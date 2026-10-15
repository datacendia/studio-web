import { SITE } from "@/data/site"
import { addEnquiry, recordNotified } from "@/lib/enquiry-store"
import { ENQUIRY_MAX_BYTES, parseEnquiry } from "@/lib/enquiries"
import { sendAlert } from "@/lib/enquiry-mail"
import { env } from "@/lib/env"
import { guardPublicForm, json } from "@/lib/public-form"

export const dynamic = "force-dynamic"

/**
 * An enquiry from the form on the home page. Saved first, so it's never lost;
 * then the studio gets an email alert when Resend is set up (src/lib/env.ts).
 * A failed alert doesn't fail the enquiry: the admin shows it as not emailed.
 */
export async function POST(request: Request) {
  const guarded = await guardPublicForm(request, { maxBytes: ENQUIRY_MAX_BYTES })
  if (!guarded.ok) return guarded.response
  const parsed = parseEnquiry(guarded.body)
  if (!parsed.ok) return json({ error: parsed.error }, 400)

  let saved
  try {
    saved = await addEnquiry(env.adminDataDir, parsed.data, new Date())
  } catch (e) {
    // Most likely a damaged enquiries.json, which is never overwritten.
    console.error("[enquiry] couldn't save an enquiry", e)
    return json({ error: "We couldn't save your enquiry just now. Please try again later." }, 500)
  }
  if (saved === "full") {
    console.error("[enquiry] enquiries.json is full; delete old enquiries in the admin")
    return json({ error: "We can't take enquiries right now. Please try again later." }, 503)
  }

  if (env.mail) {
    const adminUrl = env.siteUrl ? `${env.siteUrl}/admin` : null
    const result = await sendAlert(saved, env.mail, SITE.name, adminUrl)
    if (!result.ok) console.error("[enquiry] alert not sent:", result.error)
    await recordNotified(env.adminDataDir, saved.id, result, new Date()).catch((e) => console.error("[enquiry] couldn't record the alert result", e))
  }
  return json({ ok: true }, 201)
}

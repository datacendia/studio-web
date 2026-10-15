import { currentAdmin, unauthorized } from "@/lib/admin-auth"
import { DAMAGED_NOTE, EnquiryStoreError, listEnquiries } from "@/lib/enquiry-store"
import { env } from "@/lib/env"

export const dynamic = "force-dynamic"

/** Every enquiry, newest first. */
export async function GET() {
  if (!(await currentAdmin(new Date()))) return unauthorized()
  try {
    const items = (await listEnquiries(env.adminDataDir)).reverse()
    return Response.json({ items }, { headers: { "Cache-Control": "no-store" } })
  } catch (e) {
    if (!(e instanceof EnquiryStoreError)) throw e
    console.error("[enquiries]", e.message)
    return Response.json({ error: DAMAGED_NOTE }, { status: 500, headers: { "Cache-Control": "no-store" } })
  }
}

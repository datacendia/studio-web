import { currentAdmin, unauthorized } from "@/lib/admin-auth"
import { DAMAGED_NOTE, EnquiryStoreError, removeEnquiry, setReplied } from "@/lib/enquiry-store"
import { env } from "@/lib/env"
import { isSameOrigin } from "@/lib/same-origin"

export const dynamic = "force-dynamic"

const ID_RE = /^[a-f0-9]{16}$/
const notFound = () => Response.json({ error: "That enquiry has gone. Reload the page." }, { status: 404 })

/** Runs a change, turning a damaged enquiries.json into a plain error instead of a bare 500. */
async function orDamaged(task: () => Promise<Response>): Promise<Response> {
  try {
    return await task()
  } catch (e) {
    if (!(e instanceof EnquiryStoreError)) throw e
    console.error("[enquiries]", e.message)
    return Response.json({ error: DAMAGED_NOTE }, { status: 500 })
  }
}

/** { replied: true | false }: marks one enquiry as replied to (by whoever is signed in) or as still waiting. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentAdmin(new Date())
  if (!user) return unauthorized()
  if (!isSameOrigin(request)) return Response.json({ error: "Cross-site changes are not allowed." }, { status: 403 })
  const { id } = await params
  if (!ID_RE.test(id)) return notFound()
  const body = (await request.json().catch(() => ({}))) as { replied?: unknown }
  if (typeof body.replied !== "boolean") return Response.json({ error: "Replied or not?" }, { status: 400 })
  const replied = body.replied
  return orDamaged(async () => {
    const item = await setReplied(env.adminDataDir, id, replied, user.name, new Date())
    return item ? Response.json({ enquiry: item }) : notFound()
  })
}

/** Deletes one enquiry for good, for example when someone asks for their details to be removed. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await currentAdmin(new Date()))) return unauthorized()
  if (!isSameOrigin(request)) return Response.json({ error: "Cross-site changes are not allowed." }, { status: 403 })
  const { id } = await params
  if (!ID_RE.test(id)) return notFound()
  return orDamaged(async () => ((await removeEnquiry(env.adminDataDir, id)) ? Response.json({ ok: true }) : notFound()))
}

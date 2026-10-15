import { EnquiryInbox } from "@/components/admin/EnquiryInbox"
import { requireAdminPage } from "@/lib/admin-auth"
import { DAMAGED_NOTE, EnquiryStoreError, listEnquiries, MAX_ENQUIRIES, type Enquiry } from "@/lib/enquiry-store"
import { env } from "@/lib/env"

export const dynamic = "force-dynamic"

export default async function EnquiriesPage() {
  await requireAdminPage()
  let items: Enquiry[]
  try {
    items = (await listEnquiries(env.adminDataDir)).reverse()
  } catch (e) {
    if (!(e instanceof EnquiryStoreError)) throw e
    console.error("[enquiries]", e.message)
    return (
      <div className="adm-card" role="alert">
        <h1>Enquiries</h1>
        <p className="adm-err">{DAMAGED_NOTE}</p>
        <p className="adm-note">New enquiries can&apos;t be saved until it&apos;s fixed.</p>
      </div>
    )
  }
  return <EnquiryInbox initial={items} max={MAX_ENQUIRIES} timeZone={env.timeZone} alertsOn={env.mail !== null} />
}

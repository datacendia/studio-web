import { redirect } from "next/navigation"
import { SignOutButton } from "@/components/admin/SignOutButton"
import { SITE } from "@/data/site"
import { currentAdmin } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

/** Checks the session against the account list before anything renders. */
export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const user = await currentAdmin(new Date())
  if (!user) redirect("/admin/login?expired=1")
  return (
    <div className="adm">
      <header className="adm-bar">
        <a className="brand" href="/admin"><span className="mark" aria-hidden="true"></span>{SITE.name}</a>
        <span>
          Signed in as {user.name} <SignOutButton />
        </span>
      </header>
      <main className="adm-main">{children}</main>
    </div>
  )
}

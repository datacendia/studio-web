import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { LoginForm } from "@/components/admin/LoginForm"
import { SITE } from "@/data/site"
import { currentAdmin, users } from "@/lib/admin-auth"
import { env } from "@/lib/env"
import { safeNext } from "@/lib/safe-next"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Sign in" }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; expired?: string }> }) {
  const { next, expired } = await searchParams
  const destination = safeNext(next)
  if (await currentAdmin(new Date())) redirect(destination)
  const noAccounts = (await users.count()) === 0

  return (
    <main className="adm-login">
      <div className="adm-card">
        <h1>{SITE.name} admin</h1>
        <p className="adm-note">Sign in to see enquiries.</p>
        {env.adminAuthMode === "dev-secret" && (
          <p className="adm-warn">Development: sessions use the built-in dev secret and only work on this computer. Set ADMIN_COOKIE_SECRET before deploying.</p>
        )}
        <LoginForm next={destination} expired={expired === "1"} noAccounts={noAccounts} />
      </div>
    </main>
  )
}

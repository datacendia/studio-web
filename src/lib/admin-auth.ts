import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { SESSION_COOKIE, verifySession } from "@/lib/admin-session"
import { createUserStore, type PublicUser } from "@/lib/admin-users"
import { env } from "@/lib/env"

/**
 * The secure half of admin auth, ported from DrMarshllow. proxy.ts only
 * checks that the cookie is signed and unexpired (fast, every request); this
 * is called by the console layout and every admin API route, next to the
 * data, and also confirms the account still exists and the session hasn't
 * been revoked.
 */

export const users = createUserStore(env.adminDataDir)

export async function currentAdmin(now: Date): Promise<PublicUser | null> {
  if (env.adminAuthMode === "misconfigured") return null
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  const claims = await verifySession(token, env.cookieSecret, now)
  if (!claims) return null
  const user = await users.findById(claims.uid)
  return user && user.sessionVersion === claims.sv ? user : null
}

/** For console pages that load their own data: layouts don't re-run when you move between pages. */
export async function requireAdminPage(): Promise<PublicUser> {
  const user = await currentAdmin(new Date())
  if (!user) redirect("/admin/login?expired=1")
  return user
}

export function unauthorized(): Response {
  return Response.json({ error: "Your session has ended. Sign in again." }, { status: 401, headers: { "Cache-Control": "no-store" } })
}

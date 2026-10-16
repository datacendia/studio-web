import { NextResponse, type NextRequest } from "next/server"
import { SESSION_COOKIE, verifySession } from "@/lib/admin-session"
import { env } from "@/lib/env"

/**
 * Sign-in gate for /admin/* and /api/admin/*, ported from DrMarshllow. The
 * public site is never gated. Pages without a session redirect to the login
 * page, remembering where you were going; API calls get a 401.
 *
 * This is the fast, optimistic check. The console layout and each admin API
 * route re-check against the account list (src/lib/admin-auth.ts).
 *
 * Fail-closed: production without ADMIN_COOKIE_SECRET answers 503 on admin
 * paths. In development without it, the built-in dev secret is only accepted
 * from localhost.
 */

const PUBLIC = new Set(["/admin/login", "/api/admin/auth/login", "/api/admin/auth/logout"])

function isLocalHost(host: string | null): boolean {
  const h = (host ?? "").replace(/:\d+$/, "").toLowerCase()
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h === "::1"
}

function closed(message: string): NextResponse {
  return new NextResponse(message, { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } })
}

function secured(res: NextResponse): NextResponse {
  res.headers.set("X-Robots-Tag", "noindex, nofollow")
  res.headers.set("Cache-Control", "no-store")
  return res
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  if (env.adminAuthMode === "misconfigured") return closed("Sign-in is switched off: set ADMIN_COOKIE_SECRET (32+ characters) on the server.")
  if (env.adminAuthMode === "dev-secret" && !isLocalHost(request.headers.get("host"))) {
    return closed("To open the admin from another device, set ADMIN_COOKIE_SECRET on this machine.")
  }
  if (PUBLIC.has(pathname)) return secured(NextResponse.next())

  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value, env.cookieSecret, new Date())
  if (session) return secured(NextResponse.next())
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401, headers: { "Cache-Control": "no-store" } })
  }
  const login = new URL("/admin/login", request.url)
  if (pathname !== "/admin") login.searchParams.set("next", pathname + search)
  return NextResponse.redirect(login)
}

export const config = {
  // Admin pages and admin APIs only. Not the only lock: every admin page and API
  // route checks the session again next to the data (src/lib/admin-auth.ts).
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
}

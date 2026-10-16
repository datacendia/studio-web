import { NextResponse } from "next/server"
import { z } from "zod"
import { users } from "@/lib/admin-auth"
import { sessionCookie, signSession } from "@/lib/admin-session"
import { env } from "@/lib/env"
import { clientIp, createLoginThrottle } from "@/lib/login-throttle"
import { isSameOrigin } from "@/lib/same-origin"

export const dynamic = "force-dynamic"

// 5 failed sign-ins per address per 15 minutes (CONVENTIONS §11.5).
const throttle = createLoginThrottle({ windowMs: 15 * 60 * 1000, max: 5 })
const bodySchema = z.object({ email: z.string().max(320), password: z.string().max(200) })

function json(body: unknown, status: number, headers: Record<string, string> = {}) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } })
}

export async function POST(request: Request) {
  if (env.adminAuthMode === "misconfigured") return json({ error: "The admin is closed until the server is configured." }, 503)
  if (!isSameOrigin(request)) return json({ error: "Sign in from the admin page." }, 403)

  const now = new Date()
  const ip = clientIp(request.headers)
  const wait = throttle.retryAfter(ip, now.getTime())
  if (wait > 0) {
    const minutes = Math.ceil(wait / 60_000)
    return json({ error: `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` }, 429, { "Retry-After": String(Math.ceil(wait / 1000)) })
  }

  let parsed: ReturnType<typeof bodySchema.safeParse> | null = null
  try {
    parsed = bodySchema.safeParse(await request.json())
  } catch {
    parsed = null
  }
  if (!parsed?.success || !parsed.data.email || !parsed.data.password) return json({ error: "Enter your email and password." }, 400)

  const user = await users.verify(parsed.data.email, parsed.data.password)
  if (!user) {
    throttle.fail(ip, now.getTime())
    return json({ error: "That email and password don't match an account." }, 401)
  }
  throttle.succeed(ip)
  await users.recordLogin(user.id, now)
  const token = await signSession({ uid: user.id, sv: user.sessionVersion }, env.cookieSecret, now)
  const res = json({ ok: true, name: user.name }, 200)
  res.cookies.set(sessionCookie(token, env.isProduction))
  return res
}

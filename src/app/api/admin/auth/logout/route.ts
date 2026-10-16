import { NextResponse } from "next/server"
import { sessionCookie } from "@/lib/admin-session"
import { env } from "@/lib/env"

export const dynamic = "force-dynamic"

/** POST only, so a link or image on another site can't sign anyone out. */
export async function POST() {
  const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
  res.cookies.set({ ...sessionCookie("", env.isProduction), maxAge: 0 })
  return res
}

import { env } from "@/lib/env"
import { createDataDirCheck } from "@/lib/health"

export const dynamic = "force-dynamic"

const dataDir = createDataDirCheck(env.adminDataDir)

/**
 * Railway's health check (railway.json). Answers 503 with a short reason
 * while sign-in is switched off (production without ADMIN_COOKIE_SECRET), so
 * a deploy without the secret shows as failed, and when the data folder
 * can't be read or written: enquiries would have nowhere to go.
 */
export async function GET() {
  const reason = env.adminAuthMode === "misconfigured" ? "Sign-in isn't set up on the server." : await dataDir.check()
  return Response.json(reason ? { ok: false, reason } : { ok: true }, { status: reason ? 503 : 200, headers: { "Cache-Control": "no-store" } })
}

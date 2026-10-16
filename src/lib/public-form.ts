// Relative with extension: the unit tests import this file straight into Node.
import { clientIp, createLoginThrottle } from "./login-throttle.ts"
import { isSameOrigin } from "./same-origin.ts"

/**
 * Guard for the enquiry form, ported from DrMarshllow: same-site only, small
 * JSON bodies, 20 tries an hour per address, and a hidden "hp" field that
 * people never see but form-filling bots do. (DrMarshllow's honeypot is
 * called "website"; here that's a real field on the form.)
 */

const throttle = createLoginThrottle({ windowMs: 60 * 60 * 1000, max: 20 })
const MAX_BYTES = 4_000

export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } })
}

export type Guarded = { ok: true; body: Record<string, unknown> } | { ok: false; response: Response }

/** The body as text, or null once it passes `max` bytes, so a missing or wrong Content-Length can't get round the cap. */
async function readCapped(request: Request, max: number): Promise<string | null> {
  if (!request.body) return ""
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > max) {
      await reader.cancel().catch(() => undefined)
      return null
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks).toString("utf8")
}

/** `maxBytes`: the biggest body this form accepts (4 KB unless a form needs more, like the enquiry message). */
export async function guardPublicForm(request: Request, { maxBytes = MAX_BYTES, now = Date.now() }: { maxBytes?: number; now?: number } = {}): Promise<Guarded> {
  const tooLong = { ok: false, response: json({ error: "That's too long." }, 413) } as const
  if (!isSameOrigin(request)) return { ok: false, response: json({ error: "Please use the form on the website." }, 403) }
  if (Number(request.headers.get("content-length") ?? 0) > maxBytes) return tooLong
  const ip = clientIp(request.headers)
  const wait = throttle.retryAfter(ip, now)
  if (wait > 0) return { ok: false, response: json({ error: `Too many tries. Please try again in ${Math.ceil(wait / 60_000)} minutes.` }, 429) }
  throttle.fail(ip, now)
  const raw = await readCapped(request, maxBytes)
  if (raw === null) return tooLong
  let body: Record<string, unknown>
  try {
    body = JSON.parse(raw) as Record<string, unknown>
  } catch {
    return { ok: false, response: json({ error: "Something went wrong. Please try again." }, 400) }
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, response: json({ error: "Something went wrong. Please try again." }, 400) }
  // A bot filled in the hidden field: say thanks and keep nothing.
  if (typeof body.hp === "string" && body.hp !== "") return { ok: false, response: json({ ok: true }) }
  return { ok: true, body }
}

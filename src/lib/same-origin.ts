/**
 * Second lock on every admin write. The session cookie is SameSite=Lax, so
 * other sites can't send it with a POST/PUT/DELETE anyway; this refuses any
 * request whose Origin header names another host.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin")
  if (!origin) return true
  // Behind Railway/Cloudflare the public host arrives in x-forwarded-host.
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host")
  try {
    return new URL(origin).host === host
  } catch {
    // "null" or a malformed origin: treat as cross-site.
    return false
  }
}

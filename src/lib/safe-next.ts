/**
 * Where to send someone after they sign in: any page on this site, never
 * another one. A leading "//" or a backslash would let a link like
 * /admin/login?next=//evil.example bounce people elsewhere, so the path is
 * limited to plain characters and can't start with a second slash.
 */
const SAFE_NEXT = /^\/(?!\/)[\w\-/]*(\?[\w\-=&%]*)?$/

export function safeNext(next: string | undefined, fallback = "/admin"): string {
  return next && SAFE_NEXT.test(next) ? next : fallback
}

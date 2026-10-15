/**
 * Failed sign-in limiter: 5 failures per IP per 15 minutes (CONVENTIONS §11.5),
 * adapted from Sereno's rate-limit.ts. Only failures count and a successful
 * sign-in clears the address, so a typo or two never locks anyone out.
 *
 * In-process, like Sereno's: fine for one Railway instance; move to a shared
 * store before running several replicas.
 */

export interface ThrottleOptions {
  windowMs: number
  max: number
  /** Past this many addresses, expired ones are cleared out (an address is otherwise only forgotten when it comes back). */
  sweepAt?: number
}

export function createLoginThrottle({ windowMs, max, sweepAt = 1000 }: ThrottleOptions) {
  const buckets = new Map<string, { count: number; resetAt: number }>()

  function sweep(now: number) {
    for (const [key, b] of buckets) if (b.resetAt <= now) buckets.delete(key)
  }

  function live(key: string, now: number) {
    const b = buckets.get(key)
    if (b && b.resetAt <= now) {
      buckets.delete(key)
      return undefined
    }
    return b
  }

  return {
    /** Milliseconds until this key may try again, or 0 if it may try now. */
    retryAfter(key: string, now: number): number {
      const b = live(key, now)
      return b && b.count >= max ? b.resetAt - now : 0
    },
    fail(key: string, now: number) {
      const b = live(key, now)
      if (b) b.count += 1
      else {
        if (buckets.size >= sweepAt) sweep(now)
        buckets.set(key, { count: 1, resetAt: now + windowMs })
      }
    },
    succeed(key: string) {
      buckets.delete(key)
    },
    /** Addresses currently remembered (for tests). */
    size(): number {
      return buckets.size
    },
  }
}

/**
 * The address failures count against. Railway's edge sets X-Real-IP to the
 * visitor's address (docs: Public Networking, specs and limits). It doesn't
 * document X-Forwarded-For, whose first entry a visitor can write themselves,
 * so trusting it would let a script change "address" on every attempt. With
 * no X-Real-IP, the last X-Forwarded-For entry is the one the nearest proxy
 * added. Behind Cloudflare, read CF-Connecting-IP instead.
 */
export function clientIp(headers: { get(name: string): string | null }): string {
  const real = headers.get("x-real-ip")?.trim()
  if (real) return real
  const hops = headers.get("x-forwarded-for")?.split(",").map((h) => h.trim()).filter(Boolean) ?? []
  return hops.at(-1) || "unknown"
}

import { jwtVerify, SignJWT } from "jose"

/**
 * Signed admin session tokens (HS256 JWT in an HttpOnly cookie), ported from
 * Sereno's admin-auth.ts and set to the stack conventions (§11.1: 7 days,
 * SameSite=Lax). Pure: the secret and the clock are passed in, so the proxy,
 * the routes and the unit tests all use the same code.
 *
 * `sv` is the user's session version. Changing a password or removing an
 * account bumps it, which invalidates every cookie issued before.
 */

export const SESSION_COOKIE = "studio_admin_session"
export const SESSION_DAYS = 7
const SESSION_SECONDS = SESSION_DAYS * 24 * 60 * 60

export interface SessionClaims {
  uid: string
  sv: number
}

const key = (secret: string) => new TextEncoder().encode(secret)

export async function signSession(claims: SessionClaims, secret: string, now: Date): Promise<string> {
  const iat = Math.floor(now.getTime() / 1000)
  return new SignJWT({ sv: claims.sv })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.uid)
    .setIssuedAt(iat)
    .setExpirationTime(iat + SESSION_SECONDS)
    .sign(key(secret))
}

/** Signature, algorithm and expiry only. Whether the user still exists is checked server-side. */
export async function verifySession(token: string | undefined, secret: string, now: Date): Promise<SessionClaims | null> {
  if (!token || !secret) return null
  try {
    const { payload } = await jwtVerify(token, key(secret), { algorithms: ["HS256"], currentDate: now })
    if (typeof payload.sub !== "string" || typeof payload.sv !== "number") return null
    return { uid: payload.sub, sv: payload.sv }
  } catch {
    // Expired, tampered or signed with another secret: all mean "not signed in".
    return null
  }
}

export function sessionCookie(token: string, isProduction: boolean) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_SECONDS,
  }
}

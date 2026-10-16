import assert from "node:assert/strict"
import { randomBytes } from "node:crypto"
import { test } from "node:test"
import { SESSION_DAYS, sessionCookie, signSession, verifySession } from "../../src/lib/admin-session.ts"

const secret = randomBytes(32).toString("hex")
const now = new Date("2026-10-03T12:00:00Z")
const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url")

test("a signed session verifies and carries the user and session version", async () => {
  const token = await signSession({ uid: "user-1", sv: 3 }, secret, now)
  assert.deepEqual(await verifySession(token, secret, now), { uid: "user-1", sv: 3 })
})

test("forged, re-signed, expired and malformed tokens are all refused", async () => {
  const token = await signSession({ uid: "user-1", sv: 1 }, secret, now)
  const [header, , signature] = token.split(".")
  const forged = [header, b64({ sub: "someone-else", sv: 1, exp: 9_999_999_999 }), signature].join(".")
  assert.equal(await verifySession(forged, secret, now), null, "payload swapped under the old signature")
  assert.equal(await verifySession(token, randomBytes(32).toString("hex"), now), null, "another server's secret")
  assert.equal(await verifySession(token, secret, new Date(now.getTime() + (SESSION_DAYS * 86_400 + 60) * 1000)), null, "after 7 days")
  assert.equal(await verifySession([b64({ alg: "none" }), b64({ sub: "user-1", sv: 1 }), ""].join("."), secret, now), null, "alg none")
  for (const bad of [undefined, "", "not-a-token"]) assert.equal(await verifySession(bad, secret, now), null)
})

test("the cookie follows the stack conventions: HttpOnly, Lax, 7 days, Secure in production", () => {
  const prod = sessionCookie("t", true)
  assert.equal(prod.httpOnly, true)
  assert.equal(prod.sameSite, "lax")
  assert.equal(prod.secure, true)
  assert.equal(prod.maxAge, 7 * 24 * 60 * 60)
  assert.equal(prod.path, "/")
  assert.equal(sessionCookie("t", false).secure, false)
})

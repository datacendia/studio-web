import assert from "node:assert/strict"
import { test } from "node:test"
import { clientIp, createLoginThrottle } from "../../src/lib/login-throttle.ts"

const WINDOW = 15 * 60 * 1000

test("five failures lock one address for the rest of the 15 minutes", () => {
  const t = createLoginThrottle({ windowMs: WINDOW, max: 5 })
  for (let i = 0; i < 5; i++) {
    assert.equal(t.retryAfter("1.1.1.1", 1000 + i), 0)
    t.fail("1.1.1.1", 1000 + i)
  }
  assert.ok(t.retryAfter("1.1.1.1", 2000) > 0)
  assert.equal(t.retryAfter("2.2.2.2", 2000), 0, "other addresses are unaffected")
  assert.equal(t.retryAfter("1.1.1.1", 1000 + WINDOW), 0, "the lock lifts when the window ends")
})

test("a successful sign-in clears earlier typos", () => {
  const t = createLoginThrottle({ windowMs: WINDOW, max: 5 })
  for (let i = 0; i < 4; i++) t.fail("3.3.3.3", i)
  t.succeed("3.3.3.3")
  for (let i = 0; i < 4; i++) t.fail("3.3.3.3", 10 + i)
  assert.equal(t.retryAfter("3.3.3.3", 20), 0)
})

test("addresses that never come back are cleared out once there are many", () => {
  const t = createLoginThrottle({ windowMs: WINDOW, max: 5, sweepAt: 3 })
  for (let i = 0; i < 3; i++) t.fail(`10.0.0.${i}`, 0)
  assert.equal(t.size(), 3)
  t.fail("10.0.0.9", WINDOW)
  assert.equal(t.size(), 1, "the three expired addresses went when a new one arrived")
  t.fail("10.0.0.10", WINDOW + 1)
  assert.equal(t.size(), 2, "live ones stay")
})

test("the address comes from the proxy, not from headers a visitor can write", () => {
  const h = (o: Record<string, string>) => ({ get: (n: string) => o[n] ?? null })
  assert.equal(clientIp(h({ "x-real-ip": "203.0.113.7", "x-forwarded-for": "6.6.6.6" })), "203.0.113.7", "X-Real-IP, set by Railway, wins")
  assert.equal(clientIp(h({ "x-forwarded-for": "6.6.6.6, 203.0.113.7" })), "203.0.113.7", "otherwise the hop the nearest proxy appended")
  assert.equal(clientIp(h({})), "unknown")
})

import assert from "node:assert/strict"
import { test } from "node:test"
import { PLACEHOLDER_CLOSE_RATE, PRESETS, SLOW_LOSS, SPEND } from "../../src/data/benchmarks.ts"
import { approxAud, count, funnel, payPerBookingFee, sig2 } from "../../src/lib/funnel.ts"

const start = { spend: SPEND.start, cpc: PRESETS.svc.cpc, cr: PRESETS.svc.cr, close: PLACEHOLDER_CLOSE_RATE, job: 0 }
const near = (a: number, b: number, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} is not within ${tol} of ${b}`)

test("the slow-site loss is Google's 53% applied to half the clicks", () => {
  near(SLOW_LOSS, 0.265, 1e-9)
})

test("the page's starting numbers, worked by hand", () => {
  // 1500 / 3.81 = 393.70 clicks; 26.5% lost; 8.18% of the rest enquire; 20% of those book.
  const slow = funnel(start, true)
  near(slow.clicks, 393.70)
  near(slow.lost, 104.33)
  near(slow.enquiries, 23.67)
  near(slow.booked, 4.735)
  near(slow.costPerClient, 316.8, 0.1)
  assert.equal(approxAud(slow.costPerClient), "A$320")
  assert.equal(count(slow.enquiries), "24")

  const fast = funnel(start, false)
  near(fast.enquiries, 32.21)
  near(fast.booked, 6.441)
  assert.equal(approxAud(fast.costPerClient), "A$230")
  assert.equal((fast.booked - slow.booked).toFixed(1), "1.7")
})

test("trades preset", () => {
  const r = funnel({ ...start, cpc: PRESETS.trade.cpc, cr: PRESETS.trade.cr, close: 30 }, true)
  near(r.clicks, 162.16)
  near(r.enquiries, 9.594)
  assert.equal(approxAud(r.costPerClient), "A$520")
})

test("booked work needs a job value, and nothing books means no cost per client", () => {
  assert.equal(funnel(start, true).work, 0)
  near(funnel({ ...start, job: 4000 }, true).work, 18_936, 1)
  assert.equal(funnel({ ...start, cpc: 0 }, true).costPerClient, 0)
  assert.equal(funnel({ ...start, cr: 0.1, close: 1 }, true).costPerClient, 0, "under 0.01 bookings is shown as no estimate")
})

test("estimates round to two significant figures", () => {
  assert.deepEqual([317, 233, 95, 1509.5, 56_809, 0, -5].map(sig2), [320, 230, 95, 1500, 57_000, 0, 0])
})

test("pay per booking is A$800 + A$150 a booking, capped at A$2,000", () => {
  assert.equal(payPerBookingFee(0), 800)
  assert.equal(payPerBookingFee(4), 1400)
  assert.equal(payPerBookingFee(50), 2000)
})

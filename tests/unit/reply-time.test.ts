import assert from "node:assert/strict"
import { test } from "node:test"
import { formatDuration, replyDeadline, replyState, replyStats } from "../../src/lib/reply-time.ts"

const SYD = "Australia/Sydney"
const local = (d: Date, tz = SYD) => new Intl.DateTimeFormat("en-AU", { timeZone: tz, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(d)

test("due by the end of the next weekday, in the studio's time zone", () => {
  // Wed 14 Oct 2026, 10:00 in Sydney (AEDT, UTC+11) is 23:00 UTC on the 13th.
  assert.equal(local(replyDeadline(new Date("2026-10-13T23:00:00Z"), SYD)), "Thu, 15 Oct, 23:59:59")
  // Friday afternoon and the weekend are due on Monday.
  assert.equal(local(replyDeadline(new Date("2026-10-16T05:00:00Z"), SYD)), "Mon, 19 Oct, 23:59:59")
  assert.equal(local(replyDeadline(new Date("2026-10-17T22:00:00Z"), SYD)), "Mon, 19 Oct, 23:59:59")
})

test("the day is the studio's, not UTC's", () => {
  // 23:30 UTC Thursday is already Friday morning in Sydney, so it's due Monday, not Friday.
  assert.equal(local(replyDeadline(new Date("2026-10-15T23:30:00Z"), SYD)), "Mon, 19 Oct, 23:59:59")
})

test("daylight saving changes don't shift the deadline", () => {
  // Sydney moves to AEDT on Sun 4 Oct 2026. Friday 2 Oct is due Monday 5 Oct at 23:59:59 local.
  assert.equal(local(replyDeadline(new Date("2026-10-02T02:00:00Z"), SYD)), "Mon, 5 Oct, 23:59:59")
  assert.equal(local(replyDeadline(new Date("2026-10-02T02:00:00Z"), "Australia/Perth"), "Australia/Perth"), "Mon, 5 Oct, 23:59:59")
})

test("states and the 30-day counts", () => {
  const now = new Date("2026-10-15T03:00:00Z")
  const items = [
    { createdAt: "2026-10-13T23:00:00Z", repliedAt: "2026-10-14T01:15:00Z" }, // 2 h 15 min, on time
    { createdAt: "2026-10-01T23:00:00Z", repliedAt: "2026-10-06T23:00:00Z" }, // late
    { createdAt: "2026-10-14T22:00:00Z" }, // waiting, due Fri
    { createdAt: "2026-10-08T22:00:00Z" }, // overdue
    { createdAt: "2026-08-01T00:00:00Z", repliedAt: "2026-08-01T00:10:00Z" }, // outside 30 days
  ]
  assert.equal(replyState(items[2], now, SYD), "waiting")
  assert.equal(replyState(items[3], now, SYD), "overdue")
  assert.equal(replyState(items[0], now, SYD), "replied")
  assert.deepEqual(replyStats(items, now, SYD), { received: 4, replied: 2, onTime: 1, medianMinutes: (135 + 7200) / 2, waiting: 2, overdue: 1 })
  assert.equal(replyStats([], now, SYD).medianMinutes, null)
})

test("durations read like a person would say them", () => {
  assert.deepEqual([0, 45, 60, 135, 47 * 60, 3 * 1440].map(formatDuration), ["0 min", "45 min", "1 h", "2 h 15 min", "47 h", "3 days"])
})

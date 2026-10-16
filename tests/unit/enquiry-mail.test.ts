import assert from "node:assert/strict"
import { test } from "node:test"
import { buildAlert, sendAlert } from "../../src/lib/enquiry-mail.ts"
import type { Enquiry } from "../../src/lib/enquiry-store.ts"

const enquiry: Enquiry = {
  id: "0123456789abcdef", createdAt: "2026-10-14T01:00:00.000Z",
  name: "Sam Lee", business: "Lee Interiors", email: "sam@example.com", website: "", package: "Launch", budget: "Not sure", message: "Hi there",
  leaks: ["Site takes over 3 seconds on a phone"],
  calculator: { industry: "svc", spend: 1500, cpc: 3.81, cr: 8.18, close: 20, ownClose: false, job: 0, slow: true, booked: 4.7, costPerClient: 317 },
}
const config = { apiKey: "re_test_key", from: "Studio <enquiries@studio.example>", to: ["stuart@studio.example", "evelyn@studio.example"] }

test("the alert says who, what and the calculator result, and flags a placeholder close rate", () => {
  const { subject, text } = buildAlert(enquiry, "Built & Booked", "https://studio.example/admin")
  assert.equal(subject, "New enquiry: Lee Interiors (Launch) · Built & Booked")
  assert.match(text, /Sam Lee <sam@example.com>/)
  assert.match(text, /20% book \(placeholder, not theirs\)/)
  assert.match(text, /4\.7 booked a month at A\$317/)
  assert.match(text, /https:\/\/studio\.example\/admin$/)
})

test("it posts to Resend with Reply-To set to the person who enquired", async () => {
  let seen: { url: string; init: RequestInit } | null = null
  const result = await sendAlert(enquiry, config, "Studio", null, async (url, init) => {
    seen = { url, init }
    return new Response(JSON.stringify({ id: "x" }), { status: 200 })
  })
  assert.deepEqual(result, { ok: true })
  assert.ok(seen)
  const { url, init } = seen as { url: string; init: RequestInit }
  assert.equal(url, "https://api.resend.com/emails")
  assert.equal((init.headers as Record<string, string>).Authorization, "Bearer re_test_key")
  const body = JSON.parse(String(init.body))
  assert.deepEqual(body.to, config.to)
  assert.equal(body.reply_to, "sam@example.com")
})

test("a refusal or an outage comes back as a reason, never a throw, and never shows the key", async () => {
  const refused = await sendAlert(enquiry, config, "Studio", null, async () => new Response(JSON.stringify({ message: "Domain not verified" }), { status: 403 }))
  assert.deepEqual(refused, { ok: false, error: "Resend answered 403: Domain not verified" })
  const down = await sendAlert(enquiry, config, "Studio", null, async () => { throw new TypeError("fetch failed") })
  assert.deepEqual(down, { ok: false, error: "Couldn't reach Resend" })
  assert.ok(!JSON.stringify([refused, down]).includes("re_test_key"))
})

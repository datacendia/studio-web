import assert from "node:assert/strict"
import { test } from "node:test"
import { parseEnquiry } from "../../src/lib/enquiries.ts"

const good = {
  name: "Sam Lee", business: "Lee Interiors", email: "Sam@Example.com ", website: "leeinteriors.com.au",
  package: "Launch", budget: "A$5,000–10,000", message: "Hello", leaks: ["Site takes over 3 seconds on a phone", "Replies take more than an hour"],
  calculator: { industry: "svc", spend: 1500, cpc: 3.81, cr: 8.18, close: 20, ownClose: false, job: 0, slow: true, booked: 999, cpa: 1 },
}

test("a normal enquiry is kept, with the cost per client worked out on the server", () => {
  const r = parseEnquiry(good)
  assert.ok(r.ok)
  assert.equal(r.data.email, "sam@example.com")
  assert.equal(r.data.package, "Launch")
  assert.deepEqual(r.data.leaks, ["Site takes over 3 seconds on a phone", "Replies take more than an hour"])
  assert.equal(r.data.calculator?.booked, 4.7, "not the 999 the browser sent")
  assert.equal(r.data.calculator?.costPerClient, 317)
})

test("name, business and a real email are required", () => {
  assert.equal(parseEnquiry({ ...good, name: "  " }).ok, false)
  assert.equal(parseEnquiry({ ...good, business: "" }).ok, false)
  assert.equal(parseEnquiry({ ...good, email: "not-an-email" }).ok, false)
  assert.equal(parseEnquiry({ ...good, name: 42 }).ok, false)
})

test("line breaks and control characters can't get into one-line fields", () => {
  const r = parseEnquiry({ ...good, name: "Sam\r\nBcc: x@evil.example", business: "Lee\u0000 Interiors" })
  assert.ok(r.ok)
  assert.equal(r.data.name, "Sam Bcc: x@evil.example")
  assert.equal(r.data.business, "Lee Interiors")
})

test("an old tab's choices don't lose the enquiry", () => {
  const r = parseEnquiry({ ...good, package: "Gold plan", budget: "lots", leaks: ["Something we removed", "Google never learns who paid"] })
  assert.ok(r.ok)
  assert.equal(r.data.package, "Not sure yet")
  assert.equal(r.data.budget, "Not sure")
  assert.deepEqual(r.data.leaks, ["Google never learns who paid"])
})

test("calculator numbers out of range are left off, not trusted", () => {
  for (const bad of [{ spend: 1e9 }, { cpc: -1 }, { close: 0 }, { industry: "other" }, { slow: "yes" }]) {
    const r = parseEnquiry({ ...good, calculator: { ...good.calculator, ...bad } })
    assert.ok(r.ok)
    assert.equal(r.data.calculator, null, JSON.stringify(bad))
  }
})

test("messages are capped at 4,000 characters, counting Windows line endings once", () => {
  assert.ok(parseEnquiry({ ...good, message: "a\r\n".repeat(2000) }).ok)
  assert.equal(parseEnquiry({ ...good, message: "x".repeat(4001) }).ok, false)
})

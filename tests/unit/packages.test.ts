import assert from "node:assert/strict"
import { test } from "node:test"
import { firstTwelveMonths, PACKAGE_CHOICES, PACKAGES } from "../../src/data/packages.ts"

test("first-12-month totals are the build plus twelve monthly fees", () => {
  const totals = Object.fromEntries(PACKAGES.map((p) => [p.name, firstTwelveMonths(p)]))
  assert.deepEqual(totals, { Launch: 26_900, "Booked Solid": 38_900, Grow: 15_900 })
})

test("the form offers every package once", () => {
  assert.equal(new Set(PACKAGE_CHOICES).size, PACKAGE_CHOICES.length)
  for (const p of PACKAGES) assert.ok(PACKAGE_CHOICES.includes(p.name as (typeof PACKAGE_CHOICES)[number]))
})

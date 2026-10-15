import assert from "node:assert/strict"
import { test } from "node:test"
import { safeNext } from "../../src/lib/safe-next.ts"

test("signing in returns you to any page on this site", () => {
  for (const path of ["/", "/admin", "/admin/prices", "/admin/data?tab=versions"]) {
    assert.equal(safeNext(path), path)
  }
})

test("signing in never sends you to another site", () => {
  for (const path of ["//evil.example", "/\\evil.example", "https://evil.example", "evil.example", "/%2F%2Fevil", "/admin/../../x", "", undefined]) {
    assert.equal(safeNext(path), "/admin", String(path))
  }
})

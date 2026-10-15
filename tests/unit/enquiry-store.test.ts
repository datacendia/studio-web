import assert from "node:assert/strict"
import { mkdtemp, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { test } from "node:test"
import { addEnquiry, EnquiryStoreError, listEnquiries, recordNotified, removeEnquiry, setReplied } from "../../src/lib/enquiry-store.ts"
import type { EnquiryInput } from "../../src/lib/enquiries.ts"

const input: EnquiryInput = { name: "Sam", business: "Lee Interiors", email: "sam@example.com", website: "", package: "Launch", budget: "Not sure", message: "Hi", leaks: [], calculator: null }
const dir = () => mkdtemp(path.join(tmpdir(), "enq-"))
const at = (iso: string) => new Date(iso)

test("enquiries are saved, marked replied once, and deleted", async () => {
  const d = await dir()
  const saved = await addEnquiry(d, input, at("2026-10-14T01:00:00Z"))
  assert.ok(saved !== "full")
  assert.match(saved.id, /^[a-f0-9]{16}$/)
  const replied = await setReplied(d, saved.id, true, "Evelyn", at("2026-10-14T02:00:00Z"))
  assert.equal(replied?.repliedAt, "2026-10-14T02:00:00.000Z")
  const again = await setReplied(d, saved.id, true, "Stuart", at("2026-10-15T02:00:00Z"))
  assert.equal(again?.repliedBy, "Evelyn", "the first reply is the one that counts")
  assert.equal((await setReplied(d, saved.id, false, "Evelyn", new Date()))?.repliedAt, undefined)
  assert.equal(await removeEnquiry(d, saved.id), true)
  assert.deepEqual(await listEnquiries(d), [])
  assert.equal(await setReplied(d, saved.id, true, "Evelyn", new Date()), null)
})

test("two enquiries at the same moment are both kept", async () => {
  const d = await dir()
  await Promise.all(Array.from({ length: 10 }, (_, i) => addEnquiry(d, { ...input, name: `Person ${i}` }, new Date())))
  assert.equal((await listEnquiries(d)).length, 10)
})

test("the email alert result is recorded", async () => {
  const d = await dir()
  const saved = await addEnquiry(d, input, new Date())
  assert.ok(saved !== "full")
  assert.equal((await recordNotified(d, saved.id, { ok: false, error: "Resend answered 403" }, new Date()))?.notifyError, "Resend answered 403")
  const ok = await recordNotified(d, saved.id, { ok: true }, at("2026-10-14T01:00:05Z"))
  assert.equal(ok?.notifiedAt, "2026-10-14T01:00:05.000Z")
  assert.equal(ok?.notifyError, undefined)
})

test("a damaged file is refused and never overwritten", async () => {
  const d = await dir()
  const file = path.join(d, "enquiries.json")
  await writeFile(file, "{ not json", "utf8")
  await assert.rejects(addEnquiry(d, input, new Date()), EnquiryStoreError)
  await assert.rejects(listEnquiries(d), EnquiryStoreError)
  assert.equal(await readFile(file, "utf8"), "{ not json")
})

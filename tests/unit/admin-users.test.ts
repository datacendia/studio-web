import assert from "node:assert/strict"
import { randomBytes } from "node:crypto"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { after, test } from "node:test"
import { createUserStore, UserError } from "../../src/lib/admin-users.ts"

// Throwaway passwords generated per run; they never leave this process.
const pw = () => randomBytes(12).toString("base64url")
const now = new Date("2026-10-03T12:00:00Z")
const dir = await mkdtemp(join(tmpdir(), "drm-users-"))
// Cost 4 keeps the tests fast; the app uses 12.
const store = createUserStore(dir, 4)
after(() => rm(dir, { recursive: true, force: true }))

const evelynPw = pw()
const stuartPw = pw()

test("accounts are stored with hashed passwords and normalised emails", async () => {
  const evelyn = await store.create({ email: "  Evelyn@Example.com ", name: "Evelyn", password: evelynPw }, now)
  assert.equal(evelyn.email, "evelyn@example.com")
  assert.equal(evelyn.sessionVersion, 1)
  assert.equal("passwordHash" in evelyn, false, "hashes never leave the store")
  const file = await readFile(join(dir, "users.json"), "utf8")
  assert.ok(!file.includes(evelynPw), "the password itself is never written")
  assert.match(file, /"passwordHash": "\$2[aby]\$04\$/)
})

test("sign-in works with the right password only, whatever the email's capitals", async () => {
  assert.equal((await store.verify("EVELYN@example.com", evelynPw))?.name, "Evelyn")
  assert.equal(await store.verify("evelyn@example.com", pw()), null)
  assert.equal(await store.verify("nobody@example.com", evelynPw), null)
})

test("duplicate emails and weak input get plain messages", async () => {
  await assert.rejects(store.create({ email: "evelyn@example.com", name: "Copy", password: pw() }, now), UserError)
  await assert.rejects(store.create({ email: "short@example.com", name: "Short", password: "too-short" }, now), /at least 12/)
  await assert.rejects(store.create({ email: "not-an-email", name: "X", password: pw() }, now), /valid email/)
})

test("a new password signs the person out everywhere (session version goes up)", async () => {
  const evelyn = await store.findByEmail("evelyn@example.com")
  assert.ok(evelyn)
  const next = pw()
  const updated = await store.setPassword(evelyn.id, next)
  assert.equal(updated.sessionVersion, evelyn.sessionVersion + 1)
  assert.equal(await store.verify("evelyn@example.com", evelynPw), null, "old password stops working")
  assert.ok(await store.verify("evelyn@example.com", next))
})

test("accounts can be removed, but never the last one", async () => {
  const stuart = await store.create({ email: "stuart@example.com", name: "Stuart", password: stuartPw }, now)
  await store.recordLogin(stuart.id, now)
  assert.equal((await store.findById(stuart.id))?.lastLoginAt, now.toISOString())
  await store.remove(stuart.id)
  assert.equal(await store.count(), 1)
  const [last] = await store.list()
  await assert.rejects(store.remove(last.id), /last account/)
})

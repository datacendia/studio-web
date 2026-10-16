import assert from "node:assert/strict"
import { test } from "node:test"
import { guardPublicForm } from "../../src/lib/public-form.ts"

// Each test uses its own address, because the 20-an-hour limit is shared by the whole module.
const post = (ip: string, body: BodyInit, headers: Record<string, string> = {}) =>
  new Request("https://studio.test/api/enquiry", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-real-ip": ip, ...headers },
    body,
    duplex: "half",
  } as RequestInit)

/** A body with no Content-Length, sent in pieces, like a chunked upload. */
const streamed = (text: string, pieces = 4) => {
  const bytes = new TextEncoder().encode(text)
  const size = Math.ceil(bytes.length / pieces)
  let at = 0
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (at >= bytes.length) return controller.close()
      controller.enqueue(bytes.slice(at, at + size))
      at += size
    },
  })
}

const status = async (g: Awaited<ReturnType<typeof guardPublicForm>>) => (g.ok ? 200 : g.response.status)

test("a small JSON object gets through", async () => {
  const g = await guardPublicForm(post("10.0.0.1", JSON.stringify({ email: "sam@example.com", hp: "" })))
  assert.ok(g.ok)
  assert.deepEqual(g.body, { email: "sam@example.com", hp: "" })
})

test("a body over the cap is refused even with no Content-Length", async () => {
  const big = JSON.stringify({ message: "x".repeat(5_000) })
  const g = await guardPublicForm(post("10.0.0.2", streamed(big)))
  assert.equal(await status(g), 413)
  assert.equal(await status(await guardPublicForm(post("10.0.0.2", big))), 413, "and with one")
})

test("a form can allow a bigger body with maxBytes", async () => {
  const body = JSON.stringify({ message: "x".repeat(10_000) })
  assert.equal(await status(await guardPublicForm(post("10.0.0.3", streamed(body)))), 413, "too big for the default 4 KB")
  assert.ok((await guardPublicForm(post("10.0.0.3", streamed(body)), { maxBytes: 16_000 })).ok)
  assert.equal(await status(await guardPublicForm(post("10.0.0.3", streamed(body)), { maxBytes: 8_000 })), 413)
})

test("anything but a JSON object is refused", async () => {
  for (const body of ["[1,2]", '"hello"', "null", "42", "", "{ not json"]) {
    assert.equal(await status(await guardPublicForm(post("10.0.0.4", body))), 400, JSON.stringify(body))
  }
})

test("a filled-in hidden field gets a polite thanks and nothing else", async () => {
  const g = await guardPublicForm(post("10.0.0.5", JSON.stringify({ email: "bot@example.com", hp: "https://spam.example" })))
  assert.ok(!g.ok)
  assert.equal(g.response.status, 200)
  assert.deepEqual(await g.response.json(), { ok: true })
})

test("another site's form is refused", async () => {
  const g = await guardPublicForm(post("10.0.0.6", "{}", { origin: "https://elsewhere.example", host: "studio.test" }))
  assert.equal(await status(g), 403)
})

test("the 21st try in an hour from one address waits", async () => {
  const now = Date.now()
  for (let i = 0; i < 20; i++) assert.ok((await guardPublicForm(post("10.0.0.7", "{}"), { now })).ok)
  assert.equal(await status(await guardPublicForm(post("10.0.0.7", "{}"), { now })), 429)
  assert.ok((await guardPublicForm(post("10.0.0.8", "{}"), { now })).ok, "other addresses are unaffected")
})

import { randomBytes } from "node:crypto"
import { promises as fs } from "node:fs"
import path from "node:path"
// Relative with extension: the unit tests import this file straight into Node.
import type { EnquiryInput } from "./enquiries.ts"

/**
 * Enquiries from the website, on disk next to the app (ADMIN_DATA_DIR, a
 * Railway volume): <dir>/enquiries.json. Ported from DrMarshllow's
 * message-store.ts. Only admins can read them, and every one can be deleted.
 */

export interface Enquiry extends EnquiryInput {
  id: string
  createdAt: string
  /** When someone marked it as replied to, and who. Waiting while missing. */
  repliedAt?: string
  repliedBy?: string
  /** When the email alert went out, or why it didn't. Neither while alerts are off. */
  notifiedAt?: string
  notifyError?: string
}

/** Enough for years of enquiries; past it, new ones are refused rather than old ones dropped. */
export const MAX_ENQUIRIES = 5000

/** enquiries.json can't be read as a list. It's left as it is for someone to fix. */
export class EnquiryStoreError extends Error {}

export const DAMAGED_NOTE = "The enquiries file couldn't be read, so nothing has been changed. Ask Stuart to check enquiries.json."

const enquiriesFile = (dir: string) => path.join(dir, "enquiries.json")
const newId = () => randomBytes(8).toString("hex")

let queue: Promise<unknown> = Promise.resolve()
/** One write at a time, so two enquiries in the same moment can't drop each other. */
function oneAtATime<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task)
  queue = run.catch(() => undefined)
  return run
}

async function readItems(dir: string): Promise<Enquiry[]> {
  let raw: string
  try {
    raw = await fs.readFile(enquiriesFile(dir), "utf8")
  } catch (e) {
    if (e instanceof Error && "code" in e && e.code === "ENOENT") return []
    throw e
  }
  // A damaged file must not be overwritten with an empty one: refuse and let an admin look.
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    throw new EnquiryStoreError(`${enquiriesFile(dir)} is damaged: ${e instanceof Error ? e.message : "not JSON"}.`)
  }
  const items = (parsed as { items?: unknown } | null)?.items
  if (!Array.isArray(items)) throw new EnquiryStoreError(`${enquiriesFile(dir)} is damaged: no list of enquiries.`)
  return items as Enquiry[]
}

async function writeItems(dir: string, items: Enquiry[]) {
  await fs.mkdir(dir, { recursive: true })
  const file = enquiriesFile(dir)
  const tmp = `${file}.${randomBytes(4).toString("hex")}.tmp`
  await fs.writeFile(tmp, JSON.stringify({ items }, null, 2), "utf8")
  await fs.rename(tmp, file)
}

/** Runs a change on one enquiry. Returns it, or null when it's gone. */
function update(dir: string, id: string, change: (e: Enquiry) => boolean): Promise<Enquiry | null> {
  return oneAtATime(async () => {
    const items = await readItems(dir)
    const item = items.find((x) => x.id === id)
    if (!item) return null
    if (change(item)) await writeItems(dir, items)
    return item
  })
}

/** Oldest first, as saved. */
export async function listEnquiries(dir: string): Promise<Enquiry[]> {
  return readItems(dir)
}

export async function addEnquiry(dir: string, input: EnquiryInput, now: Date): Promise<Enquiry | "full"> {
  return oneAtATime(async () => {
    const items = await readItems(dir)
    if (items.length >= MAX_ENQUIRIES) return "full"
    const saved: Enquiry = { ...input, id: newId(), createdAt: now.toISOString() }
    items.push(saved)
    await writeItems(dir, items)
    return saved
  })
}

/** Marks one as replied to (keeping the first time and who) or as still waiting. */
export function setReplied(dir: string, id: string, replied: boolean, by: string, now: Date): Promise<Enquiry | null> {
  return update(dir, id, (item) => {
    if (replied === Boolean(item.repliedAt)) return false
    if (replied) {
      item.repliedAt = now.toISOString()
      item.repliedBy = by
    } else {
      delete item.repliedAt
      delete item.repliedBy
    }
    return true
  })
}

/** Records whether the email alert went out. */
export function recordNotified(dir: string, id: string, result: { ok: true } | { ok: false; error: string }, now: Date): Promise<Enquiry | null> {
  return update(dir, id, (item) => {
    if (result.ok) {
      item.notifiedAt = now.toISOString()
      delete item.notifyError
    } else item.notifyError = result.error
    return true
  })
}

export async function removeEnquiry(dir: string, id: string): Promise<boolean> {
  return oneAtATime(async () => {
    const items = await readItems(dir)
    if (!items.some((x) => x.id === id)) return false
    await writeItems(dir, items.filter((x) => x.id !== id))
    return true
  })
}

import { randomBytes } from "node:crypto"
import { promises as fs } from "node:fs"
import path from "node:path"

/**
 * The data folder half of /api/health: can the server still read and write
 * ADMIN_DATA_DIR (the Railway volume)? Writes, reads back and deletes a small
 * temp file, at most once every 30 seconds however often the monitor asks,
 * and gives up after 5 seconds so a stuck disk can't hang the health check.
 * Reasons are short and never name a path.
 */

const CACHE_MS = 30_000
const TIMEOUT_MS = 5_000

async function probe(dir: string): Promise<string | null> {
  try {
    await fs.mkdir(dir, { recursive: true })
    // Ends in .tmp, so a backup taken at the same moment leaves it out.
    const file = path.join(dir, `.health-${randomBytes(4).toString("hex")}.tmp`)
    const token = randomBytes(8).toString("hex")
    await fs.writeFile(file, token, "utf8")
    try {
      if ((await fs.readFile(file, "utf8")) !== token) return "The data folder gave back the wrong contents."
    } finally {
      await fs.unlink(file)
    }
    await fs.readdir(dir)
    return null
  } catch {
    return "The data folder can't be read or written."
  }
}

function withTimeout(check: Promise<string | null>, ms: number): Promise<string | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve("The data folder didn't answer in time."), ms)
    timer.unref?.()
    void check.then((r) => {
      clearTimeout(timer)
      resolve(r)
    })
  })
}

/** check() resolves to null when the folder is fine, or a short reason when it isn't. */
export function createDataDirCheck(dir: string, { cacheMs = CACHE_MS, timeoutMs = TIMEOUT_MS } = {}) {
  let last: { at: number; result: Promise<string | null> } | null = null
  return {
    check(now = Date.now()): Promise<string | null> {
      if (!last || now - last.at >= cacheMs) last = { at: now, result: withTimeout(probe(dir), timeoutMs) }
      return last.result
    },
  }
}

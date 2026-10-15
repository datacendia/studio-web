import bcrypt from "bcryptjs"
import { randomUUID } from "node:crypto"
import { promises as fs } from "node:fs"
import path from "node:path"
import { z } from "zod"

/**
 * Admin accounts, kept in users.json next to the enquiries (no database).
 * Passwords are bcryptjs hashes at cost 12, as in Sereno (CONVENTIONS §7).
 * The fields mirror a Payload `users` collection (email, name, role) so the
 * list can move there later; Payload hashes differently, so each person sets
 * a new password at that point.
 */

export const MIN_PASSWORD = 12

export const newUserSchema = z.object({
  // Trim before validating: emails pasted on a phone often carry a trailing space.
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")),
  name: z.string().trim().min(1, "Enter a name.").max(80),
  password: z.string().min(MIN_PASSWORD, `Use at least ${MIN_PASSWORD} characters.`).max(200),
})
export const passwordSchema = newUserSchema.shape.password

const userSchema = z.object({
  id: z.string().min(1),
  email: z.string().min(3),
  name: z.string().min(1),
  role: z.literal("admin"),
  passwordHash: z.string().startsWith("$2"),
  sessionVersion: z.number().int().min(1),
  createdAt: z.string(),
  lastLoginAt: z.string().nullable(),
})
const fileSchema = z.object({ users: z.array(userSchema) })

export type AdminUser = z.infer<typeof userSchema>
export type PublicUser = Omit<AdminUser, "passwordHash">

/** A problem the person can fix (shown as-is in the admin). */
export class UserError extends Error {}

const toPublic = ({ passwordHash: _hash, ...rest }: AdminUser): PublicUser => rest

function isMissing(e: unknown): boolean {
  return e instanceof Error && "code" in e && e.code === "ENOENT"
}

export function createUserStore(dir: string, cost = 12) {
  const file = path.join(dir, "users.json")
  // Compared against when an email isn't found, so unknown and known emails take as long.
  let dummyHash: Promise<string> | null = null

  async function readAll(): Promise<AdminUser[]> {
    let raw: string
    try {
      raw = await fs.readFile(file, "utf8")
    } catch (e) {
      if (isMissing(e)) return []
      throw e
    }
    const parsed = fileSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) throw new Error(`${file} doesn't match the expected shape.`)
    return parsed.data.users
  }

  async function writeAll(users: AdminUser[]) {
    await fs.mkdir(dir, { recursive: true })
    const tmp = `${file}.tmp`
    await fs.writeFile(tmp, JSON.stringify({ users }, null, 2), "utf8")
    await fs.rename(tmp, file)
  }

  return {
    async count(): Promise<number> {
      return (await readAll()).length
    },
    async list(): Promise<PublicUser[]> {
      return (await readAll()).map(toPublic)
    },
    async findById(id: string): Promise<PublicUser | null> {
      const u = (await readAll()).find((x) => x.id === id)
      return u ? toPublic(u) : null
    },
    async findByEmail(email: string): Promise<PublicUser | null> {
      const u = (await readAll()).find((x) => x.email === email.trim().toLowerCase())
      return u ? toPublic(u) : null
    },
    async create(input: { email: string; name: string; password: string }, now: Date): Promise<PublicUser> {
      const parsed = newUserSchema.safeParse(input)
      if (!parsed.success) throw new UserError(parsed.error.issues[0].message)
      const { email, name, password } = parsed.data
      const users = await readAll()
      if (users.some((u) => u.email === email)) throw new UserError("An account with that email already exists.")
      const user: AdminUser = {
        id: randomUUID(), email, name, role: "admin", passwordHash: await bcrypt.hash(password, cost),
        sessionVersion: 1, createdAt: now.toISOString(), lastLoginAt: null,
      }
      await writeAll([...users, user])
      return toPublic(user)
    },
    /** The user if email and password match; null otherwise, in about the same time either way. */
    async verify(email: string, password: string): Promise<PublicUser | null> {
      const user = (await readAll()).find((u) => u.email === email.trim().toLowerCase())
      if (!user) {
        dummyHash ??= bcrypt.hash(randomUUID(), cost)
        await bcrypt.compare(password, await dummyHash)
        return null
      }
      return (await bcrypt.compare(password, user.passwordHash)) ? toPublic(user) : null
    },
    /** Sets a new password and signs the person out everywhere. */
    async setPassword(id: string, password: string): Promise<PublicUser> {
      const checked = passwordSchema.safeParse(password)
      if (!checked.success) throw new UserError(checked.error.issues[0].message)
      const pw = checked.data
      const users = await readAll()
      const user = users.find((u) => u.id === id)
      if (!user) throw new UserError("That account no longer exists.")
      user.passwordHash = await bcrypt.hash(pw, cost)
      user.sessionVersion += 1
      await writeAll(users)
      return toPublic(user)
    },
    async remove(id: string): Promise<void> {
      const users = await readAll()
      if (!users.some((u) => u.id === id)) throw new UserError("That account no longer exists.")
      if (users.length === 1) throw new UserError("The last account can't be removed.")
      await writeAll(users.filter((u) => u.id !== id))
    },
    async recordLogin(id: string, now: Date): Promise<void> {
      const users = await readAll()
      const user = users.find((u) => u.id === id)
      if (!user) return
      user.lastLoginAt = now.toISOString()
      await writeAll(users)
    },
  }
}

export type UserStore = ReturnType<typeof createUserStore>

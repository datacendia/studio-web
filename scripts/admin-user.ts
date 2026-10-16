/**
 * Manage admin accounts from the server: adding Stuart and Evelyn, a new
 * password, or removing someone. The admin has no account page yet.
 *
 *   npm run admin:user -- add --email you@example.com --name "Your name"
 *   npm run admin:user -- password --email you@example.com
 *   npm run admin:user -- remove --email someone@example.com
 *   npm run admin:user -- list
 *
 * The password is asked for without echoing. For scripted use, pass it in
 * the ADMIN_NEW_PASSWORD environment variable instead.
 */
import { parseArgs } from "node:util"
import { createUserStore, UserError } from "../src/lib/admin-users.ts"
import { env } from "../src/lib/env.ts"

const USAGE = `Usage:
  npm run admin:user -- add --email you@example.com --name "Your name"
  npm run admin:user -- password --email you@example.com
  npm run admin:user -- remove --email someone@example.com
  npm run admin:user -- list`

function readLine(): Promise<string> {
  return new Promise((resolve) => {
    let data = ""
    process.stdin.setEncoding("utf8")
    process.stdin.on("data", (chunk) => {
      data += chunk
      const nl = data.indexOf("\n")
      if (nl >= 0) {
        process.stdin.pause()
        resolve(data.slice(0, nl).replace(/\r$/, ""))
      }
    })
    process.stdin.on("end", () => resolve(data.replace(/\r?\n$/, "")))
  })
}

/** Reads a password without showing it; falls back to a plain line when there's no terminal. */
async function askPassword(prompt: string): Promise<string> {
  process.stdout.write(prompt)
  if (!process.stdin.isTTY) return readLine()
  return new Promise((resolve, reject) => {
    const stdin = process.stdin
    let value = ""
    stdin.setRawMode(true)
    stdin.resume()
    stdin.setEncoding("utf8")
    const onData = (chunk: string) => {
      for (const c of chunk) {
        if (c === "\r" || c === "\n") {
          stdin.setRawMode(false)
          stdin.pause()
          stdin.off("data", onData)
          process.stdout.write("\n")
          resolve(value)
          return
        }
        if (c === "\u0003") {
          stdin.setRawMode(false)
          process.stdout.write("\n")
          reject(new Error("Cancelled."))
          return
        }
        if (c === "\u007f" || c === "\b") value = value.slice(0, -1)
        else value += c
      }
    }
    stdin.on("data", onData)
  })
}

async function newPassword(): Promise<string> {
  if (process.env.ADMIN_NEW_PASSWORD) return process.env.ADMIN_NEW_PASSWORD
  const first = await askPassword("New password (12+ characters): ")
  const second = await askPassword("Same password again: ")
  if (first !== second) throw new UserError("The two passwords don't match.")
  return first
}

async function main() {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: { email: { type: "string" }, name: { type: "string" } },
  })
  const command = positionals[0]
  const store = createUserStore(env.adminDataDir)
  const now = new Date()
  const byEmail = async () => {
    if (!values.email) throw new UserError("Add --email.")
    const user = await store.findByEmail(values.email)
    if (!user) throw new UserError(`No account for ${values.email}.`)
    return user
  }

  switch (command) {
    case "add": {
      if (!values.email || !values.name) throw new UserError("Add --email and --name.")
      const user = await store.create({ email: values.email, name: values.name, password: await newPassword() }, now)
      console.log(`Added ${user.name} (${user.email}). They can sign in at /admin/login.`)
      return
    }
    case "password": {
      const user = await byEmail()
      await store.setPassword(user.id, await newPassword())
      console.log(`New password set for ${user.name}. Their other sessions have ended.`)
      return
    }
    case "remove": {
      const user = await byEmail()
      await store.remove(user.id)
      console.log(`Removed ${user.name} (${user.email}).`)
      return
    }
    case "list": {
      const users = await store.list()
      if (users.length === 0) console.log(`No accounts yet in ${env.adminDataDir}.`)
      for (const u of users) console.log(`${u.name} <${u.email}> · added ${u.createdAt.slice(0, 10)} · last signed in ${u.lastLoginAt?.slice(0, 10) ?? "never"}`)
      return
    }
    default:
      console.log(USAGE)
      process.exitCode = command ? 1 : 0
  }
}

main().catch((e: unknown) => {
  console.error(e instanceof UserError || (e instanceof Error && e.message === "Cancelled.") ? e.message : e)
  process.exitCode = 1
})

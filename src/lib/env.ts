import path from "node:path"
import { z } from "zod"

/**
 * Server environment, read and validated in one place (CONVENTIONS §10).
 *
 * Admin sessions are signed with ADMIN_COOKIE_SECRET (32+ characters). In
 * production a missing or short secret closes the admin (503) rather than
 * crashing the public site. In development a fixed, publicly known dev secret
 * is used so `npm run dev` needs no setup; the proxy then only serves the
 * admin to localhost, because anyone who knows that secret could sign a cookie.
 *
 * Email alerts for new enquiries need all three of RESEND_API_KEY,
 * ENQUIRY_FROM and ENQUIRY_NOTIFY_TO. With any missing, enquiries are still
 * saved and the admin says alerts are off, so nothing is lost while the
 * domain and Resend account are being set up.
 *
 * Search engines may index the site only when SITE_INDEXABLE is "1" or
 * "true": the studio name is a placeholder until it's chosen.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  ADMIN_COOKIE_SECRET: z.string().optional(),
  ADMIN_DATA_DIR: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  ENQUIRY_FROM: z.string().min(3).optional(),
  ENQUIRY_NOTIFY_TO: z.string().min(3).optional(),
  SITE_URL: z.url().optional(),
  SITE_INDEXABLE: z.string().optional(),
  STUDIO_TIMEZONE: z.string().min(1).default("Australia/Sydney"),
})

const parsed = schema.parse({
  NODE_ENV: process.env.NODE_ENV,
  ADMIN_COOKIE_SECRET: process.env.ADMIN_COOKIE_SECRET || undefined,
  ADMIN_DATA_DIR: process.env.ADMIN_DATA_DIR || undefined,
  RESEND_API_KEY: process.env.RESEND_API_KEY || undefined,
  ENQUIRY_FROM: process.env.ENQUIRY_FROM || undefined,
  ENQUIRY_NOTIFY_TO: process.env.ENQUIRY_NOTIFY_TO || undefined,
  SITE_URL: process.env.SITE_URL || undefined,
  SITE_INDEXABLE: process.env.SITE_INDEXABLE || undefined,
  STUDIO_TIMEZONE: process.env.STUDIO_TIMEZONE || undefined,
})

// A bad zone name would only fail later, inside the admin's date maths; fail at boot instead.
new Intl.DateTimeFormat("en-AU", { timeZone: parsed.STUDIO_TIMEZONE })

export const MIN_COOKIE_SECRET = 32
const DEV_COOKIE_SECRET = "studio-development-only-cookie-secret-do-not-deploy"

/** "dev-secret": development without ADMIN_COOKIE_SECRET (localhost only). */
export type AdminAuthMode = "ready" | "dev-secret" | "misconfigured"

const isProduction = parsed.NODE_ENV === "production"
const secret = parsed.ADMIN_COOKIE_SECRET
const indexFlag = parsed.SITE_INDEXABLE?.trim().toLowerCase()

function authMode(): AdminAuthMode {
  if (secret && secret.length >= MIN_COOKIE_SECRET && secret !== DEV_COOKIE_SECRET) return "ready"
  if (!isProduction && !secret) return "dev-secret"
  return "misconfigured"
}

const notifyTo = (parsed.ENQUIRY_NOTIFY_TO ?? "").split(",").map((s) => s.trim()).filter(Boolean)

export const env = {
  isProduction,
  /** Holds enquiries.json and users.json. On Railway, a mounted volume. */
  adminDataDir: parsed.ADMIN_DATA_DIR ?? path.join(process.cwd(), ".data"),
  adminAuthMode: authMode(),
  cookieSecret: authMode() === "dev-secret" ? DEV_COOKIE_SECRET : secret ?? "",
  /** Null while any of the three settings is missing (see above). */
  mail:
    parsed.RESEND_API_KEY && parsed.ENQUIRY_FROM && notifyTo.length > 0
      ? { apiKey: parsed.RESEND_API_KEY, from: parsed.ENQUIRY_FROM, to: notifyTo }
      : null,
  siteUrl: parsed.SITE_URL?.replace(/\/+$/, "") ?? null,
  indexable: indexFlag === "1" || indexFlag === "true",
  timeZone: parsed.STUDIO_TIMEZONE,
}

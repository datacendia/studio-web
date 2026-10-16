import { z } from "zod"
// Relative with extension: the unit tests import this file straight into Node.
import { SPEND } from "../data/benchmarks.ts"
import { BUDGETS, PACKAGE_CHOICES } from "../data/packages.ts"
import { LEAKS } from "../data/site.ts"
import { funnel } from "./funnel.ts"

/**
 * What the enquiry form may send, checked on the server. Storage is in
 * enquiry-store.ts.
 *
 * Name, business and email are required and refused when wrong, because
 * without them nobody can reply. Everything else is lenient: a package,
 * budget or leak the page no longer offers (an old tab) is kept as "not sure"
 * or dropped rather than losing the enquiry, and calculator numbers out of
 * range are left off. The cost per client is worked out again here from the
 * inputs, never taken from the browser.
 */

export const NAME_MAX = 80
export const BUSINESS_MAX = 120
export const WEBSITE_MAX = 200
export const MESSAGE_MAX = 4000

/**
 * A 4,000-character message can be about 12 KB once accents and emoji are
 * counted, plus the other fields and the calculator numbers.
 */
export const ENQUIRY_MAX_BYTES = 20_000

export type Industry = "svc" | "trade" | "custom"

export interface CalculatorSnapshot {
  industry: Industry
  spend: number
  cpc: number
  cr: number
  close: number
  /** False while the close rate is still the page's placeholder. */
  ownClose: boolean
  job: number
  slow: boolean
  /** Worked out on the server from the inputs above. */
  booked: number
  costPerClient: number
}

export interface EnquiryInput {
  name: string
  business: string
  email: string
  website: string
  package: string
  budget: string
  message: string
  leaks: string[]
  calculator: CalculatorSnapshot | null
}

/** One line, no control characters, runs of spaces collapsed. */
const oneLine = (max: number, label: string) =>
  z
    .string()
    .transform((s) => s.replace(/[\u0000-\u001f\u007f\s]+/g, " ").trim())
    .pipe(z.string().max(max, `Keep ${label} to ${max} characters or fewer.`))

const name = oneLine(NAME_MAX, "your name").pipe(z.string().min(1, "Add your name."))
const business = oneLine(BUSINESS_MAX, "your business name").pipe(z.string().min(1, "Add your business."))
const website = oneLine(WEBSITE_MAX, "the website address")
const email = z.string().trim().toLowerCase().max(254).pipe(z.email())
const message = z
  .string()
  // Windows line endings count once, so the limit matches what the box shows.
  .transform((s) => s.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").trim())
  .pipe(z.string().max(MESSAGE_MAX, `Keep your message to ${MESSAGE_MAX.toLocaleString("en-AU")} characters or fewer.`))

const calculatorInputs = z.object({
  industry: z.enum(["svc", "trade", "custom"]),
  spend: z.number().min(SPEND.min).max(SPEND.max),
  cpc: z.number().min(0.1).max(1000),
  cr: z.number().min(0.1).max(100),
  close: z.number().min(1).max(100),
  ownClose: z.boolean(),
  job: z.number().min(0).max(10_000_000),
  slow: z.boolean(),
})

function snapshot(raw: unknown): CalculatorSnapshot | null {
  const parsed = calculatorInputs.safeParse(raw)
  if (!parsed.success) return null
  const c = parsed.data
  const r = funnel(c, c.slow)
  return { ...c, booked: Math.round(r.booked * 10) / 10, costPerClient: Math.round(r.costPerClient) }
}

const text = (v: unknown) => (typeof v === "string" ? v : "")
const pick = <T extends string>(choices: readonly T[], v: unknown, fallback: T): T => choices.find((c) => c === v) ?? fallback

export function parseEnquiry(body: Record<string, unknown>): { ok: true; data: EnquiryInput } | { ok: false; error: string } {
  const n = name.safeParse(text(body.name))
  if (!n.success) return { ok: false, error: n.error.issues[0].message }
  const b = business.safeParse(text(body.business))
  if (!b.success) return { ok: false, error: b.error.issues[0].message }
  const e = email.safeParse(text(body.email))
  if (!e.success) return { ok: false, error: "That doesn't look like an email address." }
  const w = website.safeParse(text(body.website))
  if (!w.success) return { ok: false, error: w.error.issues[0].message }
  const m = message.safeParse(text(body.message))
  if (!m.success) return { ok: false, error: m.error.issues[0].message }
  const leaks = Array.isArray(body.leaks) ? LEAKS.filter((l) => (body.leaks as unknown[]).includes(l)) : []
  return {
    ok: true,
    data: {
      name: n.data,
      business: b.data,
      email: e.data,
      website: w.data,
      package: pick(PACKAGE_CHOICES, body.package, PACKAGE_CHOICES[0]),
      budget: pick(BUDGETS, body.budget, BUDGETS[0]),
      message: m.data,
      leaks,
      calculator: snapshot(body.calculator),
    },
  }
}

// Relative with extension: the unit tests import this file straight into Node.
import { PRESETS } from "../data/benchmarks.ts"
import type { Enquiry } from "./enquiry-store.ts"
import { aud, count } from "./funnel.ts"

/**
 * The alert emailed to the studio when an enquiry arrives, sent through
 * Resend's HTTP API (CONVENTIONS §4.5). Reply-To is the person who enquired,
 * so replying from the inbox goes straight to them. Nothing is ever emailed
 * to the person who enquired: an auto-reply would let anyone use the form to
 * send mail to any address.
 */

export interface MailConfig {
  apiKey: string
  from: string
  to: string[]
}

type Fetch = (url: string, init: RequestInit) => Promise<Response>

const INDUSTRY: Record<string, string> = { svc: PRESETS.svc.label, trade: PRESETS.trade.label, custom: "Their own numbers" }

export function calculatorLines(e: Pick<Enquiry, "calculator">): string[] {
  const c = e.calculator
  if (!c) return ["Calculator: not used"]
  return [
    `Calculator: ${INDUSTRY[c.industry] ?? c.industry}, ${aud(c.spend)}/mo ad spend, A$${c.cpc} a click, ${c.cr}% enquire, ${c.close}% book${c.ownClose ? "" : " (placeholder, not theirs)"}`,
    `Site: ${c.slow ? "slow (over 3 s on a phone)" : "fast"} · Average job: ${c.job > 0 ? aud(c.job) : "not given"}`,
    `Result: ${count(c.booked)} booked a month at ${c.costPerClient > 0 ? aud(c.costPerClient) : "n/a"} ad spend per client`,
  ]
}

export function buildAlert(e: Enquiry, siteName: string, adminUrl: string | null): { subject: string; text: string } {
  const lines = [
    `${e.name} <${e.email}>`,
    `Business: ${e.business}`,
    `Website: ${e.website || "none given"}`,
    `Package: ${e.package} · Budget: ${e.budget}`,
    `Leaks they ticked: ${e.leaks.length ? e.leaks.join("; ") : "none"}`,
    ...calculatorLines(e),
    "",
    e.message || "(no message)",
    "",
    "Reply to this email to answer them directly. Then mark it as replied in the admin, so the reply-time count stays honest.",
  ]
  if (adminUrl) lines.push(adminUrl)
  return { subject: `New enquiry: ${e.business} (${e.package}) · ${siteName}`, text: lines.join("\n") }
}

/** Sends the alert. Never throws; the reason comes back for the admin to see. Never logs the key. */
export async function sendAlert(e: Enquiry, config: MailConfig, siteName: string, adminUrl: string | null, fetchImpl: Fetch = fetch): Promise<{ ok: true } | { ok: false; error: string }> {
  const { subject, text } = buildAlert(e, siteName, adminUrl)
  try {
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: config.from, to: config.to, reply_to: e.email, subject, text }),
      signal: AbortSignal.timeout(8_000),
    })
    if (res.ok) return { ok: true }
    const body = (await res.json().catch(() => ({}))) as { message?: unknown }
    const detail = typeof body.message === "string" ? `: ${body.message.slice(0, 200)}` : ""
    return { ok: false, error: `Resend answered ${res.status}${detail}` }
  } catch (err) {
    return { ok: false, error: err instanceof Error && err.name === "TimeoutError" ? "Resend didn't answer within 8 seconds" : "Couldn't reach Resend" }
  }
}

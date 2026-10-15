/**
 * The site promises "We reply within one business day". This checks it.
 *
 * Rule: an enquiry is answered on time if it's marked as replied before the
 * end of the next business day (Monday to Friday) after the day it arrived,
 * in the studio's time zone (STUDIO_TIMEZONE). Friday afternoon and all
 * weekend are due by the end of Monday. Public holidays aren't known here,
 * so they count as business days: the rule errs strict, never generous.
 */

interface LocalParts {
  y: number
  m: number
  d: number
  h: number
  min: number
  s: number
}

const formatters = new Map<string, Intl.DateTimeFormat>()

function localParts(at: Date, timeZone: string): LocalParts {
  let f = formatters.get(timeZone)
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23" })
    formatters.set(timeZone, f)
  }
  const p: Record<string, string> = {}
  for (const part of f.formatToParts(at)) p[part.type] = part.value
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, min: +p.minute, s: +p.second }
}

/** The instant a wall-clock time happens in a zone (two passes, so a daylight-saving change between guess and answer is caught). */
function zonedInstant(want: LocalParts, timeZone: string): Date {
  const target = Date.UTC(want.y, want.m - 1, want.d, want.h, want.min, want.s)
  let guess = target
  for (let i = 0; i < 2; i++) {
    const got = localParts(new Date(guess), timeZone)
    guess += target - Date.UTC(got.y, got.m - 1, got.d, got.h, got.min, got.s)
  }
  return new Date(guess)
}

/** When a reply to something received at `received` is due. */
export function replyDeadline(received: Date, timeZone: string): Date {
  const local = localParts(received, timeZone)
  // Calendar days counted in UTC, which has no daylight saving to trip over.
  let day = Date.UTC(local.y, local.m - 1, local.d)
  do {
    day += 86_400_000
  } while ([0, 6].includes(new Date(day).getUTCDay()))
  const due = new Date(day)
  return zonedInstant({ y: due.getUTCFullYear(), m: due.getUTCMonth() + 1, d: due.getUTCDate(), h: 23, min: 59, s: 59 }, timeZone)
}

export type ReplyState = "replied" | "waiting" | "overdue"

export function replyState(item: { createdAt: string; repliedAt?: string }, now: Date, timeZone: string): ReplyState {
  if (item.repliedAt) return "replied"
  return now > replyDeadline(new Date(item.createdAt), timeZone) ? "overdue" : "waiting"
}

export interface ReplyStats {
  /** Enquiries received in the window. */
  received: number
  /** Of those, how many have been replied to, and how many of those on time. */
  replied: number
  onTime: number
  /** Middle reply time in minutes for those replied to; null when none. */
  medianMinutes: number | null
  /** Every enquiry still waiting (any age), and how many are past due. */
  waiting: number
  overdue: number
}

export function replyStats(items: { createdAt: string; repliedAt?: string }[], now: Date, timeZone: string, days = 30): ReplyStats {
  const since = now.getTime() - days * 86_400_000
  const recent = items.filter((x) => new Date(x.createdAt).getTime() >= since)
  const answered = recent.filter((x) => x.repliedAt)
  const minutes = answered.map((x) => (new Date(x.repliedAt as string).getTime() - new Date(x.createdAt).getTime()) / 60_000).sort((a, b) => a - b)
  const mid = minutes.length / 2
  const median = minutes.length === 0 ? null : minutes.length % 2 ? minutes[Math.floor(mid)] : (minutes[mid - 1] + minutes[mid]) / 2
  const states = items.map((x) => replyState(x, now, timeZone))
  return {
    received: recent.length,
    replied: answered.length,
    onTime: answered.filter((x) => new Date(x.repliedAt as string) <= replyDeadline(new Date(x.createdAt), timeZone)).length,
    medianMinutes: median,
    waiting: states.filter((s) => s !== "replied").length,
    overdue: states.filter((s) => s === "overdue").length,
  }
}

/** "45 min", "2 h 15 min", "3 days". */
export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes))
  if (m < 60) return `${m} min`
  if (m < 48 * 60) {
    const h = Math.floor(m / 60)
    const rest = m % 60
    return rest ? `${h} h ${rest} min` : `${h} h`
  }
  return `${Math.round(m / 1440)} days`
}

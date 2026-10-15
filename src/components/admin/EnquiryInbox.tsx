"use client"

import { useMemo, useState } from "react"
import { calculatorLines } from "@/lib/enquiry-mail"
import type { Enquiry } from "@/lib/enquiry-store"
import { formatDuration, replyDeadline, replyState, replyStats, type ReplyState } from "@/lib/reply-time"

async function send(method: "PATCH" | "DELETE", id: string, body?: unknown): Promise<{ error: string } | { enquiry?: Enquiry }> {
  const res = await fetch(`/api/admin/enquiries/${id}`, {
    method,
    ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  }).catch(() => null)
  if (!res) return { error: "Couldn't reach the server." }
  if (res.status === 401) return { error: "Your session ended. Sign in again in a new tab." }
  const json = (await res.json().catch(() => ({}))) as { error?: string; enquiry?: Enquiry }
  return res.ok ? json : { error: json.error ?? "That didn't work." }
}

const LABEL: Record<ReplyState, string> = { replied: "Replied", waiting: "Waiting", overdue: "Overdue" }

/** Times in the studio's zone, whatever the viewer's device is set to. Server and browser can format slightly differently. */
function When({ iso, timeZone }: { iso: string; timeZone: string }) {
  const text = new Intl.DateTimeFormat("en-AU", { timeZone, weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(iso))
  return <time dateTime={iso} suppressHydrationWarning>{text}</time>
}

/**
 * Enquiries from the website, newest first, with the reply promise checked:
 * "We reply within one business day" (src/lib/reply-time.ts). Replies go
 * from your own email; mark each one as replied here so the count is honest.
 */
export function EnquiryInbox({ initial, max, timeZone, alertsOn }: { initial: Enquiry[]; max: number; timeZone: string; alertsOn: boolean }) {
  const [items, setItems] = useState(initial)
  const [open, setOpen] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const stats = useMemo(() => replyStats(items, now, timeZone), [items, now, timeZone])

  async function markReplied(id: string, replied: boolean) {
    setError(null)
    const result = await send("PATCH", id, { replied })
    if ("error" in result) return setError(result.error)
    if (result.enquiry) setItems((list) => list.map((x) => (x.id === id ? (result.enquiry as Enquiry) : x)))
    setNow(new Date())
  }

  async function remove(e: Enquiry) {
    if (!window.confirm(`Delete ${e.name}'s enquiry for good?`)) return
    setError(null)
    const result = await send("DELETE", e.id)
    if ("error" in result) return setError(result.error)
    setItems((list) => list.filter((x) => x.id !== e.id))
    setOpen((o) => (o === e.id ? null : o))
  }

  async function refresh() {
    setRefreshing(true)
    setError(null)
    const res = await fetch("/api/admin/enquiries", { cache: "no-store" }).catch(() => null)
    setRefreshing(false)
    setNow(new Date())
    if (!res) return setError("Couldn't reach the server.")
    if (res.status === 401) return setError("Your session ended. Sign in again in a new tab.")
    const body = (await res.json().catch(() => ({}))) as { items?: Enquiry[]; error?: string }
    if (!res.ok || !body.items) return setError(body.error ?? "That didn't work.")
    setItems(body.items)
  }

  return (
    <>
      <div className="adm-card">
        <h1>Enquiries</h1>
        <p className="adm-note">
          Everything sent from the form on the website lands here, with the visitor&apos;s calculator numbers. Reply from your own email, then mark it as replied
          so the count below stays honest. The site promises a reply within one business day: by the end of the next weekday in {timeZone.replace("_", " ")} time
          (public holidays aren&apos;t counted).
        </p>
        {!alertsOn && (
          <p className="adm-warn">
            Email alerts are off, so nobody is told when an enquiry arrives. Set RESEND_API_KEY, ENQUIRY_FROM and ENQUIRY_NOTIFY_TO on the server. Until then,
            check this page every day.
          </p>
        )}
        {items.length >= max * 0.9 && (
          <p className="adm-warn">{items.length >= max ? "The inbox is full, so new enquiries can't be saved." : "The inbox is nearly full."} Delete old enquiries.</p>
        )}
        {error && <p role="alert" className="adm-err" style={{ marginTop: 12 }}>{error}</p>}
      </div>

      <div className="adm-stats" aria-label="Replies in the last 30 days">
        <div className={stats.overdue ? "adm-stat bad" : "adm-stat"}><b>{stats.overdue}</b><span>overdue now</span></div>
        <div className="adm-stat"><b>{stats.waiting}</b><span>waiting for a reply</span></div>
        <div className="adm-stat">
          <b>{stats.replied ? `${stats.onTime} of ${stats.replied}` : "–"}</b>
          <span>replied on time, last 30 days</span>
        </div>
        <div className="adm-stat"><b>{stats.medianMinutes === null ? "–" : formatDuration(stats.medianMinutes)}</b><span>typical reply time, last 30 days</span></div>
      </div>

      <section className="adm-card">
        <div className="adm-actions" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <h2>Inbox · {items.length}</h2>
          <button type="button" className="adm-btn" disabled={refreshing} onClick={() => void refresh()}>{refreshing ? "Checking…" : "Check for new"}</button>
        </div>
        {items.length === 0 ? (
          <p className="adm-note">No enquiries yet. They come from the form at the bottom of the home page.</p>
        ) : (
          <ul className="adm-list">
            {items.map((e) => {
              const state = replyState(e, now, timeZone)
              const isOpen = open === e.id
              return (
                <li key={e.id}>
                  <button type="button" className="adm-row" aria-expanded={isOpen} aria-controls={`enq-${e.id}`} onClick={() => setOpen(isOpen ? null : e.id)}>
                    <span className="who">{e.business} · {e.name}</span>
                    <span className="what">{e.package}{e.calculator ? ` · ${e.calculator.costPerClient > 0 ? `A$${e.calculator.costPerClient.toLocaleString("en-AU")} per client` : "calculator used"}` : ""}</span>
                    <When iso={e.createdAt} timeZone={timeZone} />
                    <span className={`badge ${state}`}>{LABEL[state]}</span>
                  </button>
                  {isOpen && (
                    <div className="adm-detail" id={`enq-${e.id}`}>
                      <dl className="adm-dl">
                        <dt>From</dt><dd>{e.name}</dd>
                        <dt>Email</dt><dd><b>{e.email}</b></dd>
                        <dt>Business</dt><dd>{e.business}</dd>
                        <dt>Website</dt><dd>{e.website || "none given"}</dd>
                        <dt>Package</dt><dd>{e.package}</dd>
                        <dt>Budget</dt><dd>{e.budget}</dd>
                        <dt>Leaks ticked</dt><dd>{e.leaks.length ? e.leaks.join("; ") : "none"}</dd>
                        <dt>Calculator</dt><dd>{calculatorLines(e).map((l) => <span key={l} style={{ display: "block" }}>{l.replace(/^Calculator: /, "")}</span>)}</dd>
                        <dt>Received</dt><dd><When iso={e.createdAt} timeZone={timeZone} /></dd>
                        <dt>Reply due</dt><dd><When iso={replyDeadline(new Date(e.createdAt), timeZone).toISOString()} timeZone={timeZone} /></dd>
                        {e.repliedAt && (<><dt>Replied</dt><dd><When iso={e.repliedAt} timeZone={timeZone} /> by {e.repliedBy} ({formatDuration((new Date(e.repliedAt).getTime() - new Date(e.createdAt).getTime()) / 60_000)})</dd></>)}
                        <dt>Email alert</dt><dd>{e.notifiedAt ? "Sent" : e.notifyError ? `Not sent: ${e.notifyError}` : "Off when it arrived"}</dd>
                      </dl>
                      <p className="adm-msg">{e.message || "(no message)"}</p>
                      <div className="adm-actions">
                        <a className="adm-btn ink" href={`mailto:${e.email}?subject=${encodeURIComponent(`Your enquiry: ${e.business}`)}`}>Reply by email</a>
                        <button type="button" className={e.repliedAt ? "adm-btn" : "adm-btn primary"} onClick={() => void markReplied(e.id, !e.repliedAt)}>
                          {e.repliedAt ? "Mark as not replied" : "Mark as replied"}
                        </button>
                        <button type="button" className="adm-btn danger" onClick={() => void remove(e)}>Delete</button>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </>
  )
}

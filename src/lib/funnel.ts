// Relative with extension: the unit tests import this file straight into Node.
import { SLOW_LOSS } from "../data/benchmarks.ts"

/**
 * The calculator's arithmetic, shared by the server render (so the first
 * paint shows the real default) and the browser. Pure, so the published
 * numbers are pinned by tests/unit/funnel.test.ts.
 *
 *   clicks   = spend / cost per click
 *   reach    = 1 - SLOW_LOSS for a slow site, else 1
 *   enquiries = clicks * reach * enquiry rate
 *   booked   = enquiries * close rate
 *   cost per client = spend / booked
 */

export interface FunnelInput {
  /** A$ a month. */
  spend: number
  /** A$ per click. */
  cpc: number
  /** Percent of clicks that enquire. */
  cr: number
  /** Percent of enquiries that book. */
  close: number
  /** A$ per booked job; 0 when the visitor hasn't said. */
  job: number
}

export interface FunnelResult {
  clicks: number
  /** Clicks lost to a slow site. */
  lost: number
  enquiries: number
  booked: number
  /** Ad spend per booked client; 0 when nothing books. */
  costPerClient: number
  /** Booked work in A$; 0 when job is 0. */
  work: number
}

export function funnel(input: FunnelInput, slow: boolean): FunnelResult {
  const clicks = input.cpc > 0 ? input.spend / input.cpc : 0
  const reach = slow ? 1 - SLOW_LOSS : 1
  const enquiries = (clicks * reach * input.cr) / 100
  const booked = (enquiries * input.close) / 100
  return {
    clicks,
    lost: clicks * (1 - reach),
    enquiries,
    booked,
    costPerClient: booked > 0.01 ? input.spend / booked : 0,
    work: booked * input.job,
  }
}

/** Pay-per-booking package: A$800 a month plus A$150 a booking, capped at A$2,000. */
export function payPerBookingFee(booked: number): number {
  return Math.min(800 + 150 * booked, 2000)
}

/** Two significant figures, so an estimate doesn't look more exact than it is. */
export function sig2(n: number): number {
  if (!(n > 0)) return 0
  const p = Math.pow(10, Math.max(0, Math.floor(Math.log10(n)) - 1))
  return Math.round(n / p) * p
}

/** "A$320" for an estimate. */
export function approxAud(n: number): string {
  return "A$" + sig2(n).toLocaleString("en-AU")
}

/** "A$1,500" for an exact amount someone entered. */
export function aud(n: number): string {
  return "A$" + Math.round(n).toLocaleString("en-AU")
}

/** One decimal under 10, whole numbers above: "4.7", "24". */
export function count(n: number): string {
  return n < 10 ? n.toFixed(1) : String(Math.round(n))
}

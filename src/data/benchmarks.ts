/**
 * The published figures behind the cost-per-client calculator. Each one is
 * cited on the page next to the calculator, so change the source text in
 * Calculator.tsx in the same commit as a number here.
 *
 * Checked October 2026:
 * - CPC: DNHQ Australian Click Price Index, May 2026 (an agency's own index,
 *   not independently audited). Median A$3.81 across 8,400+ Australian service
 *   keywords; trades A$9.25.
 * - Enquiry rate: WordStream / LocaliQ Google Ads Benchmarks 2026, 13,000+ US
 *   search campaigns, April 2025 to March 2026. 8.18% all industries, 8.05%
 *   home and home improvement. No Australian equivalent found.
 * - Slow site: Google, 2016: 53% of mobile visits are abandoned when a page
 *   takes over 3 seconds. Mobile share: StatCounter, Australia, June to
 *   September 2026, about 45-50%; 50% is used.
 */

export type IndustryKey = "svc" | "trade"

export interface Preset {
  label: string
  /** Australian dollars per click. */
  cpc: number
  /** Percent of clicks that become an enquiry. */
  cr: number
}

export const PRESETS: Record<IndustryKey, Preset> = {
  svc: { label: "Service business (most)", cpc: 3.81, cr: 8.18 },
  trade: { label: "Trades and home improvement", cpc: 9.25, cr: 8.05 },
}

export const MOBILE_SHARE = 0.5
export const SLOW_ABANDON = 0.53
/** Share of clicks a site slower than 3 seconds loses before anyone sees it. */
export const SLOW_LOSS = MOBILE_SHARE * SLOW_ABANDON

/** Not research: the starting value until a visitor enters their own. The page says so. */
export const PLACEHOLDER_CLOSE_RATE = 20

export const SPEND = { min: 500, max: 8000, step: 100, start: 1500 }

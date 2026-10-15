/**
 * Packages and prices (CONVENTIONS §8: never hard-coded in components). Ad
 * spend is always on top and paid by the client straight to Google and Meta.
 * "first12" is build + 12 months, and must stay equal to that sum: a unit
 * test checks it.
 */

export interface Package {
  /** Sent with the enquiry and shown in the admin. */
  name: string
  label: string
  tag: string
  lead: string
  /** One-off build or setup fee, A$. */
  upfront: number
  upfrontNote: string
  /** A$ a month. */
  monthly: number
  bullets: string[]
  featured?: boolean
  button: string
}

export const PACKAGES: Package[] = [
  {
    name: "Launch",
    label: "Website + growth",
    tag: "Recommended start",
    lead: "A new website and booking system, then 90 days of Google Ads to fill it.",
    upfront: 9500,
    upfrontNote: "build",
    monthly: 1450,
    bullets: [
      "Custom website, live in 4–6 weeks",
      "HoneyBook or Programa for enquiries, quotes, contracts and deposits",
      "Booked-client tracking wired into Google Ads",
      "90-day Google Ads sprint, then month to month",
      "Care plan included in the monthly (A$250)",
    ],
    featured: true,
    button: "Choose Launch",
  },
  {
    name: "Booked Solid",
    label: "Full service",
    tag: "Ads + social",
    lead: "Everything in Launch, plus the social content people check before they enquire.",
    upfront: 9500,
    upfrontNote: "build",
    monthly: 2450,
    bullets: [
      "Everything in Launch",
      "12 posts a month on Instagram, Facebook and Pinterest",
      "A content plan built from your own projects",
      "Ads and social reported as one cost per client",
    ],
    button: "Choose Booked Solid",
  },
  {
    name: "Grow",
    label: "Keep your site",
    tag: "No rebuild",
    lead: "Keep your website. We fix the tracking and run the ads.",
    upfront: 1500,
    upfrontNote: "setup",
    monthly: 1200,
    bullets: [
      "Tracking audit and fixes on your current site",
      "Booked-client tracking, if your booking tool supports it (we check first)",
      "Google Ads management",
      "Add social for A$2,200/mo all up",
    ],
    button: "Choose Grow",
  },
]

/** The performance package is priced per booking, so it has its own shape. */
export const PAY_PER_BOOKING = {
  name: "Pay per booking",
  label: "Shared risk",
  tag: "Performance",
  lead: "A lower monthly fee, plus a fee for each booked client we can trace to the ads.",
  monthly: 800,
  perBooking: 150,
  cap: 2000,
  bullets: ["Google Ads management", "A booking count you can check any time", "Starts once tracking is live: A$1,500 setup, or included with a build"],
  button: "Choose this",
}

export const BIGGER_BUILD = {
  name: "A bigger build",
  portalFrom: 15000,
  platformFrom: 35000,
}

export const firstTwelveMonths = (p: Pick<Package, "upfront" | "monthly">) => p.upfront + 12 * p.monthly

/** What the enquiry form's Package menu offers, in order. */
export const PACKAGE_CHOICES = ["Not sure yet", ...PACKAGES.map((p) => p.name), PAY_PER_BOOKING.name, BIGGER_BUILD.name] as const

export const BUDGETS = ["Not sure", "Under A$5,000", "A$5,000–10,000", "A$10,000–25,000", "A$25,000+"] as const

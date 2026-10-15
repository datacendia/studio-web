/**
 * The studio's name is a placeholder until Stuart and Evelyn choose one.
 * Change it here and every page, title and email follows.
 */
export const SITE = {
  name: "Built & Booked",
  people: "Stuart Rainey and Evelyn Nunez",
  country: "Australia",
  description:
    "Websites, booking systems, Google Ads and social content for Australian service businesses, measured on one number: what each booked client cost you.",
}

/** Leaks a visitor can tick on the calculator; sent with the enquiry. */
export const SLOW_SITE_LEAK = "Site takes over 3 seconds on a phone"

export const RESEARCH_LEAKS = ["Replies take more than an hour", "No reviews or past work on show", "Google never learns who paid"] as const

export const LEAKS = [SLOW_SITE_LEAK, ...RESEARCH_LEAKS] as const

import { SITE } from "@/data/site"

/** Who the studio is, and the promises every client gets. */
export function Studio() {
  return (
    <section className="studio" id="studio">
      <div className="wrap">
        <div className="studio-grid">
          <p className="label">The studio</p>
          <div>
            <p className="studio-big">{SITE.name} is {SITE.people}. A small studio on purpose: the people you meet are the people doing the work, from the first sketch to the monthly numbers.</p>
            <p>We're building DrMarshllow, Evelyn's own brand, the same way we'd build yours, so we know your side of it: paying for ads, waiting on enquiries, and wondering what's actually working.</p>
          </div>
        </div>
        <div className="promises">
          <div className="promise"><h3><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 9.5 7 14 16 4" fill="none" stroke="currentColor" strokeWidth="2.4"/></svg>You own everything</h3><p>Website, domain, ad accounts and booking system are in your name. Leave any time and take it all with you.</p></div>
          <div className="promise"><h3><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 9.5 7 14 16 4" fill="none" stroke="currentColor" strokeWidth="2.4"/></svg>Your ad money stays yours</h3><p>Google and Meta charge your card directly. Our fee is a separate invoice, so you always see both.</p></div>
          <div className="promise"><h3><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 9.5 7 14 16 4" fill="none" stroke="currentColor" strokeWidth="2.4"/></svg>Scope in writing</h3><p>You sign off a written scope before we start. Anything new is quoted before it's built.</p></div>
          <div className="promise"><h3><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 9.5 7 14 16 4" fill="none" stroke="currentColor" strokeWidth="2.4"/></svg>50% to start</h3><p>A 50% deposit starts a build. The rest is due at launch.</p></div>
          <div className="promise"><h3><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 9.5 7 14 16 4" fill="none" stroke="currentColor" strokeWidth="2.4"/></svg>90 days, then your call</h3><p>Growth plans run 90 days so the ads can learn. After that it's month to month.</p></div>
          <div className="promise"><h3><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 9.5 7 14 16 4" fill="none" stroke="currentColor" strokeWidth="2.4"/></svg>Every number, every month</h3><p>Spend, enquiries, bookings and cost per client, including the months that go badly.</p></div>
        </div>
      </div>
    </section>
  )
}

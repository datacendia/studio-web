import { PLACEHOLDER_CLOSE_RATE, PRESETS, SPEND } from "@/data/benchmarks"
import { BIGGER_BUILD, firstTwelveMonths, PACKAGES, PAY_PER_BOOKING } from "@/data/packages"
import { approxAud, aud, funnel, payPerBookingFee } from "@/lib/funnel"

/** Prices come from src/data/packages.ts. "Choose" buttons put the package on the enquiry form (HomeBehaviour, data-pick). */
export function Packages() {
  const start = funnel({ spend: SPEND.start, cpc: PRESETS.svc.cpc, cr: PRESETS.svc.cr, close: PLACEHOLDER_CLOSE_RATE, job: 0 }, true)
  return (
    <section className="pk" id="packages">
      <div className="wrap">
        <div className="sec-head">
          <h2 className="sec-title rv">Packages</h2>
          <p>Four ways to start. Ad spend is always on top, and it goes straight from your card to Google and Meta, never through us.</p>
        </div>
        <div className="pkgs">
          {PACKAGES.map((p) => (
            <article key={p.name} className={p.featured ? "pkg feat" : "pkg"}>
              <div className="pkg-top"><span className="label">{p.label}</span><span className="tag">{p.tag}</span></div>
              <h3>{p.name}</h3>
              <p className="lead">{p.lead}</p>
              <div className="price"><b>{aud(p.upfront)}</b><span>{p.upfrontNote}, then {aud(p.monthly)}/mo</span></div>
              <ul>{p.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
              <div className="pkg-foot">
                <small>First 12 months: {aud(firstTwelveMonths(p))}</small>
                <button type="button" className="pill magnetic" data-pick={p.name}>{p.button}</button>
              </div>
            </article>
          ))}
          <article className="pkg">
            <div className="pkg-top"><span className="label">{PAY_PER_BOOKING.label}</span><span className="tag">{PAY_PER_BOOKING.tag}</span></div>
            <h3>{PAY_PER_BOOKING.name}</h3>
            <p className="lead">{PAY_PER_BOOKING.lead}</p>
            <div className="price">
              <b>{aud(PAY_PER_BOOKING.monthly)}</b>
              <span>/mo + {aud(PAY_PER_BOOKING.perBooking)} per booking, never more than {aud(PAY_PER_BOOKING.cap)}/mo</span>
            </div>
            <ul>{PAY_PER_BOOKING.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
            <div className="pkg-foot">
              <small id="ppbEst">At the calculator&apos;s numbers: about {approxAud(payPerBookingFee(start.booked))}/mo</small>
              <button type="button" className="pill magnetic" data-pick={PAY_PER_BOOKING.name}>{PAY_PER_BOOKING.button}</button>
            </div>
          </article>
        </div>
        <div className="special">
          <p>
            <b>Bigger builds.</b> A branded client portal from {aud(BIGGER_BUILD.portalFrom)}, or a fully custom platform you own outright from{" "}
            {aud(BIGGER_BUILD.platformFrom)}. Most businesses don&apos;t need one, and we&apos;ll tell you if you don&apos;t.
          </p>
          <button type="button" className="pill ghost sm magnetic" data-pick={BIGGER_BUILD.name}>Ask about it</button>
        </div>
      </div>
    </section>
  )
}

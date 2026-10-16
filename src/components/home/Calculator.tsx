import { MOBILE_SHARE, PLACEHOLDER_CLOSE_RATE, PRESETS, SLOW_ABANDON, SLOW_LOSS, SPEND } from "@/data/benchmarks"
import { RESEARCH_LEAKS } from "@/data/site"
import { approxAud, aud, count, funnel } from "@/lib/funnel"

const pct = (n: number) => `${Math.round(n * 1000) / 10}%`
const external = { target: "_blank", rel: "noopener" } as const

/**
 * The cost-per-client calculator. Rendered here with the starting numbers so
 * the first paint is already right; HomeBehaviour takes over in the browser
 * and keeps the same element ids up to date. Every figure in the sources list
 * comes from src/data/benchmarks.ts.
 */
export function Calculator() {
  const svc = PRESETS.svc
  const start = { spend: SPEND.start, cpc: svc.cpc, cr: svc.cr, close: PLACEHOLDER_CLOSE_RATE, job: 0 }
  const slow = funnel(start, true)
  const fast = funnel(start, false)
  const lost = Math.round(slow.lost)

  return (
    <section className="night engine" id="machine">
      <div className="wrap">
        <h2 className="sec-title">What does a booked client cost<span className="acc">?</span></h2>
        <div className="engine-sub">
          <p>
            Every dot is someone who clicked your ad. Most leave without enquiring, which is normal for every business. A slow website loses more. Click prices and
            enquiry rates below are published research, linked under the calculator. Your close rate and job size should be your own.
          </p>
        </div>
        <div className="rig">
          <div className="machine" id="mach">
            <canvas id="sim" aria-hidden="true"></canvas>
            <div className="m-row m-src">
              <div className="m-side l"><span className="m-chip"><span className="k">Per booked client</span><b id="chipCpa">{approxAud(slow.costPerClient)}</b></span></div>
              <div className="m-corr"><span className="spout">Your ads</span><span className="spout-sub" id="spoutSpend">{aud(SPEND.start)}/mo</span></div>
              <div className="m-side r"><span className="legend"><span><i className="lg"></i>a click</span><span><i className="lg lost"></i>lost to a slow site</span><span><i className="lg bk"></i>booked</span></span></div>
            </div>
            <div className="m-row m-stage">
              <div className="m-side l">
                <button type="button" className="leak" id="speedLeak" aria-pressed="false">
                  <span className="lk-name">Takes over 3 seconds on a phone</span>
                  <span className="lk-fix">Tap to fix: a fast site</span>
                  <span className="lk-lost" id="speedLost">−{lost} clicks a month</span>
                </button>
              </div>
              <div className="m-corr"><span className="st-name">Website</span></div>
              <div className="m-side r"><p className="m-note"><b id="nLeave">{Math.round(100 - svc.cr)}%</b>of people who reach your site leave without enquiring. Normal for every business, not a leak.</p></div>
            </div>
            <div className="m-row m-stage">
              <div className="m-side l"><p className="m-note right"><b id="nEnq">{count(slow.enquiries)}</b>enquiries a month</p></div>
              <div className="m-corr"><span className="st-name">Booking</span></div>
              <div className="m-side r"><p className="m-note"><b id="nClose">{PLACEHOLDER_CLOSE_RATE}%</b>of enquiries book: your close rate.</p></div>
            </div>
            <div className="m-row m-tray">
              <div className="m-side l"><span className="lost-tot"><span className="k">Clicks lost a month</span><b id="lostTot">{lost}</b></span></div>
              <div className="m-corr tray" id="tray"><span className="tray-label">Booked a month <b id="trayCount">{slow.booked.toFixed(1)}</b></span></div>
              <div className="m-side r"><p className="m-note">Each dot is one click, sped up.</p></div>
            </div>
          </div>
          <aside className="panel" aria-labelledby="pTitle">
            <div>
              <p className="p-k" id="pTitle">Ad spend per booked client</p>
              <p className="p-big" id="oCpa" aria-live="polite">{approxAud(slow.costPerClient)}</p>
              <p className="p-basis" id="oBasis">At a placeholder {PLACEHOLDER_CLOSE_RATE}% close rate. Put in yours below.</p>
              <p className="p-delta" id="oDelta">
                With a fast site: about {approxAud(fast.costPerClient)} per client and {(fast.booked - slow.booked).toFixed(1)} more bookings a month
              </p>
            </div>
            <div className="ctl">
              <label htmlFor="ind">Your industry</label>
              <select id="ind" defaultValue="svc">
                <option value="svc">{PRESETS.svc.label}</option>
                <option value="trade">{PRESETS.trade.label}</option>
                <option value="custom">My own numbers</option>
              </select>
            </div>
            <div className="ctl">
              <label htmlFor="spend">Ad spend a month</label>
              <output id="spendOut" htmlFor="spend">{aud(SPEND.start)}</output>
              <input type="range" id="spend" min={SPEND.min} max={SPEND.max} step={SPEND.step} defaultValue={SPEND.start} />
            </div>
            <div className="ctl2">
              <label htmlFor="cpc">Cost per click (A$)<input type="number" id="cpc" min="0.1" step="0.01" defaultValue={svc.cpc} inputMode="decimal" /></label>
              <label htmlFor="cr">Clicks that enquire (%)<input type="number" id="cr" min="0.1" max="100" step="0.01" defaultValue={svc.cr} inputMode="decimal" /></label>
              <label htmlFor="close">Enquiries that book (%)<input type="number" id="close" min="1" max="100" step="1" defaultValue={PLACEHOLDER_CLOSE_RATE} inputMode="numeric" /></label>
              <label htmlFor="job">Average job (A$)<input type="number" id="job" min="0" step="100" placeholder="Yours" inputMode="numeric" /></label>
            </div>
            <p className="ex">
              {PLACEHOLDER_CLOSE_RATE}% is a placeholder, not research. Put in yours: how many of your last 10 enquiries became paying clients? Add your average job
              to see the work it books.
            </p>
            <dl className="readout">
              <div><dt>Clicks</dt><dd id="oClicks">{Math.round(slow.clicks).toLocaleString("en-AU")}</dd></div>
              <div><dt>Enquiries</dt><dd id="oEnq">{count(slow.enquiries)}</dd></div>
              <div><dt>Booked</dt><dd id="oBook">{slow.booked.toFixed(1)}</dd></div>
            </dl>
            <p className="p-work" id="pWork">Add your average job to see the work this books.</p>
            <div className="btns"><button type="button" className="pill ghost sm" id="pause" aria-pressed="false">Pause</button></div>
            <ul className="srcs" aria-label="Sources">
              <li>
                Cost per click: <a href="https://digitalnomadshq.com.au/blog/how-much-does-google-ads-cost/" {...external}>DNHQ Australian Click Price Index</a>, May 2026.
                Median A${PRESETS.svc.cpc} across 8,400+ Australian service keywords; trades A${PRESETS.trade.cpc}. It&apos;s published by an ads agency and not
                independently audited, and other estimates differ, so use your own if you have it.
              </li>
              <li>
                Clicks that enquire: <a href="https://www.wordstream.com/blog/2026-google-ads-benchmarks" {...external}>WordStream and LocaliQ Google Ads Benchmarks 2026</a>.
                {" "}{PRESETS.svc.cr}% across all industries, {PRESETS.trade.cr}% for home and home improvement, from 13,000+ US search campaigns (April 2025 to March
                2026). It counts whatever each advertiser tracked as a conversion, usually calls and forms. We haven&apos;t found an Australian equivalent.
              </li>
              <li>
                Slow site: <a href="https://thinkwithgoogle.com/consumer-insights/consumer-trends/mobile-site-load-time-statistics/" {...external}>Google</a> found{" "}
                {pct(SLOW_ABANDON)} of mobile visits are abandoned when a page takes over 3 seconds (2016 data). Mobile is about 45–50% of Australian web traffic in
                2026 (<a href="https://gs.statcounter.com/platform-market-share/desktop-mobile/australia" {...external}>StatCounter</a>); we use {pct(MOBILE_SHARE)}, so a
                slow site loses about {pct(SLOW_LOSS)} of clicks. Ad clicks lean more mobile than that, which would make the loss bigger. It also assumes the people
                who leave would have enquired at the usual rate, which would make it smaller.
              </li>
              <li>
                The enquiry benchmark averages fast and slow sites. We apply it to a fast site, which keeps both results on the cautious side. Results are rounded
                because they&apos;re estimates, not promises. Your real numbers come from your own ad account.
              </li>
            </ul>
          </aside>
        </div>

        <div className="research">
          <div className="research-head">
            <h3>Other leaks we fix</h3>
            <p>
              Research backs these, but the effect depends too much on your business to put a fair number on. So they&apos;re not in the calculator. Tick any you
              have and they go on your enquiry.
            </p>
          </div>
          <div className="r-grid">
            <div className="r-card">
              <h4>{RESEARCH_LEAKS[0]}</h4>
              <p>
                In a study of 1.25 million sales leads, firms that contacted a lead within an hour were nearly seven times as likely to have a real conversation
                with them as firms that waited even an hour longer.
              </p>
              <p className="src">
                Oldroyd, McElheran and Elkington, <a href="https://scholarsarchive.byu.edu/facpub/9711" {...external}>&ldquo;The Short Life of Online Sales Leads&rdquo;</a>,
                Harvard Business Review, 2011.
              </p>
              <label className="chk" htmlFor="r-reply"><input type="checkbox" id="r-reply" data-name={RESEARCH_LEAKS[0]} /> We have this</label>
            </div>
            <div className="r-card">
              <h4>{RESEARCH_LEAKS[1]}</h4>
              <p>
                On one retailer&apos;s site, products with five reviews were 270% more likely to be bought than products with none. Clients check your work before
                they enquire.
              </p>
              <p className="src">
                Spiegel Research Center, 2017, from one retailer&apos;s data.{" "}
                <a href="https://marketingsherpa.com/article/chart/university-study-online-reviews-affect-sales" {...external}>Summary</a>.
              </p>
              <label className="chk" htmlFor="r-proof"><input type="checkbox" id="r-proof" data-name={RESEARCH_LEAKS[1]} /> We have this</label>
            </div>
            <div className="r-card">
              <h4>{RESEARCH_LEAKS[2]}</h4>
              <p>
                Google&apos;s bidding can only aim your ads at people who become paying clients if it&apos;s told which clicks turned into clients. We send that
                back to Google Ads for you.
              </p>
              <p className="src"><a href="https://support.google.com/google-ads/answer/15099424" {...external}>Google Ads Help: value-based bidding</a>.</p>
              <label className="chk" htmlFor="r-loop"><input type="checkbox" id="r-loop" data-name={RESEARCH_LEAKS[2]} /> We have this</label>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

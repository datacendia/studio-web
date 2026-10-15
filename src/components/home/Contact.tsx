import { BUDGETS, PACKAGE_CHOICES } from "@/data/packages"
import { SITE } from "@/data/site"
import { MESSAGE_MAX } from "@/lib/enquiries"

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
)

/**
 * The enquiry form. HomeBehaviour checks it, attaches the calculator numbers
 * and posts it to /api/enquiry. The "hp" field is hidden from people and
 * screen readers; bots fill it in and get a polite thanks with nothing saved.
 */
export function Contact() {
  return (
    <section className="night contact" id="contact">
      <div className="wrap">
        <h2 className="sec-title">Let&apos;s get you <span className="acc">booked.</span></h2>
        <div className="contact-grid">
          <div className="contact-copy">
            <p>Tell us about your business. We&apos;ll look at where your enquiries are leaking and tell you straight whether we can fix it.</p>
            <ol className="next">
              <li>We reply within one business day.</li>
              <li>A 20-minute call at a time that suits you.</li>
              <li>A written scope and a fixed price. No obligation.</li>
            </ol>
          </div>
          <form className="enq" id="enq" noValidate>
            <label className="fld" htmlFor="f-name">Name<input id="f-name" type="text" autoComplete="name" maxLength={80} /></label>
            <label className="fld" htmlFor="f-biz">Business<input id="f-biz" type="text" autoComplete="organization" maxLength={120} /></label>
            <label className="fld" htmlFor="f-email">Email<input id="f-email" type="email" autoComplete="email" maxLength={254} /></label>
            <label className="fld" htmlFor="f-site">
              Website <i>(optional)</i>
              <input id="f-site" type="text" inputMode="url" autoComplete="url" placeholder="yourbusiness.com.au" maxLength={200} />
            </label>
            <label className="fld" htmlFor="f-pkg">
              Package
              <select id="f-pkg" defaultValue={PACKAGE_CHOICES[0]}>{PACKAGE_CHOICES.map((p) => <option key={p}>{p}</option>)}</select>
            </label>
            <label className="fld" htmlFor="f-budget">
              Budget
              <select id="f-budget" defaultValue={BUDGETS[0]}>{BUDGETS.map((b) => <option key={b}>{b}</option>)}</select>
            </label>
            <label className="fld full" htmlFor="f-msg">
              Anything else
              <textarea id="f-msg" maxLength={MESSAGE_MAX} placeholder="What you sell, what a client is worth to you, what isn't working"></textarea>
            </label>
            <label className="hp" aria-hidden="true">Leave this empty<input id="f-hp" type="text" tabIndex={-1} autoComplete="off" /></label>
            <p className="err" id="formError" role="alert" hidden></p>
            <div className="send-row">
              <button type="submit" className="pill accent magnetic">Send enquiry <Arrow /></button>
              <span className="form-note">Your calculator numbers and the leaks you ticked are added for you. We only use your details to reply.</span>
            </div>
            <div className="sent" id="sent" tabIndex={-1} role="status" hidden>
              <strong>Thanks<span id="sentName"></span>. It&apos;s sent.</strong>
              <span className="form-note">One of us will reply within one business day. Your calculator numbers came through with it.</span>
            </div>
          </form>
        </div>
        <div className="foot-row">
          <span>© {new Date().getFullYear()} {SITE.name} · {SITE.country}</span>
          <span>Prices in Australian dollars. We&apos;re not registered for GST yet, so no GST is charged. If we register, GST is added to future invoices.</span>
        </div>
      </div>
    </section>
  )
}

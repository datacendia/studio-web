/** The opening screen. The headline is sized to the column in the browser (HomeBehaviour, data-fit). */
export function Hero() {
  return (
    <section className="hero">
      <div className="wrap">
        <div className="hero-top label">
          <span>Websites · Booking systems · Google Ads · Social</span>
          <span className="live"><i></i>Australia · Booking first clients</span>
        </div>
        <h1 className="hero-lines" data-fit data-max="164">
          <span className="mega"><span>Built.</span></span>
          <span className="mega"><span className="acc">Booked.</span></span>
        </h1>
        <div className="hero-bottom">
          <p>We build the website, set up the booking system, then run the Google Ads and social that fill it. One studio, measured on one number: what each booked client cost you.</p>
          <div className="cta-row">
            <a className="pill accent magnetic" href="#contact">Book a call <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" fill="none" stroke="currentColor" strokeWidth="1.8"/></svg></a>
            <a className="pill ghost magnetic" href="#machine">Work out your cost per client</a>
          </div>
        </div>
      </div>
    </section>
  )
}

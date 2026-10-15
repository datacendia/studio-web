/** What the studio does, one row per service. */
export function Services() {
  return (
    <section className="svc" id="services">
      <div className="wrap">
        <div className="sec-head">
          <h2 className="sec-title rv">What we do</h2>
          <p>Everything between the ad and the invoice, under one roof. Nothing falls between agencies because there's only one of us.</p>
        </div>
        <ul className="svc-list">
          <li><a className="svc-row" href="#packages"><h3>Websites</h3><p>Custom sites that load fast and make booking one tap, on any phone.</p><span className="tags"><span>Design</span><span>Build</span><span>Care plan</span></span></a></li>
          <li><a className="svc-row" href="#packages"><h3>Booking systems</h3><p>Enquiries, proposals, contracts and deposits in one place, set up in HoneyBook or Programa.</p><span className="tags"><span>HoneyBook</span><span>Programa</span><span>Xero</span></span></a></li>
          <li><a className="svc-row" href="#packages"><h3>Google Ads</h3><p>Campaigns judged on booked clients, with a landing page for every ad.</p><span className="tags"><span>Search</span><span>Landing pages</span><span>Tracking</span></span></a></li>
          <li><a className="svc-row" href="#packages"><h3>Social content</h3><p>A monthly plan built from your real projects, so people trust you before they enquire.</p><span className="tags"><span>Instagram</span><span>Facebook</span><span>Pinterest</span></span></a></li>
          <li><a className="svc-row" href="#packages"><h3>Reporting</h3><p>One number every month: what each booked client cost you. The bad months too.</p><span className="tags"><span>Cost per client</span><span>Monthly review</span></span></a></li>
        </ul>
      </div>
    </section>
  )
}

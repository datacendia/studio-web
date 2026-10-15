/** Questions, answered with plain disclosure. The calculator answer must match the sources under the calculator. */
export function Faq() {
  return (
    <section className="faq-sec" id="faq">
      <div className="wrap faq-grid">
        <h2 className="sec-title rv">Questions</h2>
        <div className="faq">
          <details><summary>Do you charge GST?<span className="pm" aria-hidden="true"></span></summary><p>Not yet. We're not registered for GST, so our prices don't include it. If we register, GST is added to future invoices. If your business is GST-registered, you claim it back.</p></details>
          <details><summary>Who pays for the ads?<span className="pm" aria-hidden="true"></span></summary><p>You do, directly. Google and Meta charge your card. Our fee is a separate invoice.</p></details>
          <details><summary>Where do the calculator's numbers come from?<span className="pm" aria-hidden="true"></span></summary><p>Click prices come from an index of Australian service keywords, enquiry rates from a 2026 study of over 13,000 US Google Ads campaigns (we haven't found an Australian equivalent), and the slow-site figure from Google's own research. The 20% close rate is a placeholder until you put in yours. The sources are listed under the calculator. They're averages: your real numbers come from your own account.</p></details>
          <details><summary>What's HoneyBook, and do I have to use it?<span className="pm" aria-hidden="true"></span></summary><p>HoneyBook handles enquiries, proposals, contracts, invoices and payments in one place, and launched in Australia in May 2026. If it doesn't suit you, we use Programa (built for interior designers, connects to Xero) or connect what you already use.</p></details>
          <details><summary>Can you guarantee results?<span className="pm" aria-hidden="true"></span></summary><p>No, and be careful of anyone who does. We guarantee the work, the tracking, and honest numbers every month.</p></details>
          <details><summary>Who do you work with?<span className="pm" aria-hidden="true"></span></summary><p>Businesses that sell projects or appointments: interior designers first, then architects, stylists, photographers, builders and landscapers. If a new client is worth a few thousand dollars or more, this pays for itself sooner.</p></details>
        </div>
      </div>
    </section>
  )
}

const LEAD = "Most agencies hand you clicks and call it results. We run the whole path from ad to invoice, so we can show you the number that matters:"
const HIGHLIGHT = "what each booked client cost you."

/** One span per word, rendered here so the browser only has to light them up as you scroll (HomeBehaviour). */
function Words({ text, hl }: { text: string; hl?: boolean }) {
  return text.split(" ").map((w, i) => (
    <span key={i}>
      {i > 0 && " "}
      <span className={hl ? "w hl" : "w"}>{w}</span>
    </span>
  ))
}

export function Statement() {
  return (
    <section className="statement">
      <div className="wrap">
        <div className="statement-grid">
          <p className="label">Why us</p>
          <p className="scrolly"><Words text={LEAD} /> <Words text={HIGHLIGHT} hl /></p>
        </div>
        <div className="stats">
          <div className="stat rv"><b>4–6 wks</b><span>to launch your new website</span></div>
          <div className="stat rv"><b>90 days</b><span>to your first cost-per-client review</span></div>
          <div className="stat rv"><b>100%</b><span>of your accounts stay in your name</span></div>
          <div className="stat rv"><b>A$0</b><span>of your ad spend passes through us</span></div>
        </div>
      </div>
    </section>
  )
}

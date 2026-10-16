import { SITE } from "@/data/site"

/** Splits "Built & Booked" so the ampersand can be styled; any other name shows as it is. */
function BrandName() {
  const [first, ...rest] = SITE.name.split(" & ")
  if (rest.length === 0) return <>{SITE.name}</>
  return <>{first}<i>&amp;</i>{rest.join(" & ")}</>
}

/** Frosted bar that turns deep teal over the teal sections (HomeBehaviour toggles .dark). */
export function SiteHeader() {
  return (
    <header className="head">
      <div className="wrap">
        <a className="brand" href="#top"><span className="mark" aria-hidden="true"></span><BrandName /></a>
        <nav className="nav" aria-label="Sections">
          <a href="#machine">Calculator</a>
          <a href="#services">Services</a>
          <a href="#packages">Packages</a>
          <a href="#studio">Studio</a>
        </nav>
        <a className="pill sm magnetic" href="#contact">Book a call</a>
      </div>
    </header>
  )
}

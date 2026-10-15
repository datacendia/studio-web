/** The scrolling strip of services. The second copy is for the seamless loop, so it is hidden from screen readers. */
export function Marquee() {
  return (
    <div className="marquee" aria-label="What we do: websites, booking systems, Google Ads, social content, conversion tracking, cost per client">
      <div className="mq-track">
        <div className="mq-group">
          <span>Websites</span><svg className="mq-star" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 0v20M0 10h20M2.9 2.9l14.2 14.2M17.1 2.9 2.9 17.1" stroke="currentColor" strokeWidth="2.6"/></svg>
          <span>Booking systems</span><svg className="mq-star" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 0v20M0 10h20M2.9 2.9l14.2 14.2M17.1 2.9 2.9 17.1" stroke="currentColor" strokeWidth="2.6"/></svg>
          <span>Google Ads</span><svg className="mq-star" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 0v20M0 10h20M2.9 2.9l14.2 14.2M17.1 2.9 2.9 17.1" stroke="currentColor" strokeWidth="2.6"/></svg>
          <span>Social content</span><svg className="mq-star" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 0v20M0 10h20M2.9 2.9l14.2 14.2M17.1 2.9 2.9 17.1" stroke="currentColor" strokeWidth="2.6"/></svg>
          <span>Conversion tracking</span><svg className="mq-star" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 0v20M0 10h20M2.9 2.9l14.2 14.2M17.1 2.9 2.9 17.1" stroke="currentColor" strokeWidth="2.6"/></svg>
          <span>Cost per client</span><svg className="mq-star" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 0v20M0 10h20M2.9 2.9l14.2 14.2M17.1 2.9 2.9 17.1" stroke="currentColor" strokeWidth="2.6"/></svg>
        </div>
        <div className="mq-group" aria-hidden="true">
          <span>Websites</span><svg className="mq-star" viewBox="0 0 20 20"><path d="M10 0v20M0 10h20M2.9 2.9l14.2 14.2M17.1 2.9 2.9 17.1" stroke="currentColor" strokeWidth="2.6"/></svg>
          <span>Booking systems</span><svg className="mq-star" viewBox="0 0 20 20"><path d="M10 0v20M0 10h20M2.9 2.9l14.2 14.2M17.1 2.9 2.9 17.1" stroke="currentColor" strokeWidth="2.6"/></svg>
          <span>Google Ads</span><svg className="mq-star" viewBox="0 0 20 20"><path d="M10 0v20M0 10h20M2.9 2.9l14.2 14.2M17.1 2.9 2.9 17.1" stroke="currentColor" strokeWidth="2.6"/></svg>
          <span>Social content</span><svg className="mq-star" viewBox="0 0 20 20"><path d="M10 0v20M0 10h20M2.9 2.9l14.2 14.2M17.1 2.9 2.9 17.1" stroke="currentColor" strokeWidth="2.6"/></svg>
          <span>Conversion tracking</span><svg className="mq-star" viewBox="0 0 20 20"><path d="M10 0v20M0 10h20M2.9 2.9l14.2 14.2M17.1 2.9 2.9 17.1" stroke="currentColor" strokeWidth="2.6"/></svg>
          <span>Cost per client</span><svg className="mq-star" viewBox="0 0 20 20"><path d="M10 0v20M0 10h20M2.9 2.9l14.2 14.2M17.1 2.9 2.9 17.1" stroke="currentColor" strokeWidth="2.6"/></svg>
        </div>
      </div>
    </div>
  )
}

import type { Metadata, Viewport } from "next"
import { SITE } from "@/data/site"
import { env } from "@/lib/env"
import { fontVariables } from "./fonts"
import "./globals.css"

export const metadata: Metadata = {
  ...(env.siteUrl ? { metadataBase: new URL(env.siteUrl) } : {}),
  title: { default: `${SITE.name} · Websites and Google Ads that get you booked`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: { type: "website", siteName: SITE.name, locale: "en_AU", title: SITE.name, description: SITE.description },
  // Indexed only once the name is final and SITE_INDEXABLE is set (src/lib/env.ts).
  robots: env.indexable ? { index: true, follow: true } : { index: false, follow: false },
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }] },
}

export const viewport: Viewport = { themeColor: "#0A3F43", viewportFit: "cover" }

/**
 * `translate="no"` plus `notranslate` opt the page out of browser
 * auto-translate, which mutates the DOM mid-render and breaks React
 * hydration (same fix as rl-templates `_base`).
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" translate="no" className={`notranslate ${fontVariables}`}>
      <body>{children}</body>
    </html>
  )
}

import { Funnel_Display, Funnel_Sans, JetBrains_Mono } from "next/font/google"

/** Served from the site itself, so visitors' browsers never contact Google. */
const display = Funnel_Display({ subsets: ["latin"], variable: "--font-display", display: "swap" })
const sans = Funnel_Sans({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-sans", display: "swap" })
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap", preload: false })

/** Class names that define the --font-* variables on <html>. */
export const fontVariables = [display, sans, mono].map((f) => f.variable).join(" ")

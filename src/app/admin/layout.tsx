import type { Metadata } from "next"

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
}

/** Shared by the login page and the console. Holds no data: enquiries load only after the session is checked. */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children
}

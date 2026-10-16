import Link from "next/link"

export default function NotFound() {
  return (
    <main className="plain">
      <h1>Page not found</h1>
      <p>That page doesn&apos;t exist. <Link href="/">Back to the home page</Link>.</p>
    </main>
  )
}

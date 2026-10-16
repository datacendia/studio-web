"use client"

import { useId, useState } from "react"

export function LoginForm({ next, expired, noAccounts }: { next: string; expired: boolean; noAccounts: boolean }) {
  const emailId = useId()
  const passwordId = useId()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setBusy(true)
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      if (res.ok) {
        // A full load, so the console renders on the server with the new cookie.
        window.location.assign(next)
        return
      }
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      setError(body.error ?? "Sign-in failed. Try again.")
      setPassword("")
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.")
    } finally {
      setBusy(false)
    }
  }

  if (noAccounts) {
    return (
      <div>
        <p><b>No accounts yet.</b> Create one on the server, from the project folder:</p>
        <pre>npm run admin:user -- add --email you@example.com --name &quot;Your name&quot;</pre>
        <p className="adm-note">It asks for a password (12+ characters). Run it once for each of you.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate>
      {expired && <p className="adm-warn">Your session ended. Sign in again.</p>}
      <label className="adm-field" htmlFor={emailId}>
        Email
        <input id={emailId} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="adm-field" htmlFor={passwordId}>
        Password
        <input id={passwordId} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {error && <p role="alert" className="adm-err">{error}</p>}
      <button type="submit" className="adm-btn primary" disabled={busy || !email || !password}>{busy ? "Signing in…" : "Sign in"}</button>
      <p className="adm-note">Forgot your password? Set a new one on the server with npm run admin:user -- password.</p>
    </form>
  )
}

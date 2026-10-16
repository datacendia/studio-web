"use client"

import { useState } from "react"

export function SignOutButton() {
  const [busy, setBusy] = useState(false)
  async function signOut() {
    setBusy(true)
    await fetch("/api/admin/auth/logout", { method: "POST" }).catch(() => null)
    window.location.assign("/admin/login")
  }
  return (
    <button type="button" className="adm-btn" disabled={busy} onClick={() => void signOut()}>
      {busy ? "Signing out…" : "Sign out"}
    </button>
  )
}

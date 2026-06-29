"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function MarkAllReadButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function markAll() {
    setLoading(true)
    try {
      await fetch("/api/notifications/read-all", { method: "POST" })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => void markAll()}
      className="text-[11px] uppercase tracking-widest text-fg-muted hover:text-fg disabled:opacity-50"
    >
      {loading ? "…" : "Mark all read"}
    </button>
  )
}

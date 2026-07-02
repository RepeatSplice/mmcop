"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { UserPlus } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

export function AddStaffForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"STAFF" | "OPS_ADMIN" | "FINANCE">("STAFF")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      const res = await fetch("/api/ops/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? "Something went wrong")
        return
      }
      setSuccess(`${data.staff?.name ?? email} has been added as ${role.replace("_", " ").toLowerCase()}.`)
      setEmail("")
      setRole("STAFF")
      router.refresh()
    })
  }

  return (
    <form onSubmit={submit} className="max-w-lg space-y-4">
      <Input
        id="staff-email"
        label="Email address"
        type="email"
        placeholder="team@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={isPending}
      />

      <div className="flex flex-col gap-1">
        <label
          htmlFor="staff-role"
          className="font-display text-[11px] uppercase tracking-widest text-fg-subtle"
        >
          Role
        </label>
        <select
          id="staff-role"
          value={role}
          onChange={(e) => setRole(e.target.value as typeof role)}
          disabled={isPending}
          className="w-full border border-border bg-surface px-3 py-2 text-sm text-fg focus:border-monarch-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="STAFF">Staff — general ops access</option>
          <option value="OPS_ADMIN">Ops Admin — full access including staff management</option>
          <option value="FINANCE">Finance — finance-level access</option>
        </select>
      </div>

      {error ? (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {success}
        </p>
      ) : null}

      <Button type="submit" isLoading={isPending} disabled={!email.trim()}>
        <UserPlus className="h-4 w-4" strokeWidth={1.5} />
        Add staff member
      </Button>
    </form>
  )
}

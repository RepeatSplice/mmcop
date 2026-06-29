"use client"

import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { signIn } from "next-auth/react"
import { useEffect, useState } from "react"

const AUTH_ERRORS: Record<string, string> = {
  Configuration:
    "Sign-in could not finish. Most often Postgres is not running on localhost:5432, or migrations are missing—not Discord OAuth settings.",
  AdapterError:
    "Could not reach the database. Start Postgres, then run `npx prisma migrate deploy` in monarch-portal.",
  AccessDenied: "Access was denied. Try again or use another account.",
  Verification: "The sign-in link expired. Try again.",
  OAuthSignin: "Could not start Discord sign-in. Check OAuth redirect URLs in the Discord app.",
  OAuthCallback:
    "Discord returned successfully but saving your session failed. Check that Postgres is running and migrations are applied.",
  OAuthCreateAccount: "Could not create your account. Contact support if this persists.",
  CallbackRouteError: "Sign-in callback failed. Check server logs.",
  Default: "Sign-in failed. Try again.",
}

export function LoginPage() {
  const sp = useSearchParams()
  const callbackUrl = sp.get("callbackUrl") || "/"
  const authError = sp.get("error")
  const [providers, setProviders] = useState<{ discord?: unknown; google?: unknown } | null>(null)
  const [dbOk, setDbOk] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [provRes, dbRes] = await Promise.all([
          fetch("/api/auth/providers"),
          fetch("/api/health/db"),
        ])
        if (!cancelled && provRes.ok) {
          setProviders((await provRes.json()) as { discord?: unknown; google?: unknown })
        }
        if (!cancelled) setDbOk(dbRes.ok)
      } catch {
        if (!cancelled) setDbOk(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-screen bg-surface text-fg flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md border border-border bg-surface-1 p-8">
        <p className="font-display text-[11px] uppercase tracking-[0.2em] text-fg-subtle">Monarch Portal</p>
        <h1 className="mt-2 font-display text-2xl uppercase tracking-wide text-fg">Sign in</h1>
        <p className="mt-2 text-sm text-fg-muted">Use Discord to access your workspace.</p>

        {dbOk === false ? (
          <p className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90 leading-relaxed">
            <strong className="font-medium">Database offline.</strong> Sign-in requires Postgres. Start Docker
            Desktop, then from <span className="font-mono text-[10px]">F:\mmbiz</span> run:{" "}
            <span className="font-mono text-[10px]">docker compose up -d postgres</span>
            <br />
            <span className="mt-2 block text-amber-200/80">
              Then: <span className="font-mono">cd monarch-portal</span> →{" "}
              <span className="font-mono">npx prisma migrate deploy</span>
            </span>
          </p>
        ) : null}

        {authError ? (
          <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300 leading-relaxed">
            {AUTH_ERRORS[authError] ?? AUTH_ERRORS.Default}
            <span className="mt-1 block font-mono text-[10px] text-red-400/80">{authError}</span>
          </p>
        ) : null}

        <div className="mt-8 grid gap-3">
          {providers?.discord ? (
            <Button
              type="button"
              disabled={dbOk === false}
              onClick={() => signIn("discord", { callbackUrl })}
              className="w-full"
            >
              Continue with Discord
            </Button>
          ) : null}
          {providers?.google ? (
            <Button
              type="button"
              variant="secondary"
              disabled={dbOk === false}
              onClick={() => signIn("google", { callbackUrl })}
              className="w-full"
            >
              Continue with Google
            </Button>
          ) : null}
          {providers && !providers.discord && !providers.google ? (
            <p className="text-xs text-red-400">
              No OAuth providers are configured. Set AUTH_DISCORD_ID and AUTH_DISCORD_SECRET in .env.local,
              then restart the portal.
            </p>
          ) : null}
        </div>

        <p className="mt-6 text-[10px] text-fg-subtle leading-relaxed">
          Discord redirect URI must include:{" "}
          <span className="font-mono text-fg-muted">http://localhost:4000/api/auth/callback/discord</span>
        </p>
      </div>
    </div>
  )
}

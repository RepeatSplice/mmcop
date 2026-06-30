"use client"

import { useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { useEffect, useState } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import Link from "next/link"

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
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden bg-black">
      {/* ── Left panel: hero image ───────────────────────── */}
      <div className="relative lg:w-[55%] xl:w-[60%] h-44 lg:h-full overflow-hidden shrink-0">
        <img
          src="/Portal_Banner.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-[70%_center]"
        />
        {/* gradient overlay — same profile as main site hero */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, rgb(16 28 39 / 0.88) 0%, rgb(16 28 39 / 0.60) 40%, rgb(16 28 39 / 0.2) 65%, transparent 80%), linear-gradient(180deg, transparent 60%, rgb(16 28 39 / 0.5) 100%)",
          }}
        />
        {/* Label anchored to bottom-left */}
        <div className="relative z-10 hidden lg:flex h-full flex-col justify-end p-10 xl:p-14">
          <p className="font-display text-[11px] uppercase tracking-[0.2em] text-white/50">Monarch</p>
          <h2 className="mt-1 font-display text-3xl uppercase tracking-wide text-white">Portal</h2>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/50">
            Your workspace for retainer projects, sprints, and team collaboration.
          </p>
        </div>
      </div>

      {/* ── Right panel: form — always dark ──────────────── */}
      <div className="flex flex-1 flex-col bg-[#070c12] overflow-y-auto">
        {/* Header row with logo + back */}
        <div className="flex items-center justify-between px-7 py-5 lg:px-10 lg:py-6 border-b border-white/[0.06]">
          <img
            src="/LogoText.svg"
            alt="Monarch"
            className="h-6 w-auto"
            style={{ filter: "brightness(0) invert(1)", opacity: 0.85 }}
          />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-display text-[11px] uppercase tracking-widest text-white/40 transition-colors hover:text-white/80"
          >
            <ArrowLeft className="h-3 w-3" aria-hidden="true" />
            Back
          </Link>
        </div>

        {/* Form body */}
        <div className="flex flex-1 items-center justify-center px-7 py-12 lg:px-12">
          <div className="w-full max-w-sm">
            <p className="font-display text-[11px] uppercase tracking-[0.2em] text-white/35">
              Monarch Portal
            </p>
            <h1 className="mt-2 font-display text-2xl uppercase tracking-wide text-white">
              Sign in
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/45">
              Use Discord to access your workspace.
            </p>

            {dbOk === false ? (
              <p className="mt-5 border border-amber-500/25 bg-amber-500/8 px-3 py-2.5 text-xs text-amber-200/80 leading-relaxed">
                <strong className="font-medium">Database offline.</strong> Sign-in requires
                Postgres — check your{" "}
                <span className="font-mono text-[10px]">DATABASE_URL</span> and run{" "}
                <span className="font-mono text-[10px]">npx prisma migrate deploy</span> in{" "}
                <span className="font-mono text-[10px]">apps/portal</span>.
              </p>
            ) : null}

            {authError ? (
              <p className="mt-5 border border-red-500/25 bg-red-500/8 px-3 py-2.5 text-xs text-red-300/80 leading-relaxed">
                {AUTH_ERRORS[authError] ?? AUTH_ERRORS.Default}
                <span className="mt-1 block font-mono text-[10px] text-red-400/60">
                  {authError}
                </span>
              </p>
            ) : null}

            <div className="mt-8 grid gap-3">
              {providers?.discord ? (
                <button
                  type="button"
                  disabled={dbOk === false}
                  onClick={() => signIn("discord", { callbackUrl })}
                  className="inline-flex w-full items-center justify-center gap-2 border border-white bg-white px-5 py-3 font-display text-xs uppercase tracking-widest text-black transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue with Discord
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              ) : null}

              {providers?.google ? (
                <button
                  type="button"
                  disabled={dbOk === false}
                  onClick={() => signIn("google", { callbackUrl })}
                  className="inline-flex w-full items-center justify-center gap-2 border border-white/20 bg-white/5 px-5 py-3 font-display text-xs uppercase tracking-widest text-white/70 backdrop-blur-sm transition-colors hover:border-white/40 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue with Google
                </button>
              ) : null}

              {providers && !providers.discord && !providers.google ? (
                <p className="text-xs text-red-400/80">
                  No OAuth providers configured. Set AUTH_DISCORD_ID and AUTH_DISCORD_SECRET, then
                  restart the portal.
                </p>
              ) : null}

              {providers === null && dbOk !== false ? (
                <div className="flex items-center gap-2 py-1 text-xs text-white/30">
                  <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
                  Loading providers…
                </div>
              ) : null}
            </div>

            <p className="mt-10 text-[10px] leading-relaxed text-white/25">
              By signing in you agree to the Monarch terms of service.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

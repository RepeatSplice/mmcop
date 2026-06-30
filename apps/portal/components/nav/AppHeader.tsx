"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { useTheme } from "@/components/theme/ThemeProvider"
import { Home, Moon, Search, Sun } from "lucide-react"
import { NavIconButton } from "@/components/nav/NavIconButton"
import { NotificationDropdown } from "@/components/nav/NotificationDropdown"
import { GlobalSearch } from "@/components/nav/GlobalSearch"
import { WorkspaceSwitcher } from "@/components/nav/WorkspaceSwitcher"
import { GlobalCreateMenu } from "@/components/nav/GlobalCreateMenu"
import { GlobalSearchModal } from "@/components/nav/GlobalSearchModal"

gsap.registerPlugin(useGSAP)

type WorkspaceMembership = {
  id: string
  slug: string
  name: string
  role: string
}

export function AppHeader() {
  const pathname = usePathname()
  const inWorkspace = pathname.startsWith("/workspace/")
  const workspaceSlug = inWorkspace ? pathname.match(/^\/workspace\/([^/]+)/)?.[1] : null
  const { theme, toggleTheme } = useTheme()
  const { data: session, status } = useSession()
  const [count, setCount] = useState<number>(0)
  const [mounted, setMounted] = useState(false)
  const [memberships, setMemberships] = useState<WorkspaceMembership[]>([])
  const [isStaff, setIsStaff] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const logoRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (status !== "authenticated") return
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/me/workspaces", { credentials: "same-origin" })
        if (!res.ok || cancelled) return
        const data = (await res.json()) as {
          workspaces: WorkspaceMembership[]
          isStaff?: boolean
        }
        if (cancelled) return
        setMemberships(data.workspaces ?? [])
        setIsStaff(Boolean(data.isStaff))
      } catch {
        /* ignore */
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [status])

  useEffect(() => {
    if (!inWorkspace) return
    let cancelled = false
    async function load() {
      if (status !== "authenticated") return
      const res = await fetch("/api/notifications/unread-count")
      if (!res.ok) return
      const data = (await res.json()) as { count: number }
      if (!cancelled) setCount(data.count)
    }
    load()
    const t = setInterval(load, 15000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [status, inWorkspace])

  useGSAP(
    () => {
      const header = headerRef.current
      if (!header) return

      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(header, { y: -4, opacity: 0, duration: 0.2, ease: "power2.out" })
      })

      return () => mm.revert()
    },
    { scope: headerRef }
  )

  if (pathname === "/login") return null
  if (pathname === "/" && status === "unauthenticated") return null

  const logoFilter = mounted
    ? theme === "dark"
      ? "brightness(0) invert(1)"
      : "brightness(0)"
    : undefined

  const currentMembership = workspaceSlug
    ? memberships.find((w) => w.slug === workspaceSlug) ?? null
    : null
  const canPinUpdate =
    isStaff || currentMembership?.role === "OWNER" || currentMembership?.role === "ADMIN"

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur-sm supports-[backdrop-filter]:bg-surface/80"
      >
        <div className="relative h-12 max-w-[100vw]">
          {/* Left controls */}
          <div className="absolute left-0 top-0 h-12 flex items-center gap-2 pl-2 sm:pl-3 z-10">
            <Link
              href="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-sm px-2 text-fg-muted hover:text-fg hover:bg-surface-2 border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-fg/30"
              aria-label="Home"
            >
              <Home className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span className="text-[11px] font-display uppercase tracking-widest">Home</span>
            </Link>
            {mounted && inWorkspace && status === "authenticated" ? (
              <WorkspaceSwitcher />
            ) : null}
          </div>

          {/* Centered logo */}
          <div className="absolute inset-x-0 top-0 h-12 flex items-center justify-center pointer-events-none px-28 sm:px-40">
            <Link
              ref={logoRef}
              href="/"
              className="pointer-events-auto inline-flex items-center justify-center py-1"
              aria-label="Monarch Portal home"
            >
              <img
                src="/LogoText.svg"
                alt=""
                className="h-6 sm:h-7 w-auto max-w-[min(200px,42vw)] object-contain"
                style={{ filter: logoFilter }}
              />
            </Link>
          </div>

          {/* Right controls */}
          <div className="absolute right-0 top-0 h-12 flex items-center gap-1 pr-2 sm:pr-3 z-10">
            {inWorkspace ? (
              <>
                <div className="hidden lg:flex items-center mr-1">
                  <GlobalSearch />
                </div>

                <NavIconButton
                  aria-label="Search"
                  className="lg:hidden"
                  title="Search"
                  onClick={() => setMobileSearchOpen(true)}
                >
                  <Search className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                </NavIconButton>
              </>
            ) : null}

            <NavIconButton aria-label="Toggle theme" title="Toggle theme" onClick={toggleTheme}>
              {!mounted ? (
                <span className="inline-block h-4 w-4" aria-hidden="true" />
              ) : theme === "dark" ? (
                <Sun className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              )}
            </NavIconButton>

            {inWorkspace && workspaceSlug && currentMembership ? (
              <GlobalCreateMenu
                workspaceId={currentMembership.id}
                workspaceSlug={workspaceSlug}
                canPinUpdate={canPinUpdate}
              />
            ) : null}

            {mounted && status === "authenticated" ? (
              <NotificationDropdown unreadCount={count} onCountChange={setCount} />
            ) : null}

            {mounted && status === "authenticated" ? (
              <button
                type="button"
                className="hidden md:inline-flex h-8 px-2.5 items-center text-[11px] text-fg-muted hover:text-fg hover:bg-surface-2 rounded-sm border border-transparent transition-colors max-w-[180px] truncate"
                onClick={() => signOut({ callbackUrl: "/" })}
                title={session?.user?.email ?? "Sign out"}
              >
                Sign out
              </button>
            ) : (
              <Link
                href="/login"
                className="h-8 px-2.5 inline-flex items-center text-[11px] text-fg-muted hover:text-fg hover:bg-surface-2 rounded-sm border border-border transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      {mobileSearchOpen ? (
        <GlobalSearchModal onClose={() => setMobileSearchOpen(false)} />
      ) : null}
    </>
  )
}

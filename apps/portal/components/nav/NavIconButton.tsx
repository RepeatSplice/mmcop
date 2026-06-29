"use client"

import { useRef, type ReactNode } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { cn } from "@/lib/utils"

gsap.registerPlugin(useGSAP)

type Props = {
  children: ReactNode
  className?: string
  onClick?: () => void
  href?: string
  "aria-label": string
  title?: string
  active?: boolean
}

export function NavIconButton({
  children,
  className,
  onClick,
  "aria-label": ariaLabel,
  title,
  active,
}: Props) {
  const btnRef = useRef<HTMLButtonElement>(null)

  const { contextSafe } = useGSAP(
    () => {
      const el = btnRef.current
      if (!el) return

      const onEnter = contextSafe(() => {
        gsap.to(el, {
          scale: 1.04,
          backgroundColor: "var(--color-surface-2)",
          duration: 0.2,
          ease: "power2.out",
        })
      })
      const onLeave = contextSafe(() => {
        gsap.to(el, {
          scale: 1,
          backgroundColor: "transparent",
          duration: 0.25,
          ease: "power2.out",
        })
      })

      el.addEventListener("mouseenter", onEnter)
      el.addEventListener("mouseleave", onLeave)
      return () => {
        el.removeEventListener("mouseenter", onEnter)
        el.removeEventListener("mouseleave", onLeave)
      }
    },
    { scope: btnRef }
  )

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      className={cn(
        "relative h-9 w-9 inline-flex items-center justify-center rounded-sm",
        "text-fg-muted hover:text-fg border border-transparent",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-fg/30",
        active && "text-fg bg-surface-2",
        className
      )}
    >
      {children}
    </button>
  )
}

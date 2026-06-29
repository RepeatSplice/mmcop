import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

export function GoBackLink({
  href = "/",
  label = "Go back",
  className,
}: {
  href?: string
  label?: string
  className?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-sm px-2 -ml-2",
        "text-[11px] font-display uppercase tracking-widest text-fg-muted",
        "hover:text-fg hover:bg-surface-2 transition-colors",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-fg/30",
        className
      )}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      {label}
    </Link>
  )
}

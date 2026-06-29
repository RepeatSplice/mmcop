import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

/** Horizontal inset for workspace/ops content (aligns with sub-nav). */
export const pageGutterClass = "px-4 sm:px-8 lg:px-[100px]"

/** Space above the main content card. */
export const pageTopPaddingClass = "pt-[40px] pb-8"

/** Centered content column (apply, home, etc.). */
export const pageContentMaxWidthClass = "mx-auto w-full max-w-[772px]"

/** Rounded content shell wrapping each page. */
export const pageFrameClass =
  "rounded-lg overflow-hidden border border-border bg-surface-1 min-w-0"

/** Full-width workspace page stack — no max-width; sections separated by dividers. */
export function PageShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("w-full min-w-0 flex flex-col divide-y divide-border", className)}>
      {children}
    </div>
  )
}

/** Edge-to-edge section surface (use inside PageShell). */
export const pageSectionClass =
  "bg-surface-1 overflow-hidden border-x-0 rounded-none"

import { cn } from "@/lib/utils"
import type { ButtonHTMLAttributes, ReactNode } from "react"

type Variant = "primary" | "secondary" | "ghost" | "danger"
type Size = "sm" | "md" | "lg"

export function Button({
  variant = "primary",
  size = "md",
  isLoading,
  className,
  disabled,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  isLoading?: boolean
  children: ReactNode
}) {
  const variantClasses: Record<Variant, string> = {
    primary:
      "bg-monarch-500 text-white hover:bg-monarch-600 border border-monarch-500 hover:border-monarch-600",
    secondary:
      "bg-transparent text-fg border border-border hover:border-monarch-300 hover:text-fg",
    ghost: "bg-transparent text-fg-muted hover:text-fg border border-transparent",
    danger: "bg-red-600 text-white hover:bg-red-700 border border-red-600",
  }

  const sizeClasses: Record<Size, string> = {
    sm: "px-3 py-1.5 text-xs min-h-[32px]",
    md: "px-4 py-2 text-sm min-h-[40px]",
    lg: "px-6 py-3 text-sm min-h-[48px]",
  }

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-display uppercase tracking-wide transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  )
}


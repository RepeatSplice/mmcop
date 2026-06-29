import { cn } from "@/lib/utils"
import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react"

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }
>(function Input({ label, error, className, id, ...props }, ref) {
  return (
    <div className="flex flex-col gap-1">
      {label ? (
        <label htmlFor={id} className="font-display text-[11px] uppercase tracking-widest text-fg-subtle">
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={id}
        className={cn(
          "w-full bg-surface border border-border px-3 py-2 text-sm text-fg placeholder:text-fg-subtle",
          "focus:outline-none focus:border-monarch-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
          error && "border-red-500",
          className
        )}
        {...props}
      />
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  )
})

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }
>(function Textarea({ label, error, className, id, ...props }, ref) {
  return (
    <div className="flex flex-col gap-1">
      {label ? (
        <label htmlFor={id} className="font-display text-[11px] uppercase tracking-widest text-fg-subtle">
          {label}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={id}
        className={cn(
          "w-full bg-surface border border-border px-3 py-2 text-sm text-fg placeholder:text-fg-subtle resize-y min-h-[120px]",
          "focus:outline-none focus:border-monarch-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
          error && "border-red-500",
          className
        )}
        {...props}
      />
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  )
})

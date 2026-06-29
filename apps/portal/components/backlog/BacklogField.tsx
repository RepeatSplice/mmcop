import { cn } from "@/lib/utils"
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react"

const fieldClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-fg/25 transition-shadow"

export function BacklogLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-[11px] font-medium uppercase tracking-[0.12em] text-fg-subtle"
    >
      {children}
    </label>
  )
}

export function BacklogSelect(props: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  const { label, className, id, ...rest } = props
  const selectId = id ?? rest.name
  return (
    <div className="flex flex-col gap-1.5">
      <BacklogLabel htmlFor={selectId}>{label}</BacklogLabel>
      <select id={selectId} className={cn(fieldClass, className)} {...rest} />
    </div>
  )
}

export function BacklogInput({
  label,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const id = props.id ?? props.name
  return (
    <div className="flex flex-col gap-1.5">
      <BacklogLabel htmlFor={id}>{label}</BacklogLabel>
      <input
        className={cn(fieldClass, error && "border-red-500/60")}
        {...props}
        id={id}
      />
      {error ? <p className="text-[11px] text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  )
}

export function BacklogTextarea({
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const id = props.id ?? props.name
  return (
    <div className="flex flex-col gap-1.5">
      <BacklogLabel htmlFor={id}>{label}</BacklogLabel>
      <textarea
        className={cn(fieldClass, "min-h-[100px] resize-y")}
        {...props}
        id={id}
      />
    </div>
  )
}

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function addDays(d: Date, days: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days)
}

export function diffDays(a: Date, b: Date) {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime()
  return Math.round(ms / (24 * 60 * 60 * 1000))
}

export function monthLabel(d: Date) {
  return d.toLocaleString(undefined, { month: "short", year: "2-digit" })
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function daysRemaining(end: Date): number {
  return Math.max(0, Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
}

export function sprintTimelinePct(start: Date, end: Date): number {
  const total = end.getTime() - start.getTime()
  if (total <= 0) return 0
  return Math.min(100, Math.max(0, ((Date.now() - start.getTime()) / total) * 100))
}

export function formatShortDate(d: Date) {
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" })
}

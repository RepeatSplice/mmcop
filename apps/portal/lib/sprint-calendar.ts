/** Monday-aligned 2-week sprint windows (local calendar dates). */

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function addDays(d: Date, days: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days)
}

/** Monday 00:00:00 local for the week containing `date`. */
export function startOfWeekMonday(date: Date): Date {
  const d = startOfDay(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  return addDays(d, diff)
}

/** Sunday end of week 2 (23:59:59.999 local) for a sprint starting on `mondayStart`. */
export function sprintEndFromStart(mondayStart: Date): Date {
  const end = addDays(startOfDay(mondayStart), 13)
  end.setHours(23, 59, 59, 999)
  return end
}

/** First Monday strictly after `date` (next calendar day then snap to Monday if needed). */
export function nextMondayAfter(date: Date): Date {
  const next = addDays(startOfDay(date), 1)
  const mon = startOfWeekMonday(next)
  if (mon.getTime() >= next.getTime()) return mon
  return addDays(mon, 7)
}

export function formatSprintRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`
}

export function formatSprintName(start: Date, end: Date): string {
  return `Sprint ${formatSprintRange(start, end)}`
}

export function isMonday(date: Date): boolean {
  return startOfDay(date).getDay() === 1
}

export function alignSprintRange(start: Date): { startDate: Date; endDate: Date } {
  const startDate = startOfWeekMonday(start)
  return { startDate, endDate: sprintEndFromStart(startDate) }
}

/** Current or next Monday to start an active sprint today. */
export function currentOrNextSprintMonday(now = new Date()): Date {
  const mon = startOfWeekMonday(now)
  const end = sprintEndFromStart(mon)
  if (now.getTime() <= end.getTime()) return mon
  return addDays(mon, 7)
}

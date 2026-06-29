import type { BoardColumnColor } from "@/lib/board-columns"

export const COLUMN_COLOR_DOT: Record<BoardColumnColor, string> = {
  slate: "bg-fg/30",
  blue: "bg-blue-500",
  amber: "bg-amber-500",
  orange: "bg-orange-500",
  green: "bg-emerald-500",
  red: "bg-red-500",
  violet: "bg-violet-500",
  neutral: "bg-fg/20",
}

export const COLUMN_COLOR_ACCENT: Record<BoardColumnColor, string> = {
  slate: "bg-fg/25",
  blue: "bg-blue-500/80",
  amber: "bg-amber-500/80",
  orange: "bg-orange-500/80",
  green: "bg-emerald-500/80",
  red: "bg-red-500/80",
  violet: "bg-violet-500/80",
  neutral: "bg-fg/20",
}

export const COLUMN_COLOR_BORDER: Record<BoardColumnColor, string> = {
  slate: "border-fg/20",
  blue: "border-blue-500/35",
  amber: "border-amber-500/35",
  orange: "border-orange-500/35",
  green: "border-emerald-500/35",
  red: "border-red-500/35",
  violet: "border-violet-500/35",
  neutral: "border-border",
}

import type { ComponentType } from "react"
import type { LucideProps } from "lucide-react"
import {
  Bell,
  Building2,
  CalendarDays,
  ClipboardList,
  Clock3,
  Columns3,
  CreditCard,
  GanttChart,
  Inbox,
  LayoutDashboard,
  ListTree,
  MessageSquare,
  Plug2,
  Settings2,
  Shield,
  Ticket,
} from "lucide-react"

export type SidebarIcon =
  | "summary"
  | "board"
  | "backlog"
  | "timeline"
  | "list"
  | "chat"
  | "updates"
  | "calendar"
  | "tickets"
  | "settings"
  | "billing"
  | "applications"
  | "workspaces"
  | "time"
  | "integrations"
  | "shield"

const iconMap: Record<SidebarIcon, ComponentType<LucideProps>> = {
  summary: LayoutDashboard,
  board: Columns3,
  backlog: Inbox,
  timeline: GanttChart,
  list: ListTree,
  chat: MessageSquare,
  updates: Bell,
  calendar: CalendarDays,
  tickets: Ticket,
  settings: Settings2,
  billing: CreditCard,
  applications: ClipboardList,
  workspaces: Building2,
  time: Clock3,
  integrations: Plug2,
  shield: Shield,
}

export function SidebarNavIcon({ kind, className }: { kind: SidebarIcon; className?: string }) {
  const Cmp = iconMap[kind]
  return <Cmp className={className} strokeWidth={1.75} aria-hidden="true" />
}

/** @deprecated Use SidebarIcon — maps old layout keys to new icons */
export function legacyIconToSidebarIcon(
  icon: string | undefined
): SidebarIcon | undefined {
  if (!icon) return undefined
  const map: Record<string, SidebarIcon> = {
    board: "board",
    backlog: "backlog",
    timeline: "timeline",
    list: "list",
    calendar: "calendar",
    jobs: "tickets",
    settings: "settings",
    billing: "billing",
    ops: "shield",
  }
  return map[icon]
}

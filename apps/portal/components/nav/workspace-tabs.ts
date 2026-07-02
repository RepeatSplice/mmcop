import type { SidebarIcon } from "@/components/nav/sidebar-icons"

export type WorkspaceTab = {
  label: string
  href: string
  icon: SidebarIcon
}

const TAB_ICONS: Record<string, SidebarIcon> = {
  Summary: "summary",
  Board: "board",
  Backlog: "backlog",
  Timeline: "timeline",
  "All work": "list",
  Chat: "chat",
  Updates: "updates",
  Calendar: "calendar",
  Settings: "settings",
}

export function workspaceTabIcon(label: string): SidebarIcon {
  return TAB_ICONS[label] ?? "summary"
}

export function buildWorkspaceTabs(
  baseHref: string,
  labels: readonly string[]
): WorkspaceTab[] {
  return labels.map((label) => ({
    label,
    href: `${baseHref}/${tabPath(label)}`,
    icon: workspaceTabIcon(label),
  }))
}

const OPS_TAB_LABELS = [
  "Applications",
  "Workspaces",
  "Board",
  "Jobs",
  "Time",
  "Integrations",
  "Staff",
] as const

const OPS_ICONS: Record<string, SidebarIcon> = {
  Applications: "applications",
  Workspaces: "workspaces",
  Board: "board",
  Jobs: "tickets",
  Time: "time",
  Integrations: "integrations",
  Staff: "shield",
}

const OPS_PATHS: Record<string, string> = {
  Applications: "applications",
  Workspaces: "workspaces",
  Board: "board",
  Jobs: "jobs",
  Time: "time",
  Integrations: "integrations",
  Staff: "staff",
}

export function buildOpsTabs(): WorkspaceTab[] {
  return OPS_TAB_LABELS.map((label) => ({
    label,
    href: `/ops/${OPS_PATHS[label] ?? label.toLowerCase()}`,
    icon: OPS_ICONS[label] ?? "shield",
  }))
}

export const WORKSPACE_TAB_LABELS = [
  "Summary",
  "Board",
  "Backlog",
  "Timeline",
  "All work",
  "Chat",
  "Updates",
  "Calendar",
  "Settings",
] as const

/** Grouped left-sidebar shape used by `WorkspaceSidebar`. */
export type WorkspaceSidebarItem = {
  label: string
  href: string
  icon: SidebarIcon
  /** Optional badge source ("chat" => chat unread count). */
  badge?: "chat"
}

export type WorkspaceSidebarSection = {
  /** Empty string => no header (top group). */
  label: string
  items: WorkspaceSidebarItem[]
}

export function buildWorkspaceSidebarSections(baseHref: string): WorkspaceSidebarSection[] {
  const at = (suffix: string) => `${baseHref}/${suffix}`
  return [
    {
      label: "",
      items: [{ label: "Summary", href: at("summary"), icon: "summary" }],
    },
    {
      label: "Plan",
      items: [
        { label: "Board", href: at("board"), icon: "board" },
        { label: "Backlog", href: at("backlog"), icon: "backlog" },
        { label: "Timeline", href: at("timeline"), icon: "timeline" },
        { label: "All work", href: at("list"), icon: "list" },
        { label: "Calendar", href: at("calendar"), icon: "calendar" },
      ],
    },
    {
      label: "Talk",
      items: [
        { label: "Chat", href: at("chat"), icon: "chat", badge: "chat" },
        { label: "Updates", href: at("changelog"), icon: "updates" },
      ],
    },
    {
      label: "Manage",
      items: [{ label: "Settings", href: at("settings"), icon: "settings" }],
    },
  ]
}

/** Tab routes to warm first (shown immediately on entry). */
export const WORKSPACE_PRIORITY_PRELOAD_SUFFIXES = [
  "summary",
  "board",
  "backlog",
  "chat",
  "list",
] as const

/** Routes warmed after entering a workspace (main nav + common extras). */
export function buildWorkspacePreloadHrefs(baseHref: string): string[] {
  const tabs = buildWorkspaceTabs(baseHref, WORKSPACE_TAB_LABELS)
  const extra = [
    "request",
    "changelog",
    "settings/general",
    "settings/members",
    "settings/billing",
    "settings/integrations",
  ]
  return [...tabs.map((t) => t.href), ...extra.map((p) => `${baseHref}/${p}`)]
}

function tabPath(label: string): string {
  switch (label) {
    case "Summary":
      return "summary"
    case "Board":
      return "board"
    case "Backlog":
      return "backlog"
    case "Timeline":
      return "timeline"
    case "All work":
      return "list"
    case "Chat":
      return "chat"
    case "Updates":
      return "changelog"
    case "Calendar":
      return "calendar"
    case "Settings":
      return "settings"
    default:
      return label.toLowerCase()
  }
}

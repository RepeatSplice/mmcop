export type TicketTemplateKind = "bug" | "feature" | "quote" | "ops"

export type TicketTemplate = {
  id: string
  label: string
  kind: TicketTemplateKind
  discipline: "Scripts" | "GFX" | "Imports" | "Weapons" | "Branding" | "VFX" | "Hosting" | "Other"
  title: string
  description: string
}

export const TICKET_TEMPLATE_KINDS: { id: TicketTemplateKind; label: string; hint: string }[] = [
  { id: "bug", label: "Bug", hint: "Something's broken or behaving wrong" },
  { id: "feature", label: "Feature", hint: "New gameplay, asset, or UI" },
  { id: "quote", label: "Quote", hint: "Custom work that needs scoping" },
  { id: "ops", label: "Ops", hint: "Hosting, performance, admin help" },
]

export const TICKET_TEMPLATES: TicketTemplate[] = [
  {
    id: "balance",
    label: "Balance pass",
    kind: "bug",
    discipline: "Scripts",
    title: "Balance pass",
    description:
      "Describe what feels off (loot, damage, stamina, etc.) and any test scenarios you have run on the live server.",
  },
  {
    id: "mod-conflict",
    label: "Mod conflict / crash",
    kind: "bug",
    discipline: "Scripts",
    title: "Mod conflict / crash",
    description:
      "List mods involved, when the issue happens (login, restart, specific action), and any RPT or client log excerpts.",
  },
  {
    id: "performance",
    label: "Server performance",
    kind: "ops",
    discipline: "Hosting",
    title: "Server performance",
    description:
      "Note player count when lag occurs, FPS/server FPS if known, and recent changes (mods, map, events).",
  },
  {
    id: "admin-action",
    label: "Admin action",
    kind: "ops",
    discipline: "Other",
    title: "Admin action needed",
    description:
      "What action is required (ban, restart, rollback)? Include player IDs, timestamps, and reason.",
  },
  {
    id: "new-feature",
    label: "New feature",
    kind: "feature",
    discipline: "Other",
    title: "New feature request",
    description: "What should players experience? Any references (other servers, videos, docs)?",
  },
  {
    id: "gfx",
    label: "GFX / branding",
    kind: "feature",
    discipline: "GFX",
    title: "GFX or branding update",
    description: "Describe assets needed (logo, loading screen, UI) and brand guidelines if any.",
  },
  {
    id: "imports",
    label: "Imports / assets",
    kind: "feature",
    discipline: "Imports",
    title: "Import or asset work",
    description: "List items to import, source files, and target in-game behaviour.",
  },
  {
    id: "custom-build",
    label: "Custom build",
    kind: "quote",
    discipline: "Scripts",
    title: "Custom build — request quote",
    description:
      "Outline the goal, gameplay scope, references, and any hard deadlines. We'll review and send a quote.",
  },
  {
    id: "weapon-pack",
    label: "Weapon pack",
    kind: "quote",
    discipline: "Weapons",
    title: "Weapon pack — request quote",
    description:
      "What weapons / variants / sounds? Any existing packs to replace or complement?",
  },
]

import { postDiscordAnnouncement, postDiscordLog } from "@/lib/discord-bot-client"
import { ticketStatusLabel } from "@/lib/ticket-display"

/** Fire-and-forget Discord announcement (sprint/ticket updates). */
export function discordAnnounce(workspaceId: string, title: string, body: string) {
  void postDiscordAnnouncement({ workspaceId, title, body }).catch((e) =>
    console.warn("[discord] announce failed", e)
  )
}

/** Fire-and-forget Discord log channel. */
export function discordLog(workspaceId: string, body: string) {
  void postDiscordLog({ workspaceId, body }).catch((e) => console.warn("[discord] log failed", e))
}

export function announceTicketCreated(workspaceId: string, key: string, title: string) {
  discordAnnounce(workspaceId, `Ticket created: ${key}`, title)
}

export function announceTicketStatus(workspaceId: string, key: string, from: string, to: string) {
  discordAnnounce(
    workspaceId,
    `${key} → ${ticketStatusLabel(to)}`,
    `Status changed from ${ticketStatusLabel(from)} to ${ticketStatusLabel(to)}`
  )
}

export function logWorkspaceEvent(workspaceId: string, body: string) {
  discordLog(workspaceId, body)
}

export function announceSprintActivated(workspaceId: string, name: string) {
  discordAnnounce(workspaceId, `Sprint started: ${name}`, "A new sprint is now active.")
}

export function announceSprintCompleted(workspaceId: string, name: string) {
  discordAnnounce(workspaceId, `Sprint completed: ${name}`, "This sprint has been marked complete.")
}

export function announceSprintCancelled(workspaceId: string, name: string) {
  discordAnnounce(workspaceId, `Sprint cancelled: ${name}`, "This sprint was cancelled.")
}

import { prisma } from "@/lib/prisma"
import { announceTicketCreated } from "@/lib/discord-events"

export type HeartbeatPayload = {
  online?: boolean
  playerCount?: number
  maxPlayers?: number
  mapName?: string
  version?: string
  restart?: boolean
  error?: string
}

export async function applyServerHeartbeat(
  workspaceId: string,
  payload: HeartbeatPayload
): Promise<void> {
  const prev = await prisma.workspaceServer.findUnique({
    where: { workspaceId },
    select: { online: true },
  })

  const online = payload.online ?? true
  const data = {
    online,
    playerCount: payload.playerCount ?? 0,
    maxPlayers: payload.maxPlayers ?? 0,
    mapName: payload.mapName ?? null,
    version: payload.version ?? null,
    lastSeenAt: new Date(),
    lastError: payload.error ?? null,
    ...(payload.restart ? { lastRestartAt: new Date() } : {}),
  }

  await prisma.workspaceServer.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      provider: "CUSTOM_WEBHOOK",
      displayName: "Game server",
      ...data,
    },
    update: data,
  })

  if (prev?.online === true && online === false) {
    await createIncidentTicket(workspaceId, "Server reported offline")
  }
}

async function createIncidentTicket(workspaceId: string, title: string) {
  const recent = await prisma.ticket.findFirst({
    where: {
      workspaceId,
      title: { startsWith: "[Incident]" },
      createdAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    },
  })
  if (recent) return

  const ws = await prisma.workspace.update({
    where: { id: workspaceId },
    data: { nextTicketNumber: { increment: 1 } },
    select: { slug: true, nextTicketNumber: true },
  })
  const number = ws.nextTicketNumber - 1
  const key = `${ws.slug.toUpperCase()}-${number}`

  const owner = await prisma.workspaceMember.findFirst({
    where: { workspaceId, role: "OWNER" },
    select: { userId: true },
  })
  if (!owner) return

  const ticket = await prisma.ticket.create({
    data: {
      workspaceId,
      createdById: owner.userId,
      number,
      key,
      title: `[Incident] ${title}`,
      description: "Auto-created from server monitoring heartbeat.",
      status: "IN_PROGRESS",
      discipline: "Hosting",
      position: 1000,
    },
  })

  await prisma.activityEvent.create({
    data: {
      workspaceId,
      ticketId: ticket.id,
      source: "SYSTEM",
      type: "server.incident",
      body: title,
    },
  })

  announceTicketCreated(workspaceId, key, ticket.title)
}

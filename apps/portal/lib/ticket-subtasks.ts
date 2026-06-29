import { Prisma } from "@prisma/client"
import type { PrismaClient } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export type TicketSubtaskRow = {
  id: string
  key: string
  title: string
  status: string
}

type DbClient = PrismaClient | Prisma.TransactionClient

function isStaleSubtaskClientError(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err)
  return msg.includes("Unknown argument `subtaskOfId`") || msg.includes("Unknown field `subtasks`")
}

/** Set subtask parent; uses SQL when the bundled Prisma client predates the subtask migration. */
export async function setTicketSubtaskOfId(
  client: DbClient,
  ticketId: string,
  subtaskOfId: string | null
) {
  try {
    await client.ticket.update({ where: { id: ticketId }, data: { subtaskOfId } })
  } catch (err: unknown) {
    if (!isStaleSubtaskClientError(err)) throw err
    await client.$executeRaw(
      Prisma.sql`UPDATE portal."Ticket" SET "subtaskOfId" = ${subtaskOfId} WHERE id = ${ticketId}`
    )
  }
}

/** Loads subtasks via relation when the Prisma client is current; falls back to SQL if the dev bundle is stale. */
export async function loadTicketSubtasks(parentTicketId: string): Promise<TicketSubtaskRow[]> {
  try {
    const rows = await prisma.ticket.findMany({
      where: { subtaskOfId: parentTicketId },
      orderBy: { createdAt: "asc" },
      select: { id: true, key: true, title: true, status: true },
      take: 100,
    })
    return rows
  } catch (err: unknown) {
    if (!isStaleSubtaskClientError(err)) throw err

    return prisma.$queryRaw<TicketSubtaskRow[]>(Prisma.sql`
      SELECT id, key, title, status::text AS status
      FROM portal."Ticket"
      WHERE "subtaskOfId" = ${parentTicketId}
      ORDER BY "createdAt" ASC
      LIMIT 100
    `)
  }
}

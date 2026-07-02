import { randomUUID } from "crypto"
import { prisma } from "@/lib/prisma"
import {
  DEFAULT_BOARD_COLUMNS,
  serializeBoardColumn,
  type BoardColumnDto,
} from "@/lib/board-columns"

export async function ensureWorkspaceBoardColumns(workspaceId: string): Promise<BoardColumnDto[]> {
  const existing = await prisma.workspaceBoardColumn.findMany({
    where: { workspaceId },
    orderBy: { position: "asc" },
  })
  if (existing.length > 0) {
    return existing.map(serializeBoardColumn)
  }

  // Use per-workspace UUIDs so the same defaults can be seeded across many
  // workspaces without hitting the global id primary-key constraint. Also use
  // skipDuplicates to safely handle concurrent first-load requests.
  await prisma.workspaceBoardColumn.createMany({
    skipDuplicates: true,
    data: DEFAULT_BOARD_COLUMNS.map((c) => ({
      id: randomUUID(),
      workspaceId,
      label: c.label,
      status: c.status,
      position: c.position,
      color: c.color,
      isSystem: c.isSystem,
    })),
  })

  const seeded = await prisma.workspaceBoardColumn.findMany({
    where: { workspaceId },
    orderBy: { position: "asc" },
  })
  return seeded.map(serializeBoardColumn)
}

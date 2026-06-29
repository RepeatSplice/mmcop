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

  await prisma.workspaceBoardColumn.createMany({
    data: DEFAULT_BOARD_COLUMNS.map((c) => ({
      id: c.id,
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

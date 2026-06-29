import { prisma } from "@/lib/prisma"
import { announceSprintActivated, announceSprintCompleted } from "@/lib/discord-events"
import {
  alignSprintRange,
  formatSprintName,
  nextMondayAfter,
  sprintEndFromStart,
  startOfWeekMonday,
} from "@/lib/sprint-calendar"

const sprintSelect = {
  id: true,
  name: true,
  startDate: true,
  endDate: true,
  hoursUsed: true,
  hoursMax: true,
  status: true,
} as const

export type SprintLite = {
  id: string
  name: string
  startDate: Date
  endDate: Date
  hoursUsed: number
  hoursMax: number
  status: string
}

const ROLLOVER_STATUSES = ["PLANNED", "IN_PROGRESS", "REVIEW", "BACKLOG"] as const

export async function advanceSprint(workspaceId: string): Promise<{
  completed: SprintLite | null
  activated: SprintLite
  rolledCount: number
}> {
  const active = await prisma.sprint.findFirst({
    where: { workspaceId, status: "ACTIVE" },
    orderBy: { startDate: "asc" },
    select: sprintSelect,
  })

  if (!active) {
    throw new Error("No active sprint to advance")
  }

  const nextPlanning = await prisma.sprint.findFirst({
    where: { workspaceId, status: "PLANNING" },
    orderBy: { startDate: "asc" },
    select: sprintSelect,
  })

  let activated!: SprintLite
  let rolledCount = 0

  await prisma.$transaction(async (tx) => {
    const completed = await tx.sprint.updateMany({
      where: { id: active.id, workspaceId, status: "ACTIVE" },
      data: { status: "COMPLETE" },
    })
    if (completed.count === 0) {
      throw new Error("NO_ACTIVE_SPRINT")
    }

    if (nextPlanning) {
      const range = alignSprintRange(nextPlanning.startDate)
      activated = await tx.sprint.update({
        where: { id: nextPlanning.id },
        data: {
          status: "ACTIVE",
          startDate: range.startDate,
          endDate: range.endDate,
          name: formatSprintName(range.startDate, range.endDate),
        },
        select: sprintSelect,
      })
    } else {
      const startDate = nextMondayAfter(active.endDate)
      const endDate = sprintEndFromStart(startDate)
      activated = await tx.sprint.create({
        data: {
          workspaceId,
          name: formatSprintName(startDate, endDate),
          startDate,
          endDate,
          hoursMax: 0,
          status: "ACTIVE",
        },
        select: sprintSelect,
      })
    }

    const incomplete = await tx.ticket.findMany({
      where: {
        workspaceId,
        sprintId: active.id,
        type: "TICKET",
        status: { in: [...ROLLOVER_STATUSES] },
      },
      select: { id: true, status: true },
    })

    for (const t of incomplete) {
      if (t.status === "BACKLOG") {
        await tx.ticket.update({
          where: { id: t.id },
          data: { sprintId: null, status: "BACKLOG" },
        })
      } else {
        await tx.ticket.update({
          where: { id: t.id },
          data: { sprintId: activated.id, status: "PLANNED" },
        })
      }
    }
    rolledCount = incomplete.filter((t) => t.status !== "BACKLOG").length
  })

  const [m1, m2] = planningMondayOffsets(activated.startDate)
  const existingPlanning = await prisma.sprint.findMany({
    where: { workspaceId, status: "PLANNING" },
    orderBy: { startDate: "asc" },
    select: sprintSelect,
  })
  const targetStarts = [m1.getTime(), m2.getTime()]
  for (const ts of targetStarts) {
    const has = existingPlanning.some(
      (s) => startOfWeekMonday(s.startDate).getTime() === ts
    )
    if (!has) {
      await createPlanningSprint(workspaceId, new Date(ts))
    }
  }

  announceSprintCompleted(workspaceId, active.name)
  announceSprintActivated(workspaceId, activated.name)

  return { completed: active, activated, rolledCount }
}

export async function createPlanningSprint(
  workspaceId: string,
  mondayStart: Date
): Promise<SprintLite> {
  const { startDate, endDate } = alignSprintRange(mondayStart)
  return prisma.sprint.create({
    data: {
      workspaceId,
      name: formatSprintName(startDate, endDate),
      startDate,
      endDate,
      hoursMax: 0,
      status: "PLANNING",
    },
    select: sprintSelect,
  })
}

export function planningMondayOffsets(activeStart: Date): [Date, Date] {
  const m0 = startOfWeekMonday(activeStart)
  const m1 = nextMondayAfter(sprintEndFromStart(m0))
  const m2 = nextMondayAfter(sprintEndFromStart(m1))
  return [m1, m2]
}

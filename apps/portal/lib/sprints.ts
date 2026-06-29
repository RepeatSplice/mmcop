import { cache } from "react"
import { prisma } from "@/lib/prisma"
import {
  alignSprintRange,
  currentOrNextSprintMonday,
  formatSprintName,
  isMonday,
  sprintEndFromStart,
  startOfWeekMonday,
} from "@/lib/sprint-calendar"
import {
  advanceSprint,
  createPlanningSprint,
  planningMondayOffsets,
  type SprintLite,
} from "@/lib/sprint-rollover"

const sprintSelect = {
  id: true,
  name: true,
  startDate: true,
  endDate: true,
  hoursUsed: true,
  hoursMax: true,
  status: true,
} as const

export type ActiveSprint = SprintLite

export type SprintWindow = {
  active: SprintLite
  planning: [SprintLite, SprintLite]
}

async function realignPlanningSprint(id: string, start: Date) {
  const { startDate, endDate } = alignSprintRange(start)
  return prisma.sprint.update({
    where: { id },
    data: {
      startDate,
      endDate,
      name: formatSprintName(startDate, endDate),
    },
    select: sprintSelect,
  })
}

async function ensureInitialSprints(workspaceId: string): Promise<SprintWindow> {
  const activeStart = currentOrNextSprintMonday()
  const activeEnd = sprintEndFromStart(activeStart)
  const active = await prisma.sprint.create({
    data: {
      workspaceId,
      name: formatSprintName(activeStart, activeEnd),
      startDate: activeStart,
      endDate: activeEnd,
      hoursMax: 0,
      status: "ACTIVE",
    },
    select: sprintSelect,
  })

  const [m1, m2] = planningMondayOffsets(activeStart)
  const p1 = await createPlanningSprint(workspaceId, m1)
  const p2 = await createPlanningSprint(workspaceId, m2)

  return { active, planning: [p1, p2] }
}

async function fillPlanningSlots(
  workspaceId: string,
  active: SprintLite,
  existing: SprintLite[]
): Promise<[SprintLite, SprintLite]> {
  const [targetM1, targetM2] = planningMondayOffsets(active.startDate)
  const targets = [targetM1, targetM2]
  const result: SprintLite[] = []

  for (let i = 0; i < 2; i++) {
    const targetStart = targets[i]!.getTime()
    let match =
      existing.find(
        (s) => startOfWeekMonday(s.startDate).getTime() === targetStart
      ) ?? existing[i]

    if (match) {
      if (!isMonday(match.startDate) || match.endDate.getTime() !== sprintEndFromStart(match.startDate).getTime()) {
        match = await realignPlanningSprint(match.id, match.startDate)
      }
      result.push(match)
      existing = existing.filter((s) => s.id !== match!.id)
    } else {
      const created = await createPlanningSprint(workspaceId, targets[i]!)
      result.push(created)
    }
  }

  return [result[0]!, result[1]!]
}

async function ensureSprintWindowUncached(workspaceId: string): Promise<SprintWindow> {
  let active = await prisma.sprint.findFirst({
    where: { workspaceId, status: "ACTIVE" },
    orderBy: { startDate: "desc" },
    select: sprintSelect,
  })

  if (!active) {
    const any = await prisma.sprint.findFirst({
      where: { workspaceId },
      select: { id: true },
    })
    if (!any) return ensureInitialSprints(workspaceId)

    const planning = await prisma.sprint.findFirst({
      where: { workspaceId, status: "PLANNING" },
      orderBy: { startDate: "asc" },
      select: sprintSelect,
    })
    if (planning) {
      const range = alignSprintRange(planning.startDate)
      active = await prisma.sprint.update({
        where: { id: planning.id },
        data: {
          status: "ACTIVE",
          startDate: range.startDate,
          endDate: range.endDate,
          name: formatSprintName(range.startDate, range.endDate),
        },
        select: sprintSelect,
      })
    } else {
      return ensureInitialSprints(workspaceId)
    }
  }

  const now = Date.now()
  while (active && active.endDate.getTime() < now) {
    await advanceSprint(workspaceId)
    active = await prisma.sprint.findFirst({
      where: { workspaceId, status: "ACTIVE" },
      orderBy: { startDate: "desc" },
      select: sprintSelect,
    })
    if (!active) return ensureInitialSprints(workspaceId)
  }

  if (!isMonday(active.startDate)) {
    const range = alignSprintRange(active.startDate)
    active = await prisma.sprint.update({
      where: { id: active.id },
      data: {
        startDate: range.startDate,
        endDate: range.endDate,
        name: formatSprintName(range.startDate, range.endDate),
      },
      select: sprintSelect,
    })
  }

  const planningRows = await prisma.sprint.findMany({
    where: { workspaceId, status: "PLANNING" },
    orderBy: { startDate: "asc" },
    select: sprintSelect,
    take: 10,
  })

  const planning = await fillPlanningSlots(workspaceId, active, planningRows)

  return { active, planning }
}

/** Ensures 1 ACTIVE + 2 PLANNING Monday-aligned sprints; auto-advances when past end. */
export const ensureSprintWindow = cache(ensureSprintWindowUncached)

/** Active sprint from the 3-slot window. */
export const getActiveSprint = cache(async (workspaceId: string): Promise<ActiveSprint> => {
  const window = await ensureSprintWindow(workspaceId)
  return window.active
})

/** @deprecated Use getActiveSprint / ensureSprintWindow */
export async function ensureCurrentSprint(workspaceId: string) {
  return getActiveSprint(workspaceId)
}

export { type SprintLite } from "@/lib/sprint-rollover"

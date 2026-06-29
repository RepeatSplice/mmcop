import { requireWorkspaceMember } from "@/lib/workspace"
import { prisma } from "@/lib/prisma"
import { WorkspaceCalendar, type CalendarSprint } from "@/components/calendar/WorkspaceCalendar"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function parseYm(raw: string | undefined) {
  if (!raw) return null
  const m = raw.match(/^(\d{4})-(\d{2})$/)
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null
  if (month < 1 || month > 12) return null
  return { year, month }
}

export default async function WorkspaceCalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ ym?: string }>
}) {
  const { slug } = await params
  const access = await requireWorkspaceMember(slug)

  const { ym } = await searchParams
  const parsed = parseYm(ym)

  const now = new Date()
  const year = parsed?.year ?? now.getFullYear()
  const month = parsed?.month ?? now.getMonth() + 1

  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999)

  const sprints = await prisma.sprint.findMany({
    where: {
      workspaceId: access.workspace.id,
      startDate: { lte: monthEnd },
      endDate: { gte: monthStart },
    },
    orderBy: { startDate: "asc" },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      status: true,
      hoursMax: true,
      hoursUsed: true,
    },
  })

  const sprintDtos: CalendarSprint[] = sprints.map((s) => ({
    id: s.id,
    name: s.name,
    startDate: s.startDate.toISOString(),
    endDate: s.endDate.toISOString(),
    status: s.status,
    hoursMax: s.hoursMax,
    hoursUsed: s.hoursUsed,
  }))

  const baseHref = `/workspace/${access.workspace.slug}/calendar`
  const ymValue = `${year}-${String(month).padStart(2, "0")}`

  return <WorkspaceCalendar baseHref={baseHref} ym={ymValue} sprints={sprintDtos} />
}


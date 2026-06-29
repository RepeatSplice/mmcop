"use client"

import { useMemo } from "react"
import { PageShell } from "@/components/layout/PageShell"
import { SprintRoadmap } from "@/components/timeline/SprintRoadmap"
import { TimelineGantt } from "@/components/timeline/TimelineGantt"
import { TimelineHeader } from "@/components/timeline/TimelineHeader"
import type { TimelineSprint } from "@/components/timeline/timeline-types"

export function WorkspaceTimeline(props: {
  workspaceId: string
  workspaceSlug: string
  baseHref: string
  sprints: TimelineSprint[]
  canEndSprint?: boolean
}) {
  const stats = useMemo(() => {
    let ticketCount = 0
    let ticketsWithDue = 0
    let activeSprintCount = 0
    let currentSprintId: string | null = null
    for (const s of props.sprints) {
      if (s.status === "ACTIVE") {
        activeSprintCount++
        if (!currentSprintId) currentSprintId = s.id
      }
      ticketCount += s.tickets.length
      for (const t of s.tickets) {
        if (t.dueDate) ticketsWithDue++
      }
    }
    return { ticketCount, ticketsWithDue, activeSprintCount, currentSprintId }
  }, [props.sprints])

  return (
    <PageShell>
      <TimelineHeader
        baseHref={props.baseHref}
        sprintCount={props.sprints.length}
        activeSprintCount={stats.activeSprintCount}
        ticketCount={stats.ticketCount}
        ticketsWithDue={stats.ticketsWithDue}
      />
      <TimelineGantt
        workspaceSlug={props.workspaceSlug}
        baseHref={props.baseHref}
        sprints={props.sprints}
        currentSprintId={stats.currentSprintId}
      />
      <SprintRoadmap
        workspaceId={props.workspaceId}
        workspaceSlug={props.workspaceSlug}
        baseHref={props.baseHref}
        sprints={props.sprints}
        canEndSprint={props.canEndSprint}
      />
    </PageShell>
  )
}

const { PrismaClient } = require("@prisma/client")

function mapTaskStatus(status) {
  // TaskStatus -> TicketStatus
  return status
}

function mapJobStatus(status) {
  // JobStatus -> TicketStatus (superset)
  return status
}

async function main() {
  const prisma = new PrismaClient()
  try {
    const workspaces = await prisma.workspace.findMany({
      select: { id: true, slug: true, nextTicketNumber: true },
    })

    let createdFromTasks = 0
    let createdFromJobs = 0

    for (const ws of workspaces) {
      const [tasks, jobs] = await Promise.all([
        prisma.task.findMany({
          where: { workspaceId: ws.id },
          select: {
            id: true,
            key: true,
            number: true,
            title: true,
            description: true,
            discipline: true,
            status: true,
            priority: true,
            hoursEst: true,
            hoursActual: true,
            dueDate: true,
            sprintId: true,
            createdById: true,
            assigneeId: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.job.findMany({
          where: { workspaceId: ws.id },
          select: {
            id: true,
            key: true,
            number: true,
            title: true,
            description: true,
            discipline: true,
            status: true,
            priority: true,
            createdById: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
      ])

      // Create tickets from tasks (preserve key/number).
      for (const t of tasks) {
        const exists = await prisma.ticket.findUnique({ where: { key: t.key }, select: { id: true } })
        if (exists) continue

        await prisma.ticket.create({
          data: {
            workspaceId: ws.id,
            sprintId: t.sprintId,
            createdById: t.createdById,
            assigneeId: t.assigneeId,
            number: t.number,
            key: t.key,
            type: "TICKET",
            title: t.title,
            description: t.description,
            discipline: t.discipline,
            status: mapTaskStatus(t.status),
            position: t.priority ?? 1000,
            hoursEst: t.hoursEst,
            hoursActual: t.hoursActual,
            dueDate: t.dueDate,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
          },
        })

        createdFromTasks++
      }

      // Create tickets from jobs (preserve key/number).
      for (const j of jobs) {
        const exists = await prisma.ticket.findUnique({ where: { key: j.key }, select: { id: true } })
        if (exists) continue

        await prisma.ticket.create({
          data: {
            workspaceId: ws.id,
            createdById: j.createdById,
            number: j.number,
            key: j.key,
            type: "TICKET",
            title: j.title,
            description: j.description,
            discipline: j.discipline,
            status: mapJobStatus(j.status),
            position: j.priority ?? 1000,
            createdAt: j.createdAt,
            updatedAt: j.updatedAt,
          },
        })

        createdFromJobs++
      }

      // Bump workspace counter past the max migrated number to keep future keys unique.
      const maxNumber = Math.max(
        0,
        ...tasks.map((t) => t.number || 0),
        ...jobs.map((j) => j.number || 0)
      )
      const desiredNext = Math.max(ws.nextTicketNumber || 1, maxNumber + 1)
      if (desiredNext !== ws.nextTicketNumber) {
        await prisma.workspace.update({
          where: { id: ws.id },
          data: { nextTicketNumber: desiredNext },
        })
      }
    }

    // Now wire secondary references where possible.
    // Quotes: set ticketId based on matching job key.
    const quotes = await prisma.quote.findMany({ select: { id: true, jobId: true } })
    for (const q of quotes) {
      const job = await prisma.job.findUnique({ where: { id: q.jobId }, select: { key: true } })
      if (!job) continue
      const ticket = await prisma.ticket.findUnique({ where: { key: job.key }, select: { id: true } })
      if (!ticket) continue
      await prisma.quote.update({ where: { id: q.id }, data: { ticketId: ticket.id } })
    }

    // ActivityEvent: add ticketId for task/job events if we can map by key.
    const events = await prisma.activityEvent.findMany({
      where: { ticketId: null },
      select: { id: true, taskId: true, jobId: true },
    })
    for (const ev of events) {
      if (ev.taskId) {
        const task = await prisma.task.findUnique({ where: { id: ev.taskId }, select: { key: true } })
        if (task) {
          const ticket = await prisma.ticket.findUnique({ where: { key: task.key }, select: { id: true } })
          if (ticket) await prisma.activityEvent.update({ where: { id: ev.id }, data: { ticketId: ticket.id } })
        }
      } else if (ev.jobId) {
        const job = await prisma.job.findUnique({ where: { id: ev.jobId }, select: { key: true } })
        if (job) {
          const ticket = await prisma.ticket.findUnique({ where: { key: job.key }, select: { id: true } })
          if (ticket) await prisma.activityEvent.update({ where: { id: ev.id }, data: { ticketId: ticket.id } })
        }
      }
    }

    // TimeEntry: add ticketId if we can map by key.
    const times = await prisma.timeEntry.findMany({
      where: { ticketId: null },
      select: { id: true, taskId: true, jobId: true },
    })
    for (const te of times) {
      if (te.taskId) {
        const task = await prisma.task.findUnique({ where: { id: te.taskId }, select: { key: true } })
        if (task) {
          const ticket = await prisma.ticket.findUnique({ where: { key: task.key }, select: { id: true } })
          if (ticket) await prisma.timeEntry.update({ where: { id: te.id }, data: { ticketId: ticket.id } })
        }
      } else if (te.jobId) {
        const job = await prisma.job.findUnique({ where: { id: te.jobId }, select: { key: true } })
        if (job) {
          const ticket = await prisma.ticket.findUnique({ where: { key: job.key }, select: { id: true } })
          if (ticket) await prisma.timeEntry.update({ where: { id: te.id }, data: { ticketId: ticket.id } })
        }
      }
    }

    console.log(
      JSON.stringify(
        {
          createdFromTasks,
          createdFromJobs,
        },
        null,
        2
      )
    )
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e?.message ?? String(e))
  process.exitCode = 1
})


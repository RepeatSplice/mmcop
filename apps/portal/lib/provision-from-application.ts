import { prisma } from "@/lib/prisma"
import { tryProvisionWorkspaceDiscord } from "@/lib/discord-provision"
import { logWorkspaceEvent } from "@/lib/discord-events"

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

async function uniqueSlug(base: string) {
  let slug = base
  let i = 0
  while (true) {
    const exists = await prisma.workspace.findUnique({ where: { slug }, select: { id: true } })
    if (!exists) return slug
    i += 1
    slug = `${base}-${i}`
  }
}

export async function applicantHasActiveWorkspace(userId: string) {
  const count = await prisma.workspaceMember.count({
    where: { userId, workspace: { active: true } },
  })
  return count > 0
}

export async function provisionWorkspaceFromApplication(applicationId: string) {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    select: { id: true, userId: true, serverName: true, status: true },
  })
  if (!app) return { ok: false as const, error: "Application not found" }
  if (app.status === "REJECTED") return { ok: false as const, error: "Application was rejected" }
  if (app.status !== "SUBMITTED" && app.status !== "APPROVED") {
    return { ok: false as const, error: "Application cannot be provisioned" }
  }

  if (await applicantHasActiveWorkspace(app.userId)) {
    return { ok: false as const, error: "Applicant already has an active workspace" }
  }

  const baseSlug = slugify(app.serverName) || `server-${app.id.slice(0, 6)}`
  const slug = await uniqueSlug(baseSlug)

  const created = await prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: {
        name: app.serverName,
        slug,
        active: true,
        calBookingUrl: process.env.PORTAL_DEFAULT_CAL_URL || null,
      },
      select: { id: true, name: true, slug: true },
    })

    await tx.workspaceMember.create({
      data: { workspaceId: workspace.id, userId: app.userId, role: "OWNER" },
    })

    await tx.workspaceServer.create({
      data: {
        workspaceId: workspace.id,
        provider: "MANUAL",
        displayName: app.serverName,
        online: false,
      },
    })

    const now = new Date()
    const end = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
    await tx.sprint.create({
      data: {
        workspaceId: workspace.id,
        name: "Current sprint",
        startDate: now,
        endDate: end,
        hoursMax: 0,
        status: "ACTIVE",
      },
    })

    await tx.application.update({
      where: { id: app.id },
      data: { status: "APPROVED", reviewedAt: new Date() },
    })

    return workspace
  })

  void tryProvisionWorkspaceDiscord({
    workspaceId: created.id,
    name: created.name,
    slug: created.slug,
    ownerUserId: app.userId,
  }).then((r) => {
    if (r.ok) {
      logWorkspaceEvent(created.id, `Discord channels provisioned for **${created.name}**.`)
    }
  })

  return { ok: true as const, workspace: created }
}

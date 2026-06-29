import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as { id?: string }).id!
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? ""
  let workspaceId = req.nextUrl.searchParams.get("workspaceId")?.trim()
  const workspaceSlug = req.nextUrl.searchParams.get("workspaceSlug")?.trim()
  if (!workspaceId && workspaceSlug) {
    const ws = await prisma.workspace.findUnique({
      where: { slug: workspaceSlug },
      select: { id: true },
    })
    workspaceId = ws?.id
  }

  if (q.length < 2) {
    return NextResponse.json({ tickets: [], messages: [], members: [] })
  }

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId, ...(workspaceId ? { workspaceId } : {}) },
    select: { workspaceId: true },
  })
  const workspaceIds = memberships.map((m) => m.workspaceId)
  if (workspaceIds.length === 0) {
    return NextResponse.json({ tickets: [], messages: [], members: [] })
  }

  const [tickets, messages, members] = await Promise.all([
    prisma.ticket.findMany({
      where: {
        workspaceId: { in: workspaceIds },
        type: "TICKET",
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { key: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 15,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        key: true,
        title: true,
        status: true,
        workspace: { select: { slug: true, name: true } },
      },
    }),
    prisma.workspaceChatMessage.findMany({
      where: {
        workspaceId: { in: workspaceIds },
        body: { contains: q, mode: "insensitive" },
      },
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        body: true,
        createdAt: true,
        workspace: { select: { slug: true, name: true } },
      },
    }),
    prisma.workspaceMember.findMany({
      where: {
        workspaceId: { in: workspaceIds },
        user: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
      },
      take: 8,
      select: {
        role: true,
        user: { select: { id: true, name: true, email: true } },
        workspace: { select: { slug: true, name: true } },
      },
    }),
  ])

  return NextResponse.json({
    tickets: tickets.map((t) => ({
      id: t.id,
      key: t.key,
      title: t.title,
      status: t.status,
      href: `/workspace/${t.workspace.slug}/tickets/${t.key}`,
      workspaceName: t.workspace.name,
    })),
    messages: messages.map((m) => ({
      id: m.id,
      preview: m.body.slice(0, 120),
      href: `/workspace/${m.workspace.slug}/chat`,
      workspaceName: m.workspace.name,
      createdAt: m.createdAt.toISOString(),
    })),
    members: members.map((m) => ({
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      workspaceName: m.workspace.name,
      href: `/workspace/${m.workspace.slug}/settings/members`,
    })),
  })
}

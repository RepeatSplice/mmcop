import { requireWorkspaceMember } from "@/lib/workspace"
import { prisma } from "@/lib/prisma"
import { chatMessageSelect } from "@/lib/chat-attachments"
import { serializeChatMessage } from "@/lib/chat-message"
import { getDiscordUserId } from "@/lib/discord-user"
import { WorkspaceChat } from "@/components/chat/WorkspaceChat"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function WorkspaceChatPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const access = await requireWorkspaceMember(slug)
  const userId = access.userId

  const [discord, messages, discordUserId, members] = await Promise.all([
    prisma.workspaceDiscord.findUnique({
      where: { workspaceId: access.workspace.id },
      select: { provisionedAt: true, lastError: true },
    }),
    prisma.workspaceChatMessage.findMany({
      where: { workspaceId: access.workspace.id, channel: "CHAT" },
      orderBy: { createdAt: "desc" },
      take: 51,
      select: chatMessageSelect,
    }),
    userId ? getDiscordUserId(userId) : Promise.resolve(null),
    prisma.workspaceMember.findMany({
      where: { workspaceId: access.workspace.id },
      select: {
        userId: true,
        user: { select: { name: true, email: true } },
      },
    }),
  ])

  const hasMore = messages.length > 50
  const page = (hasMore ? messages.slice(0, 50) : messages).reverse()

  return (
    <WorkspaceChat
      workspaceId={access.workspace.id}
      workspaceSlug={access.workspace.slug}
      viewerUserId={userId}
      canPost={access.role !== "VIEWER"}
      discordProvisioned={Boolean(discord?.provisionedAt)}
      hasDiscordLinked={Boolean(discordUserId)}
      initialMessages={page.map(serializeChatMessage)}
      initialHasMore={hasMore}
      members={members.map((m) => ({
        userId: m.userId,
        name: m.user.name || m.user.email?.split("@")[0] || "User",
        email: m.user.email,
      }))}
    />
  )
}

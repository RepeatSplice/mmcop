import Link from "next/link"
import { requireWorkspaceMember } from "@/lib/workspace"
import { prisma } from "@/lib/prisma"
import { PageShell } from "@/components/layout/PageShell"
import { Megaphone } from "lucide-react"
import { ticketStatusLabel } from "@/lib/ticket-display"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function ChangelogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const access = await requireWorkspaceMember(slug)
  const workspaceId = access.workspace.id
  const base = `/workspace/${access.workspace.slug}`

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [doneTickets, githubEvents, discordAnnouncements, pinnedHistory] = await Promise.all([
    prisma.ticket.findMany({
      where: {
        workspaceId,
        type: "TICKET",
        status: "DONE",
        updatedAt: { gte: weekAgo },
      },
      orderBy: { updatedAt: "desc" },
      take: 30,
      select: { key: true, title: true, updatedAt: true, discipline: true },
    }),
    prisma.activityEvent.findMany({
      where: {
        workspaceId,
        source: "GITHUB",
        createdAt: { gte: weekAgo },
      },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { id: true, body: true, createdAt: true, type: true },
    }),
    prisma.workspaceChatMessage.findMany({
      where: { workspaceId, source: "DISCORD", createdAt: { gte: weekAgo } },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, body: true, authorDisplayName: true, createdAt: true },
    }),
    prisma.workspacePinnedUpdate.findMany({
      where: { workspaceId },
      orderBy: { pinnedAt: "desc" },
      take: 12,
      select: { id: true, body: true, pinnedAt: true, active: true },
    }),
  ])

  return (
    <PageShell>
      <div className="bg-surface-1 px-4 sm:px-5 py-6 border-b border-border">
        <h2 className="text-sm font-medium text-fg">Updates</h2>
        <p className="mt-1 text-xs text-fg-muted">
          What shipped, pinned, and discussed in the last 7 days — plus the workspace announcement history.
        </p>
      </div>

      <div className="px-4 sm:px-5 py-6 space-y-6">
        <p className="text-xs text-fg-muted">
          <Link href={`${base}/summary`} className="underline hover:text-fg">
            Back to summary
          </Link>
        </p>

        <section className="border border-border bg-surface-1 p-6">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-fg-subtle" strokeWidth={1.75} />
            <h2 className="text-sm font-medium text-fg">Pinned updates</h2>
          </div>
          {pinnedHistory.length === 0 ? (
            <p className="mt-3 text-sm text-fg-muted">No pinned updates yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {pinnedHistory.map((p) => (
                <li key={p.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] uppercase tracking-widest text-fg-subtle">
                      {p.active ? "Current" : "Archived"}
                    </span>
                    <span className="text-[10px] text-fg-subtle tabular-nums">
                      {p.pinnedAt.toLocaleDateString(undefined, { dateStyle: "medium" })}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-fg whitespace-pre-wrap">{p.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border border-border bg-surface-1 p-6">
          <h2 className="text-sm font-medium text-fg">Completed tickets</h2>
          {doneTickets.length === 0 ? (
            <p className="mt-3 text-sm text-fg-muted">No tickets marked done this week.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {doneTickets.map((t) => (
                <li key={t.key} className="py-3 first:pt-0 last:pb-0">
                  <Link
                    href={`${base}/tickets/${t.key}`}
                    className="text-sm font-medium text-fg hover:underline"
                  >
                    {t.key}: {t.title}
                  </Link>
                  <p className="mt-1 text-[11px] text-fg-subtle">
                    {ticketStatusLabel("DONE")} ·{" "}
                    {t.updatedAt.toLocaleDateString(undefined, { dateStyle: "medium" })}
                    {t.discipline ? ` · ${t.discipline}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border border-border bg-surface-1 p-6">
          <h2 className="text-sm font-medium text-fg">GitHub activity</h2>
          {githubEvents.length === 0 ? (
            <p className="mt-3 text-sm text-fg-muted">No linked repo activity this week.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {githubEvents.map((e) => (
                <li key={e.id} className="text-sm text-fg-muted">
                  <span className="text-fg-subtle text-[11px] block">
                    {e.createdAt.toLocaleDateString(undefined, { dateStyle: "short" })}
                  </span>
                  {e.body}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border border-border bg-surface-1 p-6">
          <h2 className="text-sm font-medium text-fg">Discord announcements</h2>
          <p className="mt-1 text-xs text-fg-muted">
            Messages mirrored from your Discord announcements channel in the last 7 days.
          </p>
          {discordAnnouncements.length === 0 ? (
            <p className="mt-3 text-sm text-fg-muted">No Discord announcements this week.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {discordAnnouncements.map((m) => (
                <li key={m.id} className="text-sm">
                  <p className="text-[11px] text-fg-subtle">
                    {m.authorDisplayName} ·{" "}
                    {m.createdAt.toLocaleDateString(undefined, { dateStyle: "short" })}
                  </p>
                  <p className="mt-1 text-fg-muted line-clamp-4 whitespace-pre-wrap">
                    {m.body || "(attachment)"}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={`${base}/chat`}
            className="mt-4 inline-block text-xs text-fg-muted hover:text-fg"
          >
            Open chat →
          </Link>
        </section>
      </div>
    </PageShell>
  )
}

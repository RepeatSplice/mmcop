import { requireStaff } from "@/lib/ops"
import { prisma } from "@/lib/prisma"
import { PageShell } from "@/components/layout/PageShell"
import { OpsMetaPill, OpsPageHeader } from "@/components/ops/OpsPageHeader"
import { OpsEmpty, OpsSection } from "@/components/ops/OpsSection"
import { ticketStatusLabel } from "@/lib/ticket-display"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function OpsBoardPage() {
  await requireStaff()

  const tickets = await prisma.ticket.findMany({
    where: { type: "TICKET", status: { in: ["PLANNED", "IN_PROGRESS", "REVIEW"] } },
    orderBy: [{ updatedAt: "desc" }],
    include: { workspace: { select: { slug: true, name: true } } },
    take: 400,
  })

  return (
    <PageShell>
      <OpsPageHeader
        title="Global board"
        description="In-flight tickets across every client workspace."
        meta={<OpsMetaPill>{tickets.length} active</OpsMetaPill>}
      />

      <OpsSection title="In progress">
        {tickets.length === 0 ? (
          <OpsEmpty>No in-flight tickets.</OpsEmpty>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border overflow-hidden">
            {tickets.map((t) => (
              <li key={t.id}>
                <a
                  href={`/workspace/${t.workspace.slug}/tickets/${t.key}`}
                  className="flex flex-col gap-1 bg-surface px-4 py-4 hover:bg-surface-2 transition-colors sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-[11px] text-fg-subtle">{t.workspace.name}</p>
                    <p className="mt-0.5 text-sm text-fg truncate">
                      <span className="font-mono text-fg-muted">{t.key}</span> {t.title}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs text-fg-muted">
                    {ticketStatusLabel(t.status)} · {t.discipline}
                  </p>
                </a>
              </li>
            ))}
          </ul>
        )}
      </OpsSection>
    </PageShell>
  )
}

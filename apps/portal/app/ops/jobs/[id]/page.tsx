import Link from "next/link"
import { requireStaff } from "@/lib/ops"
import { prisma } from "@/lib/prisma"
import { CreateQuoteForm } from "@/components/ops/CreateQuoteForm"
import { ActivityFeed } from "@/components/realtime/ActivityFeed"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function OpsJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff()
  const { id } = await params

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      workspace: { select: { id: true, slug: true, name: true } },
      quotes: { orderBy: { createdAt: "desc" } },
      comments: { orderBy: { createdAt: "asc" } },
    },
  })

  if (!job) {
    return (
      <div className="border border-border bg-surface-1 p-6">
        <p className="text-sm text-fg-muted">Not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="border border-border bg-surface-1 p-6">
        <Link href="/ops/jobs" className="text-xs text-fg-muted hover:text-fg">
          ← Jobs
        </Link>
        <p className="mt-3 text-xs text-fg-muted">
          {job.key} • {job.status} • {job.workspace.name}
        </p>
        <h1 className="mt-1 font-display text-xl uppercase tracking-wide">{job.title}</h1>
        <p className="mt-3 text-sm text-fg-muted whitespace-pre-wrap">{job.description}</p>
        <p className="mt-4 text-xs text-fg-muted">
          Client view:{" "}
          <Link className="text-monarch-300 hover:text-fg" href={`/workspace/${job.workspace.slug}/tickets/${job.key}`}>
            open
          </Link>
        </p>
      </div>

      <div className="border border-border bg-surface-1 p-6 space-y-4">
        <h3 className="font-display text-[11px] uppercase tracking-[0.2em] text-fg-subtle">
          Quotes
        </h3>
        <CreateQuoteForm jobId={job.id} />

        {job.quotes.length === 0 ? (
          <p className="text-sm text-fg-muted">No quotes yet.</p>
        ) : (
          <div className="space-y-2">
            {job.quotes.map((q) => (
              <div key={q.id} className="border border-border bg-surface p-4">
                <p className="text-xs text-fg-muted">
                  {q.currency.toUpperCase()} {(q.amountCents / 100).toFixed(2)} • {q.type}{" "}
                  {q.approvedAt ? "• APPROVED" : ""}
                </p>
                <p className="mt-2 text-sm text-fg-muted whitespace-pre-wrap">{q.scope}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border border-border bg-surface-1 p-6">
        <h3 className="font-display text-[11px] uppercase tracking-[0.2em] text-fg-subtle">
          Activity (live)
        </h3>
        <div className="mt-4">
          <ActivityFeed workspaceId={job.workspace.id} jobId={job.id} />
        </div>
      </div>
    </div>
  )
}


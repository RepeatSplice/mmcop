import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MarkAllReadButton } from "@/components/notifications/MarkAllReadButton"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const userId = (session.user as { id?: string }).id!

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 80,
    select: {
      id: true,
      title: true,
      body: true,
      url: true,
      readAt: true,
      createdAt: true,
      type: true,
    },
  })

  return (
    <div className="max-w-[772px] mx-auto px-4 sm:px-8 py-10">
      <header className="mb-6">
        <h1 className="text-xl font-medium text-fg">Notifications</h1>
        <p className="mt-1 text-sm text-fg-muted">Updates from your workspaces.</p>
      </header>
      <div className="mb-4 flex items-center justify-between gap-4">
        <Link href="/" className="text-xs text-fg-muted underline hover:text-fg">
          Home
        </Link>
        <MarkAllReadButton />
      </div>

      {notifications.length === 0 ? (
        <p className="text-sm text-fg-muted py-8">You are all caught up.</p>
      ) : (
        <ul className="divide-y divide-border border border-border bg-surface-1">
          {notifications.map((n) => (
            <li key={n.id} className={n.readAt ? "opacity-70" : ""}>
              {n.url ? (
                <Link href={n.url} className="block px-5 py-4 hover:bg-surface-2 transition-colors">
                  <p className="text-sm font-medium text-fg">{n.title}</p>
                  {n.body ? <p className="mt-1 text-xs text-fg-muted line-clamp-2">{n.body}</p> : null}
                  <p className="mt-2 text-[10px] text-fg-subtle">
                    {n.createdAt.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </Link>
              ) : (
                <div className="px-5 py-4">
                  <p className="text-sm font-medium text-fg">{n.title}</p>
                  {n.body ? <p className="mt-1 text-xs text-fg-muted">{n.body}</p> : null}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

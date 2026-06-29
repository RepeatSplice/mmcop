import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { cn } from "@/lib/utils"
import { requireWorkspaceMember } from "@/lib/workspace"
import { pageFrameClass, pageTopPaddingClass } from "@/components/layout/PageShell"
import { WorkspaceSidebar } from "@/components/nav/WorkspaceSidebar"
import { WorkspacePreloadGate } from "@/components/workspace/WorkspacePreloadGate"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const access = await requireWorkspaceMember(slug)

  // First time in this workspace? Route through the onboard wizard. Staff are
  // exempt so on-call ops aren't interrupted.
  if (!access.onboardedAt && !access.isStaff) {
    redirect(`/onboard?workspace=${encodeURIComponent(access.workspace.slug)}`)
  }

  const base = `/workspace/${access.workspace.slug}`

  return (
    <WorkspacePreloadGate
      slug={access.workspace.slug}
      workspaceId={access.workspace.id}
      workspaceName={access.workspace.name}
      baseHref={base}
    >
      <div className="bg-surface text-fg min-h-[calc(100vh-48px)] flex">
        <WorkspaceSidebar
          workspaceId={access.workspace.id}
          workspaceName={access.workspace.name}
          baseHref={base}
        />

        <main
          className={cn(
            "flex-1 min-w-0 w-full px-4 sm:px-6 lg:px-8",
            pageTopPaddingClass
          )}
        >
          <div className={pageFrameClass}>{children}</div>
        </main>
      </div>
    </WorkspacePreloadGate>
  )
}

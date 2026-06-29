import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { requireStaff } from "@/lib/ops"
import {
  pageFrameClass,
  pageGutterClass,
  pageTopPaddingClass,
} from "@/components/layout/PageShell"
import { WorkspaceProjectNav } from "@/components/nav/WorkspaceProjectNav"
import { buildOpsTabs } from "@/components/nav/workspace-tabs"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function OpsLayout({ children }: { children: ReactNode }) {
  await requireStaff()

  return (
    <div className="bg-surface text-fg min-h-[calc(100vh-48px)] flex flex-col">
      <div className="sticky top-12 z-40 shrink-0">
        <WorkspaceProjectNav
          workspaceName="Operations"
          baseHref="/ops"
          tabs={buildOpsTabs()}
          breadcrumbRoot={{ label: "Home", href: "/" }}
          showMembersAction={false}
        />
      </div>

      <main className={cn("flex-1 w-full min-w-0", pageGutterClass, pageTopPaddingClass)}>
        <div className={pageFrameClass}>{children}</div>
      </main>
    </div>
  )
}

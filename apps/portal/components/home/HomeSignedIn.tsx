import Link from "next/link"
import { ArrowRight, FileText, LayoutGrid } from "lucide-react"
import { WorkspaceEntryLink } from "@/components/home/WorkspaceEntryLink"
import { ApplicationStatusBlock } from "@/components/portal/ApplicationStatusBlock"
import {
  PortalAccountPanel,
  PortalCard,
  PortalEmpty,
  PortalMetaPill,
  PortalPageHeader,
  PortalPageLayout,
  PortalSection,
  portalPrimaryLinkClassName,
  portalSecondaryLinkClassName,
} from "@/components/portal/PortalPage"

type WorkspaceRow = {
  id: string
  name: string
  slug: string
  role: string
}

export function HomeSignedIn(props: {
  firstName: string
  email?: string | null
  name: string | null
  discordLinked: boolean
  discordLabel: string | null
  isStaff: boolean
  workspaces: WorkspaceRow[]
  application: { status: "SUBMITTED" | "APPROVED" | "REJECTED" } | null
}) {
  const { workspaces, application } = props
  const hasWorkspaces = workspaces.length > 0

  return (
    <PortalPageLayout>
      <PortalPageHeader
        eyebrow="Monarch Portal"
        title={`Welcome, ${props.firstName}`}
        description="Pick a workspace to open the board, chat, and settings."
        meta={
          <>
            {props.isStaff ? <PortalMetaPill tone="success">Staff</PortalMetaPill> : null}
            {hasWorkspaces ? (
              <PortalMetaPill>
                {workspaces.length} workspace{workspaces.length === 1 ? "" : "s"}
              </PortalMetaPill>
            ) : null}
            {application?.status === "SUBMITTED" ? (
              <PortalMetaPill tone="warn">Application pending</PortalMetaPill>
            ) : null}
            {application?.status === "APPROVED" ? (
              <PortalMetaPill tone="success">Application approved</PortalMetaPill>
            ) : null}
          </>
        }
        actions={
          !hasWorkspaces ? (
            <Link href="/apply" className={portalPrimaryLinkClassName()}>
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              Apply for access
            </Link>
          ) : (
            <Link href="/apply" className={portalSecondaryLinkClassName()}>
              Application
            </Link>
          )
        }
      />

      <PortalCard>
        {!hasWorkspaces && application ? (
          <PortalSection title="Application status">
            <ApplicationStatusBlock status={application.status} />
            {application.status === "APPROVED" ? (
              <p className="mt-4 text-sm text-fg-muted leading-relaxed">
                Your application is approved. Staff will create your workspace and invite you, or
                you can contact support if this has been waiting more than a few days.
              </p>
            ) : null}
          </PortalSection>
        ) : null}

        <PortalSection
          title="Your workspaces"
          description={
            hasWorkspaces
              ? "Each workspace is a separate server project with its own board and team."
              : "You are not on a workspace yet. Submit an application or wait for staff to invite you."
          }
        >
          {hasWorkspaces ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {workspaces.map((w) => (
                <li key={w.id}>
                  <WorkspaceEntryLink name={w.name} slug={w.slug} role={w.role} />
                </li>
              ))}
            </ul>
          ) : (
            <PortalEmpty
              icon={
                <LayoutGrid className="mx-auto h-8 w-8 text-fg-subtle" strokeWidth={1.25} aria-hidden="true" />
              }
              title="No workspace yet"
              description="Request portal access with your account email and Discord. After approval, you will set up your server in the workspace."
            >
              <Link href="/apply" className={portalPrimaryLinkClassName()}>
                Start application
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </PortalEmpty>
          )}
        </PortalSection>

        <PortalSection
          title="Your account"
          description="Connect Discord and integrations from workspace settings after you join a team."
          actions={
            <Link href="/apply" className={portalSecondaryLinkClassName()}>
              Edit application
            </Link>
          }
        >
          <PortalAccountPanel
            email={props.email ?? ""}
            name={props.name}
            discordLabel={props.discordLabel}
            discordLinked={props.discordLinked}
          />
        </PortalSection>
      </PortalCard>
    </PortalPageLayout>
  )
}

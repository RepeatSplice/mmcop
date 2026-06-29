import Link from "next/link"
import { ArrowRight } from "lucide-react"
import {
  PortalCard,
  PortalPageHeader,
  PortalPageLayout,
  PortalSection,
  portalPrimaryLinkClassName,
  portalSecondaryLinkClassName,
} from "@/components/portal/PortalPage"

export function HomeSignedOut() {
  return (
    <PortalPageLayout className="flex flex-col justify-center">
      <PortalPageHeader
        eyebrow="Monarch Portal"
        title="Retainers & Projects"
        description="Jira-style boards for DayZ servers. Track sprints, tasks, quotes, and delivery — with Discord chat synced to your team."
      />

      <PortalCard>
        <PortalSection title="Get started">
          <div className="flex flex-wrap gap-3">
            <Link href="/login" className={portalPrimaryLinkClassName()}>
              Sign in
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <Link href="/apply" className={portalSecondaryLinkClassName()}>
              Request access
            </Link>
          </div>
        </PortalSection>
      </PortalCard>
    </PortalPageLayout>
  )
}

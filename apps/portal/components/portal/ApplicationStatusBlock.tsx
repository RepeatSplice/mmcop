import Link from "next/link"
import {
  ApplicationStatusLink,
  PortalStatusBanner,
  applicationStatusPillClass,
  portalSecondaryLinkClassName,
} from "@/components/portal/PortalPage"

export function ApplicationStatusPill(props: { status: "SUBMITTED" | "APPROVED" | "REJECTED" }) {
  return (
    <span
      className={`inline-flex rounded-md border px-3 py-1 text-[10px] font-display uppercase tracking-widest ${applicationStatusPillClass(props.status)}`}
    >
      {props.status}
    </span>
  )
}

export function ApplicationStatusBlock(props: { status: "SUBMITTED" | "APPROVED" | "REJECTED" }) {
  if (props.status === "SUBMITTED") {
    return (
      <PortalStatusBanner
        tone="amber"
        label="Under review"
        action={<ApplicationStatusLink href="/apply">View or edit application →</ApplicationStatusLink>}
      >
        Your access request was submitted. Staff will review your account and email you when a workspace is ready.
      </PortalStatusBanner>
    )
  }

  if (props.status === "REJECTED") {
    return (
      <PortalStatusBanner
        tone="red"
        label="Not approved"
        action={
          <Link href="/apply" className={portalSecondaryLinkClassName()}>
            Apply again
          </Link>
        }
      >
        Your previous application was not approved. You can submit a new one with updated details.
      </PortalStatusBanner>
    )
  }

  return (
    <PortalStatusBanner tone="emerald" label="Approved">
      Your request was approved. Your workspace should appear shortly — refresh this page or contact staff if it
      does not.
    </PortalStatusBanner>
  )
}

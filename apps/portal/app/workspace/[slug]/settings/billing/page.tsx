import { requireWorkspaceMember } from "@/lib/workspace"
import { prisma } from "@/lib/prisma"
import { BillingPortalButton } from "@/components/billing/BillingPortalButton"
import { MedusaOrdersPanel } from "@/components/billing/MedusaOrdersPanel"
import { StartRetainerButtons } from "@/components/billing/StartRetainerButtons"
import { resolveMedusaBillingForWorkspace } from "@/lib/medusa-client"
import {
  SettingsPageHeader,
  SettingsSection,
  SettingsCard,
} from "@/components/settings/SettingsSection"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Map raw Stripe statuses to client-friendly copy. */
function normalizeStatus(s: string | null): { label: string; tone: "ok" | "warn" | "err" | "neutral" } {
  switch ((s ?? "").toLowerCase()) {
    case "active":
    case "trialing":
      return { label: "Active", tone: "ok" }
    case "past_due":
    case "unpaid":
      return { label: "Past due", tone: "warn" }
    case "canceled":
    case "incomplete_expired":
      return { label: "Canceled", tone: "err" }
    case "incomplete":
      return { label: "Awaiting payment", tone: "warn" }
    case "":
      return { label: "Not set up", tone: "neutral" }
    default:
      return { label: s ?? "—", tone: "neutral" }
  }
}

export default async function BillingSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const access = await requireWorkspaceMember(slug)
  const canManageBilling = access.role === "OWNER" || access.role === "ADMIN"
  const isOwner = access.role === "OWNER"

  const ws = await prisma.workspace.findUnique({
    where: { id: access.workspace.id },
    select: {
      id: true,
      medusaCustomerId: true,
      stripeSubscriptionId: true,
      stripeSubscriptionStatus: true,
      stripeTier: true,
      stripeRenewalAt: true,
      members: {
        where: { role: "OWNER" },
        take: 1,
        select: { user: { select: { email: true } } },
      },
    },
  })

  const ownerEmail = ws?.members[0]?.user.email ?? null
  const medusa = await resolveMedusaBillingForWorkspace({
    medusaCustomerId: ws?.medusaCustomerId ?? null,
    ownerEmail,
  })

  const storefrontUrl =
    process.env.NEXT_PUBLIC_STOREFRONT_URL || process.env.STOREFRONT_URL || null

  const status = normalizeStatus(ws?.stripeSubscriptionStatus ?? null)
  const hasSub = Boolean(ws?.stripeSubscriptionId)
  const renewalCopy =
    hasSub && ws?.stripeRenewalAt
      ? `Renews ${ws.stripeRenewalAt.toLocaleDateString(undefined, { dateStyle: "medium" })}`
      : null
  const toneClass: Record<typeof status.tone, string> = {
    ok: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    warn: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300",
    err: "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-300",
    neutral: "border-border bg-surface-2 text-fg-muted",
  }

  return (
    <>
      <SettingsPageHeader
        title="Billing"
        description="Retainer subscription via Stripe and shop orders linked through Medusa."
      />

      <div className="px-5 pb-0">
        <SettingsCard>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-fg-subtle">Plan</p>
              <p className="mt-1 text-base font-medium text-fg">
                {ws?.stripeTier ?? (hasSub ? "Retainer" : "No active retainer")}
              </p>
              {renewalCopy ? (
                <p className="mt-0.5 text-xs text-fg-muted">{renewalCopy}</p>
              ) : null}
            </div>
            <span
              className={`shrink-0 inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${toneClass[status.tone]}`}
            >
              {status.label}
            </span>
          </div>
        </SettingsCard>
      </div>

      {!hasSub && isOwner ? (
        <SettingsSection
          title="Start a retainer"
          description="Pick a tier and pay through Stripe Checkout. We'll sync everything automatically."
        >
          <StartRetainerButtons workspaceId={access.workspace.id} />
        </SettingsSection>
      ) : null}

      <SettingsSection
        title="Stripe retainer"
        description={
          canManageBilling
            ? "Update payment method, invoices, and subscription in the Stripe customer portal."
            : "Only workspace owners and admins can manage billing."
        }
      >
        {canManageBilling ? (
          <BillingPortalButton workspaceId={access.workspace.id} />
        ) : (
          <p className="text-sm text-fg-muted">
            Contact a workspace admin to update payment details or subscription.
          </p>
        )}
      </SettingsSection>

      <SettingsSection
        title="Shop orders"
        description="Medusa orders associated with this workspace owner."
      >
        <MedusaOrdersPanel orders={medusa.orders} storefrontUrl={storefrontUrl} />
      </SettingsSection>
    </>
  )
}

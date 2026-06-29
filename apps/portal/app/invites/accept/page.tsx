import Link from "next/link"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AcceptInviteClient } from "@/components/invites/AcceptInviteClient"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const sp = await searchParams
  const token = sp.token ?? ""

  const session = await auth()
  if (!session?.user) redirect(`/login?callbackUrl=/invites/accept?token=${encodeURIComponent(token)}`)

  return (
    <div className="min-h-screen bg-surface text-fg flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg border border-border bg-surface-1 p-8 space-y-4">
        <div>
          <p className="font-display text-[11px] uppercase tracking-[0.2em] text-fg-subtle">
            Monarch Portal
          </p>
          <h1 className="mt-2 font-display text-2xl uppercase tracking-wide text-fg">
            Accept invite
          </h1>
          <p className="mt-2 text-sm text-fg-muted">
            Signed in as {session.user.email ?? session.user.name ?? "user"}.
          </p>
        </div>

        {token ? (
          <AcceptInviteClient token={token} />
        ) : (
          <p className="text-sm text-red-400">Missing token.</p>
        )}

        <div className="pt-2">
          <Link href="/" className="text-sm text-fg-muted hover:text-fg">
            Back home
          </Link>
        </div>
      </div>
    </div>
  )
}


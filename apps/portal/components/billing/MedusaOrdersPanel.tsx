import type { MedusaOrderSummary } from "@/lib/medusa-client"

function formatMoney(amount: number, currency: string): string {
  try {
    // Medusa stores totals in the smallest unit (cents).
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: (currency || "usd").toUpperCase(),
    }).format(amount / 100)
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency?.toUpperCase() ?? ""}`.trim()
  }
}

export function MedusaOrdersPanel(props: {
  orders: MedusaOrderSummary[]
  storefrontUrl: string | null
}) {
  if (props.orders.length === 0 && !props.storefrontUrl) {
    return (
      <p className="text-sm text-fg-muted">
        No shop orders linked yet. Orders appear when your workspace email matches a Medusa customer.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="font-display text-[11px] uppercase tracking-[0.2em] text-fg-subtle">
        Shop orders
      </h3>
      {props.orders.length === 0 ? (
        <p className="text-sm text-fg-muted">No recent orders found.</p>
      ) : (
        <ul className="divide-y divide-border border border-border">
          {props.orders.map((o) => (
            <li key={o.id} className="px-4 py-3 text-sm flex flex-wrap justify-between gap-4">
              <span>
                Order #{o.display_id}{" "}
                <span className="text-fg-muted">· {o.status}</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="tabular-nums font-medium text-fg">
                  {formatMoney(o.total, o.currency_code)}
                </span>
                <span className="text-fg-subtle text-xs shrink-0">
                  {new Date(o.created_at).toLocaleDateString()}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {props.storefrontUrl ? (
        <a
          href={props.storefrontUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-fg hover:underline"
        >
          Open storefront →
        </a>
      ) : null}
    </div>
  )
}

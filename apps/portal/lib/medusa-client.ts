/**
 * Read-only Medusa store API for portal billing (orders + customer).
 */

export type MedusaOrderSummary = {
  id: string
  display_id: number
  status: string
  created_at: string
  total: number
  currency_code: string
}

export type MedusaCustomerSummary = {
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
}

function medusaBase(): string | null {
  return (
    process.env.MEDUSA_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_MEDUSA_URL ||
    process.env.MEDUSA_URL ||
    null
  )
}

function publishableKey(): string | null {
  return process.env.MEDUSA_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || null
}

export async function fetchMedusaCustomerByEmail(
  email: string
): Promise<MedusaCustomerSummary | null> {
  const base = medusaBase()
  const pk = publishableKey()
  if (!base || !pk) return null

  try {
    const res = await fetch(
      `${base.replace(/\/$/, "")}/store/customers/me`,
      {
        headers: {
          "x-publishable-api-key": pk,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    )
    if (res.ok) {
      const data = (await res.json()) as { customer?: MedusaCustomerSummary }
      if (data.customer) return data.customer
    }
  } catch (e) {
    console.warn("[medusa] customer fetch failed", e)
  }

  return null
}

export async function fetchMedusaOrdersForCustomer(
  customerId: string
): Promise<MedusaOrderSummary[]> {
  const base = medusaBase()
  const adminToken = process.env.MEDUSA_ADMIN_API_TOKEN
  if (!base) return []

  try {
    if (adminToken) {
      const res = await fetch(
        `${base.replace(/\/$/, "")}/admin/orders?customer_id=${encodeURIComponent(customerId)}&limit=10&order=-created_at`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      )
      if (res.ok) {
        const data = (await res.json()) as { orders?: MedusaOrderSummary[] }
        return data.orders ?? []
      }
    }
  } catch (e) {
    console.warn("[medusa] orders fetch failed", e)
  }

  return []
}

export async function resolveMedusaBillingForWorkspace(input: {
  medusaCustomerId: string | null
  ownerEmail: string | null
}): Promise<{
  customer: MedusaCustomerSummary | null
  orders: MedusaOrderSummary[]
}> {
  let customerId = input.medusaCustomerId

  if (!customerId && input.ownerEmail) {
    const c = await fetchMedusaCustomerByEmail(input.ownerEmail)
    if (c) customerId = c.id
  }

  if (!customerId) return { customer: null, orders: [] }

  const orders = await fetchMedusaOrdersForCustomer(customerId)
  return {
    customer: {
      id: customerId,
      email: input.ownerEmail ?? "",
    },
    orders,
  }
}

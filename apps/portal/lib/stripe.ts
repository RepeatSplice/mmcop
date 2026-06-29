import Stripe from "stripe"

export function requireStripeSecret() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured")
  return key
}

export function getStripe() {
  const key = requireStripeSecret()
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" as any })
}

export function getSiteUrl() {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    "http://localhost:4000"
  ).replace(/\/$/, "")
}


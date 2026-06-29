import type { Metadata } from "next"
import { LoginPage } from "@/components/auth/LoginPage"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Sign in — Monarch Portal",
  robots: { index: false },
}

export default function Page() {
  return <LoginPage />
}


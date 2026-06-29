import { redirect } from "next/navigation"
import { requireStaff } from "@/lib/ops"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function OpsIndexPage() {
  await requireStaff()
  redirect("/ops/applications")
}


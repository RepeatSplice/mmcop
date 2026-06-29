import { handlers } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  return (handlers as any).GET(req)
}

export async function POST(req: Request) {
  return (handlers as any).POST(req)
}


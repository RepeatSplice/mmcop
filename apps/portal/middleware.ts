import { NextResponse, type NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").toLowerCase()
  const url = req.nextUrl

  // Host-based convenience routing (no auth checks here; keep Edge-safe)
  if (host.startsWith("admin.") && url.pathname === "/") {
    return NextResponse.redirect(new URL("/ops", req.url))
  }

  if (host.startsWith("retainer.") && url.pathname.startsWith("/ops")) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/ops/:path*"],
}


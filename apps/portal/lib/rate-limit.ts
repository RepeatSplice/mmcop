type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

/** Simple in-memory rate limiter (per server instance). */
export function checkRateLimit(
  key: string,
  opts: { max: number; windowMs: number }
): { ok: true } | { ok: false; retryAfterMs: number } {
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs })
    return { ok: true }
  }

  if (existing.count >= opts.max) {
    return { ok: false, retryAfterMs: existing.resetAt - now }
  }

  existing.count += 1
  return { ok: true }
}

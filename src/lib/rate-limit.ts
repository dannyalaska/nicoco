/**
 * Tiny in-memory rate limiter for public POST routes (waitlist,
 * webhook ingest). Not multi-instance safe — that's fine for MVP. Move
 * to Upstash Redis when we're on Vercel with multiple regions.
 */
type Bucket = { tokens: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** Max requests in the window. */
  limit: number;
  /** Window size in milliseconds. */
  windowMs: number;
}

export function rateLimit(key: string, opts: RateLimitOptions): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { tokens: opts.limit - 1, resetAt: now + opts.windowMs });
    return { ok: true, retryAfterMs: 0 };
  }
  if (b.tokens <= 0) {
    return { ok: false, retryAfterMs: b.resetAt - now };
  }
  b.tokens -= 1;
  return { ok: true, retryAfterMs: 0 };
}

export function clientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

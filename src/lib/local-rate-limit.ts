import { getLocalDb } from "@/lib/local-db";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * SQLite-backed rate limiter.
 * Uses the local SQLite database (not the primary PostgreSQL).
 *
 * Fail-open: if the local database is unreachable (e.g. SQLITE_URL not yet
 * configured), requests are allowed through with a logged warning instead of
 * hard-failing the calling route.
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  try {
    const db = getLocalDb();
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowSeconds * 1000);

    const rateLimit = await db.rateLimit.findUnique({ where: { key } });

    if (!rateLimit || rateLimit.window < windowStart) {
      // New window — reset counter
      await db.rateLimit.upsert({
        where: { key },
        update: { count: 1, window: now },
        create: { key, count: 1, window: now },
      });
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt: new Date(now.getTime() + windowSeconds * 1000),
      };
    }

    if (rateLimit.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(rateLimit.window.getTime() + windowSeconds * 1000),
      };
    }

    // Increment counter
    await db.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
    });

    return {
      allowed: true,
      remaining: maxRequests - rateLimit.count - 1,
      resetAt: new Date(rateLimit.window.getTime() + windowSeconds * 1000),
    };
  } catch (error) {
    console.error(`Rate limiter unavailable for key "${key}", allowing request:`, error);
    return {
      allowed: true,
      remaining: maxRequests,
      resetAt: new Date(Date.now() + windowSeconds * 1000),
    };
  }
}

/**
 * Get client IP from request headers (works behind proxies)
 */
export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const xri = request.headers.get("x-real-ip");
  if (xri) return xri;
  return "unknown";
}

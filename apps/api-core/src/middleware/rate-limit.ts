import type { MiddlewareHandler } from "hono";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function getClientKey(ip: string, scope: string): string {
  return `${scope}:${ip}`;
}

function getClientIp(header: string | undefined): string {
  if (!header) return "unknown";
  return header.split(",")[0]?.trim() || "unknown";
}

export function createRateLimit(options: {
  scope: string;
  windowMs: number;
  limit: number;
}): MiddlewareHandler {
  return async (c, next) => {
    const ip = getClientIp(c.req.header("x-forwarded-for"));
    const now = Date.now();
    const key = getClientKey(ip, options.scope);
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    if (current.count >= options.limit) {
      const retryAfterSec = Math.ceil((current.resetAt - now) / 1000);
      c.header("Retry-After", String(retryAfterSec));
      return c.json(
        { error: "Rate limit exceeded", scope: options.scope },
        429,
      );
    }

    current.count += 1;
    buckets.set(key, current);
    await next();
  };
}

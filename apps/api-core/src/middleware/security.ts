import type { MiddlewareHandler } from "hono";
import { corsOrigins } from "../lib/env";

export const securityHeaders: MiddlewareHandler = async (c, next) => {
  c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  await next();
};

export const corsAllowlist: MiddlewareHandler = async (c, next) => {
  const origin = c.req.header("origin");
  const hasAllowedOrigin = origin ? corsOrigins.has(origin) : false;

  c.header("Vary", "Origin");
  c.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  c.header("Access-Control-Allow-Credentials", "true");

  if (hasAllowedOrigin && origin) {
    c.header("Access-Control-Allow-Origin", origin);
  }

  if (c.req.method === "OPTIONS") {
    return hasAllowedOrigin || !origin
      ? c.body(null, 204)
      : c.json({ error: "Origin not allowed" }, 403);
  }

  await next();
};

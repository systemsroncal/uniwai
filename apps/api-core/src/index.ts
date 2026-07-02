import "./lib/load-env";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { ZodError } from "zod";
import { env } from "./lib/env";
import { corsAllowlist, securityHeaders } from "./middleware/security";
import { createRateLimit } from "./middleware/rate-limit";
import health from "./routes/health";
import v1 from "./routes/v1";

const app = new Hono();

app.use("*", securityHeaders);
app.use("*", corsAllowlist);
app.use("/health", createRateLimit({ scope: "public-health", windowMs: 60_000, limit: 120 }));
app.use("/api/*", createRateLimit({ scope: "api", windowMs: 60_000, limit: 120 }));
app.route("/health", health);
app.route("/api/v1", v1);

app.onError((error, c) => {
  if (error instanceof ZodError) {
    return c.json(
      {
        error: "Validation error",
        issues: error.flatten(),
      },
      400,
    );
  }
  console.error("[api-core] unhandled error", error);
  return c.json({ error: "Internal server error" }, 500);
});

serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    console.log(`[api-core] listening on http://localhost:${info.port}`);
  }
);


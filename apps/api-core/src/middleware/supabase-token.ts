import type { MiddlewareHandler } from "hono";
import { supabaseAdmin } from "../lib/supabase";
import type { AppBindings } from "../types";

function parseBearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const [type, token] = header.split(" ");
  if (type?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

/** Valida JWT de Supabase sin exigir usuario provisionado en Prisma. */
export const supabaseTokenRequired: MiddlewareHandler<AppBindings> = async (c, next) => {
  const token = parseBearerToken(c.req.header("authorization"));
  if (!token) {
    return c.json({ error: "Missing Bearer token" }, 401);
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  c.set("supabaseUser", {
    id: data.user.id,
    email: data.user.email ?? null,
  });

  await next();
};

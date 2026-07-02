import type { MiddlewareHandler } from "hono";
import { Role } from "@uniwai/shared";
import { prisma } from "@uniwai/database";
import { supabaseAdmin } from "../lib/supabase";
import type { AppBindings } from "../types";

function parseBearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const [type, token] = header.split(" ");
  if (type?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export const authRequired: MiddlewareHandler<AppBindings> = async (c, next) => {
  const token = parseBearerToken(c.req.header("authorization"));
  if (!token) {
    return c.json({ error: "Missing Bearer token" }, 401);
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  const appUser = await prisma.user.findFirst({
    where: { authUserId: data.user.id, isActive: true },
    select: { id: true, email: true, role: true, tenantId: true },
  });

  if (!appUser) {
    return c.json({ error: "User is not provisioned in UniWai CRM" }, 403);
  }

  c.set("authUser", {
    id: appUser.id,
    email: appUser.email,
    role: appUser.role as Role,
    tenantId: appUser.tenantId,
  });

  await next();
};

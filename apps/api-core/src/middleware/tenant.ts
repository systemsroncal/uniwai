import type { MiddlewareHandler } from "hono";
import { Role } from "@uniwai/shared";
import type { AppBindings } from "../types";

export const tenantRequired: MiddlewareHandler<AppBindings> = async (c, next) => {
  const authUser = c.get("authUser");
  if (authUser.role === Role.SUPERADMIN) {
    const impersonate = c.req.header("x-tenant-id");
    if (!impersonate) {
      return c.json(
        { error: "Superadmin debe seleccionar un tenant (header X-Tenant-Id)" },
        403,
      );
    }
    c.set("impersonatedTenantId", impersonate);
    await next();
    return;
  }
  if (!authUser.tenantId) {
    return c.json({ error: "Tenant scope is required" }, 403);
  }
  await next();
};

export function getTenantIdOrThrow(c: {
  get: (key: "authUser" | "impersonatedTenantId") => string | AppBindings["Variables"]["authUser"] | undefined;
}) {
  const authUser = c.get("authUser") as AppBindings["Variables"]["authUser"];
  if (authUser.role === Role.SUPERADMIN) {
    const impersonated = c.get("impersonatedTenantId") as string | undefined;
    if (!impersonated) {
      throw new Error("Superadmin tenant impersonation required");
    }
    return impersonated;
  }
  if (!authUser.tenantId) {
    throw new Error("TenantId is required for this operation");
  }
  return authUser.tenantId;
}

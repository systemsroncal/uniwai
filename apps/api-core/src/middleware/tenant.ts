import type { MiddlewareHandler } from "hono";
import { Role } from "@uniwai/shared";
import type { AppBindings } from "../types";

export const tenantRequired: MiddlewareHandler<AppBindings> = async (c, next) => {
  const authUser = c.get("authUser");
  if (!authUser.tenantId && authUser.role !== Role.SUPERADMIN) {
    return c.json({ error: "Tenant scope is required" }, 403);
  }
  await next();
};

export function getTenantIdOrThrow(c: {
  get: (key: "authUser") => AppBindings["Variables"]["authUser"];
}) {
  const authUser = c.get("authUser");
  if (!authUser.tenantId) {
    throw new Error("TenantId is required for this operation");
  }
  return authUser.tenantId;
}

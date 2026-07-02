import type { MiddlewareHandler } from "hono";
import { hasPermission, Role, type Permission } from "@uniwai/shared";
import type { AppBindings } from "../types";

export function requireRoles(
  ...roles: readonly Role[]
): MiddlewareHandler<AppBindings> {
  return async (c, next) => {
    const authUser = c.get("authUser");
    if (!roles.includes(authUser.role)) {
      return c.json({ error: "Insufficient role" }, 403);
    }
    await next();
  };
}

export function requirePermission(
  permission: Permission,
): MiddlewareHandler<AppBindings> {
  return async (c, next) => {
    const authUser = c.get("authUser");
    if (!hasPermission(authUser.role, permission)) {
      return c.json({ error: "Missing permission" }, 403);
    }
    await next();
  };
}

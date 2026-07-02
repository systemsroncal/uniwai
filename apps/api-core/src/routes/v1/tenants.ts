import { Hono } from "hono";
import { Role } from "@uniwai/shared";
import { prisma } from "@uniwai/database";
import type { AppBindings } from "../../types";

const tenants = new Hono<AppBindings>();

tenants.get("/me", async (c) => {
  const authUser = c.get("authUser");

  if (authUser.role === Role.SUPERADMIN && !authUser.tenantId) {
    return c.json({
      mode: "platform",
      user: authUser,
    });
  }

  if (!authUser.tenantId) {
    return c.json({ error: "Missing tenant scope" }, 403);
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: authUser.tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      timezone: true,
      storeAddress: true,
      storeLat: true,
      storeLng: true,
      createdAt: true,
    },
  });

  if (!tenant) {
    return c.json({ error: "Tenant not found" }, 404);
  }

  return c.json({ tenant, user: authUser });
});

export default tenants;

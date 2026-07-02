import { Hono } from "hono";
import { Permission, Role } from "@uniwai/shared";
import { prisma } from "@uniwai/database";
import type { AppBindings } from "../../types";
import { requirePermission, requireRoles } from "../../middleware/rbac";

const admin = new Hono<AppBindings>();

admin.use("*", requireRoles(Role.SUPERADMIN));
admin.use("*", requirePermission(Permission.VIEW_GLOBAL_STATS));

admin.get("/stats", async (c) => {
  const [tenantCount, activeTenants, userCount, messageCount] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.chatMessage.count(),
  ]);

  return c.json({
    data: {
      tenants: tenantCount,
      activeTenants,
      users: userCount,
      messages: messageCount,
    },
  });
});

admin.get("/tenants", async (c) => {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      createdAt: true,
      _count: { select: { users: true, contacts: true } },
    },
  });
  return c.json({ data: tenants });
});

export default admin;

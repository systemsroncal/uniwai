import { Hono } from "hono";
import { z } from "zod";
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

admin.get("/plans", requirePermission(Permission.MANAGE_PLANS), async (c) => {
  const plans = await prisma.plan.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return c.json({ data: plans });
});

admin.get("/flow-templates", requirePermission(Permission.MANAGE_GLOBAL_FLOW_TEMPLATES), async (c) => {
  const templates = await prisma.flowTemplate.findMany({
    where: { tenantId: null },
    orderBy: { updatedAt: "desc" },
  });
  return c.json({ data: templates });
});

admin.post("/flow-templates", requirePermission(Permission.MANAGE_GLOBAL_FLOW_TEMPLATES), async (c) => {
  const payload = z
    .object({
      name: z.string().min(2).max(120),
      description: z.string().max(2000).optional(),
      category: z.string().max(80).optional(),
      nodes: z.array(z.record(z.string(), z.unknown())).default([]),
      edges: z.array(z.record(z.string(), z.unknown())).default([]),
      isPublic: z.boolean().optional(),
    })
    .parse(await c.req.json());

  const template = await prisma.flowTemplate.create({
    data: {
      tenantId: null,
      name: payload.name,
      description: payload.description,
      category: payload.category,
      nodes: payload.nodes as import("@uniwai/database").Prisma.JsonArray,
      edges: payload.edges as import("@uniwai/database").Prisma.JsonArray,
      isPublic: payload.isPublic ?? true,
    },
  });

  return c.json({ data: template }, 201);
});

admin.patch("/tenants/:tenantId/status", requirePermission(Permission.SUSPEND_TENANT), async (c) => {
  const tenantId = c.req.param("tenantId");
  const body = z
    .object({ status: z.enum(["ACTIVE", "SUSPENDED", "BANNED"]) })
    .parse(await c.req.json());

  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: { status: body.status },
    select: { id: true, name: true, status: true },
  });

  return c.json({ data: tenant });
});

export default admin;

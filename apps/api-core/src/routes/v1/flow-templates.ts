import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "@uniwai/database";
import type { Prisma } from "@uniwai/database";
import { Permission } from "@uniwai/shared";
import type { AppBindings } from "../../types";
import { getTenantIdOrThrow } from "../../middleware/tenant";
import { requirePermission } from "../../middleware/rbac";

const flowTemplates = new Hono<AppBindings>();

const createSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  category: z.string().max(80).optional(),
  nodes: z.array(z.record(z.string(), z.unknown())).default([]),
  edges: z.array(z.record(z.string(), z.unknown())).default([]),
});

flowTemplates.get("/", async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const templates = await prisma.flowTemplate.findMany({
    where: {
      OR: [{ tenantId }, { tenantId: null, isPublic: true }],
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  return c.json({ data: templates });
});

flowTemplates.post("/", requirePermission(Permission.MANAGE_FLOWS), async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const payload = createSchema.parse(await c.req.json());

  const template = await prisma.flowTemplate.create({
    data: {
      tenantId,
      name: payload.name,
      description: payload.description,
      category: payload.category,
      nodes: payload.nodes as Prisma.JsonArray,
      edges: payload.edges as Prisma.JsonArray,
      isPublic: false,
    },
  });

  return c.json({ data: template }, 201);
});

flowTemplates.get("/:templateId", async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const templateId = c.req.param("templateId");
  const template = await prisma.flowTemplate.findFirst({
    where: {
      id: templateId,
      OR: [{ tenantId }, { tenantId: null, isPublic: true }],
    },
  });
  if (!template) return c.json({ error: "Template not found" }, 404);
  return c.json({ data: template });
});

const updateSchema = createSchema.partial();

flowTemplates.patch("/:templateId", requirePermission(Permission.MANAGE_FLOWS), async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const templateId = c.req.param("templateId");
  const payload = updateSchema.parse(await c.req.json());

  const existing = await prisma.flowTemplate.findFirst({
    where: { id: templateId, tenantId },
  });
  if (!existing) return c.json({ error: "Template not found" }, 404);

  const template = await prisma.flowTemplate.update({
    where: { id: templateId },
    data: {
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.description !== undefined ? { description: payload.description } : {}),
      ...(payload.category !== undefined ? { category: payload.category } : {}),
      ...(payload.nodes !== undefined ? { nodes: payload.nodes as Prisma.JsonArray } : {}),
      ...(payload.edges !== undefined ? { edges: payload.edges as Prisma.JsonArray } : {}),
    },
  });
  return c.json({ data: template });
});

export default flowTemplates;

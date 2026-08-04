import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "@uniwai/database";
import type { Prisma } from "@uniwai/database";
import { Permission } from "@uniwai/shared";
import type { AppBindings } from "../../types";
import { getTenantIdOrThrow } from "../../middleware/tenant";
import { requirePermission } from "../../middleware/rbac";
import { generateTextVariants } from "../../services/ai-text";

const botflows = new Hono<AppBindings>();

const createBotFlowSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  nodes: z.array(z.record(z.string(), z.unknown())),
  edges: z.array(z.record(z.string(), z.unknown())),
  isPublished: z.boolean().optional().default(false),
});

botflows.get("/", async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const flows = await prisma.botFlow.findMany({
    where: { tenantId },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
      isPublished: true,
      version: true,
      updatedAt: true,
      createdAt: true,
    },
  });
  return c.json({ data: flows });
});

botflows.post("/", requirePermission(Permission.MANAGE_FLOWS), async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const payload = createBotFlowSchema.parse(await c.req.json());

  const flow = await prisma.botFlow.create({
    data: {
      tenantId,
      name: payload.name,
      description: payload.description,
      nodes: payload.nodes as Prisma.JsonArray,
      edges: payload.edges as Prisma.JsonArray,
      isPublished: payload.isPublished,
    },
  });

  return c.json({ data: flow }, 201);
});

const generateVariantsSchema = z.object({
  prompt: z.string().min(3).max(500),
  provider: z.enum(["openai", "gemini", "deepseek", "nvidia"]).optional(),
  count: z.number().int().min(2).max(8).optional(),
});

botflows.post("/generate-variants", requirePermission(Permission.MANAGE_FLOWS), async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const payload = generateVariantsSchema.parse(await c.req.json());
  try {
    const variants = await generateTextVariants({
      tenantId,
      provider: payload.provider,
      prompt: payload.prompt,
      count: payload.count,
    });
    return c.json({ data: { variants } });
  } catch (err) {
    return c.json(
      { error: err instanceof Error ? err.message : "No se pudo generar con IA" },
      502,
    );
  }
});

const updateBotFlowSchema = createBotFlowSchema.partial().extend({
  isActive: z.boolean().optional(),
});

botflows.patch("/:flowId", requirePermission(Permission.MANAGE_FLOWS), async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const flowId = c.req.param("flowId");
  const payload = updateBotFlowSchema.parse(await c.req.json());

  const existing = await prisma.botFlow.findFirst({ where: { id: flowId, tenantId } });
  if (!existing) return c.json({ error: "Flow not found" }, 404);

  if (payload.isActive === true) {
    await prisma.botFlow.updateMany({
      where: { tenantId, id: { not: flowId } },
      data: { isActive: false },
    });
  }

  const flow = await prisma.botFlow.update({
    where: { id: flowId },
    data: {
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.description !== undefined ? { description: payload.description } : {}),
      ...(payload.nodes !== undefined ? { nodes: payload.nodes as Prisma.JsonArray } : {}),
      ...(payload.edges !== undefined ? { edges: payload.edges as Prisma.JsonArray } : {}),
      ...(payload.isPublished !== undefined ? { isPublished: payload.isPublished } : {}),
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
      version: existing.version + (payload.nodes || payload.edges ? 1 : 0),
    },
  });

  return c.json({ data: flow });
});

botflows.delete("/:flowId", requirePermission(Permission.MANAGE_FLOWS), async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const flowId = c.req.param("flowId");

  const existing = await prisma.botFlow.findFirst({ where: { id: flowId, tenantId } });
  if (!existing) return c.json({ error: "Flow not found" }, 404);

  await prisma.botFlow.delete({ where: { id: flowId } });
  return c.json({ data: { ok: true } });
});

botflows.get("/:flowId", async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const flowId = c.req.param("flowId");

  const flow = await prisma.botFlow.findFirst({
    where: { id: flowId, tenantId },
  });

  if (!flow) return c.json({ error: "Flow not found" }, 404);
  return c.json({ data: flow });
});

export default botflows;

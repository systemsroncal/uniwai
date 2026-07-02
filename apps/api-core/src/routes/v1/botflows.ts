import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "@uniwai/database";
import type { Prisma } from "@uniwai/database";
import { Permission } from "@uniwai/shared";
import type { AppBindings } from "../../types";
import { getTenantIdOrThrow } from "../../middleware/tenant";
import { requirePermission } from "../../middleware/rbac";

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

export default botflows;

import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "@uniwai/database";
import { Permission } from "@uniwai/shared";
import type { AppBindings } from "../../types";
import { getTenantIdOrThrow } from "../../middleware/tenant";
import { requirePermission } from "../../middleware/rbac";

const products = new Hono<AppBindings>();

products.use("*", requirePermission(Permission.MANAGE_TENANT_SETTINGS));

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  price: z.number().positive(),
  currency: z.string().length(3).default("PEN"),
  sku: z.string().max(80).optional(),
  imageUrl: z.string().url().optional(),
  source: z.enum(["SHEETS", "WA_CATALOG"]).default("SHEETS"),
});

products.get("/", async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const list = await prisma.product.findMany({
    where: { tenantId, isActive: true },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  return c.json({ data: list });
});

products.post("/", async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const payload = createSchema.parse(await c.req.json());

  const product = await prisma.product.create({
    data: {
      tenantId,
      name: payload.name,
      description: payload.description,
      price: payload.price,
      currency: payload.currency,
      sku: payload.sku,
      imageUrl: payload.imageUrl,
      source: payload.source,
    },
  });

  return c.json({ data: product }, 201);
});

export default products;

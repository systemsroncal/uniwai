import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "@uniwai/database";
import { Permission } from "@uniwai/shared";
import type { AppBindings } from "../../types";
import { getTenantIdOrThrow } from "../../middleware/tenant";
import { requirePermission } from "../../middleware/rbac";

const orders = new Hono<AppBindings>();

orders.use("*", requirePermission(Permission.MANAGE_TENANT_SETTINGS));

orders.get("/", async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const list = await prisma.order.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      contact: { select: { id: true, name: true, phone: true } },
    },
  });
  return c.json({ data: list });
});

orders.patch("/:orderId/status", async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const orderId = c.req.param("orderId");
  const body = z.object({ status: z.enum(["DRAFT", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]) }).parse(await c.req.json());

  const updated = await prisma.order.updateMany({
    where: { id: orderId, tenantId },
    data: { status: body.status },
  });
  if (!updated.count) return c.json({ error: "Order not found" }, 404);
  return c.json({ data: { ok: true } });
});

export default orders;

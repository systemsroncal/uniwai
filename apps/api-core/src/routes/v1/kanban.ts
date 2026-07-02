import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "@uniwai/database";
import type { AppBindings } from "../../types";
import { getTenantIdOrThrow } from "../../middleware/tenant";

const kanban = new Hono<AppBindings>();

const moveContactSchema = z.object({
  kanbanColumnId: z.string().min(1),
});

const defaultColumns = [
  { name: "Lead", position: 0, color: "#64748b", isDefault: true },
  { name: "Contactado", position: 1, color: "#0ea5e9", isDefault: true },
  { name: "Negociación", position: 2, color: "#8b5cf6", isDefault: true },
  { name: "Cierre", position: 3, color: "#10b981", isDefault: true },
] as const;

kanban.get("/columns", async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const columns = await prisma.kanbanColumn.findMany({
    where: { tenantId },
    orderBy: { position: "asc" },
    select: {
      id: true,
      name: true,
      position: true,
      color: true,
      isDefault: true,
      contacts: {
        orderBy: { updatedAt: "desc" },
        take: 50,
        select: {
          id: true,
          phone: true,
          name: true,
          botEnabled: true,
          lastMessageAt: true,
          updatedAt: true,
        },
      },
      _count: { select: { contacts: true } },
    },
  });
  return c.json({ data: columns });
});

kanban.patch("/contacts/:contactId/move", async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const contactId = c.req.param("contactId");
  const payload = moveContactSchema.parse(await c.req.json());

  const column = await prisma.kanbanColumn.findFirst({
    where: { id: payload.kanbanColumnId, tenantId },
    select: { id: true },
  });
  if (!column) {
    return c.json({ error: "Column not found" }, 404);
  }

  const updated = await prisma.contact.updateMany({
    where: { id: contactId, tenantId },
    data: { kanbanColumnId: column.id },
  });

  if (updated.count === 0) {
    return c.json({ error: "Contact not found" }, 404);
  }

  return c.json({ data: { contactId, kanbanColumnId: column.id } });
});

kanban.post("/bootstrap", async (c) => {
  const tenantId = getTenantIdOrThrow(c);

  const existing = await prisma.kanbanColumn.count({ where: { tenantId } });
  if (existing > 0) {
    return c.json({ data: { created: 0, reason: "already_initialized" } });
  }

  const created = await prisma.$transaction(
    defaultColumns.map((col) =>
      prisma.kanbanColumn.create({
        data: { tenantId, ...col },
        select: { id: true, name: true, position: true },
      }),
    ),
  );

  return c.json({ data: { created: created.length, columns: created } }, 201);
});

export default kanban;

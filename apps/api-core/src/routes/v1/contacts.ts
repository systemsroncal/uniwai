import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "@uniwai/database";
import type { AppBindings } from "../../types";
import { getTenantIdOrThrow } from "../../middleware/tenant";
import { getFlowStore, flowContactKey } from "../../lib/flow-store";

const contacts = new Hono<AppBindings>();

const createContactSchema = z.object({
  phone: z.string().min(6),
  name: z.string().min(1).max(120).optional(),
  email: z.string().email().optional(),
  tags: z.array(z.string().min(1)).optional(),
});

const toggleBotSchema = z.object({
  enabled: z.boolean(),
  currentNodeId: z.string().min(1).max(120).optional(),
});

contacts.get("/", async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const contactsList = await prisma.contact.findMany({
    where: { tenantId },
    take: 100,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      phone: true,
      name: true,
      email: true,
      tags: true,
      botEnabled: true,
      currentNodeId: true,
      lastMessageAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return c.json({ data: contactsList });
});

contacts.post("/", async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const payload = createContactSchema.parse(await c.req.json());

  const contact = await prisma.contact.create({
    data: {
      tenantId,
      phone: payload.phone,
      name: payload.name,
      email: payload.email,
      tags: payload.tags ?? [],
    },
  });

  return c.json({ data: contact }, 201);
});

contacts.patch("/:contactId/bot-toggle", async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const contactId = c.req.param("contactId");
  const payload = toggleBotSchema.parse(await c.req.json());

  const existing = await prisma.contact.findFirst({
    where: { id: contactId, tenantId },
    select: { id: true, currentNodeId: true },
  });

  if (!existing) {
    return c.json({ error: "Contact not found" }, 404);
  }

  const updated = await prisma.contact.update({
    where: { id: existing.id },
    data: {
      botEnabled: payload.enabled,
      currentNodeId: payload.currentNodeId ?? existing.currentNodeId,
    },
    select: {
      id: true,
      botEnabled: true,
      currentNodeId: true,
      updatedAt: true,
    },
  });

  const flowStore = await getFlowStore();
  const key = flowContactKey(updated.id);

  if (updated.currentNodeId) {
    await flowStore.set(key, updated.currentNodeId);
  } else {
    await flowStore.del(key);
  }

  return c.json({ data: updated });
});

contacts.get("/:contactId/flow-resume", async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const contactId = c.req.param("contactId");

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, tenantId },
    select: {
      id: true,
      botEnabled: true,
      currentNodeId: true,
      activeBotFlowId: true,
      flowState: true,
    },
  });

  if (!contact) {
    return c.json({ error: "Contact not found" }, 404);
  }

  const flowStore = await getFlowStore();
  const key = flowContactKey(contact.id);
  const redisNodeId = await flowStore.get(key);

  return c.json({
    data: {
      contactId: contact.id,
      botEnabled: contact.botEnabled,
      activeBotFlowId: contact.activeBotFlowId,
      currentNodeId: redisNodeId ?? contact.currentNodeId,
      source: redisNodeId ? "redis" : "db",
      flowState: contact.flowState,
    },
  });
});

export default contacts;

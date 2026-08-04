import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "@uniwai/database";
import { normalizeE164, isValidE164 } from "@uniwai/shared";
import type { AppBindings } from "../../types";
import { getTenantIdOrThrow } from "../../middleware/tenant";
import { getFlowStore, flowContactKey } from "../../lib/flow-store";
import { enqueueOutbound } from "../../lib/redis";
const contacts = new Hono<AppBindings>();

const sendMessageSchema = z.object({
  content: z.string().min(1).max(4096),
});

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

const updateContactSchema = z.object({
  phone: z.string().min(6).optional(),
  name: z.string().min(1).max(120).nullable().optional(),
  email: z.string().email().nullable().optional(),
});

contacts.get("/inbox-status", async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const instances = await prisma.whatsAppInstance.findMany({
    where: { tenantId },
    orderBy: { lastConnectedAt: "desc" },
    select: {
      id: true,
      label: true,
      phoneNumber: true,
      status: true,
      lastConnectedAt: true,
    },
  });
  const connected = instances.filter((i) => i.status === "CONNECTED");
  return c.json({
    data: {
      connectedCount: connected.length,
      instances,
    },
  });
});

contacts.get("/", async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const instanceFilter = c.req.query("instanceId");

  const contactsList = await prisma.contact.findMany({
    where: {
      tenantId,
      ...(instanceFilter ? { whatsAppInstanceId: instanceFilter } : {}),
    },
    take: 200,
    orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      phone: true,
      name: true,
      email: true,
      tags: true,
      botEnabled: true,
      currentNodeId: true,
      lastMessageAt: true,
      whatsAppInstanceId: true,
      createdAt: true,
      updatedAt: true,
      chatMessages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          content: true,
          direction: true,
          createdAt: true,
          status: true,
        },
      },
    },
  });

  const data = contactsList.map(({ chatMessages, ...contact }) => ({
    ...contact,
    lastMessage: chatMessages[0] ?? null,
  }));

  return c.json({ data });
});

contacts.post("/", async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const payload = createContactSchema.parse(await c.req.json());
  const phone = normalizeE164(payload.phone);
  if (!isValidE164(phone)) {
    return c.json({ error: "Teléfono inválido. Usa formato internacional (+51…)" }, 400);
  }

  const waInstance = await prisma.whatsAppInstance.findFirst({
    where: { tenantId, status: "CONNECTED" },
    orderBy: { lastConnectedAt: "desc" },
    select: { id: true },
  });

  const contact = await prisma.contact.create({
    data: {
      tenantId,
      phone,
      name: payload.name,
      email: payload.email,
      tags: payload.tags ?? [],
      whatsAppInstanceId: waInstance?.id,
    },
  });

  return c.json({ data: contact }, 201);
});

contacts.patch("/:contactId", async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const contactId = c.req.param("contactId");
  const payload = updateContactSchema.parse(await c.req.json());

  const existing = await prisma.contact.findFirst({
    where: { id: contactId, tenantId },
    select: { id: true },
  });
  if (!existing) return c.json({ error: "Contact not found" }, 404);

  const data: {
    phone?: string;
    name?: string | null;
    email?: string | null;
  } = {};

  if (payload.phone !== undefined) {
    const phone = normalizeE164(payload.phone);
    if (!isValidE164(phone)) {
      return c.json({ error: "Teléfono inválido. Usa formato internacional (+51…)" }, 400);
    }
    const conflict = await prisma.contact.findFirst({
      where: { tenantId, phone, NOT: { id: contactId } },
      select: { id: true },
    });
    if (conflict) {
      return c.json({ error: "Ya existe otro contacto con ese número" }, 409);
    }
    data.phone = phone;
  }

  if (payload.name !== undefined) data.name = payload.name;
  if (payload.email !== undefined) data.email = payload.email;

  if (Object.keys(data).length === 0) {
    return c.json({ error: "Nada que actualizar" }, 400);
  }

  const updated = await prisma.contact.update({
    where: { id: existing.id },
    data,
    select: {
      id: true,
      phone: true,
      name: true,
      email: true,
      tags: true,
      botEnabled: true,
      currentNodeId: true,
      lastMessageAt: true,
      whatsAppInstanceId: true,
      updatedAt: true,
    },
  });

  return c.json({ data: updated });
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

contacts.get("/:contactId/messages", async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const contactId = c.req.param("contactId");

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, tenantId },
    select: { id: true },
  });
  if (!contact) return c.json({ error: "Contact not found" }, 404);

  const messages = await prisma.chatMessage.findMany({
    where: { tenantId, contactId },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: {
      id: true,
      direction: true,
      status: true,
      content: true,
      mediaUrl: true,
      createdAt: true,
      sentAt: true,
    },
  });

  return c.json({ data: messages });
});

contacts.post("/:contactId/messages", async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const contactId = c.req.param("contactId");
  const payload = sendMessageSchema.parse(await c.req.json());

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, tenantId },
    select: { id: true, phone: true, whatsAppInstanceId: true },
  });
  if (!contact) return c.json({ error: "Contact not found" }, 404);

  const phone = normalizeE164(contact.phone);
  if (!isValidE164(phone)) {
    return c.json({ error: "Teléfono del contacto inválido. Edita el contacto con formato +51…" }, 400);
  }

  let instanceId = contact.whatsAppInstanceId;
  if (!instanceId) {
    const wa = await prisma.whatsAppInstance.findFirst({
      where: { tenantId, status: "CONNECTED", connectionType: "BAILEYS" },
      orderBy: { lastConnectedAt: "desc" },
      select: { id: true },
    });
    instanceId = wa?.id ?? null;
    if (wa) {
      await prisma.contact.update({
        where: { id: contact.id },
        data: { whatsAppInstanceId: wa.id, phone },
      });
    }
  }

  if (!instanceId) {
    return c.json(
      { error: "No hay WhatsApp conectado. Ve a WhatsApp y vincula un número." },
      503,
    );
  }

  const message = await prisma.chatMessage.create({
    data: {
      tenantId,
      contactId: contact.id,
      whatsAppInstanceId: instanceId,
      direction: "OUTBOUND",
      status: "PENDING",
      content: payload.content,
      sentAt: new Date(),
    },
  });

  await prisma.contact.update({
    where: { id: contact.id },
    data: { lastMessageAt: new Date(), phone },
  });

  const queued = await enqueueOutbound({
    instanceId,
    phone,
    text: payload.content,
    messageId: message.id,
  });

  if (!queued) {
    const failed = await prisma.chatMessage.update({
      where: { id: message.id },
      data: { status: "FAILED" },
    });
    return c.json(
      {
        data: failed,
        meta: {
          queued: false,
          hint: "Worker o Redis no disponible. Ejecuta: bun run stack:probar --sin-worker y luego inicia el worker.",
        },
      },
      201,
    );
  }

  return c.json({ data: message, meta: { queued: true } }, 201);
});

contacts.delete("/:contactId", async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const contactId = c.req.param("contactId");

  const existing = await prisma.contact.findFirst({
    where: { id: contactId, tenantId },
    select: { id: true },
  });
  if (!existing) return c.json({ error: "Contact not found" }, 404);

  try {
    await prisma.$transaction([
      prisma.order.deleteMany({ where: { contactId: existing.id, tenantId } }),
      prisma.contact.delete({ where: { id: existing.id } }),
    ]);
    return c.json({ data: { ok: true } });
  } catch (err) {
    console.error("[contacts] DELETE failed:", err);
    return c.json(
      { error: "No se pudo eliminar el contacto. Puede tener datos vinculados." },
      500,
    );
  }
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

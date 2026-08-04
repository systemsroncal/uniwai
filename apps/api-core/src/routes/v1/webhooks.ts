import { Hono } from "hono";
import { prisma } from "@uniwai/database";
import type { AppBindings } from "../../types";

const webhooks = new Hono<AppBindings>();

webhooks.get("/meta", async (c) => {
  const mode = c.req.query("hub.mode");
  const token = c.req.query("hub.verify_token");
  const challenge = c.req.query("hub.challenge");
  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN?.trim();

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return c.text(challenge);
  }
  return c.json({ error: "Forbidden" }, 403);
});

webhooks.post("/meta", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") return c.json({ ok: true });

  const entry = (body as { entry?: unknown[] }).entry?.[0] as {
    changes?: Array<{ value?: { metadata?: { phone_number_id?: string }; messages?: unknown[] } }>;
  } | undefined;

  const change = entry?.changes?.[0]?.value;
  const phoneNumberId = change?.metadata?.phone_number_id;
  const messages = change?.messages as Array<{
    from: string;
    id: string;
    text?: { body: string };
  }> | undefined;

  if (phoneNumberId && messages?.length) {
    const instance = await prisma.whatsAppInstance.findFirst({
      where: { metaPhoneNumberId: phoneNumberId },
    });

    if (instance?.tenantId) {
      for (const msg of messages) {
        const phone = `+${msg.from}`;
        const text = msg.text?.body ?? "";
        if (!text) continue;

        const contact = await prisma.contact.upsert({
          where: { tenantId_phone: { tenantId: instance.tenantId, phone } },
          create: {
            tenantId: instance.tenantId,
            whatsAppInstanceId: instance.id,
            phone,
            lastMessageAt: new Date(),
          },
          update: { lastMessageAt: new Date() },
        });

        await prisma.chatMessage.create({
          data: {
            tenantId: instance.tenantId,
            contactId: contact.id,
            whatsAppInstanceId: instance.id,
            direction: "INBOUND",
            status: "DELIVERED",
            content: text,
            whatsAppMessageId: msg.id,
            sentAt: new Date(),
          },
        });
      }
    }
  }

  return c.json({ ok: true });
});

export default webhooks;

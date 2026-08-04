import { prisma } from "@uniwai/database";

const META_GRAPH = "https://graph.facebook.com/v21.0";

export type MetaSendResult = { ok: boolean; messageId?: string; error?: string };

export async function sendMetaCloudText(
  instanceId: string,
  phone: string,
  text: string,
): Promise<MetaSendResult> {
  const instance = await prisma.whatsAppInstance.findUnique({ where: { id: instanceId } });
  if (!instance?.metaPhoneNumberId) {
    return { ok: false, error: "Meta phone number ID no configurado" };
  }

  const token = process.env.META_WHATSAPP_TOKEN?.trim();
  if (!token) {
    console.warn("[meta] META_WHATSAPP_TOKEN no definido — modo simulación");
    return { ok: true, messageId: `sim-${Date.now()}` };
  }

  const to = phone.replace(/\D/g, "");
  const res = await fetch(`${META_GRAPH}/${instance.metaPhoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return { ok: false, error: errText };
  }

  const json = (await res.json()) as { messages?: Array<{ id: string }> };
  return { ok: true, messageId: json.messages?.[0]?.id };
}

export async function verifyMetaWebhook(
  mode: string,
  token: string,
  challenge: string,
): Promise<string | null> {
  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN?.trim();
  if (mode === "subscribe" && token === verifyToken) return challenge;
  return null;
}

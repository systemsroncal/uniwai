/** Normaliza a E.164 (+51987654321). Acepta dígitos con o sin +. */
export function normalizeE164(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  return trimmed.startsWith("+") ? `+${digits}` : `+${digits}`;
}

export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone.replace(/\s/g, ""));
}

/** Convierte JID de WhatsApp (519...@s.whatsapp.net) a E.164. Ignora grupos/broadcast/LID. */
export function jidToE164(jid: string | undefined | null, altJid?: string | null): string | null {
  const candidates = [jid, altJid].filter(Boolean) as string[];
  for (const candidate of candidates) {
    if (
      candidate.endsWith("@g.us") ||
      candidate.endsWith("@lid") ||
      candidate === "status@broadcast"
    ) {
      continue;
    }
    const userPart = candidate.split("@")[0]?.split(":")[0] ?? "";
    if (/^\d{8,15}$/.test(userPart)) {
      return `+${userPart}`;
    }
  }
  return null;
}

/** JID de destino para enviar mensaje vía Baileys. */
export function e164ToWhatsAppJid(phone: string): string {
  return `${phone.replace(/\D/g, "")}@s.whatsapp.net`;
}

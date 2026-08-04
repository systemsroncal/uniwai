import { jidToE164 } from "@uniwai/shared";

/** Mapeo LID (@lid) → JID con número real (@s.whatsapp.net). */
const lidToPhoneJid = new Map<string, string>();

function normalizeJid(jid: string): string {
  return jid.trim().toLowerCase();
}

export function registerLidPhoneJid(lidJid: string, phoneJid: string): void {
  const lid = normalizeJid(lidJid);
  const phone = normalizeJid(phoneJid);
  if (!lid.endsWith("@lid") || !phone.includes("@")) return;
  lidToPhoneJid.set(lid, phone);
}

export function registerWaContact(contact: { id: string; lid?: string }): void {
  if (contact.lid && contact.id) {
    registerLidPhoneJid(contact.lid, contact.id);
  }
}

export function resolveMessagePhone(
  remoteJid: string | undefined | null,
  participant?: string | null,
): string | null {
  if (!remoteJid) return null;

  const direct = jidToE164(remoteJid, participant);
  if (direct) return direct;

  if (remoteJid.endsWith("@lid")) {
    const mapped = lidToPhoneJid.get(normalizeJid(remoteJid));
    if (mapped) return jidToE164(mapped);
  }

  return null;
}

/** Revisa todos los JIDs del key del mensaje (incl. campos alt de Baileys). */
export function resolveMessagePhoneFromKey(key: {
  remoteJid?: string | null;
  participant?: string | null;
}): string | null {
  const jids = new Set<string>();
  const record = key as Record<string, unknown>;
  for (const value of Object.values(record)) {
    if (typeof value === "string" && value.includes("@")) {
      jids.add(value);
    }
  }
  for (const jid of jids) {
    const phone = jidToE164(jid);
    if (phone) return phone;
  }
  return resolveMessagePhone(key.remoteJid, key.participant);
}

export function isBrokenPhone(phone: string): boolean {
  return phone.includes("@lid") || phone.includes("@g.us");
}

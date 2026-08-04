import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  type WASocket,
  type WAMessage,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import type Redis from "ioredis";
import { prisma } from "@uniwai/database";
import { e164ToWhatsAppJid, jidToE164 } from "@uniwai/shared";
import { WA_QR_PREFIX, WA_QR_TTL_SEC } from "../redis.js";
import { runFlowForInbound } from "../flow-executor.js";
import { extractWhatsAppText } from "../lib/message-text.js";
import {
  registerLidPhoneJid,
  registerWaContact,
  resolveMessagePhoneFromKey,
} from "../lib/lid-phone-map.js";

const SESSIONS_DIR = process.env.WA_SESSIONS_DIR ?? join(process.cwd(), "data", "sessions");
const RECONNECT_MS = 8000;

export type BaileysSession = {
  instanceId: string;
  socket: WASocket;
};

const activeSessions = new Map<string, BaileysSession>();
const connecting = new Set<string>();
const reconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function getBaileysSession(instanceId: string): BaileysSession | undefined {
  return activeSessions.get(instanceId);
}

export function isBaileysSessionActive(instanceId: string): boolean {
  return activeSessions.has(instanceId) || connecting.has(instanceId);
}

function clearReconnectTimer(instanceId: string): void {
  const t = reconnectTimers.get(instanceId);
  if (t) {
    clearTimeout(t);
    reconnectTimers.delete(instanceId);
  }
}

function scheduleReconnect(instanceId: string, redis: Redis, delayMs = RECONNECT_MS): void {
  clearReconnectTimer(instanceId);
  const timer = setTimeout(() => {
    reconnectTimers.delete(instanceId);
    void connectBaileysInstance(instanceId, redis);
  }, delayMs);
  reconnectTimers.set(instanceId, timer);
}

async function persistInboundMessage(params: {
  tenantId: string;
  instanceId: string;
  phone: string;
  text: string;
  pushName?: string | null;
  whatsAppMessageId?: string | null;
  fromMe: boolean;
}): Promise<string | null> {
  if (params.whatsAppMessageId) {
    const dup = await prisma.chatMessage.findFirst({
      where: { whatsAppMessageId: params.whatsAppMessageId },
      select: { contactId: true },
    });
    if (dup) return dup.contactId;
  }

  // Solo enlaza el eco de Baileys con un OUTBOUND del CRM aún sin whatsAppMessageId.
  if (params.fromMe && params.whatsAppMessageId) {
    const recentOutbound = await prisma.chatMessage.findFirst({
      where: {
        tenantId: params.tenantId,
        direction: "OUTBOUND",
        content: params.text,
        whatsAppMessageId: null,
        createdAt: { gte: new Date(Date.now() - 90_000) },
        contact: { tenantId: params.tenantId, phone: params.phone },
      },
      select: { id: true, contactId: true },
      orderBy: { createdAt: "desc" },
    });
    if (recentOutbound) {
      await prisma.chatMessage.update({
        where: { id: recentOutbound.id },
        data: { whatsAppMessageId: params.whatsAppMessageId, status: "SENT" },
      });
      await prisma.contact.update({
        where: { id: recentOutbound.contactId },
        data: { lastMessageAt: new Date() },
      });
      return recentOutbound.contactId;
    }
  }

  const contact = await prisma.contact.upsert({
    where: { tenantId_phone: { tenantId: params.tenantId, phone: params.phone } },
    create: {
      tenantId: params.tenantId,
      whatsAppInstanceId: params.instanceId,
      phone: params.phone,
      name: params.pushName ?? null,
      lastMessageAt: new Date(),
    },
    update: {
      lastMessageAt: new Date(),
      whatsAppInstanceId: params.instanceId,
      ...(params.pushName ? { name: params.pushName } : {}),
    },
  });

  await prisma.chatMessage.create({
    data: {
      tenantId: params.tenantId,
      contactId: contact.id,
      whatsAppInstanceId: params.instanceId,
      direction: params.fromMe ? "OUTBOUND" : "INBOUND",
      status: params.fromMe ? "SENT" : "DELIVERED",
      content: params.text,
      whatsAppMessageId: params.whatsAppMessageId,
      sentAt: new Date(),
    },
  });

  return contact.id;
}

async function resolvePhoneForMessage(
  socket: WASocket,
  msg: WAMessage,
): Promise<string | null> {
  let phone = resolveMessagePhoneFromKey(msg.key);
  if (phone) return phone;

  const remoteJid = msg.key.remoteJid;
  if (remoteJid?.endsWith("@lid")) {
    const lidUser = remoteJid.split("@")[0]?.split(":")[0];
    if (lidUser) {
      try {
        const onWa = await socket.onWhatsApp(lidUser);
        const jid = onWa?.[0]?.jid;
        if (jid) {
          registerLidPhoneJid(remoteJid, jid);
          phone = jidToE164(jid);
          if (phone) return phone;
        }
      } catch {
        /* onWhatsApp puede fallar con LID sin mapear */
      }
    }
  }

  return null;
}

async function handleIncomingMessage(
  instanceId: string,
  tenantId: string,
  socket: WASocket,
  msg: WAMessage,
): Promise<void> {
  const phone = await resolvePhoneForMessage(socket, msg);
  if (!phone) {
    console.warn(
      "[baileys] JID sin teléfono resoluble:",
      msg.key.remoteJid,
      "fromMe=",
      Boolean(msg.key.fromMe),
    );
    return;
  }

  const text = extractWhatsAppText(msg.message);
  if (!text) {
    console.warn(
      "[baileys] Mensaje sin texto extraíble:",
      msg.key.id,
      "fromMe=",
      Boolean(msg.key.fromMe),
    );
    return;
  }

  const fromMe = Boolean(msg.key.fromMe);
  const contactId = await persistInboundMessage({
    tenantId,
    instanceId,
    phone,
    text,
    pushName: msg.pushName,
    whatsAppMessageId: msg.key.id,
    fromMe,
  });

  if (!fromMe && contactId) {
    await runFlowForInbound({
      tenantId,
      contactId,
      instanceId,
      phone,
      text,
    }).catch((err) => console.error("[flow]", err));
  }
}

function bindSocketEvents(
  instanceId: string,
  tenantId: string,
  socket: WASocket,
  redis: Redis,
  instancePhone: string | null,
): void {
  socket.ev.on("contacts.upsert", (contacts) => {
    for (const c of contacts) registerWaContact(c);
  });

  socket.ev.on("contacts.update", (contacts) => {
    for (const c of contacts) {
      if (c.id) registerWaContact({ id: c.id, lid: c.lid });
    }
  });

  socket.ev.on("chats.phoneNumberShare", ({ lid, jid }) => {
    registerLidPhoneJid(lid, jid);
    console.log(`[baileys] LID mapeado: ${lid} → ${jid}`);
  });

  socket.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      await redis.setex(
        `${WA_QR_PREFIX}${instanceId}`,
        WA_QR_TTL_SEC,
        JSON.stringify({ qr, updatedAt: Date.now() }),
      );
      await prisma.whatsAppInstance.update({
        where: { id: instanceId },
        data: { status: "QR_PENDING" },
      });
      console.log(`[baileys] QR generado para instancia ${instanceId}`);
    }

    if (connection === "open") {
      clearReconnectTimer(instanceId);
      await redis.del(`${WA_QR_PREFIX}${instanceId}`);
      const phone = socket.user?.id?.split(":")[0];
      const e164 = phone ? jidToE164(`${phone}@s.whatsapp.net`) : instancePhone;
      await prisma.whatsAppInstance.update({
        where: { id: instanceId },
        data: {
          status: "CONNECTED",
          phoneNumber: e164 ?? instancePhone,
          lastConnectedAt: new Date(),
        },
      });
      console.log(`[baileys] Conectado: ${instanceId} (${e164 ?? phone}) tenant=${tenantId}`);
    }

    if (connection === "close") {
      activeSessions.delete(instanceId);
      connecting.delete(instanceId);

      const statusCode = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode;
      const isLoggedOut = statusCode === DisconnectReason.loggedOut;
      const isReplaced = statusCode === DisconnectReason.connectionReplaced;

      await prisma.whatsAppInstance.update({
        where: { id: instanceId },
        data: {
          status: isLoggedOut ? "QR_PENDING" : "DISCONNECTED",
        },
      });

      if (isLoggedOut) {
        console.log(`[baileys] Sesión cerrada (logout) ${instanceId}`);
        return;
      }

      if (isReplaced) {
        console.warn(
          `[baileys] Conflicto (otra sesión activa) ${instanceId} — reintento en 30s. Cierra WhatsApp Web u otras instancias duplicadas.`,
        );
        scheduleReconnect(instanceId, redis, 30_000);
        return;
      }

      console.log(`[baileys] Desconectado ${instanceId} (code ${statusCode}) — reconectando…`);
      scheduleReconnect(instanceId, redis);
    }
  });

  socket.ev.on("messages.upsert", async (m) => {
    if (m.type !== "notify" && m.type !== "append" && m.type !== "prepend") return;
    for (const msg of m.messages) {
      if (!msg.message) continue;
      try {
        await handleIncomingMessage(instanceId, tenantId, socket, msg);
      } catch (err) {
        console.error("[baileys] Error guardando mensaje:", err);
      }
    }
  });
}

export async function connectBaileysInstance(
  instanceId: string,
  redis: Redis,
): Promise<void> {
  if (activeSessions.has(instanceId) || connecting.has(instanceId)) return;

  const instance = await prisma.whatsAppInstance.findUnique({ where: { id: instanceId } });
  if (!instance || instance.connectionType !== "BAILEYS" || !instance.tenantId) return;

  if (instance.status === "BANNED") return;

  connecting.add(instanceId);

  try {
    const sessionPath = join(SESSIONS_DIR, instanceId);
    await mkdir(sessionPath, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const socket = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      browser: ["UniWai CRM", "Chrome", "1.0.0"],
      syncFullHistory: false,
      markOnlineOnConnect: false,
      connectTimeoutMs: 60_000,
      defaultQueryTimeoutMs: 60_000,
    });

    activeSessions.set(instanceId, { instanceId, socket });
    socket.ev.on("creds.update", saveCreds);
    bindSocketEvents(instanceId, instance.tenantId, socket, redis, instance.phoneNumber);
  } catch (err) {
    connecting.delete(instanceId);
    activeSessions.delete(instanceId);
    console.error(`[baileys] Error iniciando ${instanceId}:`, err);
    scheduleReconnect(instanceId, redis, 15_000);
  } finally {
    connecting.delete(instanceId);
  }
}

async function resolveRecipientJid(session: BaileysSession, phone: string): Promise<string | null> {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const onWa = await session.socket.onWhatsApp(digits);
  return onWa?.[0]?.jid ?? e164ToWhatsAppJid(phone);
}

/** Retraso natural tipo humano antes de responder (2–6 s según longitud). */
export function humanTypingDelayMs(textLength = 20, extraSec = 0): number {
  const base = 2000 + Math.random() * 2000;
  const perChar = Math.min(textLength * 30, 2500);
  return Math.min(base + perChar + extraSec * 1000, 8000);
}

async function withComposing(
  socket: WASocket,
  jid: string,
  delayMs: number,
): Promise<void> {
  await socket.sendPresenceUpdate("composing", jid);
  await new Promise((r) => setTimeout(r, delayMs));
}

export async function sendBaileysText(
  instanceId: string,
  phone: string,
  text: string,
): Promise<boolean> {
  const session = activeSessions.get(instanceId);
  if (!session) {
    console.warn(`[baileys] Sin sesión activa para enviar (${instanceId})`);
    return false;
  }

  try {
    const jid = await resolveRecipientJid(session, phone);
    if (!jid) return false;

    await withComposing(session.socket, jid, humanTypingDelayMs(text.length));
    await session.socket.sendMessage(jid, { text });
    await session.socket.sendPresenceUpdate("paused", jid).catch(() => undefined);
    console.log(`[baileys] Enviado ${instanceId} → ${phone}`);
    return true;
  } catch (err) {
    console.error(`[baileys] Error enviando a ${phone}:`, err instanceof Error ? err.message : err);
    return false;
  }
}

export async function sendBaileysMedia(
  instanceId: string,
  phone: string,
  opts: {
    mediaUrl: string;
    mediaType: "image" | "document" | "video";
    caption?: string;
  },
): Promise<boolean> {
  const session = activeSessions.get(instanceId);
  if (!session) {
    console.warn(`[baileys] Sin sesión activa para media (${instanceId})`);
    return false;
  }

  try {
    const jid = await resolveRecipientJid(session, phone);
    if (!jid) return false;

    const res = await fetch(opts.mediaUrl, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) {
      console.error(`[baileys] No se pudo descargar media (${res.status}): ${opts.mediaUrl}`);
      return false;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const caption = opts.caption?.trim() || undefined;
    const delay = humanTypingDelayMs(caption?.length ?? 12, 1);
    await withComposing(session.socket, jid, delay);

    const fileName = opts.mediaUrl.split("/").pop()?.split("?")[0] || "archivo";
    const mimetype = res.headers.get("content-type") || "application/octet-stream";

    if (opts.mediaType === "image") {
      await session.socket.sendMessage(jid, { image: buffer, caption });
    } else if (opts.mediaType === "video") {
      await session.socket.sendMessage(jid, { video: buffer, caption });
    } else {
      await session.socket.sendMessage(jid, {
        document: buffer,
        mimetype,
        fileName,
        caption,
      });
    }

    await session.socket.sendPresenceUpdate("paused", jid).catch(() => undefined);
    console.log(`[baileys] Media enviado ${instanceId} → ${phone} (${opts.mediaType})`);
    return true;
  } catch (err) {
    console.error(`[baileys] Error enviando media a ${phone}:`, err instanceof Error ? err.message : err);
    return false;
  }
}

export async function disconnectBaileys(instanceId: string): Promise<void> {
  clearReconnectTimer(instanceId);
  const session = activeSessions.get(instanceId);
  if (session) {
    await session.socket.logout().catch(() => session.socket.end(undefined));
    activeSessions.delete(instanceId);
  }
  connecting.delete(instanceId);
}

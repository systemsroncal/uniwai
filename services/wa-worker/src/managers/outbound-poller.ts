import type Redis from "ioredis";
import { prisma } from "@uniwai/database";
import { sendBaileysText } from "../adapters/baileys.js";

const WA_OUTBOUND_QUEUE = "wa:outbound";

type OutboundJob = {
  instanceId: string;
  phone: string;
  text: string;
  messageId: string;
};

const POLL_MS = 2000;

export function startOutboundPoller(redis: Redis): void {
  const tick = async () => {
    try {
      const raw = await redis.rpop(WA_OUTBOUND_QUEUE);
      if (!raw) return;

      const job = JSON.parse(raw) as OutboundJob;
      const sent = await sendBaileysText(job.instanceId, job.phone, job.text);

      const updated = await prisma.chatMessage.update({
        where: { id: job.messageId },
        data: { status: sent ? "SENT" : "FAILED" },
      }).catch(() => null);

      if (!sent) {
        console.warn(`[outbound] Falló envío a ${job.phone} (instancia ${job.instanceId})`);
      } else if (updated) {
        console.log(`[outbound] OK → ${job.phone}`);
      }
    } catch (err) {
      console.error("[outbound] Error:", err);
    }
  };

  setInterval(() => void tick(), POLL_MS);
  console.log(`[outbound] Cola activa cada ${POLL_MS}ms`);
}

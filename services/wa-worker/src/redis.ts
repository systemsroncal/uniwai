import Redis from "ioredis";

export const WA_QR_PREFIX = "wa:qr:";
export const WA_QR_TTL_SEC = 120;
export const WA_OUTBOUND_QUEUE = "wa:outbound";

export type OutboundJob = {
  instanceId: string;
  phone: string;
  text: string;
  messageId: string;
};

export function createRedis(): Redis {
  const url = process.env.REDIS_URL?.trim();
  if (!url) throw new Error("REDIS_URL required");
  return new Redis(url, { maxRetriesPerRequest: null });
}

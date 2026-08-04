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

let client: Redis | null = null;

function waitForReady(redis: Redis, timeoutMs = 5_000): Promise<void> {
  if (redis.status === "ready") return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Redis timeout")), timeoutMs);
    const onReady = () => {
      clearTimeout(timer);
      redis.off("error", onError);
      resolve();
    };
    const onError = (err: Error) => {
      clearTimeout(timer);
      redis.off("ready", onReady);
      reject(err);
    };
    redis.once("ready", onReady);
    redis.once("error", onError);
  });
}

export function getRedis(): Redis {
  if (!client) {
    const url = process.env.REDIS_URL?.trim();
    if (!url) {
      throw new Error("REDIS_URL is required");
    }
    client = new Redis(url, {
      maxRetriesPerRequest: 2,
      connectTimeout: 5_000,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: (times) => (times > 8 ? null : Math.min(times * 250, 2_000)),
    });
    client.on("error", (err) => {
      console.warn("[redis]", err.message);
    });
  }
  return client;
}

async function ensureConnected(): Promise<Redis | null> {
  try {
    const redis = getRedis();
    if (redis.status === "wait" || redis.status === "end") {
      await redis.connect();
    } else if (redis.status !== "ready") {
      await waitForReady(redis);
    }
    return redis;
  } catch (err) {
    console.warn("[redis] conexión falló:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function redisGet(key: string): Promise<string | null> {
  const redis = await ensureConnected();
  if (!redis) return null;
  try {
    return await redis.get(key);
  } catch (err) {
    console.warn("[redis] get falló:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function enqueueOutbound(job: OutboundJob): Promise<boolean> {
  const redis = await ensureConnected();
  if (!redis) return false;
  try {
    await redis.lpush(WA_OUTBOUND_QUEUE, JSON.stringify(job));
    return true;
  } catch (err) {
    console.warn("[redis] outbound queue falló:", err instanceof Error ? err.message : err);
    return false;
  }
}

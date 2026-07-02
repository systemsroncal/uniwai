import Redis from "ioredis";

let redis: Redis | null = null;

export function getRedisClient() {
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is required for flow-state operations");
  }

  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });
  }

  return redis;
}

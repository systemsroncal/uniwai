import "./load-env.js";
import { createRedis } from "./redis.js";
import {
  createWarmupQueue,
  createWarmupWorker,
  scheduleWarmupJobs,
} from "./queues/warmup.js";
import { startInstancePoller } from "./managers/instance-poller.js";
import { startOutboundPoller } from "./managers/outbound-poller.js";

function getRedisUrl(): string {
  const redisUrl = process.env.REDIS_URL?.trim();
  if (!redisUrl) {
    throw new Error("Missing REDIS_URL. Set REDIS_URL to start @uniwai/wa-worker.");
  }
  return redisUrl;
}

async function bootstrap(): Promise<void> {
  const redisUrl = getRedisUrl();
  const redis = createRedis();
  const queue = createWarmupQueue(redisUrl);
  const worker = createWarmupWorker(redisUrl);

  worker.on("completed", (job) => {
    console.log(`[worker] OK ${job.name} (${job.id ?? "?"})`);
  });

  worker.on("failed", (job, error) => {
    console.error(`[worker] FAIL ${job?.name}`, error);
  });

  startInstancePoller(redis);
  startOutboundPoller(redis);
  await scheduleWarmupJobs(queue);

  console.log("[wa-worker] Baileys + flujos + outbound + warmup listos.");

  const shutdown = async (signal: "SIGINT" | "SIGTERM"): Promise<void> => {
    console.log(`[wa-worker] ${signal} — cerrando...`);
    await worker.close();
    await queue.close();
    redis.disconnect();
    process.exit(0);
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
}

bootstrap().catch((error) => {
  console.error("[wa-worker] Bootstrap failed:", error);
  process.exit(1);
});

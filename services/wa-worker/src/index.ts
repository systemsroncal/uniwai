import "dotenv/config";
import {
  createWarmupQueue,
  createWarmupWorker,
  WARMUP_SIMULATE_JOB_NAME
} from "./queues/warmup";

function getRedisUrl(): string {
  const redisUrl = process.env.REDIS_URL?.trim();

  if (!redisUrl) {
    throw new Error(
      "Missing REDIS_URL environment variable. Set REDIS_URL to start @uniwai/wa-worker."
    );
  }

  return redisUrl;
}

async function bootstrap(): Promise<void> {
  const redisUrl = getRedisUrl();
  const queue = createWarmupQueue(redisUrl);
  const worker = createWarmupWorker(redisUrl);

  worker.on("completed", (job) => {
    console.log(`[warmup] Job completed: ${job.name} (${job.id ?? "no-id"})`);
  });

  worker.on("failed", (job, error) => {
    console.error(
      `[warmup] Job failed: ${job?.name ?? "unknown"} (${job?.id ?? "no-id"})`,
      error
    );
  });

  await queue.add(
    WARMUP_SIMULATE_JOB_NAME,
    {
      contactId: "demo-contact",
      message: "Hola, este es un warmup simulado."
    },
    {
      removeOnComplete: true,
      removeOnFail: 20
    }
  );

  console.log("[warmup] Worker started and simulation job queued.");

  const shutdown = async (signal: "SIGINT" | "SIGTERM"): Promise<void> => {
    console.log(`[warmup] Received ${signal}, shutting down worker...`);
    await worker.close();
    await queue.close();
    process.exit(0);
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
}

bootstrap().catch((error) => {
  console.error("[warmup] Failed to bootstrap worker:", error);
  process.exit(1);
});

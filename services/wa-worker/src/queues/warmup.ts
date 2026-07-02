import { Queue, Worker, type Job } from "bullmq";
import { waitRandomComposingDelay } from "../utils/typingDelay";
import type { WarmupMessagePayload } from "../adapters/baileys";

export const WARMUP_QUEUE_NAME = "warmup";
export const WARMUP_SIMULATE_JOB_NAME = "warmup:simulate";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createWarmupQueue(redisUrl: string) {
  return new Queue<WarmupMessagePayload>(WARMUP_QUEUE_NAME, {
    connection: { url: redisUrl },
  });
}

async function processWarmupSimulation(job: Job<WarmupMessagePayload>): Promise<void> {
  const { contactId, message } = job.data;
  const cleanMessage = message.trim();
  const charCount = cleanMessage.length;

  console.log(`[warmup] Starting simulation for ${contactId}`);
  console.log(`[warmup] Step 1/4: Open chat for ${contactId}`);
  await sleep(250);

  console.log("[warmup] Step 2/4: Mark typing/composing");
  const typingDelayMs = await waitRandomComposingDelay(charCount || 1);
  console.log(`[warmup] Simulated composing delay: ${typingDelayMs}ms for ${charCount} chars`);

  console.log("[warmup] Step 3/4: Simulate message send");
  await sleep(200);

  console.log("[warmup] Step 4/4: Confirm delivery simulation");
  await sleep(150);

  console.log(`[warmup] Simulation complete for ${contactId}. Message: "${cleanMessage}"`);
}

export function createWarmupWorker(redisUrl: string): Worker<WarmupMessagePayload> {
  return new Worker<WarmupMessagePayload>(
    WARMUP_QUEUE_NAME,
    async (job) => {
      if (job.name !== WARMUP_SIMULATE_JOB_NAME) {
        console.warn(`[warmup] Ignoring unknown job name: ${job.name}`);
        return;
      }

      await processWarmupSimulation(job);
    },
    { connection: { url: redisUrl } }
  );
}

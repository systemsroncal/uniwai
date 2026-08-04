import { createHash } from "node:crypto";
import { Queue, Worker, type Job } from "bullmq";
import { prisma } from "@uniwai/database";
import { waitRandomComposingDelay } from "../utils/typingDelay.js";
import { sendBaileysText, getBaileysSession } from "../adapters/baileys.js";

export const WARMUP_QUEUE_NAME = "warmup";
export const WARMUP_P2P_JOB = "warmup:p2p";
export const WARMUP_SIMULATE_JOB_NAME = "warmup:simulate";

export type WarmupJobPayload = {
  sourceInstanceId?: string;
  contactId?: string;
  message?: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickSpintax(template: string): string {
  return template.replace(/\{([^}]+)\}/g, (_, group: string) => {
    const options = group.split("|");
    return options[Math.floor(Math.random() * options.length)] ?? group;
  });
}

function hashMessage(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

export function createWarmupQueue(redisUrl: string) {
  return new Queue<WarmupJobPayload>(WARMUP_QUEUE_NAME, {
    connection: { url: redisUrl },
  });
}

async function processWarmupP2P(): Promise<void> {
  const configs = await prisma.warmupConfig.findMany({
    where: { isActive: true, joinWarmupNetwork: true },
    include: {
      whatsAppInstance: {
        select: {
          id: true,
          tenantId: true,
          phoneNumber: true,
          status: true,
          isInWarmupNetwork: true,
        },
      },
    },
  });

  if (configs.length < 1) {
    console.log("[warmup-p2p] Sin configs activas en red CRM");
    return;
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  for (const cfg of configs) {
    const source = cfg.whatsAppInstance;
    if (!source?.isInWarmupNetwork) continue;

    const sentToday = await prisma.warmupLog.count({
      where: { sourceInstanceId: source.id, sentAt: { gte: todayStart } },
    });
    if (sentToday >= cfg.dailyMessageLimit) {
      console.log(`[warmup-p2p] Límite diario alcanzado: ${source.id}`);
      continue;
    }

    const templates = Array.isArray(cfg.messageTemplates)
      ? (cfg.messageTemplates as string[])
      : ["Hola, ¿cómo estás?"];
    const template = templates[Math.floor(Math.random() * templates.length)] ?? templates[0];
    const message = pickSpintax(template);

    const manualPhones = cfg.manualDestinationPhones.filter(Boolean);
    let destinationPhone: string | null =
      manualPhones[Math.floor(Math.random() * manualPhones.length)] ?? null;
    let destinationInstanceId: string | null = null;

    if (!destinationPhone) {
      const partner = configs.find((c) => c.whatsAppInstanceId !== source.id);
      destinationPhone = partner?.whatsAppInstance.phoneNumber ?? null;
      destinationInstanceId = partner?.whatsAppInstanceId ?? null;
    }

    if (!destinationPhone) {
      console.log(`[warmup-p2p] Sin destino para ${source.id}`);
      continue;
    }

    const charCount = message.length;
    const composingMs = await waitRandomComposingDelay(charCount || 1);

    let sent = false;
    if (getBaileysSession(source.id)) {
      sent = await sendBaileysText(source.id, destinationPhone, message);
    } else {
      console.log(`[warmup-p2p] Simulando envío ${source.id} → ${destinationPhone}`);
      await sleep(composingMs);
      sent = true;
    }

    if (sent) {
      await prisma.warmupLog.create({
        data: {
          tenantId: source.tenantId,
          sourceInstanceId: source.id,
          destinationInstanceId,
          destinationPhone,
          messageHash: hashMessage(message),
          composingDurationMs: composingMs,
        },
      });
      console.log(`[warmup-p2p] Mensaje registrado ${source.id} → ${destinationPhone}`);
    }
  }
}

async function processWarmupSimulation(job: Job<WarmupJobPayload>): Promise<void> {
  const { contactId, message } = job.data;
  const cleanMessage = (message ?? "").trim();
  const charCount = cleanMessage.length;

  console.log(`[warmup] Simulación para ${contactId}`);
  await sleep(250);
  const typingDelayMs = await waitRandomComposingDelay(charCount || 1);
  console.log(`[warmup] Composing ${typingDelayMs}ms`);
  await sleep(200);
  console.log(`[warmup] Simulación completa: "${cleanMessage}"`);
}

export function createWarmupWorker(redisUrl: string): Worker<WarmupJobPayload> {
  return new Worker<WarmupJobPayload>(
    WARMUP_QUEUE_NAME,
    async (job) => {
      if (job.name === WARMUP_P2P_JOB) {
        await processWarmupP2P();
        return;
      }
      if (job.name === WARMUP_SIMULATE_JOB_NAME) {
        await processWarmupSimulation(job);
        return;
      }
      console.warn(`[warmup] Job desconocido: ${job.name}`);
    },
    { connection: { url: redisUrl } },
  );
}

export async function scheduleWarmupJobs(queue: Queue<WarmupJobPayload>): Promise<void> {
  await queue.add(
    WARMUP_P2P_JOB,
    {},
    {
      repeat: { every: Number(process.env.WARMUP_P2P_INTERVAL_MS ?? 3600000) },
      removeOnComplete: true,
      removeOnFail: 20,
    },
  );

  await queue.add(
    WARMUP_SIMULATE_JOB_NAME,
    { contactId: "healthcheck", message: "Warmup worker OK" },
    { removeOnComplete: true },
  );

  console.log("[warmup] Jobs P2P programados (repeat) + healthcheck");
}

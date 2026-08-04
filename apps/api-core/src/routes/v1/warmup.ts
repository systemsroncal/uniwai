import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "@uniwai/database";
import { Permission } from "@uniwai/shared";
import type { AppBindings } from "../../types";
import { getTenantIdOrThrow } from "../../middleware/tenant";
import { requirePermission } from "../../middleware/rbac";

const warmup = new Hono<AppBindings>();

warmup.use("*", requirePermission(Permission.MANAGE_WARMUP_CONFIG));

function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) return `+${digits}`;
  return `+${digits}`;
}

const upsertSchema = z.object({
  whatsAppInstanceId: z.string().min(1),
  joinWarmupNetwork: z.boolean().optional(),
  manualDestinationPhones: z
    .array(z.string().min(1))
    .optional()
    .transform((arr) =>
      (arr ?? [])
        .map(normalizePhone)
        .filter((p) => p.length >= 9 && /^\+[1-9]\d{7,14}$/.test(p)),
    ),
  messageTemplates: z
    .array(z.string())
    .optional()
    .transform((arr) => (arr ?? []).map((m) => m.trim()).filter(Boolean)),
  dailyMessageLimit: z.coerce.number().int().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
});

warmup.get("/configs", async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const configs = await prisma.warmupConfig.findMany({
    where: { tenantId },
    include: {
      whatsAppInstance: {
        select: { id: true, label: true, phoneNumber: true, status: true, isInWarmupNetwork: true },
      },
    },
  });
  return c.json({ data: configs });
});

warmup.put("/configs", async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const payload = upsertSchema.parse(await c.req.json());

  const instance = await prisma.whatsAppInstance.findFirst({
    where: { id: payload.whatsAppInstanceId, tenantId },
  });
  if (!instance) return c.json({ error: "Instancia WhatsApp no encontrada" }, 404);

  const createData = {
    tenantId,
    whatsAppInstanceId: payload.whatsAppInstanceId,
    joinWarmupNetwork: payload.joinWarmupNetwork ?? false,
    manualDestinationPhones: payload.manualDestinationPhones ?? [],
    messageTemplates: payload.messageTemplates ?? [],
    dailyMessageLimit: payload.dailyMessageLimit ?? 10,
    isActive: payload.isActive ?? true,
  };

  const config = await prisma.warmupConfig.upsert({
    where: { whatsAppInstanceId: payload.whatsAppInstanceId },
    create: createData,
    update: {
      joinWarmupNetwork: createData.joinWarmupNetwork,
      manualDestinationPhones: createData.manualDestinationPhones,
      messageTemplates: createData.messageTemplates,
      dailyMessageLimit: createData.dailyMessageLimit,
      isActive: createData.isActive,
    },
    include: {
      whatsAppInstance: {
        select: { id: true, label: true, phoneNumber: true, status: true },
      },
    },
  });

  if (payload.joinWarmupNetwork !== undefined) {
    await prisma.whatsAppInstance.update({
      where: { id: payload.whatsAppInstanceId },
      data: { isInWarmupNetwork: payload.joinWarmupNetwork },
    });
  }

  return c.json({ data: config });
});

warmup.get("/logs", async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const logs = await prisma.warmupLog.findMany({
    where: { tenantId },
    orderBy: { sentAt: "desc" },
    take: 50,
    select: {
      id: true,
      destinationPhone: true,
      messageHash: true,
      composingDurationMs: true,
      sentAt: true,
    },
  });
  return c.json({ data: logs });
});

export default warmup;

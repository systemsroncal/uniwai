import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "@uniwai/database";
import { Permission } from "@uniwai/shared";
import type { AppBindings } from "../../types";
import { getTenantIdOrThrow } from "../../middleware/tenant";
import { requirePermission } from "../../middleware/rbac";
import { encryptSecret, maskSecret } from "../../lib/crypto";
import { saveTenantAiKeys, type AiProvider } from "../../services/ai-text";

const settings = new Hono<AppBindings>();

const mpSchema = z.object({
  accessToken: z.string().min(10),
  publicKey: z.string().min(10),
});

const aiSchema = z.object({
  defaultProvider: z.enum(["openai", "gemini", "deepseek", "nvidia"]).optional(),
  openaiKey: z.string().optional(),
  geminiKey: z.string().optional(),
  deepseekKey: z.string().optional(),
  nvidiaKey: z.string().optional(),
  googleSheetUrl: z.union([z.string().url(), z.literal("")]).optional(),
  googleSheetGid: z.string().optional(),
});

settings.get("/payments/mercadopago", requirePermission(Permission.MANAGE_MP_CREDENTIALS), async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const config = await prisma.tenantPaymentConfig.findUnique({ where: { tenantId } });
  if (!config) return c.json({ data: { configured: false } });
  return c.json({
    data: {
      configured: true,
      isActive: config.isActive,
      publicKeyPreview: maskSecret(config.encryptedPublicKey),
      lastRotatedAt: config.lastRotatedAt,
    },
  });
});

settings.put("/payments/mercadopago", requirePermission(Permission.MANAGE_MP_CREDENTIALS), async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const payload = mpSchema.parse(await c.req.json());

  const config = await prisma.tenantPaymentConfig.upsert({
    where: { tenantId },
    create: {
      tenantId,
      encryptedAccessToken: encryptSecret(payload.accessToken),
      encryptedPublicKey: encryptSecret(payload.publicKey),
      isActive: true,
      lastRotatedAt: new Date(),
    },
    update: {
      encryptedAccessToken: encryptSecret(payload.accessToken),
      encryptedPublicKey: encryptSecret(payload.publicKey),
      isActive: true,
      lastRotatedAt: new Date(),
    },
  });

  return c.json({
    data: {
      configured: true,
      isActive: config.isActive,
      publicKeyPreview: maskSecret(payload.publicKey),
    },
  });
});

settings.get("/ai", requirePermission(Permission.MANAGE_AI_BYOK), async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const config = await prisma.tenantAiConfig.findUnique({ where: { tenantId } });
  const cfg = config as { googleSheetUrl?: string | null; googleSheetGid?: string | null } | null;
  return c.json({
    data: {
      configured: Boolean(config),
      defaultProvider: config?.defaultProvider ?? "openai",
      hasOpenai: Boolean(config?.encryptedOpenaiKey),
      hasGemini: Boolean(config?.encryptedGeminiKey),
      hasDeepseek: Boolean(config?.encryptedDeepseekKey),
      hasNvidia: Boolean(config?.encryptedNvidiaKey),
      googleSheetUrl: cfg?.googleSheetUrl ?? "",
      googleSheetGid: cfg?.googleSheetGid ?? "0",
    },
  });
});

settings.put("/ai", requirePermission(Permission.MANAGE_AI_BYOK), async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const payload = aiSchema.parse(await c.req.json());
  await saveTenantAiKeys(tenantId, payload);

  if (payload.googleSheetUrl !== undefined || payload.googleSheetGid !== undefined) {
    await prisma.tenantAiConfig.upsert({
      where: { tenantId },
      create: {
        tenantId,
        googleSheetUrl: payload.googleSheetUrl || null,
        googleSheetGid: payload.googleSheetGid ?? "0",
      } as Parameters<typeof prisma.tenantAiConfig.upsert>[0]["create"],
      update: {
        ...(payload.googleSheetUrl !== undefined
          ? { googleSheetUrl: payload.googleSheetUrl || null }
          : {}),
        ...(payload.googleSheetGid !== undefined ? { googleSheetGid: payload.googleSheetGid } : {}),
      } as Parameters<typeof prisma.tenantAiConfig.upsert>[0]["update"],
    });
  }

  return c.json({ data: { ok: true } });
});

export default settings;

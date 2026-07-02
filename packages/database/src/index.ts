import { PrismaClient } from "@prisma/client";

/**
 * Canonical JSON shape for Plan.limits (enforced at app layer via Zod in packages/shared).
 */
export type PlanLimits = {
  maxBots: number;
  maxFlows: number;
  marketingEnabled: boolean;
  marketingMaxPerCampaign: {
    BAILEYS_QR: number;
    META_CLOUD_API: number;
  };
  maxVendedores: number;
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export { PrismaClient };
export * from "@prisma/client";

#!/usr/bin/env node
/**
 * Bootstrap dev: planes + superadmin (Supabase Auth + Prisma).
 * Requiere: supabase start + DATABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { loadEnvLocal } from "./load-env.mjs";

loadEnvLocal();

const prisma = new PrismaClient();

async function waitForDatabase(maxAttempts = 12, delayMs = 5000) {
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log("[bootstrap] Base de datos disponible.");
      return;
    } catch {
      console.warn(`[bootstrap] DB no lista (intento ${i}/${maxAttempts}), reintentando…`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error("DATABASE_URL no responde. Ejecuta: npx supabase start --ignore-health-check");
}

const SUPERADMIN_EMAIL = process.env.DEV_SUPERADMIN_EMAIL ?? "superadmin@uniwai.dev";
const SUPERADMIN_PASSWORD = process.env.DEV_SUPERADMIN_PASSWORD ?? "SuperAdmin123!";

async function seedPlans() {
  const plans = [
    {
      slug: "basico",
      name: "Básico",
      description: "Entrada; sin campañas masivas",
      priceMonthly: 9.99,
      isCustom: false,
      sortOrder: 1,
      limits: {
        maxBots: 1,
        maxFlows: 5,
        marketingEnabled: false,
        marketingMaxPerCampaign: { BAILEYS_QR: 0, META_CLOUD_API: 0 },
        maxVendedores: 0,
      },
    },
    {
      slug: "lite",
      name: "Lite",
      priceMonthly: 14.99,
      isCustom: false,
      sortOrder: 2,
      limits: {
        maxBots: 2,
        maxFlows: 10,
        marketingEnabled: true,
        marketingMaxPerCampaign: { BAILEYS_QR: 499, META_CLOUD_API: 1000 },
        maxVendedores: 2,
      },
    },
    {
      slug: "pro",
      name: "Pro",
      priceMonthly: 24.99,
      isCustom: false,
      sortOrder: 3,
      limits: {
        maxBots: 5,
        maxFlows: 20,
        marketingEnabled: true,
        marketingMaxPerCampaign: { BAILEYS_QR: 499, META_CLOUD_API: 2000 },
        maxVendedores: 5,
      },
    },
    {
      slug: "enterprise",
      name: "Enterprise",
      priceMonthly: 39.99,
      isCustom: false,
      sortOrder: 4,
      limits: {
        maxBots: 10,
        maxFlows: 40,
        marketingEnabled: true,
        marketingMaxPerCampaign: { BAILEYS_QR: 499, META_CLOUD_API: 3000 },
        maxVendedores: 10,
      },
    },
    {
      slug: "custom",
      name: "Custom",
      priceMonthly: null,
      isCustom: true,
      sortOrder: 5,
      limits: {
        maxBots: -1,
        maxFlows: -1,
        marketingEnabled: true,
        marketingMaxPerCampaign: { BAILEYS_QR: 499, META_CLOUD_API: 1000 },
        maxVendedores: -1,
      },
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      create: {
        slug: plan.slug,
        name: plan.name,
        description: plan.description ?? null,
        priceMonthly: plan.priceMonthly,
        currency: "USD",
        limits: plan.limits,
        isCustom: plan.isCustom,
        sortOrder: plan.sortOrder,
        isActive: true,
      },
      update: {
        name: plan.name,
        priceMonthly: plan.priceMonthly,
        limits: plan.limits,
        isActive: true,
      },
    });
  }
  console.log(`[bootstrap] ${plans.length} planes listos.`);
}

async function ensureSuperadmin() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.warn("[bootstrap] Sin SUPABASE_URL/SERVICE_ROLE_KEY; omitiendo superadmin.");
    return;
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let authUserId;

  const existingPrisma = await prisma.user.findUnique({
    where: { email: SUPERADMIN_EMAIL },
  });

  if (existingPrisma?.authUserId) {
    authUserId = existingPrisma.authUserId;
    console.log("[bootstrap] Superadmin Prisma ya existe.");
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASSWORD,
      email_confirm: true,
    });
    if (error && !error.message.includes("already")) {
      const list = await supabase.auth.admin.listUsers();
      const found = list.data.users?.find((u) => u.email === SUPERADMIN_EMAIL);
      if (!found) throw error;
      authUserId = found.id;
    } else if (data.user) {
      authUserId = data.user.id;
    }
  }

  if (!authUserId) {
    console.warn("[bootstrap] No se pudo resolver authUserId del superadmin.");
    return;
  }

  await prisma.user.upsert({
    where: { email: SUPERADMIN_EMAIL },
    create: {
      email: SUPERADMIN_EMAIL,
      authUserId,
      name: "Super Admin",
      role: "SUPERADMIN",
      tenantId: null,
    },
    update: {
      authUserId,
      role: "SUPERADMIN",
      tenantId: null,
      isActive: true,
    },
  });

  console.log(`[bootstrap] Superadmin: ${SUPERADMIN_EMAIL} / ${SUPERADMIN_PASSWORD}`);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error(
      "[bootstrap] DATABASE_URL no definida. Ejecuta: bun run env:sync\n" +
        "[bootstrap] Requiere Docker + bun run supabase:start",
    );
    process.exit(1);
  }

  await waitForDatabase();
  await seedPlans();
  await ensureSuperadmin();
  try {
    const { spawn } = await import("node:child_process");
    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ["scripts/seed-demo.mjs"], {
        stdio: "inherit",
        cwd: process.cwd(),
        env: { ...process.env, SEED_DEMO_SKIP_SAMPLE_DATA: "1" },
      });
      child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`seed-demo exit ${code}`))));
    });
  } catch (err) {
    console.warn("[bootstrap] seed-demo omitido o falló:", err.message);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

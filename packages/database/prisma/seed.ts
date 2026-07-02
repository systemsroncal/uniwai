import { PrismaClient } from "@prisma/client";

type PlanLimits = {
  maxBots: number;
  maxFlows: number;
  marketingEnabled: boolean;
  marketingMaxPerCampaign: {
    BAILEYS_QR: number;
    META_CLOUD_API: number;
  };
  maxVendedores: number;
};

const prisma = new PrismaClient();

const plans: Array<{
  slug: string;
  name: string;
  description: string;
  priceMonthly: number | null;
  isCustom: boolean;
  sortOrder: number;
  limits: PlanLimits;
}> = [
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
    description: "Marketing QR 499 / Meta 1,000 por campaña",
    priceMonthly: 14.99,
    isCustom: false,
    sortOrder: 2,
    limits: {
      maxBots: 2,
      maxFlows: 10,
      marketingEnabled: true,
      marketingMaxPerCampaign: { BAILEYS_QR: 499, META_CLOUD_API: 1000 },
      maxVendedores: 3,
    },
  },
  {
    slug: "pro",
    name: "Pro",
    description: "Marketing QR 499 / Meta 2,000 por campaña",
    priceMonthly: 24.99,
    isCustom: false,
    sortOrder: 3,
    limits: {
      maxBots: 5,
      maxFlows: 20,
      marketingEnabled: true,
      marketingMaxPerCampaign: { BAILEYS_QR: 499, META_CLOUD_API: 2000 },
      maxVendedores: 10,
    },
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    description: "Marketing QR 499 / Meta 3,000 por campaña",
    priceMonthly: 39.99,
    isCustom: false,
    sortOrder: 4,
    limits: {
      maxBots: 10,
      maxFlows: 40,
      marketingEnabled: true,
      marketingMaxPerCampaign: { BAILEYS_QR: 499, META_CLOUD_API: 3000 },
      maxVendedores: 50,
    },
  },
  {
    slug: "custom",
    name: "Custom",
    description: "Contactar ventas — límites negociables",
    priceMonthly: null,
    isCustom: true,
    sortOrder: 5,
    limits: {
      maxBots: 0,
      maxFlows: 0,
      marketingEnabled: true,
      marketingMaxPerCampaign: { BAILEYS_QR: 499, META_CLOUD_API: 1000 },
      maxVendedores: 0,
    },
  },
];

async function main() {
  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      create: {
        slug: plan.slug,
        name: plan.name,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        currency: "USD",
        limits: plan.limits,
        isCustom: plan.isCustom,
        sortOrder: plan.sortOrder,
        isActive: true,
      },
      update: {
        name: plan.name,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        limits: plan.limits,
        isCustom: plan.isCustom,
        sortOrder: plan.sortOrder,
        isActive: true,
      },
    });
  }

  console.log(`Seeded ${plans.length} plans.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

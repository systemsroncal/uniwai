/**
 * Catálogo de planes SaaS UniWai CRM (USD/mes).
 * Límites enforced en api-core antes de crear bot, flujo, campaña o vendedor.
 */

export enum PlanTier {
  BASICO = "BASICO",
  LITE = "LITE",
  PRO = "PRO",
  ENTERPRISE = "ENTERPRISE",
  CUSTOM = "CUSTOM",
}

/** Canal de envío para campañas de marketing masivo. */
export enum MarketingChannel {
  /** WhatsApp Business vía QR / Baileys (no oficial). */
  BAILEYS_QR = "BAILEYS_QR",
  /** Meta Cloud API (oficial). */
  META_CLOUD_API = "META_CLOUD_API",
}

export type MarketingLimits = Readonly<{
  [MarketingChannel.BAILEYS_QR]: number;
  [MarketingChannel.META_CLOUD_API]: number;
}>;

export type PlanLimits = Readonly<{
  maxBots: number;
  maxFlows: number;
  marketingEnabled: boolean;
  marketingMaxPerCampaign: MarketingLimits | null;
  /** 0 = sin vendedores adicionales; -1 = ilimitado (Custom). */
  maxVendedores: number;
}>;

export type PlanDefinition = Readonly<{
  tier: PlanTier;
  /** Etiqueta comercial (español). */
  label: string;
  /** Precio mensual en USD; null = contactar ventas. */
  priceUsdMonthly: number | null;
  limits: PlanLimits;
}>;

/** Tope QR/Baileys: 499 contactos/campaña en todos los planes con marketing. */
export const BAILEYS_QR_CAMPAIGN_LIMIT = 499;

export const PLANS: Readonly<Record<PlanTier, PlanDefinition>> = {
  [PlanTier.BASICO]: {
    tier: PlanTier.BASICO,
    label: "Básico",
    priceUsdMonthly: 9.99,
    limits: {
      maxBots: 1,
      maxFlows: 5,
      marketingEnabled: false,
      marketingMaxPerCampaign: null,
      maxVendedores: 0,
    },
  },
  [PlanTier.LITE]: {
    tier: PlanTier.LITE,
    label: "Lite",
    priceUsdMonthly: 14.99,
    limits: {
      maxBots: 2,
      maxFlows: 10,
      marketingEnabled: true,
      marketingMaxPerCampaign: {
        [MarketingChannel.BAILEYS_QR]: BAILEYS_QR_CAMPAIGN_LIMIT,
        [MarketingChannel.META_CLOUD_API]: 1_000,
      },
      maxVendedores: 2,
    },
  },
  [PlanTier.PRO]: {
    tier: PlanTier.PRO,
    label: "Pro",
    priceUsdMonthly: 24.99,
    limits: {
      maxBots: 5,
      maxFlows: 20,
      marketingEnabled: true,
      marketingMaxPerCampaign: {
        [MarketingChannel.BAILEYS_QR]: BAILEYS_QR_CAMPAIGN_LIMIT,
        [MarketingChannel.META_CLOUD_API]: 2_000,
      },
      maxVendedores: 5,
    },
  },
  [PlanTier.ENTERPRISE]: {
    tier: PlanTier.ENTERPRISE,
    label: "Enterprise",
    priceUsdMonthly: 39.99,
    limits: {
      maxBots: 10,
      maxFlows: 40,
      marketingEnabled: true,
      marketingMaxPerCampaign: {
        [MarketingChannel.BAILEYS_QR]: BAILEYS_QR_CAMPAIGN_LIMIT,
        [MarketingChannel.META_CLOUD_API]: 3_000,
      },
      maxVendedores: 10,
    },
  },
  [PlanTier.CUSTOM]: {
    tier: PlanTier.CUSTOM,
    label: "Custom",
    priceUsdMonthly: null,
    limits: {
      maxBots: -1,
      maxFlows: -1,
      marketingEnabled: true,
      marketingMaxPerCampaign: {
        [MarketingChannel.BAILEYS_QR]: BAILEYS_QR_CAMPAIGN_LIMIT,
        [MarketingChannel.META_CLOUD_API]: 1_000,
      },
      maxVendedores: -1,
    },
  },
} as const;

export function getPlan(tier: PlanTier): PlanDefinition {
  return PLANS[tier];
}

export function getMarketingCampaignLimit(
  tier: PlanTier,
  channel: MarketingChannel,
): number | null {
  const { marketingEnabled, marketingMaxPerCampaign } = PLANS[tier].limits;
  if (!marketingEnabled || !marketingMaxPerCampaign) {
    return null;
  }
  return marketingMaxPerCampaign[channel];
}

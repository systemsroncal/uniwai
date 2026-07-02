/**
 * Matriz de características por plan para landing y facturación.
 * Estructura tipo comparativa SaaS (grupos + valores por tier).
 */

import { MarketingChannel, PlanTier, PLANS } from "./plans";

export type PlanFeatureCell = boolean | string;

export type PlanFeatureRow = Readonly<{
  id: string;
  label: string;
  values: Readonly<Record<PlanTier, PlanFeatureCell>>;
}>;

export type PlanFeatureGroup = Readonly<{
  id: string;
  title: string;
  rows: readonly PlanFeatureRow[];
}>;

export const PLAN_TAGLINES: Readonly<Record<PlanTier, string>> = {
  [PlanTier.BASICO]:
    "Para emprendimientos que automatizan sus primeras ventas por WhatsApp.",
  [PlanTier.LITE]:
    "Para negocios en crecimiento que necesitan campañas y equipo comercial.",
  [PlanTier.PRO]:
    "Para equipos que venden con e-commerce, IA y reportes avanzados in-chat.",
  [PlanTier.ENTERPRISE]:
    "Para operaciones de alto volumen con múltiples números y prioridad operativa.",
  [PlanTier.CUSTOM]:
    "Implementación a medida para agencias, franquicias y corporativos.",
};

/** Bullets destacados en la tarjeta de cada plan (estilo referencia LATAM). */
export const PLAN_CARD_HIGHLIGHTS: Readonly<Record<PlanTier, readonly string[]>> = {
  [PlanTier.BASICO]: [
    "1 número WhatsApp (QR)",
    "5 flujos con Bot Builder + live preview",
    "Inbox unificado y CRM Kanban",
    "Human takeover por prospecto",
  ],
  [PlanTier.LITE]: [
    "Todo en Básico",
    "2 números · 10 flujos · 2 vendedores",
    "Marketing masivo (Excel hasta 499/campaña QR)",
    "Meta Cloud API hasta 1,000 contactos/campaña",
  ],
  [PlanTier.PRO]: [
    "Todo en Lite",
    "5 números · 20 flujos · 5 vendedores",
    "E-commerce in-chat + Mercado Pago",
    "IA BYOK + reportes Excel (2 hojas)",
  ],
  [PlanTier.ENTERPRISE]: [
    "Todo en Pro",
    "10 números · 40 flujos · 10 vendedores",
    "Meta API hasta 3,000/campaña",
    "Calentador P2P prioritario y soporte dedicado",
  ],
  [PlanTier.CUSTOM]: [
    "Límites negociables (bots, flujos, vendedores)",
    "White label y SLA personalizado",
    "Onboarding e implementación asistida",
    "Integraciones y soporte enterprise",
  ],
};

const yes = true;
const no = false;

export const PLAN_FEATURE_GROUPS: readonly PlanFeatureGroup[] = [
  {
    id: "communication",
    title: "Comunicación omnicanal",
    rows: [
      {
        id: "bots",
        label: "Números WhatsApp (bots)",
        values: {
          [PlanTier.BASICO]: "1",
          [PlanTier.LITE]: "2",
          [PlanTier.PRO]: "5",
          [PlanTier.ENTERPRISE]: "10",
          [PlanTier.CUSTOM]: "A medida",
        },
      },
      {
        id: "inbox",
        label: "Inbox unificado",
        values: {
          [PlanTier.BASICO]: yes,
          [PlanTier.LITE]: yes,
          [PlanTier.PRO]: yes,
          [PlanTier.ENTERPRISE]: yes,
          [PlanTier.CUSTOM]: yes,
        },
      },
      {
        id: "qr",
        label: "Conexión WhatsApp QR (Baileys)",
        values: {
          [PlanTier.BASICO]: yes,
          [PlanTier.LITE]: yes,
          [PlanTier.PRO]: yes,
          [PlanTier.ENTERPRISE]: yes,
          [PlanTier.CUSTOM]: yes,
        },
      },
      {
        id: "meta",
        label: "Meta Cloud API (oficial)",
        values: {
          [PlanTier.BASICO]: no,
          [PlanTier.LITE]: yes,
          [PlanTier.PRO]: yes,
          [PlanTier.ENTERPRISE]: yes,
          [PlanTier.CUSTOM]: yes,
        },
      },
      {
        id: "takeover",
        label: "Human takeover (activar/desactivar bot)",
        values: {
          [PlanTier.BASICO]: yes,
          [PlanTier.LITE]: yes,
          [PlanTier.PRO]: yes,
          [PlanTier.ENTERPRISE]: yes,
          [PlanTier.CUSTOM]: yes,
        },
      },
    ],
  },
  {
    id: "automation",
    title: "Bots y automatización",
    rows: [
      {
        id: "flows",
        label: "Flujos de conversación",
        values: {
          [PlanTier.BASICO]: "5",
          [PlanTier.LITE]: "10",
          [PlanTier.PRO]: "20",
          [PlanTier.ENTERPRISE]: "40",
          [PlanTier.CUSTOM]: "A medida",
        },
      },
      {
        id: "builder",
        label: "Bot Builder drag & drop + live preview",
        values: {
          [PlanTier.BASICO]: yes,
          [PlanTier.LITE]: yes,
          [PlanTier.PRO]: yes,
          [PlanTier.ENTERPRISE]: yes,
          [PlanTier.CUSTOM]: yes,
        },
      },
      {
        id: "templates",
        label: "Plantillas de flujos reutilizables",
        values: {
          [PlanTier.BASICO]: yes,
          [PlanTier.LITE]: yes,
          [PlanTier.PRO]: yes,
          [PlanTier.ENTERPRISE]: yes,
          [PlanTier.CUSTOM]: yes,
        },
      },
      {
        id: "spintax",
        label: "Spintax + presencia «escribiendo» anti-ban",
        values: {
          [PlanTier.BASICO]: yes,
          [PlanTier.LITE]: yes,
          [PlanTier.PRO]: yes,
          [PlanTier.ENTERPRISE]: yes,
          [PlanTier.CUSTOM]: yes,
        },
      },
      {
        id: "warmup",
        label: "Calentador P2P de números",
        values: {
          [PlanTier.BASICO]: "Básico",
          [PlanTier.LITE]: "Completo",
          [PlanTier.PRO]: "Completo",
          [PlanTier.ENTERPRISE]: "Prioritario",
          [PlanTier.CUSTOM]: "A medida",
        },
      },
    ],
  },
  {
    id: "crm",
    title: "CRM y gestión de leads",
    rows: [
      {
        id: "kanban",
        label: "Pipeline Kanban (Lead → Cierre)",
        values: {
          [PlanTier.BASICO]: yes,
          [PlanTier.LITE]: yes,
          [PlanTier.PRO]: yes,
          [PlanTier.ENTERPRISE]: yes,
          [PlanTier.CUSTOM]: yes,
        },
      },
      {
        id: "vendedores",
        label: "Usuarios vendedor",
        values: {
          [PlanTier.BASICO]: "—",
          [PlanTier.LITE]: "2",
          [PlanTier.PRO]: "5",
          [PlanTier.ENTERPRISE]: "10",
          [PlanTier.CUSTOM]: "Ilimitado",
        },
      },
      {
        id: "profiles",
        label: "Perfil de contacto y historial",
        values: {
          [PlanTier.BASICO]: yes,
          [PlanTier.LITE]: yes,
          [PlanTier.PRO]: yes,
          [PlanTier.ENTERPRISE]: yes,
          [PlanTier.CUSTOM]: yes,
        },
      },
      {
        id: "resume",
        label: "Reanudar flujo del bot al reactivar",
        values: {
          [PlanTier.BASICO]: yes,
          [PlanTier.LITE]: yes,
          [PlanTier.PRO]: yes,
          [PlanTier.ENTERPRISE]: yes,
          [PlanTier.CUSTOM]: yes,
        },
      },
    ],
  },
  {
    id: "marketing",
    title: "Marketing y remarketing",
    rows: [
      {
        id: "mass",
        label: "Campañas masivas",
        values: {
          [PlanTier.BASICO]: no,
          [PlanTier.LITE]: yes,
          [PlanTier.PRO]: yes,
          [PlanTier.ENTERPRISE]: yes,
          [PlanTier.CUSTOM]: yes,
        },
      },
      {
        id: "excel",
        label: "Importación Excel (teléfono, nombre, categoría, etiqueta)",
        values: {
          [PlanTier.BASICO]: no,
          [PlanTier.LITE]: yes,
          [PlanTier.PRO]: yes,
          [PlanTier.ENTERPRISE]: yes,
          [PlanTier.CUSTOM]: yes,
        },
      },
      {
        id: "qr_limit",
        label: "Tope campaña canal QR",
        values: {
          [PlanTier.BASICO]: "—",
          [PlanTier.LITE]: "499",
          [PlanTier.PRO]: "499",
          [PlanTier.ENTERPRISE]: "499",
          [PlanTier.CUSTOM]: "499",
        },
      },
      {
        id: "meta_limit",
        label: "Tope campaña Meta Cloud API",
        values: {
          [PlanTier.BASICO]: "—",
          [PlanTier.LITE]: "1,000",
          [PlanTier.PRO]: "2,000",
          [PlanTier.ENTERPRISE]: "3,000",
          [PlanTier.CUSTOM]: "Negociable",
        },
      },
      {
        id: "remarketing",
        label: "Remarketing inteligente (abandono, sin respuesta)",
        values: {
          [PlanTier.BASICO]: no,
          [PlanTier.LITE]: yes,
          [PlanTier.PRO]: yes,
          [PlanTier.ENTERPRISE]: yes,
          [PlanTier.CUSTOM]: yes,
        },
      },
    ],
  },
  {
    id: "commerce",
    title: "E-commerce y pagos",
    rows: [
      {
        id: "catalog",
        label: "Catálogo Google Sheets / WhatsApp Business",
        values: {
          [PlanTier.BASICO]: no,
          [PlanTier.LITE]: yes,
          [PlanTier.PRO]: yes,
          [PlanTier.ENTERPRISE]: yes,
          [PlanTier.CUSTOM]: yes,
        },
      },
      {
        id: "checkout",
        label: "Checkout in-chat (carrito, dirección, ubicación Maps)",
        values: {
          [PlanTier.BASICO]: no,
          [PlanTier.LITE]: yes,
          [PlanTier.PRO]: yes,
          [PlanTier.ENTERPRISE]: yes,
          [PlanTier.CUSTOM]: yes,
        },
      },
      {
        id: "postgis",
        label: "Tarifa de envío dinámica (PostGIS misma ciudad)",
        values: {
          [PlanTier.BASICO]: no,
          [PlanTier.LITE]: yes,
          [PlanTier.PRO]: yes,
          [PlanTier.ENTERPRISE]: yes,
          [PlanTier.CUSTOM]: yes,
        },
      },
      {
        id: "mp",
        label: "Mercado Pago (credenciales en dashboard)",
        values: {
          [PlanTier.BASICO]: no,
          [PlanTier.LITE]: yes,
          [PlanTier.PRO]: yes,
          [PlanTier.ENTERPRISE]: yes,
          [PlanTier.CUSTOM]: yes,
        },
      },
    ],
  },
  {
    id: "ai",
    title: "IA y conocimiento",
    rows: [
      {
        id: "ia",
        label: "IA generativa (OpenAI, Gemini, DeepSeek)",
        values: {
          [PlanTier.BASICO]: "Pool plataforma",
          [PlanTier.LITE]: "BYOK",
          [PlanTier.PRO]: "BYOK",
          [PlanTier.ENTERPRISE]: "BYOK",
          [PlanTier.CUSTOM]: "BYOK",
        },
      },
      {
        id: "rag",
        label: "Base de conocimiento RAG (pgvector)",
        values: {
          [PlanTier.BASICO]: no,
          [PlanTier.LITE]: no,
          [PlanTier.PRO]: yes,
          [PlanTier.ENTERPRISE]: yes,
          [PlanTier.CUSTOM]: yes,
        },
      },
      {
        id: "guard",
        label: "Middleware anti-prompt-injection",
        values: {
          [PlanTier.BASICO]: yes,
          [PlanTier.LITE]: yes,
          [PlanTier.PRO]: yes,
          [PlanTier.ENTERPRISE]: yes,
          [PlanTier.CUSTOM]: yes,
        },
      },
    ],
  },
  {
    id: "analytics",
    title: "Analítica y reportes",
    rows: [
      {
        id: "dashboard",
        label: "Dashboard de métricas",
        values: {
          [PlanTier.BASICO]: yes,
          [PlanTier.LITE]: yes,
          [PlanTier.PRO]: yes,
          [PlanTier.ENTERPRISE]: yes,
          [PlanTier.CUSTOM]: yes,
        },
      },
      {
        id: "excel_report",
        label: "Exportar ventas a Excel (2 hojas)",
        values: {
          [PlanTier.BASICO]: no,
          [PlanTier.LITE]: no,
          [PlanTier.PRO]: yes,
          [PlanTier.ENTERPRISE]: yes,
          [PlanTier.CUSTOM]: yes,
        },
      },
      {
        id: "alerts",
        label: "Alertas de compras y prospectos calientes",
        values: {
          [PlanTier.BASICO]: yes,
          [PlanTier.LITE]: yes,
          [PlanTier.PRO]: yes,
          [PlanTier.ENTERPRISE]: yes,
          [PlanTier.CUSTOM]: yes,
        },
      },
    ],
  },
  {
    id: "security",
    title: "Seguridad y soporte",
    rows: [
      {
        id: "multitenant",
        label: "Multi-tenant con RLS",
        values: {
          [PlanTier.BASICO]: yes,
          [PlanTier.LITE]: yes,
          [PlanTier.PRO]: yes,
          [PlanTier.ENTERPRISE]: yes,
          [PlanTier.CUSTOM]: yes,
        },
      },
      {
        id: "webhooks",
        label: "Webhooks e integraciones",
        values: {
          [PlanTier.BASICO]: no,
          [PlanTier.LITE]: yes,
          [PlanTier.PRO]: yes,
          [PlanTier.ENTERPRISE]: yes,
          [PlanTier.CUSTOM]: yes,
        },
      },
      {
        id: "support",
        label: "Soporte",
        values: {
          [PlanTier.BASICO]: "Email",
          [PlanTier.LITE]: "Email",
          [PlanTier.PRO]: "Prioritario",
          [PlanTier.ENTERPRISE]: "Dedicado",
          [PlanTier.CUSTOM]: "SLA",
        },
      },
      {
        id: "whitelabel",
        label: "Marca blanca",
        values: {
          [PlanTier.BASICO]: no,
          [PlanTier.LITE]: no,
          [PlanTier.PRO]: no,
          [PlanTier.ENTERPRISE]: no,
          [PlanTier.CUSTOM]: yes,
        },
      },
    ],
  },
] as const;

export const LANDING_PLAN_ORDER: readonly PlanTier[] = [
  PlanTier.BASICO,
  PlanTier.LITE,
  PlanTier.PRO,
  PlanTier.ENTERPRISE,
];

export function formatPlanPrice(tier: PlanTier): string {
  const price = PLANS[tier].priceUsdMonthly;
  if (price === null) return "A medida";
  return `$${price.toFixed(2)}`;
}

export function formatMarketingLimit(tier: PlanTier, channel: MarketingChannel): string {
  const plan = PLANS[tier];
  if (!plan.limits.marketingEnabled || !plan.limits.marketingMaxPerCampaign) {
    return "—";
  }
  const limit = plan.limits.marketingMaxPerCampaign[channel];
  return limit.toLocaleString("es-PE");
}

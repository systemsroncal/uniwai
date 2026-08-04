/** Etiquetas en español para valores de enum / códigos del backend. */

export const ORDER_STATUS_ES: Record<string, string> = {
  DRAFT: "Borrador",
  CONFIRMED: "Confirmado",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

export const ORDER_PAYMENT_STATUS_ES: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  FAILED: "Fallido",
  REFUNDED: "Reembolsado",
  CASH_ON_DELIVERY: "Contraentrega",
};

export const WHATSAPP_STATUS_ES: Record<string, string> = {
  CONNECTED: "Conectado",
  DISCONNECTED: "Desconectado",
  BANNED: "Baneado",
  QR_PENDING: "Esperando QR",
};

export const WHATSAPP_CONNECTION_ES: Record<string, string> = {
  BAILEYS: "QR / WhatsApp Business",
  META_CLOUD: "Meta Cloud API",
};

export const USER_ROLE_ES: Record<string, string> = {
  SUPERADMIN: "Superadmin",
  OWNER: "Propietario",
  VENDEDOR: "Vendedor",
};

export const TENANT_STATUS_ES: Record<string, string> = {
  ACTIVE: "Activo",
  SUSPENDED: "Suspendido",
  BANNED: "Baneado",
};

export const SUBSCRIPTION_STATUS_ES: Record<string, string> = {
  TRIALING: "Prueba",
  ACTIVE: "Activa",
  PAST_DUE: "Pago vencido",
  CANCELLED: "Cancelada",
  EXPIRED: "Expirada",
};

export const CAMPAIGN_STATUS_ES: Record<string, string> = {
  DRAFT: "Borrador",
  SCHEDULED: "Programada",
  RUNNING: "En curso",
  PAUSED: "Pausada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

export const CAMPAIGN_CHANNEL_ES: Record<string, string> = {
  BAILEYS_QR: "WhatsApp QR",
  META_CLOUD_API: "Meta Cloud API",
};

export const KNOWLEDGE_STATUS_ES: Record<string, string> = {
  PENDING: "Pendiente",
  PROCESSING: "Procesando",
  READY: "Listo",
  FAILED: "Error",
};

export const MESSAGE_STATUS_ES: Record<string, string> = {
  PENDING: "Pendiente",
  SENT: "Enviado",
  DELIVERED: "Entregado",
  READ: "Leído",
  FAILED: "Fallido",
};

export const PRODUCT_SOURCE_ES: Record<string, string> = {
  SHEETS: "Google Sheets",
  WA_CATALOG: "Catálogo WhatsApp",
};

export const PLAN_SLUG_ES: Record<string, string> = {
  basico: "Básico",
  lite: "Lite",
  pro: "Pro",
  enterprise: "Enterprise",
  custom: "Personalizado",
};

/** Traduce un código; si no hay entrada, devuelve el original formateado. */
export function labelEs(map: Record<string, string>, value: string | null | undefined): string {
  if (!value) return "—";
  if (map[value]) return map[value];
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

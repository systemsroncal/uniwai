/**
 * RBAC — roles y matriz de permisos UniWai CRM.
 * Enforced en Hono middleware + UI route guards.
 */

export enum Role {
  SUPERADMIN = "SUPERADMIN",
  OWNER = "OWNER",
  VENDEDOR = "VENDEDOR",
}

export const Permission = {
  // Plataforma (SUPERADMIN)
  MANAGE_PLANS: "manage_plans",
  MANAGE_PRICES: "manage_prices",
  SUSPEND_TENANT: "suspend_tenant",
  BAN_TENANT: "ban_tenant",
  VIEW_GLOBAL_STATS: "view_global_stats",
  MANAGE_AI_POOL_KEYS: "manage_ai_pool_keys",
  MANAGE_GLOBAL_FLOW_TEMPLATES: "manage_global_flow_templates",

  // Tenant (OWNER)
  MANAGE_BOTS: "manage_bots",
  MANAGE_FLOWS: "manage_flows",
  MANAGE_MP_CREDENTIALS: "manage_mp_credentials",
  MANAGE_TEAM: "manage_team",
  MANAGE_AI_BYOK: "manage_ai_byok",
  MANAGE_WARMUP_CONFIG: "manage_warmup_config",
  VIEW_REPORTS: "view_reports",
  MANAGE_MARKETING: "manage_marketing",
  MANAGE_BILLING: "manage_billing",
  MANAGE_TENANT_SETTINGS: "manage_tenant_settings",

  // Operaciones (OWNER + VENDEDOR)
  VIEW_KANBAN: "view_kanban",
  MANAGE_CHAT: "manage_chat",
  TOGGLE_BOT_PROSPECT: "toggle_bot_prospect",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

/** Permisos efectivos por rol. */
export const ROLE_PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
  [Role.SUPERADMIN]: [
    Permission.MANAGE_PLANS,
    Permission.MANAGE_PRICES,
    Permission.SUSPEND_TENANT,
    Permission.BAN_TENANT,
    Permission.VIEW_GLOBAL_STATS,
    Permission.MANAGE_AI_POOL_KEYS,
    Permission.MANAGE_GLOBAL_FLOW_TEMPLATES,
  ],
  [Role.OWNER]: [
    Permission.MANAGE_BOTS,
    Permission.MANAGE_FLOWS,
    Permission.MANAGE_MP_CREDENTIALS,
    Permission.MANAGE_TEAM,
    Permission.MANAGE_AI_BYOK,
    Permission.MANAGE_WARMUP_CONFIG,
    Permission.VIEW_REPORTS,
    Permission.MANAGE_MARKETING,
    Permission.MANAGE_BILLING,
    Permission.MANAGE_TENANT_SETTINGS,
    Permission.VIEW_KANBAN,
    Permission.MANAGE_CHAT,
    Permission.TOGGLE_BOT_PROSPECT,
  ],
  [Role.VENDEDOR]: [
    Permission.VIEW_KANBAN,
    Permission.MANAGE_CHAT,
    Permission.TOGGLE_BOT_PROSPECT,
  ],
} as const;

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function hasAnyPermission(
  role: Role,
  permissions: readonly Permission[],
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(
  role: Role,
  permissions: readonly Permission[],
): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

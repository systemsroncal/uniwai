"use client";

import Link from "next/link";
import { Role, PLAN_SLUG_ES, USER_ROLE_ES, labelEs } from "@uniwai/shared";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  Button,
  Chip,
  Alert,
} from "@mui/material";
import {
  ArrowForward,
  AutoAwesomeOutlined,
  CampaignOutlined,
  CreditCardOutlined,
  DescriptionOutlined,
  ForumOutlined,
  GroupsOutlined,
  Inventory2Outlined,
  LocalFireDepartmentOutlined,
  MenuBookOutlined,
  AssessmentOutlined,
  SettingsOutlined,
  ShoppingCartOutlined,
  SmartToyOutlined,
  ViewKanbanOutlined,
  WhatsApp,
  AdminPanelSettingsOutlined,
  PriceChangeOutlined,
  PsychologyOutlined,
} from "@mui/icons-material";
import { Permission } from "@uniwai/shared";
import { useAuth } from "@/src/context/auth-context";
import { useTenantImpersonation } from "@/src/context/tenant-impersonation-context";

type ModuleCard = {
  href: string;
  title: string;
  text: string;
  icon: React.ReactNode;
  color: string;
  permission?: Permission;
  roles?: Role[];
};

const ALL_MODULES: ModuleCard[] = [
  { href: "/app/whatsapp", title: "WhatsApp", text: "Conecta números QR o Meta API.", icon: <WhatsApp />, color: "success.main", permission: Permission.MANAGE_BOTS },
  { href: "/app/inbox", title: "Inbox", text: "Conversaciones unificadas.", icon: <ForumOutlined />, color: "info.main", permission: Permission.MANAGE_CHAT },
  { href: "/app/kanban", title: "Kanban", text: "Pipeline Lead → Cierre.", icon: <ViewKanbanOutlined />, color: "primary.main", permission: Permission.VIEW_KANBAN },
  { href: "/app/builder", title: "Bot Builder", text: "Editor visual + preview.", icon: <SmartToyOutlined />, color: "secondary.main", permission: Permission.MANAGE_FLOWS },
  { href: "/app/templates", title: "Plantillas", text: "Flujos reutilizables.", icon: <DescriptionOutlined />, color: "secondary.dark", permission: Permission.MANAGE_FLOWS },
  { href: "/app/warmup", title: "Calentador", text: "Anti-ban P2P.", icon: <LocalFireDepartmentOutlined />, color: "warning.main", permission: Permission.MANAGE_WARMUP_CONFIG },
  { href: "/app/marketing", title: "Marketing", text: "Campañas masivas.", icon: <CampaignOutlined />, color: "warning.dark", permission: Permission.MANAGE_MARKETING },
  { href: "/app/catalog", title: "Catálogo", text: "Productos y Sheets.", icon: <Inventory2Outlined />, color: "info.dark", permission: Permission.MANAGE_TENANT_SETTINGS },
  { href: "/app/orders", title: "Pedidos", text: "Checkout in-chat.", icon: <ShoppingCartOutlined />, color: "success.dark", permission: Permission.MANAGE_TENANT_SETTINGS },
  { href: "/app/knowledge", title: "Conocimiento", text: "RAG para IA del bot.", icon: <MenuBookOutlined />, color: "primary.dark", permission: Permission.MANAGE_AI_BYOK },
  { href: "/app/reports", title: "Reportes", text: "Excel 2 hojas.", icon: <AssessmentOutlined />, color: "error.main", permission: Permission.VIEW_REPORTS },
  { href: "/app/team", title: "Equipo", text: "Vendedores del plan.", icon: <GroupsOutlined />, color: "text.primary", permission: Permission.MANAGE_TEAM },
  { href: "/app/billing", title: "Facturación", text: "Tu plan UniWai.", icon: <CreditCardOutlined />, color: "text.secondary", permission: Permission.MANAGE_BILLING },
  { href: "/app/settings", title: "Configuración", text: "MP, IA BYOK.", icon: <SettingsOutlined />, color: "text.primary", roles: [Role.OWNER, Role.SUPERADMIN] },
  { href: "/app/admin", title: "Superadmin", text: "Tenants y moderación.", icon: <AdminPanelSettingsOutlined />, color: "error.dark", roles: [Role.SUPERADMIN] },
  { href: "/app/admin/plans", title: "Planes", text: "Precios SaaS.", icon: <PriceChangeOutlined />, color: "primary.main", permission: Permission.MANAGE_PLANS },
  { href: "/app/admin/ai-pool", title: "Pool IA", text: "Keys globales.", icon: <PsychologyOutlined />, color: "secondary.main", permission: Permission.MANAGE_AI_POOL_KEYS },
  { href: "/app/admin/templates", title: "Plantillas globales", text: "Flujos plataforma.", icon: <DescriptionOutlined />, color: "info.main", permission: Permission.MANAGE_GLOBAL_FLOW_TEMPLATES },
];

export default function DashboardPage() {
  const { crmUser, tenantName, planSlug, can } = useAuth();
  const { needsTenant, isImpersonating, tenantName: impersonatedName } = useTenantImpersonation();

  const modules = ALL_MODULES.filter((m) => {
    if (m.roles && crmUser && !m.roles.includes(crmUser.role as Role)) {
      if (!(m.roles.includes(Role.OWNER) && crmUser.role === Role.SUPERADMIN)) return false;
    }
    if (m.permission && !can(m.permission)) return false;
    return true;
  });

  const crmModules = modules.filter((m) => !m.href.startsWith("/app/admin"));
  const platformModules = modules.filter((m) => m.href.startsWith("/app/admin"));

  const stats = [
    { label: "Workspace", value: isImpersonating ? (impersonatedName ?? "Tenant") : (tenantName ?? "Plataforma") },
    { label: "Rol", value: labelEs(USER_ROLE_ES, crmUser?.role) },
    { label: "Plan", value: planSlug ? labelEs(PLAN_SLUG_ES, planSlug) : (crmUser?.role === Role.SUPERADMIN ? "—" : "Prueba") },
    { label: "Módulos", value: String(modules.length) },
  ];

  return (
    <Stack spacing={3}>
      {crmUser?.role === Role.SUPERADMIN && needsTenant ? (
        <Alert severity="warning">
          Selecciona un <strong>negocio activo</strong> en el menú lateral para operar los módulos CRM (Kanban, WhatsApp, etc.).
          O regístrate en <Link href="/register">/register</Link> como dueño de negocio.
        </Alert>
      ) : null}

      <Card
        sx={{
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, #253662 0%, #2A3547 100%)"
              : "linear-gradient(135deg, #ECF2FF 0%, #ffffff 100%)",
          border: 1,
          borderColor: "divider",
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Bienvenido de nuevo
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {tenantName || isImpersonating
                  ? `Gestiona ${impersonatedName ?? tenantName} desde un solo panel.`
                  : crmUser?.role === Role.SUPERADMIN
                    ? "Panel maestro de la plataforma UniWai CRM."
                    : "Tu centro de control para WhatsApp y ventas."}
              </Typography>
            </Box>
            <Chip icon={<AutoAwesomeOutlined />} label="18 módulos" color="primary" variant="outlined" />
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 2 }}>
        {stats.map((stat) => (
          <Card key={stat.label} variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                {stat.label}
              </Typography>
              <Typography variant="h6" fontWeight={600} sx={{ mt: 0.5 }} noWrap>
                {stat.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {crmModules.length > 0 ? (
        <ModuleGrid title="CRM — Operaciones" modules={crmModules} />
      ) : null}

      {platformModules.length > 0 ? (
        <ModuleGrid title="Plataforma — Superadmin" modules={platformModules} />
      ) : null}
    </Stack>
  );
}

function ModuleGrid({ title, modules }: { title: string; modules: ModuleCard[] }) {
  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        {title}
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)", xl: "repeat(4, 1fr)" }, gap: 2 }}>
        {modules.map(({ href, title: modTitle, text, icon, color }) => (
          <Card
            key={href}
            component={Link}
            href={href}
            sx={{
              height: "100%",
              textDecoration: "none",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": { transform: "translateY(-2px)", boxShadow: 6 },
            }}
          >
            <CardContent>
              <Box sx={{ width: 44, height: 44, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "action.hover", color, mb: 2 }}>
                {icon}
              </Box>
              <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                {modTitle}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                {text}
              </Typography>
              <Button size="small" endIcon={<ArrowForward />} sx={{ px: 0 }}>
                Abrir
              </Button>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}

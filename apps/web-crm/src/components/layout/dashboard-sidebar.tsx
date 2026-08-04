"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AdminPanelSettingsOutlined,
  CampaignOutlined,
  CreditCardOutlined,
  DescriptionOutlined,
  ForumOutlined,
  GroupsOutlined,
  Inventory2Outlined,
  LocalFireDepartmentOutlined,
  AssessmentOutlined,
  MenuBookOutlined,
  PsychologyOutlined,
  SettingsOutlined,
  ShoppingCartOutlined,
  SmartToyOutlined,
  DashboardOutlined,
  ViewKanbanOutlined,
  WhatsApp,
  PriceChangeOutlined,
} from "@mui/icons-material";
import { Permission, Role, PLAN_SLUG_ES, USER_ROLE_ES, labelEs } from "@uniwai/shared";
import { useAuth } from "@/src/context/auth-context";
import {
  Box,
  Chip,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { TenantSelector } from "@/src/components/layout/tenant-selector";

const SIDEBAR_WIDTH = 270;

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles?: Role[];
  permission?: Permission;
  section?: "crm" | "platform";
};

const links: NavItem[] = [
  { href: "/app", label: "Dashboard", icon: <DashboardOutlined fontSize="small" /> },

  // CRM operativo
  { href: "/app/whatsapp", label: "WhatsApp", icon: <WhatsApp fontSize="small" />, permission: Permission.MANAGE_BOTS, section: "crm" },
  { href: "/app/inbox", label: "Inbox", icon: <ForumOutlined fontSize="small" />, permission: Permission.MANAGE_CHAT, section: "crm" },
  { href: "/app/kanban", label: "Kanban", icon: <ViewKanbanOutlined fontSize="small" />, permission: Permission.VIEW_KANBAN, section: "crm" },
  { href: "/app/builder", label: "Bot Builder", icon: <SmartToyOutlined fontSize="small" />, permission: Permission.MANAGE_FLOWS, section: "crm" },
  { href: "/app/templates", label: "Plantillas flujos", icon: <DescriptionOutlined fontSize="small" />, permission: Permission.MANAGE_FLOWS, section: "crm" },
  { href: "/app/warmup", label: "Calentador", icon: <LocalFireDepartmentOutlined fontSize="small" />, permission: Permission.MANAGE_WARMUP_CONFIG, section: "crm" },
  { href: "/app/marketing", label: "Marketing", icon: <CampaignOutlined fontSize="small" />, permission: Permission.MANAGE_MARKETING, section: "crm" },
  { href: "/app/catalog", label: "Catálogo", icon: <Inventory2Outlined fontSize="small" />, permission: Permission.MANAGE_TENANT_SETTINGS, section: "crm" },
  { href: "/app/orders", label: "Pedidos", icon: <ShoppingCartOutlined fontSize="small" />, permission: Permission.MANAGE_TENANT_SETTINGS, section: "crm" },
  { href: "/app/knowledge", label: "Base conocimiento", icon: <MenuBookOutlined fontSize="small" />, permission: Permission.MANAGE_AI_BYOK, section: "crm" },
  { href: "/app/reports", label: "Reportes", icon: <AssessmentOutlined fontSize="small" />, permission: Permission.VIEW_REPORTS, section: "crm" },
  { href: "/app/team", label: "Equipo", icon: <GroupsOutlined fontSize="small" />, permission: Permission.MANAGE_TEAM, section: "crm" },
  { href: "/app/billing", label: "Facturación", icon: <CreditCardOutlined fontSize="small" />, permission: Permission.MANAGE_BILLING, section: "crm" },
  { href: "/app/settings", label: "Configuración", icon: <SettingsOutlined fontSize="small" />, roles: [Role.OWNER, Role.SUPERADMIN], section: "crm" },

  // Plataforma (superadmin)
  { href: "/app/admin", label: "Superadmin", icon: <AdminPanelSettingsOutlined fontSize="small" />, roles: [Role.SUPERADMIN], section: "platform" },
  { href: "/app/admin/plans", label: "Planes y precios", icon: <PriceChangeOutlined fontSize="small" />, permission: Permission.MANAGE_PLANS, section: "platform" },
  { href: "/app/admin/ai-pool", label: "Pool IA global", icon: <PsychologyOutlined fontSize="small" />, permission: Permission.MANAGE_AI_POOL_KEYS, section: "platform" },
  { href: "/app/admin/templates", label: "Plantillas globales", icon: <DescriptionOutlined fontSize="small" />, permission: Permission.MANAGE_GLOBAL_FLOW_TEMPLATES, section: "platform" },
];

type DashboardSidebarProps = {
  desktopOpen: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
};

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const theme = useTheme();
  const { crmUser, tenantName, planSlug, can } = useAuth();

  const visibleLinks = links.filter((item) => {
    if (item.roles && crmUser && !item.roles.includes(crmUser.role as Role)) {
      if (item.roles.length === 1 && item.roles[0] === Role.OWNER && crmUser.role === Role.SUPERADMIN) {
        // superadmin puede ver settings
      } else if (!item.roles.includes(crmUser.role as Role)) return false;
    }
    if (item.permission && !can(item.permission)) return false;
    return true;
  });

  const crmLinks = visibleLinks.filter((l) => l.section === "crm" || (!l.section && l.href !== "/app"));
  const platformLinks = visibleLinks.filter((l) => l.section === "platform");
  const dashboardLink = visibleLinks.find((l) => l.href === "/app");

  const renderLink = ({ href, label, icon }: NavItem) => {
    const active = pathname === href || (href !== "/app" && pathname.startsWith(href));
    return (
      <ListItemButton
        key={href}
        component={Link}
        href={href}
        onClick={onNavigate}
        selected={active}
        sx={{
          mb: 0.5,
          borderRadius: 2,
          minHeight: 44,
          "&.Mui-selected": {
            bgcolor: "primary.main",
            color: "primary.contrastText",
            "&:hover": { bgcolor: "primary.dark" },
            "& .MuiListItemIcon-root": { color: "primary.contrastText" },
          },
        }}
      >
        <ListItemIcon sx={{ minWidth: 36, color: active ? "inherit" : theme.palette.text.secondary }}>
          {icon}
        </ListItemIcon>
        <ListItemText primary={label} primaryTypographyProps={{ fontSize: "0.875rem", fontWeight: active ? 600 : 500 }} />
      </ListItemButton>
    );
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: "background.paper", borderRight: 1, borderColor: "divider" }}>
      <Box sx={{ px: 3, py: 2.5 }}>
        <Typography component={Link} href="/app" onClick={onNavigate} variant="h6" sx={{ fontWeight: 700, textDecoration: "none", color: "text.primary" }}>
          UniWai<Box component="span" sx={{ color: "primary.main" }}>CRM</Box>
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          {tenantName ?? "Modo plataforma"}
        </Typography>
        <Box sx={{ mt: 1, display: "flex", gap: 0.75, flexWrap: "wrap" }}>
          <Chip label={labelEs(USER_ROLE_ES, crmUser?.role)} size="small" color="primary" variant="outlined" />
          {planSlug ? <Chip label={labelEs(PLAN_SLUG_ES, planSlug)} size="small" variant="outlined" /> : null}
        </Box>
      </Box>

      <Divider />
      <TenantSelector />

      <List component="nav" aria-label="CRM" sx={{ flex: 1, px: 1.5, py: 1, overflowY: "auto" }}>
        {dashboardLink ? renderLink(dashboardLink) : null}

        {crmLinks.length > 0 ? (
          <>
            <ListSubheader sx={{ bgcolor: "transparent", lineHeight: 2, fontSize: "0.7rem", fontWeight: 700, letterSpacing: 1 }}>
              CRM
            </ListSubheader>
            {crmLinks.map(renderLink)}
          </>
        ) : null}

        {platformLinks.length > 0 ? (
          <>
            <ListSubheader sx={{ bgcolor: "transparent", lineHeight: 2, fontSize: "0.7rem", fontWeight: 700, letterSpacing: 1, mt: 1 }}>
              PLATAFORMA
            </ListSubheader>
            {platformLinks.map(renderLink)}
          </>
        ) : null}
      </List>

      <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
        <Typography variant="caption" color="text.secondary" noWrap>
          {crmUser?.email}
        </Typography>
      </Box>
    </Box>
  );
}

export function DashboardSidebar({ desktopOpen, mobileOpen, onMobileClose }: DashboardSidebarProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));

  if (isDesktop) {
    if (!desktopOpen) return null;
    return (
      <Box component="aside" sx={{ width: SIDEBAR_WIDTH, flexShrink: 0, position: "sticky", top: 0, height: "100dvh" }}>
        <SidebarContent />
      </Box>
    );
  }

  return (
    <Drawer variant="temporary" open={mobileOpen} onClose={onMobileClose} ModalProps={{ keepMounted: true }} sx={{ "& .MuiDrawer-paper": { width: SIDEBAR_WIDTH } }}>
      <SidebarContent onNavigate={onMobileClose} />
    </Drawer>
  );
}

export { SIDEBAR_WIDTH };

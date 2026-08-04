"use client";

import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  DarkModeOutlined,
  LightModeOutlined,
  LogoutOutlined,
  MenuOutlined,
  NotificationsNoneOutlined,
} from "@mui/icons-material";
import { useState } from "react";
import { useAuth } from "@/src/context/auth-context";
import { useThemeMode } from "@/src/context/theme-mode-context";

type DashboardHeaderProps = {
  onMenuClick: () => void;
};

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const { crmUser, tenantName, signOut } = useAuth();
  const { mode, toggleMode } = useThemeMode();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const initials =
    crmUser?.email?.slice(0, 2).toUpperCase() ??
    crmUser?.role?.slice(0, 2).toUpperCase() ??
    "UW";

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        color: "text.primary",
        borderBottom: 1,
        borderColor: "divider",
        backdropFilter: "blur(8px)",
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 64, lg: 70 }, gap: 1 }}>
        <IconButton
          edge="start"
          onClick={onMenuClick}
          aria-label="Abrir o cerrar menú"
        >
          <MenuOutlined />
        </IconButton>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={600} noWrap>
            {tenantName ?? "Panel UniWai CRM"}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {crmUser?.role} · WhatsApp omnicanal
          </Typography>
        </Box>

        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Tooltip title={mode === "light" ? "Modo oscuro" : "Modo claro"}>
            <IconButton onClick={toggleMode} aria-label="Cambiar tema">
              {mode === "light" ? <DarkModeOutlined /> : <LightModeOutlined />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Notificaciones">
            <IconButton aria-label="Notificaciones">
              <NotificationsNoneOutlined />
            </IconButton>
          </Tooltip>

          <IconButton
            onClick={(e) => setAnchorEl(e.currentTarget)}
            aria-label="Menú de usuario"
            aria-haspopup="true"
          >
            <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main", fontSize: "0.875rem" }}>
              {initials}
            </Avatar>
          </IconButton>
        </Stack>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <MenuItem disabled sx={{ opacity: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {crmUser?.email}
            </Typography>
          </MenuItem>
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              void signOut();
            }}
          >
            <LogoutOutlined fontSize="small" sx={{ mr: 1 }} />
            Cerrar sesión
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

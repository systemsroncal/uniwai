"use client";

import Link from "next/link";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { ModernizeProvider } from "@/src/components/providers/modernize-provider";
import { useThemeMode } from "@/src/context/theme-mode-context";
import { DarkModeOutlined, LightModeOutlined } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";

type AuthCardLayoutProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthCardLayout({ title, subtitle, children, footer }: AuthCardLayoutProps) {
  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default", p: 2 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3, maxWidth: 1100, width: "100%" }}>
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            justifyContent: "center",
            p: 4,
            borderRadius: 3,
            minHeight: 420,
            flexDirection: "column",
            background: (theme) =>
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, #253662 0%, #171C23 100%)"
                : "linear-gradient(135deg, #5D87FF 0%, #49BEFF 100%)",
            color: "#fff",
          }}
        >
          <Typography variant="h3" fontWeight={700} gutterBottom>
            UniWai CRM
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.95, fontWeight: 400, maxWidth: 360, textAlign: "center" }}>
            Vende más por WhatsApp con bots, Kanban, campañas y pagos in-chat.
          </Typography>
          <Stack spacing={1} sx={{ mt: 4, alignSelf: "flex-start" }}>
            {["Inbox unificado multi-número", "Bot Builder con IA segura", "Mercado Pago en el dashboard"].map((item) => (
              <Typography key={item} variant="body2" sx={{ opacity: 0.9 }}>
                • {item}
              </Typography>
            ))}
          </Stack>
        </Box>

        <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {subtitle}
            </Typography>
            {children}
            {footer ? <Box sx={{ mt: 3 }}>{footer}</Box> : null}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

export function AuthPageShell({ children }: { children: React.ReactNode }) {
  return (
    <ModernizeProvider>
      <AuthPageChrome>{children}</AuthPageChrome>
    </ModernizeProvider>
  );
}

function AuthPageChrome({ children }: { children: React.ReactNode }) {
  const { mode, toggleMode } = useThemeMode();

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "background.default", position: "relative" }}>
      <Stack direction="row" spacing={1} sx={{ position: "absolute", top: 16, right: 16, zIndex: 2, alignItems: "center" }}>
        <Tooltip title={mode === "light" ? "Modo oscuro" : "Modo claro"}>
          <IconButton onClick={toggleMode} aria-label="Cambiar tema" size="small">
            {mode === "light" ? <DarkModeOutlined /> : <LightModeOutlined />}
          </IconButton>
        </Tooltip>
        <Typography component={Link} href="/" variant="body2" color="text.secondary" sx={{ textDecoration: "none", "&:hover": { color: "primary.main" } }}>
          ← Inicio
        </Typography>
      </Stack>
      {children}
    </Box>
  );
}

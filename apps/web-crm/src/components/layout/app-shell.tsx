"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress, Container, useMediaQuery, useTheme } from "@mui/material";
import { useAuth } from "@/src/context/auth-context";
import { DashboardHeader } from "@/src/components/layout/dashboard-header";
import { DashboardSidebar } from "@/src/components/layout/dashboard-sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { loading, crmUser } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));

  function handleMenuToggle() {
    if (isDesktop) setSidebarOpen((o) => !o);
    else setMobileOpen((o) => !o);
  }

  useEffect(() => {
    if (!loading && !crmUser) {
      router.replace("/login");
    }
  }, [loading, crmUser, router]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
        }}
      >
        <CircularProgress aria-label="Cargando sesión" />
      </Box>
    );
  }

  if (!crmUser) return null;

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh", bgcolor: "background.default" }}>
      <DashboardSidebar
        desktopOpen={sidebarOpen}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <DashboardHeader onMenuClick={handleMenuToggle} />

        <Box component="main" sx={{ flex: 1, py: { xs: 2, md: 3 }, px: { xs: 2, md: 3 } }}>
          <Container maxWidth="xl" disableGutters>
            {children}
          </Container>
        </Box>
      </Box>
    </Box>
  );
}

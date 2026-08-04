"use client";

import { Alert, Box } from "@mui/material";
import { Role } from "@uniwai/shared";
import { useAuth } from "@/src/context/auth-context";
import { useTenantImpersonation } from "@/src/context/tenant-impersonation-context";

/** Bloquea módulos tenant-scoped si superadmin no eligió negocio. */
export function TenantScopeGate({ children }: { children: React.ReactNode }) {
  const { crmUser } = useAuth();
  const { needsTenant } = useTenantImpersonation();

  if (crmUser?.role === Role.SUPERADMIN && needsTenant) {
    return (
      <Box sx={{ py: 2 }}>
        <Alert severity="info">
          Selecciona un <strong>negocio activo</strong> en el panel lateral para usar este módulo.
          También puedes registrar un owner en <strong>/register</strong> para probar como cliente.
        </Alert>
      </Box>
    );
  }

  return <>{children}</>;
}

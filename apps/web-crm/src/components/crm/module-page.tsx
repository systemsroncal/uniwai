"use client";

import { Stack } from "@mui/material";
import { TenantScopeGate } from "@/src/components/crm/tenant-scope-gate";

type ModulePageProps = {
  children: React.ReactNode;
};

/** Wrapper estándar para páginas CRM tenant-scoped. */
export function ModulePage({ children }: ModulePageProps) {
  return (
    <Stack spacing={3}>
      <TenantScopeGate>{children}</TenantScopeGate>
    </Stack>
  );
}

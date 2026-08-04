"use client";

import { useEffect, useState } from "react";
import { Alert, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import { Role } from "@uniwai/shared";
import { useAuth } from "@/src/context/auth-context";
import { useTenantImpersonation, type TenantOption } from "@/src/context/tenant-impersonation-context";
import { apiFetch } from "@/src/lib/api";

type TenantsResponse = {
  data: Array<{ id: string; name: string; slug: string; status: string }>;
};

export function TenantSelector() {
  const { crmUser } = useAuth();
  const { tenantId, tenantName, setTenant, needsTenant, isImpersonating } = useTenantImpersonation();
  const [tenants, setTenants] = useState<TenantOption[]>([]);

  useEffect(() => {
    if (crmUser?.role !== Role.SUPERADMIN) return;
    async function load() {
      try {
        const res = await apiFetch<TenantsResponse>("/admin/tenants");
        setTenants(res.data.map((t) => ({ id: t.id, name: t.name, slug: t.slug })));
      } catch {
        setTenants([]);
      }
    }
    void load();
  }, [crmUser?.role]);

  if (crmUser?.role !== Role.SUPERADMIN) return null;

  return (
    <Stack spacing={1} sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: "divider", bgcolor: "action.hover" }}>
      {needsTenant ? (
        <Alert severity="warning" sx={{ py: 0 }}>
          Selecciona un negocio para usar los módulos CRM
        </Alert>
      ) : null}
      <FormControl size="small" fullWidth>
        <InputLabel id="tenant-select-label">Negocio activo</InputLabel>
        <Select
          labelId="tenant-select-label"
          label="Negocio activo"
          value={tenantId ?? ""}
          onChange={(e) => {
            const id = e.target.value as string;
            const t = tenants.find((x) => x.id === id);
            setTenant(id || null, t?.name ?? null);
            window.location.reload();
          }}
        >
          <MenuItem value="">
            <em>— Plataforma (sin tenant) —</em>
          </MenuItem>
          {tenants.map((t) => (
            <MenuItem key={t.id} value={t.id}>
              {t.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {isImpersonating ? (
        <Typography variant="caption" color="text.secondary">
          Operando como: {tenantName}
        </Typography>
      ) : null}
    </Stack>
  );
}

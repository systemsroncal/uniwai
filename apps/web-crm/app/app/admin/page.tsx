"use client";

import { useEffect, useState } from "react";
import { Role, Permission, TENANT_STATUS_ES, labelEs } from "@uniwai/shared";
import { useAuth } from "@/src/context/auth-context";
import { apiFetch } from "@/src/lib/api";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { CrmPageHeader } from "@/src/components/crm/crm-page-header";

type StatsResponse = {
  data: { tenants: number; activeTenants: number; users: number; messages: number };
};

type TenantsResponse = {
  data: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    createdAt: string;
    _count: { users: number; contacts: number };
  }>;
};

export default function AdminPage() {
  const { crmUser, can } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<StatsResponse["data"] | null>(null);
  const [tenants, setTenants] = useState<TenantsResponse["data"]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (crmUser && crmUser.role !== Role.SUPERADMIN) {
      router.replace("/app");
    }
  }, [crmUser, router]);

  async function load() {
    try {
      const [statsRes, tenantsRes] = await Promise.all([
        apiFetch<StatsResponse>("/admin/stats"),
        apiFetch<TenantsResponse>("/admin/tenants"),
      ]);
      setStats(statsRes.data);
      setTenants(tenantsRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar admin");
    }
  }

  useEffect(() => {
    if (crmUser?.role === Role.SUPERADMIN) void load();
  }, [crmUser]);

  async function setTenantStatus(tenantId: string, status: "ACTIVE" | "SUSPENDED" | "BANNED") {
    if (!can(Permission.SUSPEND_TENANT)) return;
    setBusyId(tenantId);
    try {
      await apiFetch(`/admin/tenants/${tenantId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar tenant");
    } finally {
      setBusyId(null);
    }
  }

  if (crmUser?.role !== Role.SUPERADMIN) return null;

  return (
    <Stack spacing={3}>
      <CrmPageHeader
        title="Panel Superadmin"
        subtitle="Estadísticas globales, gestión de clientes y moderación de la plataforma."
      />

      {error ? <Alert severity="error">{error}</Alert> : null}

      {stats ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
          {[
            ["Tenants", stats.tenants],
            ["Activos", stats.activeTenants],
            ["Usuarios", stats.users],
            ["Mensajes", stats.messages],
          ].map(([label, value]) => (
            <Card key={label} variant="outlined">
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  {label}
                </Typography>
                <Typography variant="h5" fontWeight={600}>
                  {value}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : null}

      <Card>
        <CardContent sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Negocio</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Usuarios</TableCell>
                <TableCell>Contactos</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <Typography fontWeight={600}>{tenant.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {tenant.slug}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={labelEs(TENANT_STATUS_ES, tenant.status)}
                      size="small"
                      color={tenant.status === "ACTIVE" ? "success" : "error"}
                    />
                  </TableCell>
                  <TableCell>{tenant._count.users}</TableCell>
                  <TableCell>{tenant._count.contacts}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      {tenant.status !== "ACTIVE" ? (
                        <Button size="small" disabled={busyId === tenant.id} onClick={() => void setTenantStatus(tenant.id, "ACTIVE")}>
                          Activar
                        </Button>
                      ) : (
                        <Button size="small" color="warning" disabled={busyId === tenant.id} onClick={() => void setTenantStatus(tenant.id, "SUSPENDED")}>
                          Suspender
                        </Button>
                      )}
                      <Button size="small" color="error" disabled={busyId === tenant.id} onClick={() => void setTenantStatus(tenant.id, "BANNED")}>
                        Banear
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Stack>
  );
}

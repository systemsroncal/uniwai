"use client";

import { useEffect, useState } from "react";
import { Role } from "@uniwai/shared";
import { useAuth } from "@/src/context/auth-context";
import { useRouter } from "next/navigation";
import { Alert, Card, CardContent, Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { apiFetch } from "@/src/lib/api";
import { CrmPageHeader } from "@/src/components/crm/crm-page-header";

type Plan = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priceMonthly: string | null;
  currency: string;
  limits: Record<string, unknown>;
  isActive: boolean;
};

export default function AdminPlansPage() {
  const { crmUser } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (crmUser?.role !== Role.SUPERADMIN) router.replace("/app");
  }, [crmUser, router]);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch<{ data: Plan[] }>("/admin/plans");
        setPlans(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      }
    }
    if (crmUser?.role === Role.SUPERADMIN) void load();
  }, [crmUser]);

  if (crmUser?.role !== Role.SUPERADMIN) return null;

  return (
    <Stack spacing={3}>
      <CrmPageHeader title="Planes y precios" subtitle="Catálogo SaaS: límites de bots, flujos, vendedores y marketing por tier." />
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Card>
        <CardContent sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Plan</TableCell>
                <TableCell>Precio</TableCell>
                <TableCell>Límites</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {plans.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Typography fontWeight={600}>{p.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{p.slug}</Typography>
                  </TableCell>
                  <TableCell>
                    {p.priceMonthly ? `${p.currency} ${Number(p.priceMonthly).toFixed(2)}/mes` : "Custom"}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" component="pre" sx={{ whiteSpace: "pre-wrap" }}>
                      {JSON.stringify(p.limits, null, 0)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={p.isActive ? "Activo" : "Inactivo"} color={p.isActive ? "success" : "default"} />
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

"use client";

import { Alert, Card, CardContent, Stack, Typography } from "@mui/material";
import { useAuth } from "@/src/context/auth-context";
import { PLAN_SLUG_ES, labelEs } from "@uniwai/shared";
import { CrmPageHeader } from "@/src/components/crm/crm-page-header";
import { ModulePage } from "@/src/components/crm/module-page";

export default function BillingPage() {
  const { planSlug, tenantName } = useAuth();

  return (
    <ModulePage>
      <CrmPageHeader title="Facturación y plan" subtitle="Gestiona tu suscripción UniWai CRM y métodos de pago de la plataforma." />
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography><strong>Negocio:</strong> {tenantName ?? "—"}</Typography>
            <Typography><strong>Plan actual:</strong> {planSlug ? labelEs(PLAN_SLUG_ES, planSlug) : "Prueba"}</Typography>
            <Alert severity="info">
              Los pagos in-chat de tus clientes se configuran en Configuración → Mercado Pago.
            </Alert>
          </Stack>
        </CardContent>
      </Card>
    </ModulePage>
  );
}

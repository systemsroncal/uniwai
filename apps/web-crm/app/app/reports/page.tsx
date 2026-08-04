"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import DownloadOutlined from "@mui/icons-material/DownloadOutlined";
import { apiFetch, apiFetchBlob } from "@/src/lib/api";
import { CrmPageHeader } from "@/src/components/crm/crm-page-header";
import { ModulePage } from "@/src/components/crm/module-page";

type Summary = {
  orderCount: number;
  totalRevenue: string | number;
  paidOrders: number;
  orders: Array<{
    id: string;
    status: string;
    total: string | number;
    createdAt: string;
    contact: { name: string | null; phone: string };
  }>;
};

export default function ReportsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch<{ data: Summary }>("/reports/sales/summary");
        setSummary(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar reportes");
      }
    }
    void load();
  }, []);

  async function downloadExcel() {
    setDownloading(true);
    setError(null);
    try {
      const blob = await apiFetchBlob("/reports/sales/export.xlsx");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `uniwai-ventas-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al exportar");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <ModulePage>
    <Stack spacing={3}>
      <CrmPageHeader
        title="Reportes de ventas"
        subtitle="Resumen de órdenes y exportación Excel con 2 hojas: estadísticas + compradores."
      />

      {error ? <Alert severity="error">{error}</Alert> : null}

      {summary ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
          {[
            ["Órdenes", summary.orderCount],
            ["Pagadas", summary.paidOrders],
            ["Ingresos", `S/ ${Number(summary.totalRevenue).toFixed(2)}`],
            ["Ticket prom.", summary.orderCount ? `S/ ${(Number(summary.totalRevenue) / summary.orderCount).toFixed(2)}` : "—"],
          ].map(([label, value]) => (
            <Card key={label} variant="outlined">
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  {label}
                </Typography>
                <Typography variant="h6" fontWeight={600}>
                  {value}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : null}

      <Button
        variant="contained"
        startIcon={<DownloadOutlined />}
        onClick={() => void downloadExcel()}
        disabled={downloading}
      >
        {downloading ? "Generando…" : "Descargar Excel (.xlsx)"}
      </Button>
    </Stack>
    </ModulePage>
  );
}

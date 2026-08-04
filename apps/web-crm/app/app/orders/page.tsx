"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Card,
  CardContent,
  Chip,
} from "@mui/material";
import {
  ORDER_STATUS_ES,
  ORDER_PAYMENT_STATUS_ES,
  labelEs,
} from "@uniwai/shared";
import { apiFetch } from "@/src/lib/api";
import { CrmPageHeader } from "@/src/components/crm/crm-page-header";
import { ModulePage } from "@/src/components/crm/module-page";

type Order = {
  id: string;
  status: string;
  paymentStatus: string;
  total: string | number;
  createdAt: string;
  contact: { name: string | null; phone: string };
};

const STATUSES = ["DRAFT", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: Order[] }>("/orders");
      setOrders(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar pedidos");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateStatus(orderId: string, status: string) {
    setBusyId(orderId);
    try {
      await apiFetch(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar");
    } finally {
      setBusyId(null);
    }
  }

  const filtered = filter === "ALL" ? orders : orders.filter((o) => o.status === filter);

  return (
    <ModulePage>
      <CrmPageHeader title="Pedidos" subtitle="Gestiona el estado de cada pedido del checkout in-chat." />
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Stack direction="row" spacing={2} alignItems="center">
        <TextField select size="small" label="Filtrar" value={filter} onChange={(e) => setFilter(e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="ALL">Todos</MenuItem>
          {STATUSES.map((s) => (
            <MenuItem key={s} value={s}>{labelEs(ORDER_STATUS_ES, s)}</MenuItem>
          ))}
        </TextField>
        <Typography variant="body2" color="text.secondary">{filtered.length} pedidos</Typography>
      </Stack>
      <Card>
        <CardContent sx={{ overflowX: "auto", p: 0 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Cliente</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Pago</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Fecha</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>Sin pedidos.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{o.contact.name ?? o.contact.phone}</Typography>
                      <Typography variant="caption" color="text.secondary">{o.contact.phone}</Typography>
                    </TableCell>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        value={o.status}
                        disabled={busyId === o.id}
                        onChange={(e) => void updateStatus(o.id, e.target.value)}
                        sx={{ minWidth: 130 }}
                      >
                        {STATUSES.map((s) => (
                          <MenuItem key={s} value={s}>{labelEs(ORDER_STATUS_ES, s)}</MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell><Chip size="small" variant="outlined" label={labelEs(ORDER_PAYMENT_STATUS_ES, o.paymentStatus)} /></TableCell>
                    <TableCell align="right">S/ {Number(o.total).toFixed(2)}</TableCell>
                    <TableCell>{new Date(o.createdAt).toLocaleDateString("es-PE")}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </ModulePage>
  );
}

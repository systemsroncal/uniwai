"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, type KanbanColumn } from "@/src/lib/api";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import ForumOutlined from "@mui/icons-material/ForumOutlined";
import { CrmPageHeader } from "@/src/components/crm/crm-page-header";

type ColumnsResponse = { data: KanbanColumn[] };

type SelectedContact = KanbanColumn["contacts"][number] | null;

export function KanbanBoard() {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [selected, setSelected] = useState<SelectedContact>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<ColumnsResponse>("/kanban/columns");
      setColumns(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar Kanban");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function bootstrap() {
    setBusyId("bootstrap");
    try {
      await apiFetch("/kanban/bootstrap", { method: "POST" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo inicializar");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleBot(contactId: string, enabled: boolean) {
    setBusyId(contactId);
    try {
      await apiFetch(`/contacts/${contactId}/bot-toggle`, {
        method: "PATCH",
        body: JSON.stringify({ enabled }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cambiar bot");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={2}>
        <CrmPageHeader
          title="CRM Kanban"
          subtitle="Selecciona un prospecto para ver detalle, escribir o abrir el chat."
        />
        <Button variant="outlined" disabled={busyId === "bootstrap"} onClick={() => void bootstrap()}>
          Inicializar columnas
        </Button>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loading ? (
        <Typography color="text.secondary">Cargando pipeline…</Typography>
      ) : columns.length === 0 ? (
        <Alert severity="info">No hay columnas. Pulsa «Inicializar columnas».</Alert>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1fr 320px" }, gap: 2 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(4, 1fr)" }, gap: 2, overflowX: "auto" }}>
            {columns.map((column) => (
              <Card key={column.id} variant="outlined" sx={{ minHeight: 320 }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography fontWeight={600}>{column.name}</Typography>
                    <Chip label={column._count.contacts} size="small" />
                  </Stack>
                  <Stack spacing={1}>
                    {column.contacts.length === 0 ? (
                      <Typography variant="caption" color="text.secondary">
                        Sin prospectos
                      </Typography>
                    ) : (
                      column.contacts.map((contact) => (
                        <Card
                          key={contact.id}
                          variant={selected?.id === contact.id ? "elevation" : "outlined"}
                          sx={{
                            cursor: "pointer",
                            borderColor: selected?.id === contact.id ? "primary.main" : undefined,
                            borderWidth: selected?.id === contact.id ? 2 : 1,
                          }}
                          onClick={() => setSelected(contact)}
                        >
                          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                            <Typography variant="body2" fontWeight={600}>
                              {contact.name ?? "Sin nombre"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {contact.phone}
                            </Typography>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Card sx={{ position: { xl: "sticky" }, top: 88, alignSelf: "start" }}>
            <CardContent>
              {selected ? (
                <>
                  <Typography variant="h6" fontWeight={600}>
                    {selected.name ?? "Prospecto"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selected.phone}
                  </Typography>
                  <Chip
                    label={selected.botEnabled ? "Bot activo" : "Humano (bot pausado)"}
                    color={selected.botEnabled ? "primary" : "warning"}
                    size="small"
                    sx={{ mt: 2 }}
                  />
                  <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={busyId === selected.id}
                      onClick={() => void toggleBot(selected.id, !selected.botEnabled)}
                    >
                      {selected.botEnabled ? "Tomar chat (humano)" : "Reactivar bot"}
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      component={Link}
                      href={`/app/inbox?contact=${selected.id}`}
                      startIcon={<ForumOutlined />}
                    >
                      Abrir chat
                    </Button>
                  </Stack>
                  {selected.lastMessageAt ? (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
                      Último mensaje: {new Date(selected.lastMessageAt).toLocaleString("es-PE")}
                    </Typography>
                  ) : null}
                </>
              ) : (
                <Typography color="text.secondary">Selecciona una tarjeta del pipeline.</Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      )}
    </Stack>
  );
}

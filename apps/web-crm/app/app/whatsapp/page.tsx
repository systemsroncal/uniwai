"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { apiFetch } from "@/src/lib/api";
import {
  WHATSAPP_STATUS_ES,
  WHATSAPP_CONNECTION_ES,
  labelEs,
} from "@uniwai/shared";
import { CrmPageHeader } from "@/src/components/crm/crm-page-header";
import { ModulePage } from "@/src/components/crm/module-page";
import { WhatsAppQrPanel } from "@/src/components/crm/whatsapp-qr-panel";
import { ConfirmDeleteDialog } from "@/src/components/crm/confirm-delete-dialog";

type WaInstance = {
  id: string;
  label: string | null;
  phoneNumber: string | null;
  connectionType: "BAILEYS" | "META_CLOUD";
  status: string;
  isInWarmupNetwork: boolean;
};

export default function WhatsAppPage() {
  const [instances, setInstances] = useState<WaInstance[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("");
  const [connectionType, setConnectionType] = useState<"BAILEYS" | "META_CLOUD">("BAILEYS");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: WaInstance[] }>("/whatsapp/instances");
      setInstances(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar números");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleConnectionChange = useCallback(
    (instanceId: string, newStatus: string, phone?: string | null) => {
      setInstances((prev) =>
        prev.map((inst) =>
          inst.id === instanceId
            ? { ...inst, status: newStatus, phoneNumber: phone ?? inst.phoneNumber }
            : inst,
        ),
      );
    },
    [],
  );

  async function createInstance(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch("/whatsapp/instances", {
        method: "POST",
        body: JSON.stringify({ label, connectionType, phoneNumber: phoneNumber || undefined }),
      });
      setLabel("");
      setPhoneNumber("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear instancia");
    }
  }

  async function toggleNetwork(id: string, join: boolean) {
    try {
      await apiFetch(`/whatsapp/instances/${id}/network`, {
        method: "PATCH",
        body: JSON.stringify({ joinWarmupNetwork: join }),
      });
      setInstances((prev) => prev.map((i) => (i.id === id ? { ...i, isInWarmupNetwork: join } : i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar red");
    }
  }

  async function disconnect(id: string) {
    setBusy(true);
    try {
      await apiFetch(`/whatsapp/instances/${id}/disconnect`, { method: "POST" });
      setInstances((prev) => prev.map((i) => (i.id === id ? { ...i, status: "DISCONNECTED" } : i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al desconectar");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setBusy(true);
    try {
      await apiFetch(`/whatsapp/instances/${deleteId}`, { method: "DELETE" });
      setDeleteId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModulePage>
      <Stack spacing={3}>
        <CrmPageHeader
          title="Números WhatsApp"
          subtitle="Conecta por QR o Meta Cloud API."
        />

        {error ? <Alert severity="error">{error}</Alert> : null}

        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Agregar número
            </Typography>
            <Box component="form" onSubmit={createInstance} sx={{ display: "grid", gap: 2, maxWidth: 480 }}>
              <TextField label="Etiqueta" value={label} onChange={(e) => setLabel(e.target.value)} required fullWidth />
              <TextField select label="Tipo" value={connectionType} onChange={(e) => setConnectionType(e.target.value as "BAILEYS" | "META_CLOUD")} fullWidth>
                <MenuItem value="BAILEYS">QR / WhatsApp Business</MenuItem>
                <MenuItem value="META_CLOUD">Meta Cloud API</MenuItem>
              </TextField>
              <TextField label="Teléfono (opcional)" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} fullWidth />
              <Button type="submit" variant="contained">Crear instancia</Button>
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" } }}>
          {loading ? (
            <Typography color="text.secondary">Cargando…</Typography>
          ) : instances.length === 0 ? (
            <Typography color="text.secondary">Aún no hay números conectados.</Typography>
          ) : (
            instances.map((inst) => (
              <Card key={inst.id} variant="outlined">
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography fontWeight={600}>{inst.label ?? "Sin etiqueta"}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {inst.phoneNumber ?? "Pendiente de vincular"}
                      </Typography>
                    </Box>
                    <Chip label={labelEs(WHATSAPP_STATUS_ES, inst.status)} size="small" color={inst.status === "CONNECTED" ? "success" : "default"} />
                  </Stack>
                  <Chip label={labelEs(WHATSAPP_CONNECTION_ES, inst.connectionType)} size="small" sx={{ mt: 1 }} variant="outlined" />
                  <FormControlLabel
                    sx={{ mt: 2, display: "block" }}
                    control={<Switch checked={inst.isInWarmupNetwork} onChange={(e) => void toggleNetwork(inst.id, e.target.checked)} />}
                    label="Red de calentamiento"
                  />
                  {inst.connectionType === "BAILEYS" ? (
                    <WhatsAppQrPanel
                      instanceId={inst.id}
                      status={inst.status}
                      onStatusChange={(s, phone) => handleConnectionChange(inst.id, s, phone)}
                      onMissing={() => void load()}
                    />
                  ) : null}
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Button component={Link} href="/app/warmup" size="small">Calentador</Button>
                    {inst.status === "CONNECTED" ? (
                      <Button size="small" color="warning" disabled={busy} onClick={() => void disconnect(inst.id)}>
                        Desconectar
                      </Button>
                    ) : null}
                    <Button size="small" color="error" onClick={() => setDeleteId(inst.id)}>
                      Eliminar
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      </Stack>

      <ConfirmDeleteDialog
        open={Boolean(deleteId)}
        title="Eliminar número WhatsApp"
        description="Se borrará la instancia y dejará de aparecer en la lista. La sesión QR se perderá."
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        busy={busy}
      />
    </ModulePage>
  );
}

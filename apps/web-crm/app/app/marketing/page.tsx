"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { apiFetch, apiUpload } from "@/src/lib/api";
import { CAMPAIGN_STATUS_ES, CAMPAIGN_CHANNEL_ES, labelEs } from "@uniwai/shared";
import { CrmPageHeader } from "@/src/components/crm/crm-page-header";
import { ModulePage } from "@/src/components/crm/module-page";

type Campaign = {
  id: string;
  name: string;
  channel: string;
  status: string;
  messageTemplate: string;
  _count: { contacts: number };
};

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<"BAILEYS_QR" | "META_CLOUD_API">("BAILEYS_QR");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [importingId, setImportingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: Campaign[] }>("/campaigns");
      setCampaigns(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar campañas");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function importExcel(campaignId: string, file: File) {
    setImportingId(campaignId);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await apiUpload<{ data: { imported: number } }>(`/campaigns/${campaignId}/import`, fd);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al importar Excel");
    } finally {
      setImportingId(null);
    }
  }

  async function createCampaign(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch("/campaigns", {
        method: "POST",
        body: JSON.stringify({ name, channel, messageTemplate: message }),
      });
      setName("");
      setMessage("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear campaña");
    }
  }

  return (
    <ModulePage>
    <Stack spacing={3}>
      <CrmPageHeader
        title="Marketing y campañas"
        subtitle="Campañas masivas con importación Excel, remarketing y límites anti-ban por canal (499 QR · hasta 3k Meta API)."
      />
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Alert severity="info">
        Importa contactos desde Excel (.xlsx) con columnas teléfono y nombre. Máx. 499 contactos en canal QR.
      </Alert>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Nueva campaña
          </Typography>
          <Box component="form" onSubmit={createCampaign} sx={{ display: "grid", gap: 2, maxWidth: 560 }}>
            <TextField label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
            <TextField select label="Canal" value={channel} onChange={(e) => setChannel(e.target.value as typeof channel)} fullWidth>
              <MenuItem value="BAILEYS_QR">QR / Baileys (máx. 499 contactos)</MenuItem>
              <MenuItem value="META_CLOUD_API">Meta Cloud API (según plan)</MenuItem>
            </TextField>
            <TextField
              label="Mensaje / plantilla"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              multiline
              minRows={4}
              required
              fullWidth
            />
            <Button type="submit" variant="contained">
              Crear borrador
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Stack spacing={1}>
        {campaigns.map((c) => (
          <Card key={c.id} variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                <Box>
                  <Typography fontWeight={600}>{c.name}</Typography>
                  <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 480 }}>
                    {c.messageTemplate.slice(0, 120)}
                    {c.messageTemplate.length > 120 ? "…" : ""}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Chip label={labelEs(CAMPAIGN_STATUS_ES, c.status)} size="small" />
                  <Chip label={labelEs(CAMPAIGN_CHANNEL_ES, c.channel)} size="small" variant="outlined" />
                  <Chip label={`${c._count.contacts} contactos`} size="small" />
                  <Button
                    component="label"
                    size="small"
                    variant="outlined"
                    disabled={importingId === c.id}
                  >
                    {importingId === c.id ? "Importando…" : "Importar Excel"}
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      hidden
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void importExcel(c.id, f);
                        e.target.value = "";
                      }}
                    />
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Stack>
    </ModulePage>
  );
}

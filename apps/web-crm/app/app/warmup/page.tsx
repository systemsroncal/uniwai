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
import { apiFetch } from "@/src/lib/api";
import { WHATSAPP_STATUS_ES, labelEs } from "@uniwai/shared";
import { isValidE164 } from "@/src/lib/phone";
import { CrmPageHeader } from "@/src/components/crm/crm-page-header";
import { ModulePage } from "@/src/components/crm/module-page";
import { DynamicFieldList } from "@/src/components/crm/dynamic-field-list";
import {
  PhoneFieldList,
  emptyPhoneRow,
  phoneRowsFromE164List,
  phoneRowsToE164,
  type PhoneRow,
} from "@/src/components/crm/phone-field-list";

type WaInstance = { id: string; label: string | null; phoneNumber: string | null; status: string };
type WarmupConfig = {
  id: string;
  whatsAppInstanceId: string;
  joinWarmupNetwork: boolean;
  manualDestinationPhones: string[];
  messageTemplates: unknown;
  dailyMessageLimit: number;
  whatsAppInstance: WaInstance;
};

function parseMessageTemplates(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  return [];
}

export default function WarmupPage() {
  const [instances, setInstances] = useState<WaInstance[]>([]);
  const [configs, setConfigs] = useState<WarmupConfig[]>([]);
  const [instanceId, setInstanceId] = useState("");
  const [phoneRows, setPhoneRows] = useState<PhoneRow[]>([emptyPhoneRow()]);
  const [messageLines, setMessageLines] = useState<string[]>([""]);
  const [dailyLimit, setDailyLimit] = useState(10);
  const [joinNetwork, setJoinNetwork] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const applyConfigToForm = useCallback((cfg: WarmupConfig | undefined) => {
    if (!cfg) {
      setPhoneRows([emptyPhoneRow()]);
      setMessageLines([""]);
      setDailyLimit(10);
      setJoinNetwork(false);
      return;
    }
    setPhoneRows(phoneRowsFromE164List(cfg.manualDestinationPhones));
    const msgs = parseMessageTemplates(cfg.messageTemplates);
    setMessageLines(msgs.length ? msgs : [""]);
    setDailyLimit(cfg.dailyMessageLimit);
    setJoinNetwork(cfg.joinWarmupNetwork);
  }, []);

  const load = useCallback(async () => {
    try {
      const [wa, warm] = await Promise.all([
        apiFetch<{ data: WaInstance[] }>("/whatsapp/instances"),
        apiFetch<{ data: WarmupConfig[] }>("/warmup/configs"),
      ]);
      setInstances(wa.data);
      setConfigs(warm.data);
      if (!instanceId && wa.data[0]) setInstanceId(wa.data[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar");
    }
  }, [instanceId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!instanceId) return;
    const cfg = configs.find((c) => c.whatsAppInstanceId === instanceId);
    applyConfigToForm(cfg);
  }, [instanceId, configs, applyConfigToForm]);

  async function saveConfig(e: React.FormEvent) {
    e.preventDefault();
    if (!instanceId) return;

    setError(null);
    setSuccess(null);

    const phones = phoneRowsToE164(phoneRows);
    const invalid = phones.filter((p) => !isValidE164(p));
    if (invalid.length) {
      setError(`Número inválido: ${invalid[0]}. Revisa país y dígitos.`);
      return;
    }

    const templates = messageLines.map((m) => m.trim()).filter(Boolean);

    setSaving(true);
    try {
      await apiFetch("/warmup/configs", {
        method: "PUT",
        body: JSON.stringify({
          whatsAppInstanceId: instanceId,
          joinWarmupNetwork: joinNetwork,
          manualDestinationPhones: phones,
          messageTemplates: templates,
          dailyMessageLimit: dailyLimit || 10,
          isActive: true,
        }),
      });
      setSuccess("Configuración guardada correctamente.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModulePage>
      <Stack spacing={3}>
        <CrmPageHeader
          title="Calentador de números"
          subtitle="Envía mensajes rotativos entre números de la red CRM y destinos manuales. Simula presencia «escribiendo» para reducir riesgo de baneo."
        />
        {error ? <Alert severity="error">{error}</Alert> : null}
        {success ? <Alert severity="success">{success}</Alert> : null}

        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Configuración por número
            </Typography>
            <Box component="form" onSubmit={saveConfig} sx={{ display: "grid", gap: 3, maxWidth: 640 }}>
              <TextField
                select
                label="Número WhatsApp"
                value={instanceId}
                onChange={(e) => setInstanceId(e.target.value)}
                fullWidth
                required
              >
                {instances.map((i) => (
                  <MenuItem key={i.id} value={i.id}>
                    {i.label ?? i.phoneNumber ?? i.id} ({labelEs(WHATSAPP_STATUS_ES, i.status)})
                  </MenuItem>
                ))}
              </TextField>

              <PhoneFieldList rows={phoneRows} onChange={setPhoneRows} />

              <DynamicFieldList
                label="Mensajes de calentamiento"
                hint="Usa Spintax: {Hola|Buenos días} ¿cómo estás?"
                values={messageLines}
                onChange={setMessageLines}
                placeholder="Escribe un mensaje…"
                addLabel="Agregar mensaje"
              />

              <TextField
                type="number"
                label="Límite diario de mensajes"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(Math.max(1, Number(e.target.value) || 1))}
                inputProps={{ min: 1, max: 100 }}
                fullWidth
              />

              <TextField
                select
                label="Red CRM de calentamiento"
                value={joinNetwork ? "yes" : "no"}
                onChange={(e) => setJoinNetwork(e.target.value === "yes")}
                fullWidth
              >
                <MenuItem value="no">Solo números manuales</MenuItem>
                <MenuItem value="yes">Unirse a red P2P del CRM (opt-in)</MenuItem>
              </TextField>

              <Button type="submit" variant="contained" disabled={saving || !instanceId}>
                {saving ? "Guardando…" : "Guardar configuración"}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {configs.length > 0 ? (
          <Box>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Configuraciones activas
            </Typography>
            <Stack spacing={1}>
              {configs.map((cfg) => (
                <Card key={cfg.id} variant="outlined">
                  <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={1}>
                      <Typography fontWeight={600}>
                        {cfg.whatsAppInstance.label ?? cfg.whatsAppInstance.phoneNumber}
                      </Typography>
                      <Chip size="small" label={`${cfg.dailyMessageLimit}/día`} />
                      <Chip size="small" label={`${cfg.manualDestinationPhones.length} destinos`} variant="outlined" />
                      {cfg.joinWarmupNetwork ? <Chip size="small" color="primary" label="Red CRM" /> : null}
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Box>
        ) : null}
      </Stack>
    </ModulePage>
  );
}

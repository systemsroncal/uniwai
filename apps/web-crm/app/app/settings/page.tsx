"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { Role } from "@uniwai/shared";
import { useAuth } from "@/src/context/auth-context";
import { apiFetch } from "@/src/lib/api";
import { CrmPageHeader } from "@/src/components/crm/crm-page-header";
import { ModulePage } from "@/src/components/crm/module-page";

function AiKeysForm() {
  const [defaultProvider, setDefaultProvider] = useState("openai");
  const [openaiKey, setOpenaiKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [deepseekKey, setDeepseekKey] = useState("");
  const [nvidiaKey, setNvidiaKey] = useState("");
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [googleSheetGid, setGoogleSheetGid] = useState("0");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch<{
      data: {
        defaultProvider: string;
        googleSheetUrl?: string;
        googleSheetGid?: string;
      };
    }>("/settings/ai")
      .then((res) => {
        setDefaultProvider(res.data.defaultProvider);
        setGoogleSheetUrl(res.data.googleSheetUrl ?? "");
        setGoogleSheetGid(res.data.googleSheetGid ?? "0");
      })
      .catch(() => null);
  }, []);

  async function saveAi(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await apiFetch("/settings/ai", {
        method: "PUT",
        body: JSON.stringify({
          defaultProvider,
          openaiKey: openaiKey || undefined,
          geminiKey: geminiKey || undefined,
          deepseekKey: deepseekKey || undefined,
          nvidiaKey: nvidiaKey || undefined,
          googleSheetUrl: googleSheetUrl.trim(),
          googleSheetGid: googleSheetGid.trim() || "0",
        }),
      });
      setOpenaiKey("");
      setGeminiKey("");
      setDeepseekKey("");
      setNvidiaKey("");
      setMessage("Configuración de IA y Google Sheet guardada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    }
  }

  return (
    <Box component="form" onSubmit={saveAi} sx={{ display: "grid", gap: 2, maxWidth: 560 }}>
      {message ? <Alert severity="success">{message}</Alert> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Typography variant="subtitle2" fontWeight={600}>
        API keys (BYOK)
      </Typography>
      <TextField
        select
        label="Proveedor por defecto"
        value={defaultProvider}
        onChange={(e) => setDefaultProvider(e.target.value)}
        fullWidth
        SelectProps={{ native: true }}
      >
        <option value="openai">OpenAI</option>
        <option value="gemini">Gemini</option>
        <option value="deepseek">DeepSeek</option>
        <option value="nvidia">NVIDIA</option>
      </TextField>
      <TextField label="OpenAI API Key" type="password" value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} fullWidth />
      <TextField label="Gemini API Key" type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} fullWidth />
      <TextField label="DeepSeek API Key" type="password" value={deepseekKey} onChange={(e) => setDeepseekKey(e.target.value)} fullWidth />
      <TextField label="NVIDIA API Key" type="password" value={nvidiaKey} onChange={(e) => setNvidiaKey(e.target.value)} fullWidth />
      <Divider />
      <Typography variant="subtitle2" fontWeight={600}>
        Google Sheet (catálogo / datos)
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Pega la URL de un Sheet público (Archivo → Compartir → Cualquier persona con el enlace). El bot IA lo usará como contexto de productos y servicios.
      </Typography>
      <TextField
        label="URL de Google Sheet"
        value={googleSheetUrl}
        onChange={(e) => setGoogleSheetUrl(e.target.value)}
        placeholder="https://docs.google.com/spreadsheets/d/..."
        fullWidth
      />
      <TextField
        label="GID de pestaña (opcional)"
        value={googleSheetGid}
        onChange={(e) => setGoogleSheetGid(e.target.value)}
        helperText="0 = primera pestaña. Lo ves en la URL como gid=123456"
        fullWidth
      />
      <Button type="submit" variant="contained">Guardar configuración IA</Button>
    </Box>
  );
}

export default function SettingsPage() {
  const { crmUser, tenantName, planSlug } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [mpToken, setMpToken] = useState("");
  const [mpPublic, setMpPublic] = useState("");
  const [mpConfigured, setMpConfigured] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (crmUser && crmUser.role !== Role.OWNER) router.replace("/app");
  }, [crmUser, router]);

  useEffect(() => {
    async function loadMp() {
      try {
        const res = await apiFetch<{ data: { configured: boolean } }>("/settings/payments/mercadopago");
        setMpConfigured(res.data.configured);
      } catch {
        /* ignore if not configured */
      }
    }
    if (crmUser?.role === Role.OWNER) void loadMp();
  }, [crmUser]);

  if (crmUser?.role !== Role.OWNER) return null;

  async function saveMp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await apiFetch("/settings/payments/mercadopago", {
        method: "PUT",
        body: JSON.stringify({ accessToken: mpToken, publicKey: mpPublic }),
      });
      setMpConfigured(true);
      setMpToken("");
      setMpPublic("");
      setMessage("Credenciales de Mercado Pago guardadas de forma cifrada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    }
  }

  return (
    <ModulePage>
    <Stack spacing={3}>
      <CrmPageHeader title="Configuración" subtitle="Integraciones, facturación e IA de tu negocio." />

      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="General" />
        <Tab label="Mercado Pago" />
        <Tab label="IA (BYOK)" />
      </Tabs>

      {tab === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Workspace
            </Typography>
            <Stack spacing={1}>
              <Typography><strong>Negocio:</strong> {tenantName}</Typography>
              <Typography><strong>Plan:</strong> {planSlug ?? "—"}</Typography>
              <Typography><strong>Rol:</strong> {crmUser?.role}</Typography>
            </Stack>
          </CardContent>
        </Card>
      ) : null}

      {tab === 1 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Mercado Pago
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Configura tus credenciales aquí — no en variables de entorno. Se almacenan cifradas por tenant.
            </Typography>
            {mpConfigured ? <Alert severity="success" sx={{ mb: 2 }}>Mercado Pago configurado</Alert> : null}
            {message ? <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert> : null}
            {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
            <Box component="form" onSubmit={saveMp} sx={{ display: "grid", gap: 2, maxWidth: 480 }}>
              <TextField label="Access Token" value={mpToken} onChange={(e) => setMpToken(e.target.value)} required fullWidth type="password" />
              <TextField label="Public Key" value={mpPublic} onChange={(e) => setMpPublic(e.target.value)} required fullWidth />
              <Button type="submit" variant="contained">Guardar credenciales</Button>
            </Box>
          </CardContent>
        </Card>
      ) : null}

      {tab === 2 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              IA generativa (BYOK)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              API keys por proveedor para generar variantes de mensajes en el Bot Builder. Se almacenan cifradas.
            </Typography>
            <AiKeysForm />
          </CardContent>
        </Card>
      ) : null}
    </Stack>
    </ModulePage>
  );
}

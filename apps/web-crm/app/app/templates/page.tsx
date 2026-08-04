"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { apiFetch } from "@/src/lib/api";
import { CrmPageHeader } from "@/src/components/crm/crm-page-header";
import { ModulePage } from "@/src/components/crm/module-page";

type Template = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  isPublic: boolean;
  tenantId: string | null;
};

export default function FlowTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: Template[] }>("/flow-templates");
      setTemplates(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar plantillas");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createTemplate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch("/flow-templates", {
        method: "POST",
        body: JSON.stringify({ name, description, nodes: [], edges: [] }),
      });
      setName("");
      setDescription("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear plantilla");
    }
  }

  return (
    <ModulePage>
      <CrmPageHeader
        title="Plantillas de flujos"
        subtitle="Cada plantilla es un flujo base. Ábrela en el Bot Builder para editarla y guardarla como flujo activo de tu negocio."
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Card>
        <CardContent>
          <Box component="form" onSubmit={createTemplate} sx={{ display: "grid", gap: 2, maxWidth: 480 }}>
            <TextField label="Nombre plantilla" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
            <TextField label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline minRows={2} />
            <Button type="submit" variant="contained">Crear plantilla vacía</Button>
          </Box>
        </CardContent>
      </Card>
      <Stack spacing={1}>
        {templates.map((t) => (
          <Card key={t.id} variant="outlined">
            <CardContent sx={{ py: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
              <Box>
                <Typography fontWeight={600}>{t.name}</Typography>
                <Typography variant="body2" color="text.secondary">{t.description ?? "—"}</Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip size="small" label={t.tenantId ? "Propia" : "Global"} color={t.tenantId ? "default" : "primary"} />
                <Button
                  component={Link}
                  href={`/app/builder?templateId=${t.id}`}
                  variant="contained"
                  size="small"
                  startIcon={<EditOutlinedIcon />}
                >
                  Editar en Builder
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </ModulePage>
  );
}

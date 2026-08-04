"use client";

import { useCallback, useEffect, useState } from "react";
import { Role } from "@uniwai/shared";
import { useAuth } from "@/src/context/auth-context";
import { useRouter } from "next/navigation";
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
import { apiFetch } from "@/src/lib/api";
import { CrmPageHeader } from "@/src/components/crm/crm-page-header";

type Template = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  isPublic: boolean;
};

export default function AdminGlobalTemplatesPage() {
  const { crmUser } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("ventas");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: Template[] }>("/admin/flow-templates");
      setTemplates(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar");
    }
  }, []);

  useEffect(() => {
    if (crmUser?.role !== Role.SUPERADMIN) router.replace("/app");
  }, [crmUser, router]);

  useEffect(() => {
    if (crmUser?.role === Role.SUPERADMIN) void load();
  }, [crmUser, load]);

  async function createTemplate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch("/admin/flow-templates", {
        method: "POST",
        body: JSON.stringify({ name, description, category, nodes: [], edges: [], isPublic: true }),
      });
      setName("");
      setDescription("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear");
    }
  }

  if (crmUser?.role !== Role.SUPERADMIN) return null;

  return (
    <Stack spacing={3}>
      <CrmPageHeader
        title="Plantillas globales de flujos"
        subtitle="Flujos predefinidos que todos los tenants pueden clonar al crear bots (e-commerce, soporte, citas…)."
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Card>
        <CardContent>
          <Box component="form" onSubmit={createTemplate} sx={{ display: "grid", gap: 2, maxWidth: 520 }}>
            <TextField label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
            <TextField label="Categoría" value={category} onChange={(e) => setCategory(e.target.value)} fullWidth />
            <TextField label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline minRows={2} />
            <Button type="submit" variant="contained" sx={{ maxWidth: 200 }}>
              Publicar plantilla global
            </Button>
          </Box>
        </CardContent>
      </Card>
      <Stack spacing={1}>
        {templates.map((t) => (
          <Card key={t.id} variant="outlined">
            <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography fontWeight={600}>{t.name}</Typography>
                <Typography variant="body2" color="text.secondary">{t.description}</Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                {t.category ? <Chip size="small" label={t.category} /> : null}
                <Chip size="small" color="primary" label={t.isPublic ? "Pública" : "Privada"} />
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}

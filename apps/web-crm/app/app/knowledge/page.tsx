"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Chip, Stack, TextField, Typography } from "@mui/material";
import { apiFetch } from "@/src/lib/api";
import { KNOWLEDGE_STATUS_ES, labelEs } from "@uniwai/shared";
import { CrmPageHeader } from "@/src/components/crm/crm-page-header";
import { ModulePage } from "@/src/components/crm/module-page";

type Doc = {
  id: string;
  title: string;
  status: string;
  _count: { chunks: number };
};

export default function KnowledgePage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: Doc[] }>("/knowledge");
      setDocs(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar documentos");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function addDoc(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch("/knowledge", { method: "POST", body: JSON.stringify({ title, content }) });
      setTitle("");
      setContent("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    }
  }

  return (
    <ModulePage>
      <CrmPageHeader title="Base de conocimiento (RAG)" subtitle="Documentos que alimentan la IA del bot. Solo responde sobre tu negocio — anti-prompt-injection incluido." />
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Card>
        <CardContent>
          <Box component="form" onSubmit={addDoc} sx={{ display: "grid", gap: 2 }}>
            <TextField label="Título" value={title} onChange={(e) => setTitle(e.target.value)} required fullWidth />
            <TextField label="Contenido (FAQ, políticas, catálogo…)" value={content} onChange={(e) => setContent(e.target.value)} required fullWidth multiline minRows={6} />
            <Button type="submit" variant="contained" sx={{ maxWidth: 200 }}>Agregar documento</Button>
          </Box>
        </CardContent>
      </Card>
      <Stack spacing={1}>
        {docs.map((d) => (
          <Card key={d.id} variant="outlined">
            <CardContent sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography fontWeight={600}>{d.title}</Typography>
              <Stack direction="row" spacing={1}>
                <Chip size="small" label={labelEs(KNOWLEDGE_STATUS_ES, d.status)} />
                <Chip size="small" variant="outlined" label={`${d._count.chunks} fragmentos`} />
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </ModulePage>
  );
}

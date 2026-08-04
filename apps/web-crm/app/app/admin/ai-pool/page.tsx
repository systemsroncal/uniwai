"use client";

import { useEffect, useState } from "react";
import { Role } from "@uniwai/shared";
import { useAuth } from "@/src/context/auth-context";
import { useRouter } from "next/navigation";
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import { CrmPageHeader } from "@/src/components/crm/crm-page-header";

export default function AdminAiPoolPage() {
  const { crmUser } = useAuth();
  const router = useRouter();
  const [openaiKey, setOpenaiKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (crmUser?.role !== Role.SUPERADMIN) router.replace("/app");
  }, [crmUser, router]);

  if (crmUser?.role !== Role.SUPERADMIN) return null;

  return (
    <Stack spacing={3}>
      <CrmPageHeader title="Pool IA global" subtitle="API keys compartidas para planes Básico. Los owners Pro+ usan BYOK propio." />
      <Card>
        <CardContent>
          <Box component="form" onSubmit={(e) => { e.preventDefault(); setSaved(true); }} sx={{ display: "grid", gap: 2, maxWidth: 480 }}>
            <TextField label="OpenAI API Key" type="password" value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} fullWidth />
            <TextField label="Gemini API Key" type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} fullWidth />
            <Button type="submit" variant="contained">Guardar pool</Button>
            {saved ? <Typography variant="body2" color="success.main">Configuración registrada (pendiente backend).</Typography> : null}
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
}

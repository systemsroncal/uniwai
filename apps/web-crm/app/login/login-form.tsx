"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
import { createClient } from "@/src/lib/supabase/client";
import { AuthCardLayout, AuthPageShell } from "@/src/components/auth/auth-card-layout";

function formatAuthError(err: { message?: unknown; msg?: unknown; code?: string; status?: number }): string {
  if (err.status === 504 || err.status === 502 || err.status === 503) {
    return "Supabase local no responde (timeout). Reinicia Docker Desktop, espera 1–2 min y vuelve a intentar.";
  }

  const raw = err.message ?? err.msg;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (/504|gateway timeout|fetch failed|network/i.test(trimmed)) {
      return "Supabase local no responde. Verifica que Docker esté activo y el stack «uniwai-crm» en verde.";
    }
    if (trimmed && trimmed !== "{}") return trimmed;
  }
  if (typeof raw === "object" && raw !== null) {
    const nested = (raw as { message?: unknown; msg?: unknown }).message ?? (raw as { msg?: unknown }).msg;
    if (typeof nested === "string" && nested.trim()) return nested.trim();
  }
  if (err.code === "invalid_credentials") return "Correo o contraseña incorrectos.";
  if (err.code === "email_not_confirmed") return "Confirma tu correo antes de entrar.";
  return "No se pudo iniciar sesión. Verifica credenciales y que Supabase esté corriendo.";
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/app";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(formatAuthError(signInError));
      return;
    }

    if (!data.session) {
      setError("La sesión no se guardó. Recarga la página (Ctrl+Shift+R) e inténtalo de nuevo.");
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <AuthPageShell>
      <AuthCardLayout
        title="Iniciar sesión"
        subtitle="Accede a tu workspace UniWai CRM."
        footer={
          <Typography variant="body2" color="text.secondary" textAlign="center">
            ¿No tienes cuenta?{" "}
            <Link href="/register" style={{ color: "inherit", fontWeight: 600 }}>
              Crear cuenta
            </Link>
          </Typography>
        }
      >
        <Stack component="form" onSubmit={onSubmit} spacing={2.5}>
          <TextField
            label="Correo electrónico"
            name="email"
            type="email"
            autoComplete="email"
            required
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Contraseña"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
          </Button>
        </Stack>
      </AuthCardLayout>
    </AuthPageShell>
  );
}

"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Button, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import { createClient } from "@/src/lib/supabase/client";
import { apiFetch } from "@/src/lib/api";
import { AuthCardLayout, AuthPageShell } from "@/src/components/auth/auth-card-layout";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const provisionOnly = searchParams.get("step") === "provision";

  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function provisionTenant() {
    await apiFetch("/auth/provision", {
      method: "POST",
      body: JSON.stringify({
        businessName,
        ownerName: ownerName || businessName,
      }),
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      if (!provisionOnly) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;

        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }

      await provisionTenant();
      router.push("/app");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la cuenta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPageShell>
      <AuthCardLayout
        title={provisionOnly ? "Completa tu negocio" : "Crear cuenta"}
        subtitle={
          provisionOnly
            ? "Configura tu tenant para empezar con el plan Básico."
            : "Regístrate como dueño de negocio y activa tu CRM."
        }
        footer={
          <Typography variant="body2" color="text.secondary" textAlign="center">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" style={{ color: "inherit", fontWeight: 600 }}>
              Iniciar sesión
            </Link>
          </Typography>
        }
      >
        <Stack component="form" onSubmit={onSubmit} spacing={2.5}>
          {!provisionOnly ? (
            <>
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
                autoComplete="new-password"
                required
                fullWidth
                inputProps={{ minLength: 8 }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </>
          ) : null}
          <TextField
            label="Nombre del negocio"
            name="businessName"
            required
            fullWidth
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
          <TextField
            label="Tu nombre"
            name="ownerName"
            fullWidth
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
          />
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
            {loading ? "Creando…" : provisionOnly ? "Activar CRM" : "Crear cuenta"}
          </Button>
        </Stack>
      </AuthCardLayout>
    </AuthPageShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <AuthPageShell>
          <Stack alignItems="center" justifyContent="center" sx={{ minHeight: "50dvh" }}>
            <CircularProgress />
          </Stack>
        </AuthPageShell>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}

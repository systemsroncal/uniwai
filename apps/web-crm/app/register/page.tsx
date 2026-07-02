"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { apiFetch } from "@/src/lib/api";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";

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
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
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
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-primary">
          {provisionOnly ? "Completa tu negocio" : "Crear cuenta"}
        </h1>
        <p className="mt-1 text-sm text-secondary">
          {provisionOnly
            ? "Configura tu tenant para empezar con el plan Básico."
            : "Regístrate como dueño de negocio y activa tu CRM."}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {!provisionOnly ? (
            <>
              <Input
                label="Correo electrónico"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                label="Contraseña"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </>
          ) : null}
          <Input
            label="Nombre del negocio"
            name="businessName"
            required
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
          <Input
            label="Tu nombre"
            name="ownerName"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
          />
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="min-h-11 w-full" disabled={loading}>
            {loading ? "Creando…" : provisionOnly ? "Activar CRM" : "Crear cuenta"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-secondary">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-secondary">Cargando…</div>}>
      <RegisterForm />
    </Suspense>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Permission } from "@uniwai/shared";
import { useAuth } from "@/src/context/auth-context";
import { apiFetch } from "@/src/lib/api";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { useRouter } from "next/navigation";

type TeamResponse = {
  data: Array<{
    id: string;
    email: string;
    name: string | null;
    role: string;
    isActive: boolean;
  }>;
};

export default function TeamPage() {
  const { can } = useAuth();
  const router = useRouter();
  const [team, setTeam] = useState<TeamResponse["data"]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!can(Permission.MANAGE_TEAM)) router.replace("/app");
  }, [can, router]);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch<TeamResponse>("/users");
        setTeam(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar equipo");
      }
    }
    if (can(Permission.MANAGE_TEAM)) void load();
  }, [can]);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify({ email, name, password }),
      });
      setEmail("");
      setName("");
      setPassword("");
      const res = await apiFetch<TeamResponse>("/users");
      setTeam(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo invitar vendedor");
    } finally {
      setBusy(false);
    }
  }

  if (!can(Permission.MANAGE_TEAM)) return null;

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-primary">Equipo</h1>
        <p className="text-sm text-secondary">Invita vendedores según los límites de tu plan.</p>
      </header>

      <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
        <ul className="divide-y divide-border">
          {team.map((member) => (
            <li key={member.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="font-medium text-primary">{member.name ?? member.email}</p>
                <p className="text-secondary">{member.email}</p>
              </div>
              <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">{member.role}</span>
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={invite} className="max-w-md space-y-3 rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-primary">Nuevo vendedor</h2>
        <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input
          label="Correo"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Contraseña temporal"
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="min-h-11" disabled={busy}>
          Crear vendedor
        </Button>
      </form>
    </section>
  );
}

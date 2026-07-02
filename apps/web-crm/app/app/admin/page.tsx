"use client";

import { useEffect, useState } from "react";
import { Role } from "@uniwai/shared";
import { useAuth } from "@/src/context/auth-context";
import { apiFetch } from "@/src/lib/api";
import { useRouter } from "next/navigation";

type StatsResponse = {
  data: { tenants: number; activeTenants: number; users: number; messages: number };
};

type TenantsResponse = {
  data: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    createdAt: string;
    _count: { users: number; contacts: number };
  }>;
};

export default function AdminPage() {
  const { crmUser } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<StatsResponse["data"] | null>(null);
  const [tenants, setTenants] = useState<TenantsResponse["data"]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (crmUser && crmUser.role !== Role.SUPERADMIN) {
      router.replace("/app");
    }
  }, [crmUser, router]);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, tenantsRes] = await Promise.all([
          apiFetch<StatsResponse>("/admin/stats"),
          apiFetch<TenantsResponse>("/admin/tenants"),
        ]);
        setStats(statsRes.data);
        setTenants(tenantsRes.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar admin");
      }
    }
    if (crmUser?.role === Role.SUPERADMIN) void load();
  }, [crmUser]);

  if (crmUser?.role !== Role.SUPERADMIN) return null;

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-primary">Panel Superadmin</h1>
        <p className="text-sm text-secondary">Estadísticas globales y tenants de la plataforma.</p>
      </header>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Tenants", stats.tenants],
            ["Activos", stats.activeTenants],
            ["Usuarios", stats.users],
            ["Mensajes", stats.messages],
          ].map(([label, value]) => (
            <article key={label} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
              <p className="text-xs text-secondary">{label}</p>
              <p className="text-2xl font-semibold tabular-nums text-primary">{value}</p>
            </article>
          ))}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-4 py-3 font-semibold">Negocio</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Usuarios</th>
              <th className="px-4 py-3 font-semibold">Contactos</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="border-b border-border/70">
                <td className="px-4 py-3">
                  <p className="font-medium text-primary">{tenant.name}</p>
                  <p className="text-xs text-secondary">{tenant.slug}</p>
                </td>
                <td className="px-4 py-3 text-secondary">{tenant.status}</td>
                <td className="px-4 py-3 tabular-nums">{tenant._count.users}</td>
                <td className="px-4 py-3 tabular-nums">{tenant._count.contacts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

"use client";

import { useAuth } from "@/src/context/auth-context";
import { Role } from "@uniwai/shared";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SettingsPage() {
  const { crmUser, tenantName, planSlug } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (crmUser && crmUser.role !== Role.OWNER) router.replace("/app");
  }, [crmUser, router]);

  if (crmUser?.role !== Role.OWNER) return null;

  return (
    <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-primary">Configuración</h1>
      <p className="mt-1 text-sm text-secondary">Workspace, facturación e integraciones (próxima fase).</p>
      <dl className="mt-6 space-y-3 text-sm">
        <div>
          <dt className="text-secondary">Negocio</dt>
          <dd className="font-medium text-primary">{tenantName}</dd>
        </div>
        <div>
          <dt className="text-secondary">Plan</dt>
          <dd className="font-medium text-primary">{planSlug ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-secondary">Rol</dt>
          <dd className="font-medium text-primary">{crmUser?.role}</dd>
        </div>
      </dl>
    </section>
  );
}

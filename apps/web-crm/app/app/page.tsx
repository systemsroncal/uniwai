"use client";

import Link from "next/link";
import { useAuth } from "@/src/context/auth-context";
import { Permission } from "@uniwai/shared";
import { ArrowRight, Bot, KanbanSquare, MessageSquare } from "lucide-react";

export default function DashboardPage() {
  const { crmUser, tenantName, planSlug, can } = useAuth();

  const modules = [
    can(Permission.VIEW_KANBAN)
      ? {
          href: "/app/kanban",
          title: "Kanban CRM",
          text: "Pipeline Lead → Cierre con takeover humano.",
          icon: KanbanSquare,
        }
      : null,
    can(Permission.MANAGE_FLOWS)
      ? {
          href: "/app/builder",
          title: "Bot Builder",
          text: "Flujos drag & drop con live preview.",
          icon: Bot,
        }
      : null,
    can(Permission.MANAGE_CHAT)
      ? {
          href: "/app/inbox",
          title: "Inbox",
          text: "Chat omnicanal con toggle bot ON/OFF.",
          icon: MessageSquare,
        }
      : null,
  ].filter(Boolean) as Array<{
    href: string;
    title: string;
    text: string;
    icon: typeof Bot;
  }>;

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-primary">Dashboard</h1>
        <p className="mt-1 text-sm text-secondary">
          {tenantName ? `Workspace: ${tenantName}` : "Modo plataforma"} · {crmUser?.role}
          {planSlug ? ` · plan ${planSlug}` : ""}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {modules.map(({ href, title, text, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-2xl border border-border bg-white p-5 shadow-sm transition-colors hover:border-accent"
          >
            <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-accent">
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <h2 className="font-semibold text-primary">{title}</h2>
            <p className="mt-1 text-sm text-secondary">{text}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent">
              Abrir <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

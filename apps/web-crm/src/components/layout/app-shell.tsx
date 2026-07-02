"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bot,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { Permission, Role } from "@uniwai/shared";
import { useAuth } from "@/src/context/auth-context";
import { Button } from "@/src/components/ui/button";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: Role[];
  permission?: Permission;
};

const links: NavItem[] = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/kanban", label: "Kanban", icon: KanbanSquare, permission: Permission.VIEW_KANBAN },
  { href: "/app/inbox", label: "Inbox", icon: MessageSquare, permission: Permission.MANAGE_CHAT },
  {
    href: "/app/builder",
    label: "Bot Builder",
    icon: Bot,
    permission: Permission.MANAGE_FLOWS,
  },
  {
    href: "/app/team",
    label: "Equipo",
    icon: Users,
    permission: Permission.MANAGE_TEAM,
  },
  {
    href: "/app/settings",
    label: "Configuración",
    icon: Settings,
    roles: [Role.OWNER],
  },
  {
    href: "/app/admin",
    label: "Superadmin",
    icon: Shield,
    roles: [Role.SUPERADMIN],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading, crmUser, tenantName, planSlug, signOut, can } = useAuth();

  const visibleLinks = links.filter((item) => {
    if (item.roles && crmUser && !item.roles.includes(crmUser.role as Role)) return false;
    if (item.permission && !can(item.permission)) return false;
    return true;
  });

  useEffect(() => {
    if (!loading && !crmUser) {
      router.replace("/login");
    }
  }, [loading, crmUser, router]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-secondary">
        Cargando sesión…
      </div>
    );
  }

  if (!crmUser) return null;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 md:px-6">
        <aside className="hidden w-60 shrink-0 md:block">
          <div className="mb-2 text-lg font-semibold text-primary">
            UniWai<span className="text-accent">CRM</span>
          </div>
          {tenantName ? (
            <p className="mb-1 truncate text-xs font-medium text-primary">{tenantName}</p>
          ) : (
            <p className="mb-1 text-xs font-medium text-accent">Modo plataforma</p>
          )}
          <p className="mb-6 text-xs text-secondary">
            {crmUser.role}
            {planSlug ? ` · ${planSlug}` : ""}
          </p>

          <nav className="space-y-1" aria-label="CRM">
            {visibleLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary text-white"
                      : "text-secondary hover:bg-muted hover:text-primary"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 border-t border-border pt-4">
            <p className="mb-2 truncate text-xs text-secondary">{crmUser.email}</p>
            <Button
              variant="outline"
              className="min-h-11 w-full justify-start gap-2"
              onClick={() => void signOut()}
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Cerrar sesión
            </Button>
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

import { AuthProvider } from "@/src/context/auth-context";
import { TenantImpersonationProvider } from "@/src/context/tenant-impersonation-context";
import { AppShell } from "@/src/components/layout/app-shell";
import { ModernizeProvider } from "@/src/components/providers/modernize-provider";

export default function CrmAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModernizeProvider>
      <AuthProvider>
        <TenantImpersonationProvider>
          <AppShell>{children}</AppShell>
        </TenantImpersonationProvider>
      </AuthProvider>
    </ModernizeProvider>
  );
}

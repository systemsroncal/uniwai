import { AuthProvider } from "@/src/context/auth-context";
import { AppShell } from "@/src/components/layout/app-shell";

export default function CrmAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}

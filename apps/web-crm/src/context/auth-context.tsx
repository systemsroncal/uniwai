"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Role, hasPermission, type Permission } from "@uniwai/shared";
import { createClient } from "@/src/lib/supabase/client";
import { ApiError, apiFetch, type AuthMeResponse, type CrmUser } from "@/src/lib/api";

type AuthState = {
  loading: boolean;
  crmUser: CrmUser | null;
  tenantName: string | null;
  planSlug: string | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  can: (permission: Permission) => boolean;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [crmUser, setCrmUser] = useState<CrmUser | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [planSlug, setPlanSlug] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<AuthMeResponse>("/auth/me");
      setCrmUser(res.data.user);
      setTenantName(res.data.tenant?.name ?? null);
      setPlanSlug(res.data.subscription?.plan.slug ?? null);
    } catch (error) {
      if (error instanceof ApiError && error.code === "NEEDS_PROVISION") {
        router.replace("/register?step=provision");
        return;
      }
      setCrmUser(null);
      setTenantName(null);
      setPlanSlug(null);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void refresh();
    const supabase = createClient();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setCrmUser(null);
    router.push("/login");
  }, [router]);

  const can = useCallback(
    (permission: Permission) => {
      if (!crmUser) return false;
      return hasPermission(crmUser.role as Role, permission);
    },
    [crmUser],
  );

  const value = useMemo(
    () => ({ loading, crmUser, tenantName, planSlug, refresh, signOut, can }),
    [loading, crmUser, tenantName, planSlug, refresh, signOut, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

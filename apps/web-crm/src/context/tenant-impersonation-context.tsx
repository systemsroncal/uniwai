"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Role } from "@uniwai/shared";
import { useAuth } from "@/src/context/auth-context";

const STORAGE_KEY = "uniwai-impersonate-tenant-id";

type TenantOption = { id: string; name: string; slug: string };

type TenantImpersonationContextValue = {
  tenantId: string | null;
  tenantName: string | null;
  setTenant: (id: string | null, name?: string | null) => void;
  needsTenant: boolean;
  isImpersonating: boolean;
};

const TenantImpersonationContext = createContext<TenantImpersonationContextValue | null>(null);

export function TenantImpersonationProvider({ children }: { children: ReactNode }) {
  const { crmUser } = useAuth();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);

  const isSuperadmin = crmUser?.role === Role.SUPERADMIN;

  useEffect(() => {
    if (!isSuperadmin) {
      setTenantId(null);
      setTenantName(null);
      return;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedName = localStorage.getItem(`${STORAGE_KEY}-name`);
    if (stored) {
      setTenantId(stored);
      setTenantName(storedName);
    }
  }, [isSuperadmin]);

  const setTenant = useCallback(
    (id: string | null, name?: string | null) => {
      setTenantId(id);
      setTenantName(name ?? null);
      if (id) {
        localStorage.setItem(STORAGE_KEY, id);
        if (name) localStorage.setItem(`${STORAGE_KEY}-name`, name);
      } else {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(`${STORAGE_KEY}-name`);
      }
    },
    [],
  );

  const value = useMemo(
    () => ({
      tenantId: isSuperadmin ? tenantId : crmUser?.tenantId ?? null,
      tenantName: isSuperadmin ? tenantName : null,
      setTenant,
      needsTenant: isSuperadmin && !tenantId,
      isImpersonating: isSuperadmin && Boolean(tenantId),
    }),
    [crmUser?.tenantId, isSuperadmin, tenantId, tenantName, setTenant],
  );

  return (
    <TenantImpersonationContext.Provider value={value}>{children}</TenantImpersonationContext.Provider>
  );
}

export function useTenantImpersonation() {
  const ctx = useContext(TenantImpersonationContext);
  if (!ctx) throw new Error("useTenantImpersonation must be used within TenantImpersonationProvider");
  return ctx;
}

export function getImpersonateTenantId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export type { TenantOption };

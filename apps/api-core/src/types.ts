import type { Role } from "@uniwai/shared";

export type AuthUser = {
  id: string;
  email: string | null;
  role: Role;
  tenantId: string | null;
};

export type SupabaseUser = {
  id: string;
  email: string | null;
};

export type AppBindings = {
  Variables: {
    authUser: AuthUser;
    supabaseUser: SupabaseUser;
  };
};

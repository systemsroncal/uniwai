import { createClient } from "@/src/lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function getAccessToken(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = await getAccessToken();
  if (!token) {
    throw new ApiError("Sesión no válida", 401);
  }

  const response = await fetch(`${API_URL}/api/v1${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      (body as { error?: string }).error ?? "Error de API",
      response.status,
      (body as { code?: string }).code,
    );
  }

  return body as T;
}

export type CrmUser = {
  id: string;
  email: string | null;
  role: "SUPERADMIN" | "OWNER" | "VENDEDOR";
  tenantId: string | null;
};

export type AuthMeResponse = {
  data: {
    mode: "platform" | "tenant";
    user: CrmUser;
    tenant: {
      id: string;
      name: string;
      slug: string;
      status: string;
      timezone?: string;
    } | null;
    subscription: {
      status: string;
      plan: { slug: string; name: string; limits: unknown };
    } | null;
  };
};

export type KanbanColumn = {
  id: string;
  name: string;
  position: number;
  color: string;
  isDefault: boolean;
  contacts: Array<{
    id: string;
    phone: string;
    name: string | null;
    botEnabled: boolean;
    lastMessageAt: string | null;
    updatedAt: string;
  }>;
  _count: { contacts: number };
};

export type ContactRow = {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  tags: string[];
  botEnabled: boolean;
  currentNodeId: string | null;
  lastMessageAt: string | null;
};

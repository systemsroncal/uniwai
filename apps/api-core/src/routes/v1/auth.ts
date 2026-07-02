import { Hono } from "hono";
import { z } from "zod";
import { Role } from "@uniwai/shared";
import { prisma } from "@uniwai/database";
import type { AppBindings } from "../../types";
import { authRequired } from "../../middleware/auth";
import { supabaseTokenRequired } from "../../middleware/supabase-token";

const auth = new Hono<AppBindings>();

const defaultKanbanColumns = [
  { name: "Lead", position: 0, color: "#64748b", isDefault: true },
  { name: "Contactado", position: 1, color: "#0ea5e9", isDefault: true },
  { name: "Negociación", position: 2, color: "#8b5cf6", isDefault: true },
  { name: "Cierre", position: 3, color: "#10b981", isDefault: true },
] as const;

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "negocio"
  );
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let suffix = 1;
  while (await prisma.tenant.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

const provisionSchema = z.object({
  businessName: z.string().min(2).max(120),
  ownerName: z.string().min(2).max(120).optional(),
  timezone: z.string().min(2).max(64).optional(),
});

auth.post("/provision", supabaseTokenRequired, async (c) => {
  const supabaseUser = c.get("supabaseUser");
  const payload = provisionSchema.parse(await c.req.json());

  const existing = await prisma.user.findFirst({
    where: { authUserId: supabaseUser.id, isActive: true },
    select: {
      id: true,
      email: true,
      role: true,
      tenantId: true,
      tenant: { select: { id: true, name: true, slug: true, status: true } },
    },
  });

  if (existing) {
    return c.json({
      data: {
        user: {
          id: existing.id,
          email: existing.email,
          role: existing.role,
          tenantId: existing.tenantId,
        },
        tenant: existing.tenant,
        provisioned: false,
      },
    });
  }

  if (!supabaseUser.email) {
    return c.json({ error: "Supabase user must have an email" }, 400);
  }

  const basicoPlan = await prisma.plan.findUnique({ where: { slug: "basico" } });
  if (!basicoPlan) {
    return c.json({ error: "Plan catalog not seeded. Run db:seed." }, 503);
  }

  const baseSlug = slugify(payload.businessName);
  const slug = await uniqueSlug(baseSlug);

  const result = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name: payload.businessName,
        slug,
        timezone: payload.timezone ?? "America/Lima",
      },
    });

    const user = await tx.user.create({
      data: {
        tenantId: tenant.id,
        email: supabaseUser.email!,
        authUserId: supabaseUser.id,
        name: payload.ownerName ?? payload.businessName,
        role: "OWNER",
      },
    });

    await tx.subscription.create({
      data: {
        tenantId: tenant.id,
        planId: basicoPlan.id,
        status: "TRIALING",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    await tx.kanbanColumn.createMany({
      data: defaultKanbanColumns.map((col) => ({
        tenantId: tenant.id,
        ...col,
      })),
    });

    return { tenant, user };
  });

  return c.json(
    {
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role as Role,
          tenantId: result.user.tenantId,
        },
        tenant: {
          id: result.tenant.id,
          name: result.tenant.name,
          slug: result.tenant.slug,
          status: result.tenant.status,
        },
        provisioned: true,
      },
    },
    201,
  );
});

auth.get("/me", authRequired, async (c) => {
  const authUser = c.get("authUser");

  if (authUser.role === Role.SUPERADMIN && !authUser.tenantId) {
    return c.json({
      data: {
        mode: "platform",
        user: authUser,
        tenant: null,
        subscription: null,
      },
    });
  }

  if (!authUser.tenantId) {
    return c.json({ error: "Tenant not provisioned", code: "NEEDS_PROVISION" }, 403);
  }

  const [tenant, subscription] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: authUser.tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        timezone: true,
      },
    }),
    prisma.subscription.findFirst({
      where: { tenantId: authUser.tenantId },
      orderBy: { createdAt: "desc" },
      select: {
        status: true,
        plan: { select: { slug: true, name: true, limits: true } },
      },
    }),
  ]);

  return c.json({
    data: {
      mode: "tenant",
      user: authUser,
      tenant,
      subscription,
    },
  });
});

export default auth;

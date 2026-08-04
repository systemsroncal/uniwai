import { Hono } from "hono";
import { z } from "zod";
import { Permission, Role } from "@uniwai/shared";
import { prisma } from "@uniwai/database";
import { supabaseAdmin } from "../../lib/supabase";
import type { AppBindings } from "../../types";
import { getTenantIdOrThrow } from "../../middleware/tenant";
import { requirePermission, requireRoles } from "../../middleware/rbac";

const users = new Hono<AppBindings>();

users.use("*", requireRoles(Role.OWNER));

users.get("/", async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const team = await prisma.user.findMany({
    where: { tenantId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
  return c.json({ data: team });
});

const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(120),
  password: z.string().min(8).max(72),
});

users.post("/", requirePermission(Permission.MANAGE_TEAM), async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const payload = inviteSchema.parse(await c.req.json());

  const subscription = await prisma.subscription.findFirst({
    where: { tenantId, status: { in: ["TRIALING", "ACTIVE"] } },
    include: { plan: true },
  });

  if (!subscription) {
    return c.json({ error: "No active subscription" }, 403);
  }

  const limits = subscription.plan.limits as { maxVendedores?: number };
  const maxVendedores = limits.maxVendedores ?? 0;

  const vendedorCount = await prisma.user.count({
    where: { tenantId, role: "VENDEDOR", isActive: true },
  });

  if (maxVendedores >= 0 && vendedorCount >= maxVendedores) {
    return c.json({ error: "Plan limit reached for vendedores" }, 403);
  }

  const existing = await prisma.user.findUnique({ where: { email: payload.email } });
  if (existing) {
    return c.json({ error: "Email already registered" }, 409);
  }

  const { data: createdAuth, error } = await supabaseAdmin.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true,
    user_metadata: { tenantId, role: Role.VENDEDOR },
  });

  if (error || !createdAuth.user) {
    return c.json({ error: error?.message ?? "Failed to create auth user" }, 400);
  }

  const user = await prisma.user.create({
    data: {
      tenantId,
      email: payload.email,
      name: payload.name,
      authUserId: createdAuth.user.id,
      role: "VENDEDOR",
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return c.json({ data: user }, 201);
});

const updateUserSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  isActive: z.boolean().optional(),
});

users.patch("/:userId", requirePermission(Permission.MANAGE_TEAM), async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const userId = c.req.param("userId");
  const payload = updateUserSchema.parse(await c.req.json());

  const existing = await prisma.user.findFirst({
    where: { id: userId, tenantId },
  });
  if (!existing) return c.json({ error: "User not found" }, 404);
  if (existing.role === Role.OWNER) {
    return c.json({ error: "Cannot modify owner via this endpoint" }, 403);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  return c.json({ data: user });
});

users.delete("/:userId", requirePermission(Permission.MANAGE_TEAM), async (c) => {
  const tenantId = getTenantIdOrThrow(c);
  const userId = c.req.param("userId");

  const existing = await prisma.user.findFirst({
    where: { id: userId, tenantId },
  });
  if (!existing) return c.json({ error: "User not found" }, 404);
  if (existing.role === Role.OWNER) {
    return c.json({ error: "Cannot delete owner" }, 403);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  });

  return c.json({ data: { ok: true } });
});

export default users;

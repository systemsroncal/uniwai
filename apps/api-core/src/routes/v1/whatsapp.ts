import { Hono } from "hono";

import { z } from "zod";

import { prisma } from "@uniwai/database";

import { Permission } from "@uniwai/shared";

import type { AppBindings } from "../../types";

import { getTenantIdOrThrow } from "../../middleware/tenant";

import { requirePermission } from "../../middleware/rbac";

import { redisGet, WA_QR_PREFIX } from "../../lib/redis";



const whatsapp = new Hono<AppBindings>();



whatsapp.use("*", requirePermission(Permission.MANAGE_BOTS));



const createSchema = z.object({

  label: z.string().min(1).max(80).optional(),

  connectionType: z.enum(["BAILEYS", "META_CLOUD"]),

  phoneNumber: z.string().min(6).max(20).optional(),

  metaPhoneNumberId: z.string().optional(),

  metaWabaId: z.string().optional(),

});



whatsapp.get("/instances", async (c) => {

  const tenantId = getTenantIdOrThrow(c);

  const instances = await prisma.whatsAppInstance.findMany({

    where: { tenantId },

    orderBy: { createdAt: "desc" },

    select: {

      id: true,

      label: true,

      phoneNumber: true,

      connectionType: true,

      status: true,

      isInWarmupNetwork: true,

      lastConnectedAt: true,

      createdAt: true,

    },

  });

  return c.json({ data: instances });

});



whatsapp.post("/instances", async (c) => {

  const tenantId = getTenantIdOrThrow(c);

  const payload = createSchema.parse(await c.req.json());



  const instance = await prisma.whatsAppInstance.create({

    data: {

      tenantId,

      label: payload.label,

      phoneNumber: payload.phoneNumber,

      connectionType: payload.connectionType,

      status: payload.connectionType === "BAILEYS" ? "QR_PENDING" : "DISCONNECTED",

      metaPhoneNumberId: payload.metaPhoneNumberId,

      metaWabaId: payload.metaWabaId,

    },

  });



  return c.json({ data: instance }, 201);

});



whatsapp.get("/instances/:instanceId/qr", async (c) => {

  const tenantId = getTenantIdOrThrow(c);

  const instanceId = c.req.param("instanceId");



  const instance = await prisma.whatsAppInstance.findFirst({

    where: { id: instanceId, tenantId, connectionType: "BAILEYS" },

  });

  if (!instance) return c.json({ error: "Instance not found" }, 404);



  if (instance.status === "CONNECTED") {
    return c.json({
      data: {
        status: "CONNECTED",
        qr: null,
        phoneNumber: instance.phoneNumber,
      },
    });
  }

  try {
    const raw = await redisGet(`${WA_QR_PREFIX}${instanceId}`);
    if (!raw) {
      return c.json({
        data: {
          status: instance.status,
          qr: null,
          phoneNumber: instance.phoneNumber,
          hint: "Esperando código QR. Asegúrate de que el worker de WhatsApp esté activo.",
        },
      });
    }
    const parsed = JSON.parse(raw) as { qr: string; updatedAt: number };
    return c.json({
      data: { status: "QR_PENDING", qr: parsed.qr, updatedAt: parsed.updatedAt, phoneNumber: null },
    });
  } catch {
    return c.json({
      data: {
        status: instance.status,
        qr: null,
        phoneNumber: instance.phoneNumber,
        hint: "No se pudo leer el QR. Verifica que Redis y el worker estén activos.",
      },
    });
  }

});



whatsapp.post("/instances/:instanceId/disconnect", async (c) => {

  const tenantId = getTenantIdOrThrow(c);

  const instanceId = c.req.param("instanceId");



  const updated = await prisma.whatsAppInstance.updateMany({

    where: { id: instanceId, tenantId },

    data: { status: "DISCONNECTED" },

  });

  if (!updated.count) return c.json({ error: "Instance not found" }, 404);

  return c.json({ data: { ok: true } });

});



whatsapp.delete("/instances/:instanceId", async (c) => {

  const tenantId = getTenantIdOrThrow(c);

  const instanceId = c.req.param("instanceId");



  const existing = await prisma.whatsAppInstance.findFirst({

    where: { id: instanceId, tenantId },

  });

  if (!existing) return c.json({ error: "Instance not found" }, 404);



  await prisma.whatsAppInstance.delete({ where: { id: instanceId } });

  return c.json({ data: { ok: true } });

});



whatsapp.patch("/instances/:instanceId/network", async (c) => {

  const tenantId = getTenantIdOrThrow(c);

  const instanceId = c.req.param("instanceId");

  const body = z.object({ joinWarmupNetwork: z.boolean() }).parse(await c.req.json());



  const updated = await prisma.whatsAppInstance.updateMany({

    where: { id: instanceId, tenantId },

    data: { isInWarmupNetwork: body.joinWarmupNetwork },

  });



  if (!updated.count) return c.json({ error: "Instance not found" }, 404);

  return c.json({ data: { ok: true } });

});



export default whatsapp;


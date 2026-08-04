import { Hono } from "hono";

import { z } from "zod";

import { prisma } from "@uniwai/database";

import { Permission } from "@uniwai/shared";

import type { AppBindings } from "../../types";

import { getTenantIdOrThrow } from "../../middleware/tenant";

import { requirePermission } from "../../middleware/rbac";

import { parseContactsFromExcel } from "../../lib/excel";



const campaigns = new Hono<AppBindings>();



campaigns.use("*", requirePermission(Permission.MANAGE_MARKETING));



const createSchema = z.object({

  name: z.string().min(1).max(120),

  channel: z.enum(["BAILEYS_QR", "META_CLOUD_API"]),

  messageTemplate: z.string().min(1).max(4000),

  scheduledAt: z.string().datetime().optional(),

});



const BAILEYS_MAX = 499;



campaigns.get("/", async (c) => {

  const tenantId = getTenantIdOrThrow(c);

  const list = await prisma.campaign.findMany({

    where: { tenantId },

    orderBy: { createdAt: "desc" },

    take: 50,

    include: { _count: { select: { contacts: true } } },

  });

  return c.json({ data: list });

});



campaigns.post("/", async (c) => {

  const tenantId = getTenantIdOrThrow(c);

  const payload = createSchema.parse(await c.req.json());



  const campaign = await prisma.campaign.create({

    data: {

      tenantId,

      name: payload.name,

      channel: payload.channel,

      messageTemplate: payload.messageTemplate,

      status: "DRAFT",

      scheduledAt: payload.scheduledAt ? new Date(payload.scheduledAt) : null,

    },

  });



  return c.json({ data: campaign }, 201);

});



campaigns.post("/:campaignId/import", async (c) => {

  const tenantId = getTenantIdOrThrow(c);

  const campaignId = c.req.param("campaignId");



  const campaign = await prisma.campaign.findFirst({

    where: { id: campaignId, tenantId },

  });

  if (!campaign) return c.json({ error: "Campaign not found" }, 404);



  const body = await c.req.parseBody();

  const file = body.file;

  if (!file || typeof file === "string") {

    return c.json({ error: "Se requiere archivo Excel (.xlsx)" }, 400);

  }



  const buffer = Buffer.from(await (file as File).arrayBuffer());

  const rows = await parseContactsFromExcel(buffer);

  if (!rows.length) {

    return c.json({ error: "No se encontraron contactos válidos. Usa columnas teléfono/nombre." }, 400);

  }



  const max =

    campaign.channel === "BAILEYS_QR"

      ? BAILEYS_MAX

      : Number(process.env.META_CAMPAIGN_MAX ?? 3000);



  if (rows.length > max) {

    return c.json({ error: `Máximo ${max} contactos para canal ${campaign.channel}` }, 400);

  }



  let imported = 0;

  for (const row of rows) {

    const contact = await prisma.contact.upsert({

      where: { tenantId_phone: { tenantId, phone: row.phone } },

      create: { tenantId, phone: row.phone, name: row.name },

      update: { name: row.name ?? undefined },

    });



    await prisma.campaignContact.upsert({

      where: { campaignId_contactId: { campaignId, contactId: contact.id } },

      create: { tenantId, campaignId, contactId: contact.id, status: "PENDING" },

      update: {},

    });

    imported += 1;

  }



  await prisma.campaign.update({

    where: { id: campaignId },

    data: { totalContacts: imported },

  });



  return c.json({ data: { imported, total: rows.length } });

});



export default campaigns;


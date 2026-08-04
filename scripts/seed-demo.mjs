#!/usr/bin/env node
/**
 * Seed tenant demo con datos CRM completos para superadmin / pruebas locales.
 * Requiere: DATABASE_URL, planes seedeados, opcional Supabase para owner auth.
 */
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { loadEnvLocal } from "./load-env.mjs";

loadEnvLocal();

const prisma = new PrismaClient();

const DEMO_TENANT_SLUG = "demo-tienda-uniwai";
const DEMO_OWNER_EMAIL = process.env.DEV_DEMO_OWNER_EMAIL ?? "owner@demo.uniwai.dev";
const DEMO_OWNER_PASSWORD = process.env.DEV_DEMO_OWNER_PASSWORD ?? "DemoOwner123!";
const DEMO_VENDEDOR_EMAIL = "vendedor@demo.uniwai.dev";

const defaultKanbanColumns = [
  { name: "Lead", position: 0, color: "#64748b", isDefault: true },
  { name: "Contactado", position: 1, color: "#0ea5e9", isDefault: true },
  { name: "Negociación", position: 2, color: "#8b5cf6", isDefault: true },
  { name: "Cierre", position: 3, color: "#10b981", isDefault: true },
];

async function ensureDemoOwnerAuthUserId() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.warn("[seed-demo] Sin Supabase; owner sin authUserId.");
    return null;
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.admin.createUser({
    email: DEMO_OWNER_EMAIL,
    password: DEMO_OWNER_PASSWORD,
    email_confirm: true,
  });

  if (data.user) return data.user.id;

  if (error?.message?.includes("already")) {
    const list = await supabase.auth.admin.listUsers();
    const found = list.data.users?.find((u) => u.email === DEMO_OWNER_EMAIL);
    return found?.id ?? null;
  }

  console.warn("[seed-demo] No se pudo crear owner auth:", error?.message);
  return null;
}

async function seedDemo() {
  const litePlan = await prisma.plan.findUnique({ where: { slug: "lite" } });
  if (!litePlan) {
    throw new Error("Plan lite no encontrado. Ejecuta db:seed primero.");
  }

  const ownerAuthId = await ensureDemoOwnerAuthUserId();

  let tenant = await prisma.tenant.findUnique({ where: { slug: DEMO_TENANT_SLUG } });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: "Tienda Demo UniWai",
        slug: DEMO_TENANT_SLUG,
        timezone: "America/Lima",
        storeAddress: "Av. Larco 123, Miraflores, Lima",
        storeLat: -12.1191,
        storeLng: -77.0349,
        businessContext:
          "Tienda de ropa y accesorios en Lima. Envíos locales. Horario 9am-7pm. Aceptamos Mercado Pago y contraentrega.",
      },
    });
    console.log("[seed-demo] Tenant creado:", tenant.name);
  } else {
    console.log("[seed-demo] Tenant existente:", tenant.name);
  }

  const owner = await prisma.user.upsert({
    where: { email: DEMO_OWNER_EMAIL },
    create: {
      tenantId: tenant.id,
      email: DEMO_OWNER_EMAIL,
      authUserId: ownerAuthId,
      name: "María Demo",
      role: "OWNER",
    },
    update: {
      tenantId: tenant.id,
      authUserId: ownerAuthId ?? undefined,
      role: "OWNER",
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: DEMO_VENDEDOR_EMAIL },
    create: {
      tenantId: tenant.id,
      email: DEMO_VENDEDOR_EMAIL,
      name: "Carlos Vendedor",
      role: "VENDEDOR",
    },
    update: { tenantId: tenant.id, role: "VENDEDOR", isActive: true },
  });

  const existingSub = await prisma.subscription.findFirst({ where: { tenantId: tenant.id } });
  if (existingSub) {
    await prisma.subscription.update({
      where: { id: existingSub.id },
      data: { planId: litePlan.id, status: "ACTIVE" },
    });
  } else {
    await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        planId: litePlan.id,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  const columnCount = await prisma.kanbanColumn.count({ where: { tenantId: tenant.id } });
  if (columnCount === 0) {
    await prisma.kanbanColumn.createMany({
      data: defaultKanbanColumns.map((col) => ({ tenantId: tenant.id, ...col })),
    });
  }

  const columns = await prisma.kanbanColumn.findMany({
    where: { tenantId: tenant.id },
    orderBy: { position: "asc" },
  });

  const skipSampleData = process.env.SEED_DEMO_SKIP_SAMPLE_DATA !== "0";
  if (skipSampleData) {
    console.log("[seed-demo] Solo estructura (tenant + usuarios). Sin contactos/mensajes demo.");
    console.log("[seed-demo] Tenant:", tenant.name, `(${tenant.id})`);
    console.log("[seed-demo] Owner:", DEMO_OWNER_EMAIL, "/", DEMO_OWNER_PASSWORD);
    console.log("[seed-demo] Para datos demo completos: SEED_DEMO_SKIP_SAMPLE_DATA=0 bun run db:seed:demo");
    return;
  }

  const waBaileys = await prisma.whatsAppInstance.upsert({
    where: { tenantId_phoneNumber: { tenantId: tenant.id, phoneNumber: "+51999000001" } },
    create: {
      tenantId: tenant.id,
      label: "Ventas QR",
      phoneNumber: "+51999000001",
      connectionType: "BAILEYS",
      status: "QR_PENDING",
      isInWarmupNetwork: true,
    },
    update: { label: "Ventas QR", isInWarmupNetwork: true },
  });

  const waMeta = await prisma.whatsAppInstance.upsert({
    where: { tenantId_phoneNumber: { tenantId: tenant.id, phoneNumber: "+51999000002" } },
    create: {
      tenantId: tenant.id,
      label: "Soporte Meta API",
      phoneNumber: "+51999000002",
      connectionType: "META_CLOUD",
      status: "CONNECTED",
      metaPhoneNumberId: "demo_phone_id",
      metaWabaId: "demo_waba_id",
      lastConnectedAt: new Date(),
    },
    update: { status: "CONNECTED", lastConnectedAt: new Date() },
  });

  await prisma.warmupConfig.upsert({
    where: { whatsAppInstanceId: waBaileys.id },
    create: {
      tenantId: tenant.id,
      whatsAppInstanceId: waBaileys.id,
      joinWarmupNetwork: true,
      manualDestinationPhones: ["+51988000001", "+51988000002"],
      messageTemplates: [
        "Hola {nombre|amigo}, ¿cómo va tu día?",
        "Buenos días, solo pasaba a saludar 👋",
        "¿Todo bien por allá?",
      ],
      dailyMessageLimit: 15,
      isActive: true,
    },
    update: { joinWarmupNetwork: true, isActive: true },
  });

  const contactSeeds = [
    { phone: "+51911110001", name: "Ana García", col: 0, tags: ["instagram"] },
    { phone: "+51911110002", name: "Luis Torres", col: 0, tags: ["web"] },
    { phone: "+51911110003", name: "Sofía Mendoza", col: 1, tags: ["referido"] },
    { phone: "+51911110004", name: "Pedro Ríos", col: 1, tags: [] },
    { phone: "+51911110005", name: "Carmen Vega", col: 2, tags: ["vip"] },
    { phone: "+51911110006", name: "Diego Castro", col: 2, tags: [] },
    { phone: "+51911110007", name: "Elena Paredes", col: 3, tags: ["cerrado"] },
    { phone: "+51911110008", name: "Roberto Silva", col: 3, tags: [] },
  ];

  const contacts = [];
  for (const c of contactSeeds) {
    const contact = await prisma.contact.upsert({
      where: { tenantId_phone: { tenantId: tenant.id, phone: c.phone } },
      create: {
        tenantId: tenant.id,
        whatsAppInstanceId: waBaileys.id,
        kanbanColumnId: columns[c.col]?.id,
        phone: c.phone,
        name: c.name,
        tags: c.tags,
        botEnabled: true,
        lastMessageAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      },
      update: {
        name: c.name,
        kanbanColumnId: columns[c.col]?.id,
        whatsAppInstanceId: waBaileys.id,
      },
    });
    contacts.push(contact);
  }

  const productSeeds = [
    { sku: "POL-001", name: "Polo UniWai Azul", price: 59.9, description: "Algodón pima, tallas S-XL" },
    { sku: "POL-002", name: "Polo UniWai Negro", price: 59.9, description: "Edición limitada" },
    { sku: "BOL-001", name: "Bolso Tote Canvas", price: 89.0, description: "Ideal para playa" },
    { sku: "GOR-001", name: "Gorra Snapback", price: 45.0, description: "Bordado logo" },
    { sku: "BUF-001", name: "Bufanda Lana", price: 72.5, description: "Colores surtidos" },
  ];

  for (const p of productSeeds) {
    await prisma.product.upsert({
      where: { tenantId_sku: { tenantId: tenant.id, sku: p.sku } },
      create: {
        tenantId: tenant.id,
        sku: p.sku,
        name: p.name,
        description: p.description,
        price: p.price,
        currency: "PEN",
        source: "SHEETS",
      },
      update: { name: p.name, price: p.price, description: p.description },
    });
  }

  for (let i = 0; i < 3; i++) {
    const contact = contacts[i + 4];
    const orderId = `demo-order-${i + 1}`;
    const existing = await prisma.order.findFirst({
      where: { tenantId: tenant.id, contactId: contact.id, notes: orderId },
    });
    if (!existing) {
      await prisma.order.create({
        data: {
          tenantId: tenant.id,
          contactId: contact.id,
          status: i === 2 ? "DELIVERED" : "CONFIRMED",
          paymentStatus: i === 0 ? "PENDING" : "PAID",
          items: [{ sku: productSeeds[i].sku, qty: 1, price: productSeeds[i].price }],
          subtotal: productSeeds[i].price,
          shippingCost: 12,
          total: productSeeds[i].price + 12,
          currency: "PEN",
          deliveryAddress: "Lima, Perú",
          notes: orderId,
          confirmedAt: new Date(),
        },
      });
    }
  }

  let botFlow = await prisma.botFlow.findFirst({
    where: { tenantId: tenant.id, name: "Bienvenida + catálogo" },
  });
  if (!botFlow) {
    botFlow = await prisma.botFlow.create({
      data: {
        tenantId: tenant.id,
        whatsAppInstanceId: waBaileys.id,
        name: "Bienvenida + catálogo",
        description: "Flujo demo de ventas",
        nodes: [
          { id: "start", type: "message", data: { text: "¡Hola! Bienvenido a Tienda Demo UniWai 🛍️" } },
          { id: "menu", type: "buttons", data: { text: "¿Qué deseas?", buttons: ["Ver catálogo", "Hablar con vendedor"] } },
        ],
        edges: [{ id: "e1", source: "start", target: "menu" }],
        isActive: true,
        isPublished: true,
      },
    });
  }

  if (botFlow) {
    await prisma.contact.updateMany({
      where: { tenantId: tenant.id, phone: contacts[0].phone },
      data: { activeBotFlowId: botFlow.id, currentNodeId: "menu" },
    });
  }

  let campaign = await prisma.campaign.findFirst({
    where: { tenantId: tenant.id, name: "Promo Verano 2026" },
  });
  if (!campaign) {
    campaign = await prisma.campaign.create({
      data: {
        tenantId: tenant.id,
        whatsAppInstanceId: waMeta.id,
        name: "Promo Verano 2026",
        channel: "META_CLOUD_API",
        status: "DRAFT",
        messageTemplate: "Hola {{nombre}}, tenemos 20% OFF en polos esta semana. ¿Te interesa?",
        totalContacts: 5,
      },
    });
  }

  if (campaign) {
    for (const contact of contacts.slice(0, 5)) {
      await prisma.campaignContact.upsert({
        where: { campaignId_contactId: { campaignId: campaign.id, contactId: contact.id } },
        create: { tenantId: tenant.id, campaignId: campaign.id, contactId: contact.id, status: "PENDING" },
        update: {},
      });
    }
  }

  const globalTemplates = [
    { name: "E-commerce básico", category: "ventas", description: "Catálogo + checkout" },
    { name: "Soporte FAQ", category: "soporte", description: "Preguntas frecuentes + handoff" },
    { name: "Agendar cita", category: "servicios", description: "Calendario simplificado" },
  ];

  for (const tpl of globalTemplates) {
    const existing = await prisma.flowTemplate.findFirst({
      where: { tenantId: null, name: tpl.name, isPublic: true },
    });
    if (!existing) {
      await prisma.flowTemplate.create({
        data: {
          tenantId: null,
          name: tpl.name,
          description: tpl.description,
          category: tpl.category,
          nodes: [{ id: "start", type: "message", data: { text: `Plantilla: ${tpl.name}` } }],
          edges: [],
          isPublic: true,
        },
      });
    }
  }

  const docTitle = "Políticas de envío y devoluciones";
  let knowledgeDoc = await prisma.knowledgeDocument.findFirst({
    where: { tenantId: tenant.id, title: docTitle },
  });
  if (!knowledgeDoc) {
    knowledgeDoc = await prisma.knowledgeDocument.create({
      data: {
        tenantId: tenant.id,
        title: docTitle,
        status: "READY",
        metadata: { sourceType: "MANUAL" },
      },
    });
    await prisma.knowledgeChunk.create({
      data: {
        tenantId: tenant.id,
        documentId: knowledgeDoc.id,
        content:
          "Envíos en Lima en 24-48h. Provincias 3-5 días. Devoluciones hasta 7 días en productos sin uso. Costo de envío desde S/12 según distrito.",
        chunkIndex: 0,
      },
    });
  }

  for (const contact of contacts.slice(0, 4)) {
    const exists = await prisma.chatMessage.findFirst({
      where: { tenantId: tenant.id, contactId: contact.id },
    });
    if (!exists) {
      await prisma.chatMessage.createMany({
        data: [
          {
            tenantId: tenant.id,
            contactId: contact.id,
            whatsAppInstanceId: waBaileys.id,
            direction: "INBOUND",
            status: "DELIVERED",
            content: `Hola, soy ${contact.name}. ¿Tienen stock?`,
            sentAt: new Date(Date.now() - 3600000),
          },
          {
            tenantId: tenant.id,
            contactId: contact.id,
            whatsAppInstanceId: waBaileys.id,
            direction: "OUTBOUND",
            status: "READ",
            content: "¡Hola! Sí tenemos stock. ¿Qué talla buscas?",
            sentAt: new Date(Date.now() - 3500000),
          },
        ],
      });
    }
  }

  await prisma.warmupLog.create({
    data: {
      tenantId: tenant.id,
      sourceInstanceId: waBaileys.id,
      destinationPhone: "+51988000001",
      messageHash: "demo-warmup-hash-1",
      composingDurationMs: 2400,
    },
  }).catch(() => {});

  console.log("[seed-demo] ─────────────────────────────────────");
  console.log("[seed-demo] Tenant:", tenant.name, `(${tenant.id})`);
  console.log("[seed-demo] Owner:", DEMO_OWNER_EMAIL, "/", DEMO_OWNER_PASSWORD);
  console.log("[seed-demo] Vendedor:", DEMO_VENDEDOR_EMAIL);
  console.log("[seed-demo] Contactos:", contacts.length, "| Productos: 5 | Órdenes: 3");
  console.log("[seed-demo] Superadmin: selecciona este tenant en «Negocio activo»");
}

seedDemo()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import { Hono } from "hono";

import { prisma } from "@uniwai/database";

import { Permission, ORDER_STATUS_ES, ORDER_PAYMENT_STATUS_ES, labelEs } from "@uniwai/shared";

import type { AppBindings } from "../../types";

import { getTenantIdOrThrow } from "../../middleware/tenant";

import { requirePermission } from "../../middleware/rbac";

import { buildWorkbookBuffer } from "../../lib/excel";



const reports = new Hono<AppBindings>();



reports.use("*", requirePermission(Permission.VIEW_REPORTS));



reports.get("/sales/summary", async (c) => {

  const tenantId = getTenantIdOrThrow(c);

  const from = c.req.query("from");

  const to = c.req.query("to");



  const where: { tenantId: string; createdAt?: { gte?: Date; lte?: Date } } = { tenantId };

  if (from || to) {

    where.createdAt = {};

    if (from) where.createdAt.gte = new Date(from);

    if (to) where.createdAt.lte = new Date(to);

  }



  const [orders, totals] = await Promise.all([

    prisma.order.findMany({

      where,

      orderBy: { createdAt: "desc" },

      take: 100,

      include: {

        contact: { select: { id: true, name: true, phone: true } },

      },

    }),

    prisma.order.aggregate({

      where,

      _count: true,

      _sum: { total: true, subtotal: true, shippingCost: true },

    }),

  ]);



  const paid = orders.filter((o) => o.paymentStatus === "PAID").length;



  return c.json({

    data: {

      orderCount: totals._count,

      totalRevenue: totals._sum.total ?? 0,

      subtotal: totals._sum.subtotal ?? 0,

      shipping: totals._sum.shippingCost ?? 0,

      paidOrders: paid,

      orders,

    },

  });

});



function buildSalesSheets(

  orders: Array<{

    contact: { name: string | null; phone: string; email?: string | null };

    status: string;

    paymentStatus: string;

    total: { toString(): string } | number;

    createdAt: Date;

  }>,

) {

  const totalRevenue = orders.reduce((acc, o) => acc + Number(o.total), 0);

  const paidCount = orders.filter((o) => o.paymentStatus === "PAID").length;



  return [

    {

      name: "Resumen Órdenes",

      rows: [

        ["Métrica", "Valor"],

        ["Total órdenes", orders.length],

        ["Órdenes pagadas", paidCount],

        ["Ingresos (S/)", totalRevenue.toFixed(2)],

        ["Ticket promedio", orders.length ? (totalRevenue / orders.length).toFixed(2) : "0"],

        ["Generado", new Date().toISOString()],

      ],

    },

    {

      name: "Compradores",

      rows: [

        ["Contacto", "Teléfono", "Estado orden", "Pago", "Total", "Fecha"],

        ...orders.map((o) => [

          o.contact.name ?? "—",

          o.contact.phone,

          labelEs(ORDER_STATUS_ES, o.status),

          labelEs(ORDER_PAYMENT_STATUS_ES, o.paymentStatus),

          String(o.total),

          o.createdAt.toISOString(),

        ]),

      ],

    },

  ];

}



reports.get("/sales/export", async (c) => {

  const tenantId = getTenantIdOrThrow(c);

  const orders = await prisma.order.findMany({

    where: { tenantId },

    orderBy: { createdAt: "desc" },

    include: { contact: { select: { name: true, phone: true, email: true } } },

  });



  const sheets = buildSalesSheets(orders);

  return c.json({ data: { format: "xlsx", sheets } });

});



reports.get("/sales/export.xlsx", async (c) => {

  const tenantId = getTenantIdOrThrow(c);

  const orders = await prisma.order.findMany({

    where: { tenantId },

    orderBy: { createdAt: "desc" },

    include: { contact: { select: { name: true, phone: true, email: true } } },

  });



  const buffer = await buildWorkbookBuffer(buildSalesSheets(orders));

  const filename = `uniwai-ventas-${new Date().toISOString().slice(0, 10)}.xlsx`;



  return new Response(buffer, {

    headers: {

      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

      "Content-Disposition": `attachment; filename="${filename}"`,

    },

  });

});



export default reports;


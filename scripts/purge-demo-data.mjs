#!/usr/bin/env node
/** Elimina contactos/mensajes demo del tenant demo-tienda-uniwai */
import { PrismaClient } from "@prisma/client";
import { loadEnvLocal } from "./load-env.mjs";

loadEnvLocal();
const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { slug: "demo-tienda-uniwai" } });
  if (!tenant) {
    console.log("[purge-demo] No hay tenant demo.");
    return;
  }

  const deletedMessages = await prisma.chatMessage.deleteMany({ where: { tenantId: tenant.id } });
  const deletedContacts = await prisma.contact.deleteMany({ where: { tenantId: tenant.id } });
  const deletedOrders = await prisma.order.deleteMany({ where: { tenantId: tenant.id } });
  const deletedProducts = await prisma.product.deleteMany({ where: { tenantId: tenant.id } });

  console.log("[purge-demo] Eliminados:", {
    messages: deletedMessages.count,
    contacts: deletedContacts.count,
    orders: deletedOrders.count,
    products: deletedProducts.count,
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

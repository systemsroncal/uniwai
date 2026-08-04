import { PrismaClient } from "@prisma/client";
import { loadEnvLocal } from "./load-env.mjs";

loadEnvLocal();
const prisma = new PrismaClient();

function normalizeE164(raw) {
  const digits = raw.replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

function isValidE164(phone) {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}

/**
 * Repara contactos con teléfono corrupto (@lid, @g.us) y fusiona duplicados.
 * Ejecutar una vez tras actualizar el worker.
 */
async function main() {
  const broken = await prisma.contact.findMany({
    where: {
      OR: [{ phone: { contains: "@lid" } }, { phone: { contains: "@g.us" } }],
    },
    include: { chatMessages: { select: { id: true } } },
  });

  console.log(`[fix-lid] ${broken.length} contacto(s) con teléfono inválido`);

  for (const contact of broken) {
    if (contact.phone.includes("@g.us")) {
      console.log(`[fix-lid] Eliminando contacto de grupo: ${contact.phone} (${contact.chatMessages.length} msgs)`);
      await prisma.contact.delete({ where: { id: contact.id } });
      continue;
    }

    const lidDigits = contact.phone.replace(/^\+?/, "").replace("@lid", "");
    const candidates = await prisma.contact.findMany({
      where: {
        tenantId: contact.tenantId,
        phone: { not: contact.phone },
        NOT: { phone: { contains: "@" } },
      },
    });

    const byName =
      contact.name &&
      candidates.find((c) => c.name?.toLowerCase() === contact.name?.toLowerCase());

    if (byName) {
      console.log(`[fix-lid] Fusionando ${contact.phone} → ${byName.phone} (${contact.name})`);
      await prisma.chatMessage.updateMany({
        where: { contactId: contact.id },
        data: { contactId: byName.id },
      });
      await prisma.contact.update({
        where: { id: byName.id },
        data: {
          lastMessageAt: contact.lastMessageAt ?? byName.lastMessageAt,
          name: byName.name ?? contact.name,
        },
      });
      await prisma.contact.delete({ where: { id: contact.id } });
      continue;
    }

    const fallbackPhone = normalizeE164(lidDigits);
    if (isValidE164(fallbackPhone)) {
      const existing = await prisma.contact.findUnique({
        where: { tenantId_phone: { tenantId: contact.tenantId, phone: fallbackPhone } },
      });
      if (existing && existing.id !== contact.id) {
        await prisma.chatMessage.updateMany({
          where: { contactId: contact.id },
          data: { contactId: existing.id },
        });
        await prisma.contact.delete({ where: { id: contact.id } });
        console.log(`[fix-lid] Fusionado por teléfono ${fallbackPhone}`);
      } else {
        await prisma.contact.update({
          where: { id: contact.id },
          data: { phone: fallbackPhone },
        });
        console.log(`[fix-lid] Teléfono corregido: ${contact.phone} → ${fallbackPhone}`);
      }
    } else {
      console.warn(`[fix-lid] Sin destino para ${contact.phone} — conservar o borrar manualmente`);
    }
  }

  console.log("[fix-lid] Listo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

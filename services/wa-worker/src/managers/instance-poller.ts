import { prisma } from "@uniwai/database";
import type Redis from "ioredis";
import { connectBaileysInstance, isBaileysSessionActive } from "../adapters/baileys.js";

const POLL_MS = Number(process.env.WA_INSTANCE_POLL_MS ?? 15000);

/** Una sola conexión activa por número de teléfono (evita conflictos Baileys). */
function pickInstancesToConnect(
  instances: Array<{ id: string; status: string; phoneNumber: string | null; lastConnectedAt: Date | null }>,
): string[] {
  const byPhone = new Map<string, typeof instances[0]>();

  for (const inst of instances) {
    if (inst.status === "BANNED") continue;
    if (isBaileysSessionActive(inst.id)) continue;

    const key = inst.phoneNumber?.replace(/\D/g, "") || inst.id;
    const prev = byPhone.get(key);
    if (!prev) {
      byPhone.set(key, inst);
      continue;
    }
    const prevTs = prev.lastConnectedAt?.getTime() ?? 0;
    const curTs = inst.lastConnectedAt?.getTime() ?? 0;
    if (curTs >= prevTs) byPhone.set(key, inst);
  }

  return [...byPhone.values()].map((i) => i.id);
}

export function startInstancePoller(redis: Redis): void {
  const tick = async () => {
    try {
      const instances = await prisma.whatsAppInstance.findMany({
        where: {
          connectionType: "BAILEYS",
          status: { in: ["QR_PENDING", "DISCONNECTED", "CONNECTED"] },
        },
        select: { id: true, status: true, phoneNumber: true, lastConnectedAt: true },
      });

      const toConnect = pickInstancesToConnect(instances);

      for (const id of toConnect) {
        void connectBaileysInstance(id, redis).catch((err) => {
          console.error(`[instances] Error conectando ${id}:`, err);
        });
      }
    } catch (err) {
      console.error("[instances] Poll error:", err);
    }
  };

  void tick();
  setInterval(() => void tick(), POLL_MS);
  console.log(`[instances] Poller activo cada ${POLL_MS}ms`);
}

import makeWASocket from "@whiskeysockets/baileys";

export interface WarmupMessagePayload {
  contactId: string;
  message: string;
}

export interface WhatsAppAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

/**
 * Placeholder for future Baileys integration.
 * The current worker runs in simulation mode only.
 */
export function createBaileysAdapterPlaceholder(): WhatsAppAdapter {
  void makeWASocket;

  throw new Error(
    "Baileys adapter is not implemented yet. Warmup runs in simulate mode."
  );
}

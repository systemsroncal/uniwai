import type { proto } from "@whiskeysockets/baileys";

/** Extrae texto legible de un mensaje WA (incluye captions y respuestas a botones). */
export function extractWhatsAppText(message: proto.IMessage | null | undefined): string | null {
  if (!message) return null;

  if (message.conversation) return message.conversation;
  if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;

  if (message.imageMessage) {
    return message.imageMessage.caption?.trim() || "📷 Imagen";
  }
  if (message.videoMessage) {
    return message.videoMessage.caption?.trim() || "🎬 Video";
  }
  if (message.audioMessage) return "🎤 Audio";
  if (message.documentMessage) {
    return message.documentMessage.caption?.trim() || message.documentMessage.fileName || "📎 Documento";
  }
  if (message.stickerMessage) return "🎨 Sticker";
  if (message.locationMessage) return "📍 Ubicación";
  if (message.contactMessage) return "👤 Contacto";

  const btn = message.buttonsResponseMessage;
  if (btn?.selectedDisplayText) return btn.selectedDisplayText;
  if (btn?.selectedButtonId) return btn.selectedButtonId;

  const list = message.listResponseMessage?.singleSelectReply;
  if (list?.selectedRowId) return list.selectedRowId;

  if (message.reactionMessage?.text) return message.reactionMessage.text;

  return null;
}

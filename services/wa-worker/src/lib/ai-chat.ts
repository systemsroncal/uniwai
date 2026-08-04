import { prisma } from "@uniwai/database";
import { decryptSecret } from "./crypto.js";
import { fetchGoogleSheetCsv } from "./google-sheets.js";

export type AiProvider = "openai" | "gemini" | "deepseek" | "nvidia";

const PROVIDER_ENV: Record<AiProvider, string> = {
  openai: "OPENAI_API_KEY",
  gemini: "GEMINI_API_KEY",
  deepseek: "DEEPSEEK_API_KEY",
  nvidia: "NVIDIA_API_KEY",
};

async function resolveApiKey(tenantId: string, provider: AiProvider): Promise<string | null> {
  const config = await prisma.tenantAiConfig.findUnique({ where: { tenantId } });
  const field = {
    openai: "encryptedOpenaiKey",
    gemini: "encryptedGeminiKey",
    deepseek: "encryptedDeepseekKey",
    nvidia: "encryptedNvidiaKey",
  }[provider] as keyof NonNullable<typeof config>;

  const encrypted = config?.[field];
  if (typeof encrypted === "string" && encrypted) {
    try {
      return decryptSecret(encrypted);
    } catch {
      /* fall through */
    }
  }
  return process.env[PROVIDER_ENV[provider]]?.trim() ?? null;
}

async function loadSheetContext(tenantId: string, sheetUrl?: string | null): Promise<string | null> {
  const config = await prisma.tenantAiConfig.findUnique({ where: { tenantId } });
  const cfg = config as { googleSheetUrl?: string | null; googleSheetGid?: string | null } | null;
  const url = sheetUrl?.trim() || cfg?.googleSheetUrl?.trim();
  if (!url) return null;
  try {
    const csv = await fetchGoogleSheetCsv(url, cfg?.googleSheetGid ?? undefined);
    return `Datos del catálogo (Google Sheet):\n${csv}`;
  } catch (err) {
    console.warn("[ai] Sheet no disponible:", err instanceof Error ? err.message : err);
    return null;
  }
}

async function callChatApi(
  provider: AiProvider,
  apiKey: string,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
): Promise<string> {
  if (provider === "openai" || provider === "deepseek") {
    const base =
      provider === "deepseek"
        ? "https://api.deepseek.com/v1/chat/completions"
        : "https://api.openai.com/v1/chat/completions";
    const model = provider === "deepseek" ? "deepseek-chat" : "gpt-4o-mini";
    const res = await fetch(base, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 500 }),
    });
    if (!res.ok) throw new Error(`IA ${provider}: ${res.status}`);
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return json.choices?.[0]?.message?.content?.trim() ?? "";
  }

  if (provider === "gemini") {
    const system = messages.find((m) => m.role === "system")?.content ?? "";
    const convo = messages
      .filter((m) => m.role !== "system")
      .map((m) => `${m.role === "user" ? "Cliente" : "Asistente"}: ${m.content}`)
      .join("\n");
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${system}\n\n${convo}` }] }],
        }),
      },
    );
    if (!res.ok) throw new Error(`IA gemini: ${res.status}`);
    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    return json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  }

  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "meta/llama-3.1-8b-instruct",
      messages,
      temperature: 0.7,
      max_tokens: 500,
    }),
  });
  if (!res.ok) throw new Error(`IA nvidia: ${res.status}`);
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content?.trim() ?? "";
}

export async function generateConversationReply(params: {
  tenantId: string;
  contactId: string;
  userMessage: string;
  systemPrompt: string;
  useSheet?: boolean;
  sheetUrl?: string | null;
  provider?: AiProvider;
}): Promise<string> {
  const config = await prisma.tenantAiConfig.findUnique({ where: { tenantId: params.tenantId } });
  const provider = (params.provider ?? config?.defaultProvider ?? "openai") as AiProvider;
  const apiKey = await resolveApiKey(params.tenantId, provider);
  if (!apiKey) {
    return "⚠️ IA no configurada. El negocio debe añadir API keys en Configuración → IA (BYOK).";
  }

  const history = await prisma.chatMessage.findMany({
    where: { contactId: params.contactId },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { direction: true, content: true },
  });

  const sheetBlock =
    params.useSheet !== false ? await loadSheetContext(params.tenantId, params.sheetUrl) : null;

  const systemParts = [
    params.systemPrompt,
    "Responde siempre en español, de forma natural y breve para WhatsApp (máx 500 caracteres si es posible).",
    sheetBlock,
  ].filter(Boolean);

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemParts.join("\n\n") },
  ];

  for (const msg of history.reverse()) {
    if (!msg.content?.trim()) continue;
    messages.push({
      role: msg.direction === "INBOUND" ? "user" : "assistant",
      content: msg.content,
    });
  }

  if (!history.some((m) => m.content === params.userMessage)) {
    messages.push({ role: "user", content: params.userMessage });
  }

  const reply = await callChatApi(provider, apiKey, messages);
  return reply || "Disculpa, no pude generar una respuesta. ¿Puedes reformular tu pregunta?";
}

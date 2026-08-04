import { prisma } from "@uniwai/database";
import { decryptSecret, encryptSecret } from "../lib/crypto";

export type AiProvider = "openai" | "gemini" | "deepseek" | "nvidia";

const PROVIDER_ENV: Record<AiProvider, string> = {
  openai: "OPENAI_API_KEY",
  gemini: "GEMINI_API_KEY",
  deepseek: "DEEPSEEK_API_KEY",
  nvidia: "NVIDIA_API_KEY",
};

function keyField(provider: AiProvider): keyof Pick<
  {
    encryptedOpenaiKey: string | null;
    encryptedGeminiKey: string | null;
    encryptedDeepseekKey: string | null;
    encryptedNvidiaKey: string | null;
  },
  "encryptedOpenaiKey" | "encryptedGeminiKey" | "encryptedDeepseekKey" | "encryptedNvidiaKey"
> {
  const map = {
    openai: "encryptedOpenaiKey",
    gemini: "encryptedGeminiKey",
    deepseek: "encryptedDeepseekKey",
    nvidia: "encryptedNvidiaKey",
  } as const;
  return map[provider];
}

export async function resolveTenantApiKey(
  tenantId: string,
  provider: AiProvider,
): Promise<string | null> {
  const config = await prisma.tenantAiConfig.findUnique({ where: { tenantId } });
  const field = keyField(provider);
  const encrypted = config?.[field];
  if (encrypted) {
    try {
      return decryptSecret(encrypted);
    } catch {
      /* fall through */
    }
  }
  return process.env[PROVIDER_ENV[provider]]?.trim() ?? null;
}

export async function saveTenantAiKeys(
  tenantId: string,
  payload: {
    defaultProvider?: AiProvider;
    openaiKey?: string;
    geminiKey?: string;
    deepseekKey?: string;
    nvidiaKey?: string;
  },
): Promise<void> {
  const data: Record<string, string | undefined> = {};
  if (payload.defaultProvider) data.defaultProvider = payload.defaultProvider;
  if (payload.openaiKey?.trim()) data.encryptedOpenaiKey = encryptSecret(payload.openaiKey.trim());
  if (payload.geminiKey?.trim()) data.encryptedGeminiKey = encryptSecret(payload.geminiKey.trim());
  if (payload.deepseekKey?.trim()) data.encryptedDeepseekKey = encryptSecret(payload.deepseekKey.trim());
  if (payload.nvidiaKey?.trim()) data.encryptedNvidiaKey = encryptSecret(payload.nvidiaKey.trim());

  await prisma.tenantAiConfig.upsert({
    where: { tenantId },
    create: { tenantId, ...data },
    update: data,
  });
}

export async function generateTextVariants(params: {
  tenantId: string;
  provider?: AiProvider;
  prompt: string;
  count?: number;
}): Promise<string[]> {
  const provider = params.provider ?? "openai";
  const apiKey = await resolveTenantApiKey(params.tenantId, provider);
  if (!apiKey) {
    throw new Error(
      `Sin API key para ${provider}. Configúrala en Configuración → IA (BYOK).`,
    );
  }

  const system = `Genera ${params.count ?? 4} variantes cortas y naturales en español para un mensaje de WhatsApp. 
Responde SOLO con un JSON array de strings, sin markdown. Máximo 160 caracteres cada una.`;
  const user = params.prompt;

  if (provider === "openai" || provider === "deepseek") {
    const base =
      provider === "deepseek"
        ? "https://api.deepseek.com/v1/chat/completions"
        : "https://api.openai.com/v1/chat/completions";
    const model = provider === "deepseek" ? "deepseek-chat" : "gpt-4o-mini";
    const res = await fetch(base, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.9,
      }),
    });
    if (!res.ok) throw new Error(`IA ${provider}: ${res.status}`);
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = json.choices?.[0]?.message?.content ?? "[]";
    return parseVariantsJson(raw);
  }

  if (provider === "gemini") {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${system}\n\n${user}` }] }],
        }),
      },
    );
    if (!res.ok) throw new Error(`IA gemini: ${res.status}`);
    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const raw = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";
    return parseVariantsJson(raw);
  }

  // NVIDIA NIM (OpenAI-compatible)
  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "meta/llama-3.1-8b-instruct",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.9,
    }),
  });
  if (!res.ok) throw new Error(`IA nvidia: ${res.status}`);
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = json.choices?.[0]?.message?.content ?? "[]";
  return parseVariantsJson(raw);
}

function parseVariantsJson(raw: string): string[] {
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) return [raw.trim()].filter(Boolean);
  try {
    const arr = JSON.parse(match[0]) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.map((v) => String(v).trim()).filter(Boolean).slice(0, 8);
  } catch {
    return raw
      .split("\n")
      .map((l) => l.replace(/^[-*\d.]+\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 8);
  }
}

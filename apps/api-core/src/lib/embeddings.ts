const EMBEDDING_DIM = 1536;

/** Embedding determinístico para dev sin API key (no semántico, solo pruebas RAG). */
function hashEmbedding(text: string): number[] {
  const vec = new Array<number>(EMBEDDING_DIM);
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
    vec[i % EMBEDDING_DIM] = (h % 1000) / 1000 - 0.5;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return hashEmbedding(text);
  }

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
      input: text.slice(0, 8000),
    }),
  });

  if (!res.ok) {
    console.warn("[embeddings] OpenAI failed, using hash fallback:", await res.text());
    return hashEmbedding(text);
  }

  const json = (await res.json()) as { data: Array<{ embedding: number[] }> };
  return json.data[0]?.embedding ?? hashEmbedding(text);
}

export function vectorToPgLiteral(vec: number[]): string {
  return `[${vec.map((n) => Number(n).toFixed(8)).join(",")}]`;
}

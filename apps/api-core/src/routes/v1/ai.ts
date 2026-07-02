import { Hono } from "hono";
import { z } from "zod";
import type { AppBindings } from "../../types";
import { buildGuardedPrompt } from "../../services/ai-guard";

const ai = new Hono<AppBindings>();

const chatSchema = z.object({
  message: z.string().min(1).max(4000),
  businessContext: z.string().min(10).max(12000),
});

ai.post("/guard", async (c) => {
  const parsed = chatSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ ok: false, error: "Payload inválido." }, 400);
  }

  const result = buildGuardedPrompt({
    userMessage: parsed.data.message,
    businessContext: parsed.data.businessContext,
  });

  if (!result.allowed) {
    return c.json({ ok: false, error: result.reason }, 400);
  }

  return c.json({
    ok: true,
    preview: result.sanitizedPrompt.slice(0, 280),
    note: "IA provider no conectado en dev; prompt validado por middleware.",
  });
});

export default ai;

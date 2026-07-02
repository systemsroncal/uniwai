import "./load-env";
import { z } from "zod";

/** JWT estándar de Supabase local (`supabase start`). Válidos solo en dev local. */
const SUPABASE_LOCAL_URL = "http://127.0.0.1:54321";
const SUPABASE_LOCAL_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6OjE5ODM4MTI5OTZ9.EGIM96RA1x35lJzdJsyHq-qwvMVlNHApvvJWsWRgPAI";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .optional()
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGINS: z.string().optional().default("http://localhost:3000"),
  SUPABASE_URL: z.string().url().default(SUPABASE_LOCAL_URL),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1)
    .default(SUPABASE_LOCAL_SERVICE_ROLE_KEY),
});

export const env = envSchema.parse(process.env);

export const corsOrigins = new Set(
  env.CORS_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0),
);

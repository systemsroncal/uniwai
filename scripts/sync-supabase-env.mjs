import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";

const root = process.cwd();
const envPath = resolve(root, ".env.local");

function parseEnvLines(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .reduce((acc, line) => {
      const idx = line.indexOf("=");
      if (idx <= 0) return acc;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      acc[key] = value;
      return acc;
    }, {});
}

const SUPABASE_LOCAL_URL = "http://127.0.0.1:54321";
const SUPABASE_LOCAL_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const SUPABASE_LOCAL_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6OjE5ODM4MTI5OTZ9.EGIM96RA1x35lJzdJsyHq-qwvMVlNHApvvJWsWRgPAI";

const defaults = {
  DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  SUPABASE_URL: SUPABASE_LOCAL_URL,
  SUPABASE_ANON_KEY: SUPABASE_LOCAL_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: SUPABASE_LOCAL_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_SUPABASE_URL: SUPABASE_LOCAL_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: SUPABASE_LOCAL_ANON_KEY,
  REDIS_URL: "redis://127.0.0.1:6379",
  PORT: "3001",
  CORS_ORIGINS: "http://localhost:3000,http://127.0.0.1:3000",
  NEXT_PUBLIC_API_URL: "http://localhost:3001",
};

let supabaseEnv = {};
try {
  const output = execSync("npx supabase status -o env", {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  });
  supabaseEnv = parseEnvLines(output);
} catch (error) {
  console.warn(
    "[env:sync] No se pudo leer `supabase status -o env`. ¿Está levantado? Ejecuta `bun run supabase:start`.",
  );
}

const existing = existsSync(envPath)
  ? parseEnvLines(readFileSync(envPath, "utf8"))
  : {};

const merged = {
  ...defaults,
  ...existing,
  ...supabaseEnv,
};

if (merged.API_URL && !merged.SUPABASE_URL) {
  merged.SUPABASE_URL = merged.API_URL;
}
if (merged.ANON_KEY && !merged.SUPABASE_ANON_KEY) {
  merged.SUPABASE_ANON_KEY = merged.ANON_KEY;
}
if (merged.SERVICE_ROLE_KEY && !merged.SUPABASE_SERVICE_ROLE_KEY) {
  merged.SUPABASE_SERVICE_ROLE_KEY = merged.SERVICE_ROLE_KEY;
}

if (!merged.NEXT_PUBLIC_SUPABASE_URL && merged.SUPABASE_URL) {
  merged.NEXT_PUBLIC_SUPABASE_URL = merged.SUPABASE_URL;
}
if (!merged.NEXT_PUBLIC_SUPABASE_ANON_KEY && merged.SUPABASE_ANON_KEY) {
  merged.NEXT_PUBLIC_SUPABASE_ANON_KEY = merged.SUPABASE_ANON_KEY;
}

const order = [
  "DATABASE_URL",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "REDIS_URL",
  "ENCRYPTION_KEY",
  "JWT_SECRET",
  "PORT",
  "CORS_ORIGINS",
  "NEXT_PUBLIC_API_URL",
];

const lines = order
  .filter((key) => merged[key] !== undefined)
  .map((key) => `${key}=${merged[key]}`);

for (const [key, value] of Object.entries(merged)) {
  if (!order.includes(key)) lines.push(`${key}=${value}`);
}

writeFileSync(envPath, `${lines.join("\n")}\n`, "utf8");
console.log(`[env:sync] Archivo generado: ${envPath}`);

const webEnvPath = resolve(root, "apps/web-crm/.env.local");
const webKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_API_URL",
];
const webLines = webKeys
  .filter((key) => merged[key] !== undefined)
  .map((key) => `${key}=${merged[key]}`);
mkdirSync(dirname(webEnvPath), { recursive: true });
writeFileSync(webEnvPath, `${webLines.join("\n")}\n`, "utf8");
console.log(`[env:sync] Frontend: ${webEnvPath}`);

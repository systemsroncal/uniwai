#!/usr/bin/env node
import { mkdirSync, writeFileSync, unlinkSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const flagPath = resolve(root, ".uniwai-stack/auto-down.enabled");
const action = process.argv[2];

if (action === "on") {
  mkdirSync(resolve(root, ".uniwai-stack"), { recursive: true });
  writeFileSync(flagPath, "enabled\n", "utf8");
  console.log("[stack] Auto-apagado ON — al terminar sesión de Cursor se ejecutará stack:down");
  console.log("[stack] Desactivar: bun run stack:auto-down:off");
} else if (action === "off") {
  if (existsSync(flagPath)) unlinkSync(flagPath);
  console.log("[stack] Auto-apagado OFF");
} else {
  console.log("Uso: node scripts/stack-auto-down.mjs on|off");
  process.exit(1);
}

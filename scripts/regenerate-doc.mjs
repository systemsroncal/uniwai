#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { marked } from "marked";

const mdPath = "docs/superpowers/specs/2026-07-02-uniwai-crm-design.md";
const htmlPath = "docs/superpowers/specs/2026-07-02-uniwai-crm-analisis-tecnico.html";

const md = readFileSync(mdPath, "utf8");
const existing = readFileSync(htmlPath, "utf8");
const cssMatch = existing.match(/<style>([\s\S]*?)<\/style>/);
const css = cssMatch?.[1] ?? "body{font-family:system-ui;max-width:900px;margin:2rem auto;padding:0 1.5rem}";

const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>UniWai CRM — Análisis Técnico v3.0</title>
  <style>${css}</style>
</head>
<body>
  <div class="print-hint">
    <strong>Exportar a PDF:</strong> Ctrl+P → Destino: &quot;Guardar como PDF&quot;
  </div>
  ${marked.parse(md)}
</body>
</html>`;

writeFileSync(htmlPath, html);
console.log("OK:", htmlPath);

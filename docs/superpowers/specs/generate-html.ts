import { readFileSync, writeFileSync } from "fs";
import { marked } from "marked";

const md = readFileSync(
  "docs/superpowers/specs/2026-07-02-uniwai-crm-design.md",
  "utf8"
);

const css = `
@media print { body { margin: 0; } h1, h2, h3 { page-break-after: avoid; } }
body { font-family: "Segoe UI", system-ui, sans-serif; max-width: 900px; margin: 2rem auto; padding: 0 1.5rem; line-height: 1.6; color: #1a1a1a; }
h1 { border-bottom: 2px solid #2563eb; padding-bottom: 0.5rem; }
h2 { color: #1e40af; margin-top: 2rem; }
table { border-collapse: collapse; width: 100%; margin: 1rem 0; font-size: 0.9rem; }
th, td { border: 1px solid #d1d5db; padding: 0.5rem 0.75rem; text-align: left; }
th { background: #f3f4f6; }
code { font-size: 0.85em; }
pre code { background: transparent; color: inherit; padding: 0; border-radius: 0; }
pre { background: #1e293b; color: #e2e8f0; padding: 1rem; overflow-x: auto; border-radius: 8px; }
blockquote { border-left: 4px solid #2563eb; margin: 1rem 0; padding-left: 1rem; color: #4b5563; }
.print-hint { background: #eff6ff; border: 1px solid #93c5fd; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; }
@media print { .print-hint { display: none; } }
`;

const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>UniWai CRM — Análisis Técnico</title>
  <style>${css}</style>
</head>
<body>
  <div class="print-hint">
    <strong>Exportar a PDF:</strong> Ctrl+P → Destino: &quot;Guardar como PDF&quot; → Guardar.
  </div>
  ${marked.parse(md)}
</body>
</html>`;

writeFileSync(
  "docs/superpowers/specs/2026-07-02-uniwai-crm-analisis-tecnico.html",
  html
);
console.log("OK: docs/superpowers/specs/2026-07-02-uniwai-crm-analisis-tecnico.html");

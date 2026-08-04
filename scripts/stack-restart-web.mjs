#!/usr/bin/env node
/**
 * Web en modo producción (poca RAM, estable en PCs 8 GB).
 * 1. Detiene worker para liberar memoria
 * 2. Compila si hace falta (una vez)
 * 3. Arranca next start en :3000
 */
import {
  hasWebBuild,
  killPid,
  killPort,
  log,
  readPids,
  run,
  startProcess,
  waitForHttp,
} from "./stack/lib.mjs";

const pids = readPids();
if (pids.worker) {
  log("stop", `Liberando RAM — deteniendo worker (PID ${pids.worker})…`);
  killPid(pids.worker);
}

killPort(3000);

if (!hasWebBuild()) {
  log("build", "Compilando Next.js (una vez, 2–4 min). Cierra Chrome si falla…");
  try {
    run("bun run build:web", {
      env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=2048" },
    });
  } catch {
    log("warn", "Build falló (RAM). Cierra apps y ejecuta: bun run stack:web");
    process.exit(1);
  }
}

log("web", "Iniciando en modo producción (estable, poca RAM)…");
startProcess("web", "dev:web:start");

log("wait", "Esperando http://localhost:3000/login …");
const ok = await waitForHttp("http://127.0.0.1:3000/login", 30, 2000);
if (ok) {
  log("web", "Listo → http://localhost:3000/login");
} else {
  log("warn", "Web no respondió — revisa .uniwai-stack/web.log");
  process.exit(1);
}

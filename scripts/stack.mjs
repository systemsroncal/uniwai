#!/usr/bin/env node
/**
 * UniWai — alternar entre DESARROLLO y PRUEBA (8 GB friendly).
 *
 * Comandos principales:
 *   probar       Apaga stack de desarrollo → levanta solo CRM para probar
 *   desarrollar  Apaga modo prueba → levanta stack de desarrollo completo
 *   down         Apaga absolutamente todo
 *   status       Estado actual
 */
import {
  bootstrapDev,
  hasWebBuild,
  isCloudDatabase,
  isPortListening,
  isRedisUp,
  isSupabaseUp,
  log,
  printBanner,
  readStackMode,
  startCrmApps,
  startDevStack,
  startProcess,
  startRedis,
  startSupabase,
  stopApps,
  stopDevStack,
  stopRedis,
  stopSupabase,
  syncEnv,
  waitForHttp,
  writePids,
  writeStackMode,
} from "./stack/lib.mjs";

const mode = process.argv[2] ?? "help";
const flags = new Set(process.argv.slice(3));
const skipBootstrap = flags.has("--skip-bootstrap");

/** Modo PRUEBA: apagar dev stack, encender solo CRM (Web + API). */
async function cmdProbar() {
  console.log("\n▶ Entrando en MODO PRUEBA\n");

  const cloud = isCloudDatabase();
  const keepSupabase = !cloud && !flags.has("--apagar-docker");

  if (!cloud) {
    log("info", "Supabase LOCAL — se mantiene Docker (auth/DB).");
    log("info", "Redis se mantiene activo (la API lo necesita).");
    log("tip", "Con Supabase Cloud en .env.local liberas más RAM al probar.");
  } else {
    log("info", "Supabase en nube — apagando Docker local.");
  }

  if (!isSupabaseUp() && !cloud) {
    log("supabase", "Supabase no responde — reiniciando (1–2 min)…");
    const ok = startSupabase();
    if (!ok) {
      log("warn", "Sin Supabase: login y datos no funcionarán hasta iniciar Docker Desktop.");
    }
  } else if (!cloud) {
    log("supabase", "OK (puerto 54321 activo).");
  }

  log("dev-stack", "Reiniciando apps CRM…");
  stopDevStack({ keepSupabase, keepRedis: true });

  if (!isRedisUp()) {
    log("redis", "Iniciando Redis…");
    startRedis();
  } else {
    log("redis", "OK.");
  }

  await startCrmApps("probar", {
    withWorker: !flags.has("--sin-worker"),
    webProd: !flags.has("--dev-web"),
  });

  if (!flags.has("--sin-worker")) {
    log("tip", "PC 8 GB: usa --sin-worker para más estabilidad (sin WhatsApp worker).");
  }
  if (!hasWebBuild() && !flags.has("--dev-web")) {
    log("tip", "Primera vez: ejecuta bun run stack:web para compilar y arrancar en modo producción.");
  }

  printBanner("probar", {
    Web: "http://localhost:3000/login",
    API: "http://localhost:3001/health",
    Worker: "wa-worker (logs → .uniwai-stack/worker.log)",
  }, "Al terminar pruebas → bun run stack:desarrollar");
}

/** Modo DESARROLLO: apagar prueba, encender stack completo. */
async function cmdDesarrollar() {
  console.log("\n▶ Entrando en MODO DESARROLLO\n");

  // 1. Apagar lo que esté corriendo (prueba o dev previo)
  stopApps();

  // 2. Levantar stack de desarrollo
  startSupabase();
  startRedis();
  syncEnv();
  if (!skipBootstrap) bootstrapDev();

  await startCrmApps("desarrollar");

  printBanner("desarrollar", {
    Web: "http://localhost:3000/login",
    API: "http://localhost:3001/health",
    Worker: "wa-worker (logs → .uniwai-stack/worker.log)",
    Supabase: "http://127.0.0.1:54323",
  }, "Para probar el CRM → bun run stack:probar");
}

async function cmdDown() {
  log("down", "Apagando todo…");
  stopDevStack({ keepSupabase: false });
  writeStackMode("off");
  log("down", "Listo. RAM liberada.");
}

async function cmdFull() {
  console.log("\n▶ DESARROLLO + WhatsApp worker\n");
  stopApps();
  startSupabase();
  startRedis();
  syncEnv();
  if (!skipBootstrap) bootstrapDev();

  const pids = { startedAt: new Date().toISOString(), stackMode: "desarrollar" };
  for (const [name, script] of [
    ["api", "dev:api"],
    ["web", "dev:web"],
    ["worker", "dev:worker"],
  ]) {
    log("start", `${name} → bun run ${script}`);
    pids[name] = startProcess(name, script);
  }
  writePids(pids);
  writeStackMode("desarrollar");

  printBanner("desarrollar", {
    Web: "http://localhost:3000/login",
    WhatsApp: "http://localhost:3000/app/whatsapp",
  }, "Worker activo. Al terminar → bun run stack:down");
}

function cmdStatus() {
  const saved = readStackMode();
  const activeMode = saved?.stackMode ?? "desconocido";

  console.log("\n── UniWai — estado ──");
  console.log(`  Modo guardado  : ${activeMode}`);
  console.log(`  Supabase local : ${isSupabaseUp() ? "✓ activo" : "✗ apagado"}`);
  console.log(`  Redis          : ${isRedisUp() ? "✓ activo" : "✗ apagado"}`);
  console.log(`  API :3001      : ${isPortListening(3001) ? "✓ activo" : "✗ apagado"}`);
  console.log(`  Web :3000      : ${isPortListening(3000) ? "✓ activo" : "✗ apagado"}`);
  console.log(`  DB en nube     : ${isCloudDatabase() ? "✓ sí (.env.local)" : "✗ no (local Docker)"}`);
  console.log("\n  bun run stack:probar      → probar CRM (apaga dev)");
  console.log("  bun run stack:desarrollar → volver a desarrollar");
  console.log("  bun run stack:down        → apagar todo\n");
}

function cmdHelp() {
  console.log(`
UniWai — alternar desarrollo ↔ pruebas

  PRINCIPALES (lo que necesitas):

    bun run stack:probar
      1. Apaga stack de desarrollo (Supabase Docker, Redis, API, Web)
      2. Levanta solo CRM (API + Web) para probar en el navegador

    bun run stack:desarrollar
      1. Apaga modo prueba
      2. Levanta stack de desarrollo (Supabase + Redis + API + Web)

  OTROS:

    bun run stack:down     Apagar absolutamente todo
    bun run stack:status   Ver qué está activo
    bun run stack:full     Desarrollo + worker WhatsApp

  FLAGS:

    --apagar-docker  Forzar apagar Supabase local (solo si usas DB en nube)
    --skip-bootstrap No ejecutar bootstrap (más rápido)

  FLUJO:

    Desarrollando código  →  bun run stack:desarrollar
    Voy a probar el CRM   →  bun run stack:probar
    Terminé de probar     →  bun run stack:desarrollar
    Cierro por hoy        →  bun run stack:down
`);
}

const commands = {
  probar: cmdProbar,
  desarrollar: cmdDesarrollar,
  dev: cmdDesarrollar,
  down: cmdDown,
  full: cmdFull,
  status: cmdStatus,
  help: cmdHelp,
  // alias antiguos
  lite: cmdProbar,
  test: cmdProbar,
};

const fn = commands[mode];
if (!fn) {
  console.error(`Comando desconocido: ${mode}`);
  cmdHelp();
  process.exit(1);
}

await fn();

import { execSync, spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
} from "node:fs";
import { resolve } from "node:path";

export const root = resolve(import.meta.dirname, "../..");
export const stackDir = resolve(root, ".uniwai-stack");
export const pidFile = resolve(stackDir, "pids.json");
export const modeFile = resolve(stackDir, "mode.json");

const isWin = process.platform === "win32";

function findBunExecutable() {
  if (process.env.BUN_INSTALL) {
    const candidate = resolve(process.env.BUN_INSTALL, "bin", isWin ? "bun.exe" : "bun");
    if (existsSync(candidate)) return candidate;
  }

  if (isWin) {
    try {
      const hit = execSync("where.exe bun", {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      })
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find((line) => line.toLowerCase().endsWith("bun.exe"));
      if (hit) return hit;
    } catch {
      /* fall through */
    }

    const home = process.env.USERPROFILE ?? process.env.HOME ?? "";
    const candidates = [
      resolve(home, ".bun", "bin", "bun.exe"),
      "C:\\Program Files\\nodejs\\bun.exe",
    ];
    for (const candidate of candidates) {
      if (existsSync(candidate)) return candidate;
    }
  }

  return "bun";
}

const bunExecutable = findBunExecutable();

export function log(tag, message) {
  console.log(`[stack:${tag}] ${message}`);
}

export function run(cmd, opts = {}) {
  log("run", cmd);
  return execSync(cmd, {
    cwd: root,
    stdio: "inherit",
    encoding: "utf8",
    ...opts,
  });
}

export function runQuiet(cmd, timeoutMs = 20_000) {
  try {
    return execSync(cmd, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: timeoutMs,
    }).trim();
  } catch {
    return "";
  }
}

export function ensureStackDir() {
  mkdirSync(stackDir, { recursive: true });
}

export function readPids() {
  if (!existsSync(pidFile)) return {};
  try {
    return JSON.parse(readFileSync(pidFile, "utf8"));
  } catch {
    return {};
  }
}

export function writePids(pids) {
  ensureStackDir();
  writeFileSync(pidFile, `${JSON.stringify(pids, null, 2)}\n`, "utf8");
}

export function clearPids() {
  if (existsSync(pidFile)) unlinkSync(pidFile);
}

export function killPid(pid) {
  if (!pid) return;
  try {
    if (isWin) {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" });
    } else {
      process.kill(pid, "SIGTERM");
    }
  } catch {
    /* already dead */
  }
}

export function killPort(port) {
  if (isWin) {
    const out = runQuiet(`netstat -ano | findstr :${port}`);
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      if (!line.includes("LISTENING")) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts.at(-1);
      if (pid && /^\d+$/.test(pid)) pids.add(pid);
    }
    for (const pid of pids) killPid(Number(pid));
    return;
  }

  runQuiet(`lsof -ti:${port} | xargs -r kill -9`);
}

export function isPortListening(port) {
  if (isWin) {
    const out = runQuiet(`netstat -ano | findstr :${port}`);
    return out.split(/\r?\n/).some((line) => line.includes("LISTENING"));
  }
  return Boolean(runQuiet(`lsof -ti:${port}`));
}

export function isSupabaseUp() {
  if (isPortListening(54321)) return true;
  const out = runQuiet("npx supabase status -o env", 12_000);
  return out.includes("API_URL=") && out.includes("127.0.0.1:54321");
}

export function isRedisUp() {
  const out = runQuiet('docker ps --filter "name=uniwai-redis" --format "{{.Status}}"');
  return out.toLowerCase().includes("up");
}

export function isDockerUp() {
  const out = runQuiet("docker info --format {{.ServerVersion}}", 8_000);
  return Boolean(out);
}

export function startSupabase() {
  if (isSupabaseUp()) {
    log("supabase", "Ya está corriendo.");
    return true;
  }
  if (!isDockerUp()) {
    log("warn", "Docker Desktop no está corriendo. Ábrelo y vuelve a ejecutar stack:probar.");
    return false;
  }
  log("supabase", "Iniciando (puede tardar 1–2 min)…");
  try {
    run("npx supabase start --ignore-health-check");
    return isSupabaseUp();
  } catch {
    log("warn", "No se pudo iniciar Supabase local.");
    return false;
  }
}

export function stopSupabase() {
  log("supabase", "Deteniendo…");
  try {
    run("npx supabase stop");
  } catch {
    log("supabase", "Algunos contenedores no respondieron — prueba reiniciar Docker Desktop.");
  }
}

export function startRedis() {
  if (isRedisUp()) {
    log("redis", "Ya está corriendo.");
    return true;
  }
  if (!isDockerUp()) {
    log("warn", "Redis requiere Docker. WhatsApp QR/cola outbound no funcionarán hasta levantar Docker.");
    return false;
  }
  log("redis", "Iniciando contenedor…");
  try {
    run("docker compose -f docker/docker-compose.yml up -d");
    return isRedisUp();
  } catch {
    log("warn", "No se pudo iniciar Redis.");
    return false;
  }
}

export function stopRedis() {
  log("redis", "Deteniendo…");
  try {
    run("docker compose -f docker/docker-compose.yml down");
  } catch {
    log("redis", "No se pudo detener Redis.");
  }
}

export function syncEnv() {
  run("node scripts/sync-supabase-env.mjs");
}

export function bootstrapDev() {
  run("bun scripts/bootstrap-dev.mjs");
}

export function startProcess(name, bunScript) {
  const logPath = resolve(stackDir, `${name}.log`);
  ensureStackDir();

  const memMb =
    name === "web"
      ? bunScript === "dev:web:start"
        ? "384"
        : "1024"
      : name === "api"
        ? "512"
        : "384";
  const out = openSync(logPath, "a");
  const child = spawn(bunExecutable, ["run", bunScript], {
    cwd: root,
    detached: true,
    stdio: ["ignore", out, out],
    env: {
      ...process.env,
      NODE_OPTIONS: `--max-old-space-size=${memMb}`,
    },
    shell: false,
    windowsHide: true,
  });

  child.unref();
  log("pid", `${name} → ${bunExecutable} (PID ${child.pid})`);
  return child.pid;
}

export async function waitForHttp(url, maxAttempts = 30, delayMs = 2000) {
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) return true;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

export function stopApps() {
  const pids = readPids();
  for (const [name, pid] of Object.entries(pids)) {
    if (["startedAt", "mode", "stackMode"].includes(name)) continue;
    log("stop", `Deteniendo ${name} (PID ${pid})…`);
    killPid(pid);
  }
  killPort(3000);
  killPort(3001);
  clearPids();
}

export function readStackMode() {
  if (!existsSync(modeFile)) return null;
  try {
    return JSON.parse(readFileSync(modeFile, "utf8"));
  } catch {
    return null;
  }
}

export function writeStackMode(stackMode) {
  ensureStackDir();
  const prev = readStackMode() ?? {};
  writeFileSync(
    modeFile,
    `${JSON.stringify({ ...prev, stackMode, updatedAt: new Date().toISOString() }, null, 2)}\n`,
    "utf8",
  );
}

/** ¿Supabase/DB apuntan a la nube (no localhost)? */
export function isCloudDatabase() {
  const envPath = resolve(root, ".env.local");
  if (!existsSync(envPath)) return false;
  const content = readFileSync(envPath, "utf8");
  const db = content.match(/^DATABASE_URL=(.+)$/m)?.[1] ?? "";
  const supa = content.match(/^SUPABASE_URL=(.+)$/m)?.[1] ?? "";
  const local = (v) => /localhost|127\.0\.0\.1|:54321|:54322/.test(v);
  return Boolean(db && supa && !local(db) && !local(supa));
}

export function stopDevStack({ keepSupabase = false, keepRedis = false } = {}) {
  log("dev-stack", "Apagando stack de desarrollo…");
  stopApps();
  if (!keepRedis) stopRedis();
  if (!keepSupabase) stopSupabase();
}

export function startDevStack({ skipBootstrap = false } = {}) {
  startSupabase();
  startRedis();
  syncEnv();
  if (!skipBootstrap) bootstrapDev();
}

export const webBuildIdPath = resolve(root, "apps/web-crm/.next/BUILD_ID");

export function hasWebBuild() {
  return existsSync(webBuildIdPath);
}

export function webStackScript(preferProd = true) {
  if (preferProd && hasWebBuild()) return "dev:web:start";
  return "dev:web:stack";
}

export function startCrmApps(stackMode, { withWorker = true, webProd = true } = {}) {
  const services = [
    ["api", "dev:api:stack"],
    ["web", webStackScript(webProd)],
  ];
  if (withWorker) services.push(["worker", "dev:worker:stack"]);
  return startAppsInternal(stackMode, services);
}

async function startAppsInternal(stackMode, services) {
  stopApps();

  const pids = {
    startedAt: new Date().toISOString(),
    stackMode,
  };

  for (const [name, script] of services) {
    if (name === "api" && isPortListening(3001)) {
      log("skip", "API ya escucha en :3001");
      continue;
    }
    if (name === "web" && isPortListening(3000)) {
      log("skip", "Web ya escucha en :3000");
      continue;
    }
    log("start", `${name} → bun run ${script}`);
    pids[name] = startProcess(name, script);
  }

  writePids(pids);
  writeStackMode(stackMode);

  log("wait", "Esperando CRM…");
  if (services.some(([n]) => n === "api")) {
    const apiOk = await waitForHttp("http://127.0.0.1:3001/health", 25, 2000);
    if (!apiOk) log("warn", "API no respondió — revisa .uniwai-stack/api.log");
  }
  if (services.some(([n]) => n === "web")) {
    const webOk = await waitForHttp("http://127.0.0.1:3000/login", 25, 2000);
    if (!webOk) log("warn", "Web no respondió — revisa .uniwai-stack/web.log");
  }
}

export function printBanner(stackMode, urls, footer) {
  console.log("\n─────────────────────────────────────────");
  console.log(`  UniWai — ${stackMode === "probar" ? "MODO PRUEBA" : "MODO DESARROLLO"}`);
  console.log("─────────────────────────────────────────");
  for (const [label, url] of Object.entries(urls)) {
    console.log(`  ${label.padEnd(12)} ${url}`);
  }
  console.log("\n  Login: superadmin@uniwai.dev / SuperAdmin123!");
  if (footer) console.log(`\n  ${footer}`);
  console.log("─────────────────────────────────────────\n");
}

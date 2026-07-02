# Plan Ejecutable — Fase 0/Fase 1 (UniWai CRM)

## Contexto
- Base: `docs/superpowers/specs/2026-07-02-uniwai-crm-design.md`.
- Decisiones aprobadas: Supabase CLI + Prisma + Redis/BullMQ.
- Estado actual: `packages/database`, `packages/shared` y `supabase/` ya creados.

## Objetivo de esta ejecución
Levantar la base operativa del monorepo para empezar desarrollo real:
1) `apps/api-core` (Hono + Bun + health + seguridad base),
2) `apps/web-crm` (Next.js 15 shell + Tailwind + shadcn base + Framer Motion),
3) `services/wa-worker` (esqueleto BullMQ + warmup básico),
4) scripts raíz y documentación de arranque.

## Tareas

### T1 — API Core
1. Crear `apps/api-core` con TypeScript.
2. Instalar: `hono`, `@hono/node-server`, `zod`, `dotenv`.
3. Implementar servidor Bun con:
   - `GET /health` (status ok, timestamp, service).
   - Middleware CORS por allowlist env.
   - Headers mínimos de seguridad (HSTS, nosniff, frame deny, referrer-policy).
4. Agregar scripts `dev`, `start`, `typecheck`.

**Verificación T1**
- `bun run --filter @uniwai/api-core typecheck`
- Levantar local y comprobar `/health`.

### T2 — Web CRM shell
1. Crear `apps/web-crm` con Next.js 15 + TS + App Router.
2. Integrar Tailwind y layout base.
3. Instalar y configurar `framer-motion`.
4. Crear páginas mínimas:
   - `/` landing placeholder.
   - `/app` dashboard shell.
5. Agregar componente base con estilo shadcn-like (`Button`) para dejar listo el sistema UI.

**Verificación T2**
- `bun run --filter @uniwai/web-crm typecheck`
- `bun run --filter @uniwai/web-crm build`

### T3 — WA Worker skeleton
1. Crear `services/wa-worker` con TypeScript.
2. Instalar: `bullmq`, `ioredis`, `dotenv`, `@whiskeysockets/baileys` (skeleton).
3. Crear colas y worker warmup base:
   - Job `warmup:simulate`.
   - Delay de composing aleatorio por caracteres (función utilitaria).
4. Exponer script `dev` para iniciar worker.

**Verificación T3**
- `bun run --filter @uniwai/wa-worker typecheck`

### T4 — Integración monorepo
1. Actualizar scripts raíz (`dev`, `build`, `typecheck` por filtros).
2. Actualizar `docs/DEV.md` con comandos para levantar:
   - `supabase start`
   - `docker compose -f docker/docker-compose.yml up -d`
   - api, web, worker
3. Revisar `.env.example` con variables faltantes para apps/worker.

**Verificación T4**
- `bun install`
- typecheck global.

## Criterio de listo
- Los 3 paquetes (`api-core`, `web-crm`, `wa-worker`) existen y compilan.
- `GET /health` responde OK.
- `web-crm` build pasa.
- Worker inicia sin crash en ausencia de credenciales reales.

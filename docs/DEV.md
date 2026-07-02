# Desarrollo local — UniWai CRM

Requisitos: [Bun](https://bun.sh) 1.x.

**Para CRM completo (auth, API, DB):** [Docker Desktop](https://docs.docker.com/desktop/) + Supabase CLI (`npx supabase`).

**Solo landing (sin login real):** `bun run dev:landing` — no requiere Docker.

## Arranque rápido (CRM con auth)

### Paso 0 — Docker Desktop (obligatorio)

1. Instala [Docker Desktop para Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
2. Abre Docker Desktop y espera a que diga **Running**
3. **Reinicia la terminal** (o Cursor) para que `docker` esté en el PATH
4. Verifica: `docker version`

Si ves `open //./pipe/docker_engine: The system cannot find the file specified`, Docker **no está corriendo**.

### Paso 1 — Base de datos y auth

```bash
bun run supabase:start      # Postgres + Auth (requiere Docker)
bun run env:sync
bun run setup:db            # prisma db push + seed planes
bun run bootstrap:dev       # superadmin en Supabase + Prisma
```

Terminal 1: `bun run dev:api`  
Terminal 2: `bun run dev:web`

### Cuentas de desarrollo

| Rol | Email | Contraseña |
|-----|-------|------------|
| Superadmin | `superadmin@uniwai.dev` | `SuperAdmin123!` |
| Dueño de negocio | Registro en `/register` | la que elijas |

Tras registrarte como dueño, el API crea automáticamente: tenant, plan Básico (trial), columnas Kanban y usuario `OWNER`.

## 1. Dependencias

```bash
bun install
```

## 2. Supabase (Postgres + Auth)

```bash
bun run supabase:start
bun run env:sync
bun run setup:db
bun run bootstrap:dev
```

## 3. Redis (opcional)

BullMQ y warmup usan Redis. Sin Docker, el API usa **memoria en proceso** para `currentNodeId` del bot.

```bash
docker compose -f docker/docker-compose.yml up -d
```

## 4. Servicios

```bash
bun run dev:api    # http://localhost:3001
bun run dev:web    # http://localhost:3000
bun run dev:worker # BullMQ warmup (opcional)
```

## 5. Rutas principales

| Ruta | Descripción |
|------|-------------|
| `/` | Landing |
| `/login` | Inicio de sesión (Supabase) |
| `/register` | Alta dueño + provision tenant |
| `/app` | Dashboard (requiere auth) |
| `/app/kanban` | CRM Kanban + bot toggle |
| `/app/inbox` | Contactos + human takeover |
| `/app/builder` | Bot Builder (OWNER) |
| `/app/team` | Invitar vendedores (OWNER) |
| `/app/admin` | Superadmin |

## API (`/api/v1`)

- `POST /auth/provision` — crea tenant tras signup
- `GET /auth/me` — usuario CRM + tenant + plan
- `GET /kanban/columns` — pipeline con contactos
- `GET|POST /contacts` — inbox
- `PATCH /contacts/:id/bot-toggle` — human takeover
- `GET /admin/*` — solo SUPERADMIN

## Variables

Ver `.env.example`. Usa `.env.local` (generado con `env:sync`).

## Typecheck / build

```bash
bun run typecheck
bun run build
```

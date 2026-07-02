# @uniwai/database

Paquete de base de datos para **UniWai CRM**: esquema Prisma (PostgreSQL), cliente tipado y seed de planes SaaS.

## Requisitos

- PostgreSQL 16 (recomendado: Supabase CLI local)
- Extensiones (vía migración SQL en Supabase, no Prisma): `postgis`, `vector`
- Variable de entorno `DATABASE_URL`

## Instalación

Desde la raíz del monorepo (cuando existan workspaces):

```bash
bun install
```

O solo este paquete:

```bash
cd packages/database
bun install
```

## Variables de entorno

Crea `packages/database/.env` (o usa la raíz del monorepo):

```env
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
```

## Comandos

```bash
# Generar Prisma Client
bun run db:generate

# Aplicar schema (desarrollo rápido)
bun run db:push

# Migraciones versionadas
bun run db:migrate

# Seed de planes (Básico, Lite, Pro, Enterprise, Custom)
bun run db:seed

# Prisma Studio
bun run db:studio
```

## Uso en apps

```typescript
import { prisma, PrismaClient, type PlanLimits } from "@uniwai/database";

// Singleton (recomendado en api-core)
const tenants = await prisma.tenant.findMany({
  where: { status: "ACTIVE" },
  include: { subscriptions: { include: { plan: true } } },
});

// Verificar límites del plan
const limits = tenant.subscriptions[0]?.plan.limits as PlanLimits;
if (limits.maxBots <= botCount) {
  throw new Error("Plan limit: maxBots");
}
```

## Modelos principales

| Modelo | Alcance | Descripción |
|--------|---------|-------------|
| `Tenant` | Plataforma | Cliente SaaS aislado |
| `User` | Tenant / global | RBAC: SUPERADMIN, OWNER, VENDEDOR |
| `Plan` | Global | Catálogo de planes con `limits` JSON |
| `Subscription` | Tenant | Suscripción activa a un plan |
| `WhatsAppInstance` | Tenant | META_CLOUD o BAILEYS + flags warmup |
| `KanbanColumn` | Tenant | Columnas del CRM Kanban |
| `Contact` | Tenant | Prospecto: bot, nodo actual, flowState |
| `ChatMessage` | Tenant | Mensajes inbound/outbound |
| `BotFlow` | Tenant | Flujos React Flow (nodes/edges JSON) |
| `FlowTemplate` | Global / tenant | Plantillas clonables |
| `Product` | Tenant | Catálogo (Sheets o WA Catalog) |
| `Order` | Tenant | Pedidos con lat/lng PostGIS-ready |
| `KnowledgeDocument` | Tenant | Documentos RAG |
| `KnowledgeChunk` | Tenant | Chunks + embedding pgvector |
| `Campaign` | Tenant | Campañas masivas por canal |
| `CampaignContact` | Tenant | Destinatarios por campaña |
| `TenantPaymentConfig` | Tenant | Credenciales MP cifradas |
| `WarmupConfig` | Tenant | Config calentador P2P por instancia |
| `WarmupLog` | Tenant | Registro de mensajes warmup |
| `AuditLog` | Tenant / global | Auditoría de acciones |

## Multi-tenancy

Todas las tablas de negocio incluyen `tenantId`, excepto:

- `Plan` (catálogo global)
- `User.tenantId` opcional (SUPERADMIN)
- `FlowTemplate.tenantId` opcional (plantillas globales)
- `AuditLog.tenantId` opcional (acciones de plataforma)

El filtrado por tenant debe aplicarse en **Prisma middleware** en `api-core` (fail-closed).

## PostGIS y pgvector

El schema usa campos `Float?` (`storeLat`/`storeLng`, `deliveryLat`/`deliveryLng`) y `Unsupported("vector(1536)")` hasta que las extensiones estén habilitadas. Comentarios en `schema.prisma` indican la migración SQL a `geography(Point, 4326)` y `vector(1536)`.

## Planes (seed)

| Plan | Precio | Bots | Flujos | Marketing |
|------|--------|------|--------|-----------|
| Básico | $9.99 | 1 | 5 | No |
| Lite | $14.99 | 2 | 10 | QR 499 / Meta 1k |
| Pro | $24.99 | 5 | 20 | QR 499 / Meta 2k |
| Enterprise | $39.99 | 10 | 40 | QR 499 / Meta 3k |
| Custom | Contactar | A medida | A medida | QR 499 / Meta 1k base |

Ejecuta `bun run db:seed` después de la primera migración.

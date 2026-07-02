# Supabase — UniWai CRM (local dev)

Configuración local del CLI de Supabase para Postgres, Auth, Storage y Realtime.

## Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) en ejecución
- [Supabase CLI](https://supabase.com/docs/guides/cli) instalado

```bash
# Instalar CLI (ejemplo con npm)
npm install -g supabase

# Verificar
supabase --version
```

## Estructura

```
supabase/
├── config.toml              # Configuración local (puertos, auth, seed)
├── migrations/              # Migraciones SQL versionadas
│   ├── 20260702120000_enable_extensions.sql
│   └── 20260702120001_rls_tenant_template.sql
├── seed.sql                 # Datos iniciales (planes SaaS)
└── README.md
```

## Comandos habituales

### Primera vez (si no existiera `supabase/`)

Este repo ya incluye los archivos generados por `supabase init`. Si partieras de cero:

```bash
supabase init
```

### Levantar stack local

```bash
supabase start
```

Al terminar, el CLI imprime URLs y claves (`anon`, `service_role`, `DB URL`). Studio: http://127.0.0.1:54323

### Aplicar migraciones y seed

Recrea la base desde cero (migraciones + `seed.sql`):

```bash
supabase db reset
```

Solo nuevas migraciones (sin borrar datos):

```bash
supabase migration up
```

### Generar tipos TypeScript

Desde la raíz del monorepo, apuntando al esquema `public`:

```bash
supabase gen types typescript --local > packages/database/src/types/supabase.ts
```

Ajusta la ruta de salida según dónde viva el paquete de tipos en tu app.

Con proyecto remoto vinculado:

```bash
supabase gen types typescript --project-id <PROJECT_REF> > packages/database/src/types/supabase.ts
```

### Parar servicios

```bash
supabase stop
```

## Notas de seguridad

- **RLS**: toda tabla con datos de tenant debe tener `ENABLE ROW LEVEL SECURITY` y políticas por `tenant_id` (ver plantilla en `migrations/20260702120001_rls_tenant_template.sql`). El JWT debe incluir el claim `tenant_id`.
- **Service role**: solo en servidor/workers; nunca en el cliente.
- **Seed**: `plans` es catálogo global; las tablas multi-tenant se añadirán en migraciones futuras con el patrón RLS documentado.

## Puertos por defecto (local)

| Servicio   | Puerto |
|-----------|--------|
| API       | 54321  |
| Postgres  | 54322  |
| Studio    | 54323  |
| Inbucket  | 54324  |

# Graph Report - .  (2026-07-02)

## Corpus Check
- Corpus is ~23,466 words - fits in a single context window. You may not need a graph.

## Summary
- 693 nodes · 872 edges · 50 communities (38 shown, 12 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 66 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_CRM App Pages|CRM App Pages]]
- [[_COMMUNITY_API Core Routes|API Core Routes]]
- [[_COMMUNITY_WA Worker & Specs|WA Worker & Specs]]
- [[_COMMUNITY_Shared Types & Plans|Shared Types & Plans]]
- [[_COMMUNITY_Database Package Config|Database Package Config]]
- [[_COMMUNITY_Shared Package Source|Shared Package Source]]
- [[_COMMUNITY_Web CRM Dependencies|Web CRM Dependencies]]
- [[_COMMUNITY_API Architecture Concepts|API Architecture Concepts]]
- [[_COMMUNITY_CRM Auth & API Client|CRM Auth & API Client]]
- [[_COMMUNITY_API Core Dependencies|API Core Dependencies]]
- [[_COMMUNITY_Web CRM TypeScript Config|Web CRM TypeScript Config]]
- [[_COMMUNITY_API Bootstrap & Security|API Bootstrap & Security]]
- [[_COMMUNITY_Database Dependencies|Database Dependencies]]
- [[_COMMUNITY_CRM Bot Toggle Flow|CRM Bot Toggle Flow]]
- [[_COMMUNITY_Flow Store & Contacts|Flow Store & Contacts]]
- [[_COMMUNITY_WA Worker Dependencies|WA Worker Dependencies]]
- [[_COMMUNITY_Landing Page Components|Landing Page Components]]
- [[_COMMUNITY_Shared TSConfig|Shared TSConfig]]
- [[_COMMUNITY_Database TSConfig|Database TSConfig]]
- [[_COMMUNITY_API Core TSConfig|API Core TSConfig]]
- [[_COMMUNITY_Warmup Queue Pipeline|Warmup Queue Pipeline]]
- [[_COMMUNITY_Bot Builder UI|Bot Builder UI]]
- [[_COMMUNITY_Supabase Env Sync|Supabase Env Sync]]
- [[_COMMUNITY_Root Package Config|Root Package Config]]
- [[_COMMUNITY_WA Worker TSConfig|WA Worker TSConfig]]
- [[_COMMUNITY_Contact Route Handlers|Contact Route Handlers]]
- [[_COMMUNITY_Dev Bootstrap Script|Dev Bootstrap Script]]
- [[_COMMUNITY_Supabase Session Middleware|Supabase Session Middleware]]
- [[_COMMUNITY_Flow Store Redis|Flow Store Redis]]
- [[_COMMUNITY_Landing Marketing Sections|Landing Marketing Sections]]
- [[_COMMUNITY_Prisma Seed Script|Prisma Seed Script]]
- [[_COMMUNITY_Root Layout Metadata|Root Layout Metadata]]
- [[_COMMUNITY_Login & Register Forms|Login & Register Forms]]
- [[_COMMUNITY_AI Prompt Guard|AI Prompt Guard]]
- [[_COMMUNITY_Database Index Exports|Database Index Exports]]
- [[_COMMUNITY_User Invite Handlers|User Invite Handlers]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_HTML Spec Generator|HTML Spec Generator]]
- [[_COMMUNITY_Kanban Bootstrap Columns|Kanban Bootstrap Columns]]
- [[_COMMUNITY_Root Layout Config|Root Layout Config]]
- [[_COMMUNITY_Env Local Loader|Env Local Loader]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Tailwind Config|Tailwind Config]]
- [[_COMMUNITY_Site Footer|Site Footer]]
- [[_COMMUNITY_Button Component|Button Component]]
- [[_COMMUNITY_Input Component|Input Component]]

## God Nodes (most connected - your core abstractions)
1. `scripts` - 23 edges
2. `compilerOptions` - 17 edges
3. `compilerOptions` - 14 edges
4. `AppBindings` - 13 edges
5. `compilerOptions` - 13 edges
6. `compilerOptions` - 12 edges
7. `Button()` - 12 edges
8. `useAuth()` - 11 edges
9. `compilerOptions` - 10 edges
10. `apiFetch()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Monorepo Architecture` --references--> `prisma`  [EXTRACTED]
  docs/superpowers/specs/2026-07-02-uniwai-crm-design.md → packages/database/package.json
- `seed main` --semantically_similar_to--> `seedPlans`  [INFERRED] [semantically similar]
  packages/database/prisma/seed.ts → scripts/bootstrap-dev.mjs
- `@uniwai/wa-worker` --conceptually_related_to--> `WA Worker Skeleton Task`  [INFERRED]
  services/wa-worker/package.json → docs/superpowers/plans/2026-07-02-fase0-fase1-plan-ejecutable.md
- `getRedisUrl` --conceptually_related_to--> `uniwai-redis`  [INFERRED]
  services/wa-worker/src/index.ts → docker/docker-compose.yml
- `createWarmupQueue` --shares_data_with--> `uniwai-redis`  [INFERRED]
  services/wa-worker/src/queues/warmup.ts → docker/docker-compose.yml

## Hyperedges (group relationships)
- **API Request Auth & RBAC Pipeline** — auth_authRequiredMiddleware, tenant_tenantRequired, rbac_requireRoles, rbac_requirePermission, types_authUser [INFERRED 0.85]
- **Global Security Middleware Stack** — index_honoAppBootstrap, security_securityHeaders, security_corsAllowlist, rate-limit_createRateLimit [EXTRACTED 1.00]
- **Tenant Provisioning Onboarding Flow** — auth_provisionEndpoint, auth_meEndpoint, arch_tenantOnboardingTransaction, arch_multiTenantScoping [INFERRED 0.85]
- **v1 Tenant-Scoped API Routes** — index_tenantMiddlewareScope, contacts_router, kanban_router, users_router [EXTRACTED 1.00]
- **Contact Bot Flow State Sync** — contacts_botToggle, contacts_flowResume, entity_flowStore, entity_contactModel [EXTRACTED 1.00]
- **CRM Authenticated App Shell** — middleware_sessionGuard, layout_crmApp, context_authProvider, layout_appShell [INFERRED 0.85]
- **Bot Builder live preview flow** — page_BuilderPage, bot-builder-canvas_BotBuilderCanvas, smartphone-mockup_SmartphoneMockup, builder-preview_useBuilderPreviewStore [EXTRACTED 1.00]
- **Contact bot toggle across CRM views** — inbox-panel_InboxPanel, kanban-board_KanbanBoard, inbox-panel_toggleBot, kanban-board_toggleBot, api_contacts_bot_toggle [EXTRACTED 1.00]
- **Tenant onboarding and session gate** — register_RegisterForm, register_provisionTenant, login-form_LoginForm, app-shell_AppShell, auth-context_useAuth [INFERRED 0.85]
- **CRM authentication flow** — auth-context_AuthProvider, auth-context_refresh, api_apiFetch, api_getAccessToken, client_createClient, middleware_updateSession [INFERRED 0.85]
- **SaaS plan catalog and seeding** — plans_PLANS, plan-features_PLAN_FEATURE_GROUPS, database-index_PlanLimits, seed_main, bootstrap-dev_seedPlans [INFERRED 0.85]
- **RBAC permission enforcement** — rbac_Role, rbac_Permission, rbac_ROLE_PERMISSIONS, rbac_hasPermission, auth-context_can [EXTRACTED 1.00]
- **Warmup Simulation Pipeline** — index_bootstrap, warmup_createWarmupQueue, warmup_createWarmupWorker, warmup_processWarmupSimulation, typingDelay_waitRandomComposingDelay [EXTRACTED 1.00]
- **Local Development Stack** — supabase_local_cli, sync-supabase-env_syncScript, docker_redis_service, dev_bootstrap_flow [INFERRED 0.85]
- **Tenant Security Model** — migrations_rls_tenant_template, database_prisma_middleware, spec_multi_tenancy [INFERRED 0.85]

## Communities (50 total, 12 thin omitted)

### Community 0 - "CRM App Pages"
Cohesion: 0.06
Nodes (32): AdminPage(), StatsResponse, TenantsResponse, DashboardPage(), AuthContext, AuthProvider(), AuthState, useAuth() (+24 more)

### Community 1 - "API Core Routes"
Cohesion: 0.06
Nodes (44): supabaseAdmin, authRequired(), parseBearerToken(), requirePermission(), requireRoles(), getTenantIdOrThrow(), tenantRequired(), AiGuardInput (+36 more)

### Community 2 - "WA Worker & Specs"
Cohesion: 0.05
Nodes (47): WarmupMessagePayload, WhatsAppAdapter, createBaileysAdapterPlaceholder, Baileys Simulation Mode Only, prisma, seed, Prisma Tenant Middleware, CRM Bootstrap Flow (+39 more)

### Community 3 - "Shared Types & Plans"
Cohesion: 0.07
Nodes (34): AuthMeResponse, ContactRow, CrmUser, KanbanColumn, can, ensureSuperadmin, bootstrap main, seedPlans (+26 more)

### Community 4 - "Database Package Config"
Cohesion: 0.06
Nodes (32): description, devDependencies, @prisma/client, @supabase/supabase-js, typescript, name, private, scripts (+24 more)

### Community 5 - "Shared Package Source"
Cohesion: 0.12
Nodes (27): BullQueue, BullQueueName, DomainEvent, DomainEventName, formatMarketingLimit(), formatPlanPrice(), LANDING_PLAN_ORDER, PLAN_CARD_HIGHLIGHTS (+19 more)

### Community 6 - "Web CRM Dependencies"
Cohesion: 0.07
Nodes (28): dependencies, framer-motion, lucide-react, react, react-dom, @supabase/ssr, @supabase/supabase-js, @uniwai/shared (+20 more)

### Community 7 - "API Architecture Concepts"
Cohesion: 0.09
Nodes (27): Admin Global Stats & Tenants Routes, AI Guard Prompt Validation Route, API Core Service (@uniwai/api-core), Multi-Tenant SaaS Scoping, Supabase JWT + Prisma User Auth Bridge, Tenant Onboarding Transaction, Auth Required Middleware, Current User Profile Endpoint (+19 more)

### Community 8 - "CRM Auth & API Client"
Cohesion: 0.11
Nodes (24): ApiError, apiFetch, getAccessToken, AuthProvider, refresh, signOut, createClient (browser), Contacts Router (+16 more)

### Community 9 - "API Core Dependencies"
Cohesion: 0.09
Nodes (21): dependencies, dotenv, hono, @hono/node-server, ioredis, @supabase/supabase-js, @uniwai/database, @uniwai/shared (+13 more)

### Community 10 - "Web CRM TypeScript Config"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, baseUrl, esModuleInterop, incremental, isolatedModules, jsx, lib (+12 more)

### Community 11 - "API Bootstrap & Security"
Cohesion: 0.14
Nodes (12): corsOrigins, env, envSchema, monorepoRoot, Bucket, buckets, createRateLimit(), corsAllowlist() (+4 more)

### Community 12 - "Database Dependencies"
Cohesion: 0.10
Nodes (19): dependencies, @prisma/client, description, devDependencies, prisma, typescript, exports, main (+11 more)

### Community 13 - "CRM Bot Toggle Flow"
Cohesion: 0.13
Nodes (20): PATCH /contacts/:id/bot-toggle, AppShell, useAuth, InboxPanel, InboxPanel.load, InboxPanel.toggleBot, KanbanBoard, KanbanBoard.bootstrap (+12 more)

### Community 14 - "Flow Store & Contacts"
Cohesion: 0.14
Nodes (13): flowContactKey(), FlowStore, getFlowStore(), getMemoryStore(), getRedisStore(), MemoryFlowStore, contactId, contacts (+5 more)

### Community 15 - "WA Worker Dependencies"
Cohesion: 0.11
Nodes (17): dependencies, bullmq, dotenv, ioredis, @whiskeysockets/baileys, devDependencies, @types/node, typescript (+9 more)

### Community 16 - "Landing Page Components"
Cohesion: 0.16
Nodes (8): LandingHero(), features, FeaturesSection(), PlanComparisonTable(), PricingSection(), SiteFooter(), nav, SiteHeader()

### Community 17 - "Shared TSConfig"
Cohesion: 0.12
Nodes (15): compilerOptions, declaration, declarationMap, esModuleInterop, lib, module, moduleResolution, outDir (+7 more)

### Community 18 - "Database TSConfig"
Cohesion: 0.12
Nodes (15): compilerOptions, declaration, declarationMap, exactOptionalPropertyTypes, isolatedModules, lib, module, moduleResolution (+7 more)

### Community 19 - "API Core TSConfig"
Cohesion: 0.13
Nodes (14): compilerOptions, isolatedModules, lib, module, moduleResolution, noEmit, resolveJsonModule, skipLibCheck (+6 more)

### Community 20 - "Warmup Queue Pipeline"
Cohesion: 0.23
Nodes (10): WarmupMessagePayload, WhatsAppAdapter, createWarmupQueue(), createWarmupWorker(), processWarmupSimulation(), sleep(), bootstrap(), getRedisUrl() (+2 more)

### Community 21 - "Bot Builder UI"
Cohesion: 0.24
Nodes (8): BotBuilderCanvas(), seedEdges, seedNodes, SmartphoneMockup(), BuilderPreviewState, initialMessages, PreviewMessage, useBuilderPreviewStore

### Community 22 - "Supabase Env Sync"
Cohesion: 0.15
Nodes (11): defaults, envPath, lines, merged, order, output, root, supabaseEnv (+3 more)

### Community 23 - "Root Package Config"
Cohesion: 0.17
Nodes (11): devDependencies, typescript, exports, main, name, private, scripts, typecheck (+3 more)

### Community 24 - "WA Worker TSConfig"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, noEmit, skipLibCheck (+3 more)

### Community 25 - "Contact Route Handlers"
Cohesion: 0.27
Nodes (11): Bot Toggle Handler, Create Contact Handler, Create Contact Schema, Flow Resume Handler, List Contacts Handler, Toggle Bot Schema, Contact Entity, Flow Store (Redis) (+3 more)

### Community 26 - "Dev Bootstrap Script"
Cohesion: 0.43
Nodes (5): ensureSuperadmin(), main(), prisma, seedPlans(), loadEnvLocal()

### Community 27 - "Supabase Session Middleware"
Cohesion: 0.60
Nodes (3): updateSession(), config, middleware()

### Community 28 - "Flow Store Redis"
Cohesion: 0.50
Nodes (5): Redis-to-Memory Flow Store Fallback, Flow Contact Redis Key Builder, Flow Store Factory, In-Memory Flow Store, Strict Redis Client Factory

### Community 29 - "Landing Marketing Sections"
Cohesion: 0.40
Nodes (5): FeaturesSection, FeatureValue, PlanComparisonTable, PricingSection, SiteHeader

### Community 30 - "Prisma Seed Script"
Cohesion: 0.40
Nodes (3): PlanLimits, plans, prisma

### Community 32 - "Login & Register Forms"
Cohesion: 0.50
Nodes (4): LoginForm, LoginPage, RegisterPage, RegisterForm

### Community 33 - "AI Prompt Guard"
Cohesion: 0.67
Nodes (3): Blocked Topic Patterns, buildGuardedPrompt, AI BYOK Prompt Guard

### Community 35 - "User Invite Handlers"
Cohesion: 0.67
Nodes (3): Invite User Schema, Invite Vendedor Handler, Plan Vendedor Limit Check

## Knowledge Gaps
- **330 isolated node(s):** `name`, `version`, `private`, `description`, `workspaces` (+325 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Web CRM Dependencies` to `API Bootstrap & Security`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `next` connect `API Bootstrap & Security` to `API Core Routes`, `Web CRM Dependencies`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `AuthProvider` connect `CRM Auth & API Client` to `CRM Bot Toggle Flow`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _342 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CRM App Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.06440677966101695 - nodes in this community are weakly interconnected._
- **Should `API Core Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.0576271186440678 - nodes in this community are weakly interconnected._
- **Should `WA Worker & Specs` be split into smaller, more focused modules?**
  _Cohesion score 0.04609929078014184 - nodes in this community are weakly interconnected._
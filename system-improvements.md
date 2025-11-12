Ambiguity between Express and Fastify: generators mention both while config shows framework: 'express'; pick one or define selection logic.

Registry mode trade-offs not documented: debugging, middleware composition, and per-model overrides vs single-file registry.

WS phase placement is unclear: numbered phases stop at 13; “WS-Phase” sits between 08 and 09 without explicit order/dependencies.

Annotations (@@service, @@auth, @@policy) lack concrete syntax, validation rules, and examples; undefined error messages on invalid usage.

Auto-detection of realtime models (“Message/Chat/Notification”) is brittle; needs explicit annotations to avoid false positives/negatives.

WebSocket auth model not specified: token format, rotation/refresh, origin checks, CORS/CSRF alignment with HTTP.

WebSocket authorization isn’t tied to RLS/permissions; no clear policy application on subscribe/publish or field masking.

WebSocket scaling strategy missing: transport (in-memory vs Redis/NATS), horizontal fan-out, backpressure, heartbeats, reconnection.

HybridDataClient ownership/placement unclear: which package exports it, how apps import/extend it.

UI generation says TypeScript pages but doesn’t cover create/edit forms, field-level disable, or validation wiring to Zod.

Next.js data model not defined: RSC boundaries, where use client is required, data fetching strategy (SSR/CSR), caching/invalidation.

SDK/react hooks versioning unspecified: React Query/Payload signatures, SSR compatibility, suspense, cache keys/invalidation.

Security consistency gap: RLS described for HTTP but not for WS; no guarantee both paths share the same guard logic.

Field-level permissions and output masking not described in DTO generator; risk of leaking denied fields.

OpenAPI as source of truth vs Zod validators: drift risk and reconciliation rules not documented.

Generated UI location conflicts: “generated/ (API + SDK + UI + WS)” vs Next pages under app/admin/*; clarify final output paths.

Dev workflow unclear: where Express server runs relative to Next; pnpm dev starting both servers and ports/env coordination.

Plugin system breadth (24 plugins) vs maturity: activation criteria, ordering, conflicts, idempotency, and version compatibility not specified.

FeaturePlugin lifecycle is minimal; no hooks for modify/afterWrite/cleanup or conflict resolution between plugins.

Search plugin vague: implementation details (DB engine, Prisma support, migrations, indexing) missing.

Storage plugins lack upload security model: presigned URLs, size/type limits, antivirus/quarantine, multi-part uploads.

Payments plugins lack webhook generation/verification steps and idempotency handling.

Monitoring/usage tracker plugin not defined: PII handling, sampling, opt-out, and performance overhead.

Schema Processing lacks composite PK and through-table policies: which models get UI/API, which are skipped.

Relationship analysis mentions M:N but not implicit junction handling for UI (avoid generating pages for join models).

CI/CD phase defined but no scaffolded workflows content (Node version matrix, cache, build/test/lint, release).

Formatting phase listed but Prettier/ESLint configs and rules are not specified; no opinionated defaults.

Configuration example omits auth strategy settings; @@auth(Strategy) exists but ssot.config.ts has no corresponding fields.

WebSocket client file naming (*-ws-client.ts) and import paths aren’t standardized; SDK barrel export plan missing.

Transport abstraction not integrated into SDK generator spec: how HTTP/WS are selected per call (policies, hints, retry).

Docs generators listed but no doc IA: where annotations, plugins, and WS guides live; no “hello world” end-to-end doc.

Performance risks in registry mode not addressed: bundle size, tree-shaking, cold-start cost, per-model middleware inclusion.

Logging/error handling undefined: structured logs, request IDs, error shapes, mapping to HTTP status codes.

Rate limiting/throttling not covered for HTTP or WS; no plugin or generator hooks.

Version pinning and semver policy absent for all packages; monorepo publish/release process unspecified.

CLI naming inconsistency: create-ssot-app vs pnpm ssot generate; clarify single entrypoint and responsibilities.

Test strategy light: “Test scaffolds” phase exists but no e2e tests for generated projects, WS integration tests, or coverage targets.

Privacy/compliance not addressed: data retention, GDPR/CCPA hooks, PII redaction in logs and analytics.

Environment/config management not specified: .env templates, secrets handling, runtime config for Next vs server.
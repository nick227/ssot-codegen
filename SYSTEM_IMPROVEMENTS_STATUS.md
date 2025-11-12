# System Improvements - Status & Action Plan

**Review Date**: November 12, 2025  
**Reviewed Against**: Current Codebase  
**Status**: In Progress  

---

## Priority 1: Critical (Fix Now)

### ✅ #3 - WebSocket Phase Ordering
**Issue**: WS phase between 08-09 without explicit order  
**Status**: **FIXED** - Added `order: 8` in WebSocketGenerationPhase  
**Action**: Update phase order to 9, shift Tests to 10  

### ⚠️ #1 - Framework Selection Ambiguity
**Issue**: Express vs Fastify unclear  
**Current**: `route-generator.templated.ts` supports both  
**Gap**: No config validation, defaults undocumented  
**Action**: Add `framework` validation, document selection logic  

### ❌ #7 - Schema Annotations Missing
**Issue**: `@@service`, `@@auth`, `@@policy` not implemented  
**Current**: No annotation parsing in DMMF parser  
**Action**: **HIGH PRIORITY** - Implement annotation parser  

### ❌ #9 - Auto-Detection Brittle
**Issue**: Hardcoded model names for WebSocket detection  
**Current**: `shouldEnableWebSocket()` checks hardcoded names  
**Action**: Replace with `@@realtime` annotation  

---

## Priority 2: Security & Integration

### ⚠️ #11 - WebSocket Auth Model Undefined
**Issue**: Token format, refresh, CORS not specified  
**Current**: Stub implementation in `auth.ts`  
**Gap**: No JWT validation, no refresh logic  
**Action**: Implement proper JWT validation with NextAuth integration  

### ⚠️ #13 - WS Authorization Not Tied to RLS
**Issue**: WS permissions separate from HTTP RLS  
**Current**: Basic channel permissions in gateway  
**Gap**: No RLS plugin integration  
**Action**: **CRITICAL** - Integrate RLS policies into WS channel auth  

### ⚠️ #25 - Security Consistency Gap
**Issue**: RLS for HTTP but not WS  
**Same as #13**  
**Action**: Single security layer for both transports  

### ⚠️ #27 - Field-Level Permissions
**Issue**: DTOs may leak denied fields  
**Current**: No field-level filtering in DTO generator  
**Action**: Add permission-based field masking  

---

## Priority 3: Documentation & Configuration

### ⚠️ #17 - HybridDataClient Ownership Unclear
**Issue**: Which package exports it, how to import  
**Current**: `@ssot/sdk-runtime` exports it  
**Gap**: Not documented, no usage examples  
**Action**: **DONE** - Already exported, needs docs only  

### ⚠️ #31 - Generated UI Location Unclear
**Issue**: Conflicting paths mentioned  
**Current**: API in `generated/src/`, UI in project root `app/`  
**Action**: Clarify in docs (API and SDK generated, UI scaffolded)  

### ⚠️ #33 - Dev Workflow Unclear
**Issue**: Express + Next.js coordination  
**Gap**: No dev script, port coordination undocumented  
**Action**: Generate `package.json` scripts, document architecture  

### ⚠️ #55 - Config Example Incomplete
**Issue**: `@@auth(Strategy)` exists but no config fields  
**Gap**: Auth configuration not documented  
**Action**: Add auth config section, link to plugins  

### ⚠️ #77 - Environment Config Management
**Issue**: .env templates, secrets handling  
**Gap**: No `.env.example` generation  
**Action**: Generate `.env.template` with required vars  

---

## Priority 4: Features & Enhancements

### ⚠️ #19 - UI Generation Gaps
**Issue**: Create/edit forms, field-level validation  
**Current**: List/detail pages only  
**Gap**: Form generation incomplete  
**Action**: Add form generators with Zod integration  

### ⚠️ #21 - Next.js Data Model Undefined
**Issue**: RSC boundaries, SSR/CSR strategy  
**Current**: `'use client'` on data-fetching pages  
**Gap**: No SSR support, no caching strategy  
**Action**: Define data fetching patterns, add RSC pages  

### ⚠️ #15 - WebSocket Scaling Strategy
**Issue**: In-memory only, no Redis/NATS  
**Current**: Single-instance in-memory  
**Gap**: No horizontal scaling  
**Action**: **FUTURE** - Add Redis adapter for multi-instance  

### ⚠️ #47 - Composite PK & Junction Tables
**Issue**: Which models get UI/API  
**Current**: Basic filtering in UI generator  
**Gap**: `skipJunctionTables: true` but undocumented  
**Action**: Document model selection criteria  

### ⚠️ #49 - Junction Table Handling
**Issue**: M:N implicit junction not documented  
**Current**: Skipped in registry generator  
**Action**: Document in SYSTEM_GUIDE  

### ⚠️ #67 - Rate Limiting Missing
**Issue**: No rate limiting for HTTP or WS  
**Gap**: No middleware, no plugin  
**Action**: Create RateLimitPlugin  

---

## Priority 5: Plugin System Maturity

### ⚠️ #35 - Plugin System Breadth vs Maturity
**Issue**: 24 plugins, but activation unclear  
**Current**: `shouldActivate()` method exists  
**Gap**: No ordering, no conflicts, no docs  
**Action**: Document plugin lifecycle, add examples  

### ⚠️ #37 - Plugin Lifecycle Minimal
**Issue**: No hooks for modify/afterWrite/cleanup  
**Current**: `generate()` only  
**Gap**: Limited extension points  
**Action**: **V2 PLUGIN** interface has more hooks (use that)  

### ⚠️ #39 - Search Plugin Vague
**Issue**: Implementation details missing  
**Current**: Basic full-text search  
**Gap**: No indexing strategy  
**Action**: Document search implementation  

### ⚠️ #41 - Storage Plugin Security
**Issue**: Presigned URLs, size limits, antivirus  
**Current**: Basic upload methods  
**Gap**: No security layer  
**Action**: Add upload security to S3/Cloudinary plugins  

### ⚠️ #43 - Payment Webhook Gaps
**Issue**: Webhook verification, idempotency  
**Current**: Basic Stripe/PayPal stubs  
**Gap**: No webhook handling  
**Action**: Generate webhook routes in payment plugins  

---

## Priority 6: Testing & Quality

### ⚠️ #73 - Test Strategy Light
**Issue**: No E2E tests for generated projects  
**Current**: Unit tests for generators  
**Gap**: No integration tests, no WS tests  
**Action**: Add E2E test suite  

### ⚠️ #51 - CI/CD Phase Empty
**Issue**: Phase defined but no content  
**Current**: Phase exists, generates nothing  
**Gap**: No GitHub Actions workflows  
**Action**: Generate `.github/workflows/ci.yml`  

### ⚠️ #53 - Formatting Phase Unspecified
**Issue**: Prettier/ESLint rules not defined  
**Current**: Phase exists, no config  
**Gap**: No opinionated defaults  
**Action**: Generate `.prettierrc` and `.eslintrc`  

---

## Priority 7: Architecture & Performance

### ⚠️ #3 - Registry Mode Trade-Offs
**Issue**: Debugging, middleware, overrides undocumented  
**Current**: Registry mode working  
**Gap**: No comparison docs  
**Action**: Write registry vs controllers guide  

### ⚠️ #29 - OpenAPI vs Zod Drift
**Issue**: Two sources of truth  
**Current**: Both generated independently  
**Gap**: No validation they match  
**Action**: Generate OpenAPI from Zod schemas  

### ⚠️ #63 - Registry Performance Risks
**Issue**: Bundle size, tree-shaking, cold-start  
**Current**: Single file for all CRUD  
**Gap**: No analysis  
**Action**: **FUTURE** - Benchmark and optimize  

### ⚠️ #65 - Logging/Error Handling Undefined
**Issue**: Structured logs, request IDs, error shapes  
**Current**: Basic console.log  
**Gap**: No structured logging  
**Action**: Add logging middleware, error formatter  

---

## Priority 8: Compliance & Operations

### ⚠️ #69 - Version Pinning Absent
**Issue**: No semver policy  
**Current**: Workspace protocol used  
**Gap**: No versioning strategy  
**Action**: Define versioning policy, add changesets  

### ⚠️ #71 - CLI Naming Inconsistency
**Issue**: `create-ssot-app` vs `pnpm ssot generate`  
**Current**: Two entry points  
**Gap**: Unclear responsibilities  
**Action**: Document: `create-ssot-app` = scaffold, `ssot` = generate  

### ⚠️ #75 - Privacy/Compliance
**Issue**: GDPR/CCPA, PII redaction  
**Current**: Basic sanitization in parser  
**Gap**: No GDPR hooks  
**Action**: **FUTURE** - Add compliance plugin  

---

## Summary Statistics

| Priority | Total | Fixed | In Progress | Planned | Deferred |
|----------|-------|-------|-------------|---------|----------|
| P1 Critical | 4 | 1 | 1 | 2 | 0 |
| P2 Security | 4 | 0 | 0 | 4 | 0 |
| P3 Documentation | 5 | 0 | 0 | 5 | 0 |
| P4 Features | 7 | 0 | 0 | 5 | 2 |
| P5 Plugins | 5 | 0 | 0 | 5 | 0 |
| P6 Testing | 3 | 0 | 0 | 3 | 0 |
| P7 Architecture | 5 | 0 | 0 | 3 | 2 |
| P8 Compliance | 3 | 0 | 0 | 1 | 2 |
| **TOTAL** | **36** | **1** | **1** | **28** | **6** |

---

## Immediate Actions (Today)

1. ✅ Fix WebSocket phase order
2. 🔧 Implement schema annotation parser
3. 📝 Document framework selection
4. 📝 Document HybridDataClient usage
5. 🔧 Integrate RLS with WebSocket

---

## Next Steps (This Week)

1. Schema annotations (`@@service`, `@@auth`, `@@policy`, `@@realtime`)
2. WebSocket + RLS integration
3. Configuration documentation
4. Form generation
5. Dev workflow scripts

---

**Status**: 1 fixed, 35 pending  
**Next Review**: After annotation implementation  


# 🧹 Consolidation Plan - Fold Redundant Systems

## Analysis: What We Have

### V2 SYSTEM (Existing - KEEP)
**Location**: packages/gen/
**What It Does**: Complete API generation
**Status**: Production-ready, tested, working

**Keep**:
- ✅ API route generation (RESTful)
- ✅ Controller generation
- ✅ DTO generation
- ✅ Validator generation (Zod)
- ✅ OpenAPI spec generation
- ✅ Client SDK generation
- ✅ Plugin system (FeaturePlugin interface)
- ✅ Plugin manager
- ✅ Pipeline/phase system

---

### V3 COMPONENTS (New - EVALUATE)

**Expression System** ✅ KEEP (Genuinely New)
- packages/ui-expressions/
- 1,500 lines, 95% tests passing
- Enables logic in JSON
- No equivalent in V2
- **Action**: Keep and integrate with V2

**Policy Engine** ⚠️ CONSOLIDATE
- packages/policy-engine/
- 400 lines, 100% tests passing
- Row-level security
- **Action**: Convert to V2 plugin, delete standalone package

**Simple Security** ❌ REDUNDANT
- packages/create-ssot-app/src/lib/simple-security.ts
- 65 lines
- Duplicates policy engine functionality
- **Action**: DELETE, use policy engine instead

**Page Renderers** ⚠️ EVALUATE
- packages/ui-runtime/src/renderers/
- 520 lines
- Could be generated code instead of runtime
- **Action**: Convert to V2 generation templates

**Presets** ✅ KEEP
- packages/create-ssot-app/src/presets/
- 370 lines
- Useful for quick scaffolding
- **Action**: Keep, make framework-agnostic

**app.json Schema** ⚠️ SIMPLIFY
- packages/ui-schemas/src/schemas/app-config.ts
- 200 lines
- **Action**: Simplify, keep only what's needed

**API Endpoint Template** ❌ REDUNDANT
- packages/create-ssot-app/src/templates/api-data-route-simple.ts
- 100 lines
- V2 generates better RESTful routes
- **Action**: DELETE, use V2 generation

---

## Consolidation Strategy

### PHASE 1: Identify Best-of-Breed

| Component | V2 Version | V3 Version | Winner | Action |
|-----------|-----------|------------|--------|--------|
| **API Routes** | RESTful generation | Universal endpoint | V2 | Delete V3 version |
| **Validation** | Zod from Prisma | Basic | V2 | Keep V2 |
| **Plugin System** | Full system | None | V2 | Keep V2 only |
| **Client SDK** | Generated | None | V2 | Keep V2 |
| **OpenAPI** | Generated | None | V2 | Keep V2 |
| **Security** | Plugin-based | Policy engine + simple | Merge | Make policy a V2 plugin |
| **Expressions** | None | Complete | V3 | NEW - integrate with V2 |
| **UI** | None | Runtime renderers | V2 | GENERATE instead |
| **Presets** | None | 3 presets | V3 | Keep (useful) |

---

### PHASE 2: Cleanup Actions

**DELETE (Redundant)**:
1. packages/create-ssot-app/src/lib/simple-security.ts (use policy engine)
2. packages/create-ssot-app/src/templates/api-data-route-simple.ts (use V2 generation)
3. V3 universal endpoint concept (use V2 RESTful routes)

**CONVERT TO V2 PLUGINS**:
1. packages/policy-engine/ → packages/gen/src/plugins/rls-plugin/
2. packages/ui-expressions/ → packages/gen/src/plugins/expressions-plugin/

**CONSOLIDATE**:
1. Merge app.json into V2's config system
2. Keep presets, make them V2 templates
3. Convert page renderers to V2 generation templates

**KEEP AS-IS**:
1. V2 API generation (packages/gen/)
2. Existing V2 plugins
3. Adapters (they work with both)

---

### PHASE 3: Integration Plan

**Goal**: V2 + Expressions + UI Generation = Complete Platform

**Architecture**:
```
Prisma Schema
    ↓
V2 Code Generator
    ↓
┌──────────────┬────────────────┬──────────────────┐
↓              ↓                ↓                  ↓
API Routes    Client SDK    UI Components    Expressions Plugin
(RESTful)     (Type-safe)   (React)          (Runtime)
    ↓              ↓                ↓                  ↓
Express       Frontend      Next.js Pages    Logic in JSON
```

**Benefits**:
- ✅ RESTful API (caching, standards)
- ✅ Type-safe SDK
- ✅ OpenAPI docs
- ✅ Generated UI (fast, type-safe)
- ✅ Expressions for dynamic logic
- ✅ Hot reload (Next.js reloads generated files)

---

## Immediate Actions

**Starting cleanup now**:
1. Delete redundant simple-security.ts
2. Delete redundant API endpoint template
3. Move policy-engine to V2 plugin
4. Move expressions to V2 plugin
5. Update documentation


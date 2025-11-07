# Code Quality Audit Report

**Date:** November 7, 2025  
**Tools:** Knip (dead code), Madge (circular dependencies)  
**Status:** ⚠️ **Issues Found - Cleanup Recommended**

---

## 🔍 Executive Summary

After running quality checks on the codebase:

| Tool | Critical | Warning | Info |
|------|----------|---------|------|
| **Knip** | 0 | 48 unused files | 40 unused exports |
| **Madge** | 3 circular deps | 0 | 0 |

**Recommendation:** Address circular dependencies (critical), clean up unused files (nice to have).

---

## 🔴 Critical Issues (Madge)

### Circular Dependencies Found: 3

#### 1. API Public-API ↔ Implementation
```
api/public-api.ts → api/implementation.ts → api/public-api.ts
```

**Impact:** High  
**Risk:** Can cause initialization issues, harder to test  
**Recommended Fix:** 
- Extract shared types to `api/types.ts`
- Have both files import from types, not each other

#### 2. Code Generator ↔ Checklist Generator
```
code-generator.ts → generators/checklist-generator.ts → code-generator.ts
```

**Impact:** Medium  
**Risk:** Potential initialization race conditions  
**Recommended Fix:**
- Move shared logic to `generators/shared.ts`
- Or make checklist-generator fully independent

#### 3. Phase Runner ↔ Phase Hooks
```
generator/phase-runner.ts → generator/hooks/phase-hooks.ts → generator/phase-runner.ts
```

**Impact:** High  
**Risk:** Core generation system - circular dependency is dangerous  
**Recommended Fix:**
- Extract hook types/interfaces to `generator/hooks/types.ts`
- Break the circular reference

---

## ⚠️ Warnings (Knip)

### Unused Files: 48

#### Category 1: Examples & Documentation (Safe to Keep)
These are intentional examples/documentation:

```
✅ packages/gen/src/api/examples/*.ts (7 files)
   - 01-basic-usage.ts
   - 02-progress-monitoring.ts
   - 03-vite-plugin.ts
   - 04-ci-cd-integration.ts
   - 05-custom-logger.ts
   - 06-watch-mode.ts
   - 07-microservices.ts

✅ packages/gen/src/generator/hooks/examples/*.ts (4 files)
   - audit-plugin.ts
   - custom-phase-plugin.ts
   - logging-plugin.ts
   - validation-plugin.ts
```

**Action:** Keep (documentation/examples)

#### Category 2: Dead Code (Should Remove)

```
❌ packages/gen/src/generators/base-generator.ts
❌ packages/gen/src/generators/checklist-generator-v2.ts
❌ packages/gen/src/generators/generator-interface.ts
❌ packages/gen/src/generators/route-generator.templated.ts
❌ packages/gen/src/generators/validator-generator-lean.ts
❌ packages/gen/src/plugins/index.ts (empty or unused)
❌ packages/gen/src/plugins/plugin-manager-v2.ts
❌ packages/gen/src/plugins/plugin-v2.interface.ts
❌ packages/gen/src/templates/template-registry.ts
❌ packages/gen/src/utils/config-loader.ts
❌ packages/gen/vitest.plugins.config.ts
```

**Action:** Consider removing (11 files, ~2000 lines)

#### Category 3: Framework Strategy Files (Unused)

```
❌ packages/gen/src/generators/strategies/framework-strategy.ts
❌ packages/gen/src/generators/utils/import-builder.ts
❌ packages/gen/src/generators/utils/model-metadata.ts
❌ packages/gen/src/generators/utils/template-builder.ts
```

**Action:** Remove if not part of future plans (4 files)

#### Category 4: Plugin System (Unused)

```
❌ packages/gen/src/plugins/ai/ai-provider.interface.ts
❌ packages/gen/src/plugins/ai/ai.types.ts
❌ packages/gen/src/plugins/examples/example-v2-plugin.ts
```

**Action:** Remove or move to separate package (3 files)

#### Category 5: Template Checklist Files

```
❌ packages/gen/src/templates/checklist/renderer.ts
❌ packages/gen/src/templates/checklist/script.js
```

**Action:** Investigate - might be used at runtime (2 files)

#### Category 6: SDK Runtime (Entire Package Unused!)

```
⚠️ ALL packages/sdk-runtime/src/* files flagged as unused (17 files)
```

**Analysis:** 
- The sdk-runtime package is meant to be used by *generated* code
- Knip doesn't see this because generated projects are outside the repo
- This is a **false positive** - the package IS used, just externally

**Action:** Update knip.json to ignore sdk-runtime or mark as library

---

### Unused devDependencies: 1

```
❌ prisma (package.json:46:6)
```

**Analysis:**
- Prisma is in root devDependencies
- Probably meant for examples/testing
- Packages have it as peerDependency (correct)

**Action:** 
- Keep if used for development/testing
- Or move to only examples that need it

---

### Unused Exports: 40

#### Utility Functions (Might be useful for public API)

```typescript
// dmmf-parser.ts
- getField
- getRelationTarget  
- getDefaultValueString

// service-linker.ts
- parseAllServiceAnnotations
- validateServiceFile
- getServiceFilePath
- toCamelCase
- isModifyingMethod

// utils/naming.ts
- toPascalCase
- toSnakeCase
- pluralize
- singularize

// type-mapper.ts
- getFieldTypeForDTO
```

**Action:** 
- If these are part of public API for plugins/extensions → Keep and mark as public
- If truly unused → Remove

#### Internal Functions (Safe to remove)

```typescript
// phase-hooks.ts - Hook system functions
- resetHookRegistry
- beforePhase
- afterPhase
- replacePhase
- wrapPhase
- onError

// gen-folder.ts
- cleanupOldGenFolders

// formatter.ts
- formatCodeSync
```

**Action:** Remove if confirmed unused

#### analyzer.ts Functions

```typescript
// field-analyzer.ts
- getFilterableFields
- getSearchableFields
- getSortableFields (appears twice!)

// model-capabilities.ts
- getGenerationSummary
```

**Action:** Investigate - might be used in phases

---

### Unused Exported Types: 8

```typescript
ServiceMethod             // service-linker.ts
CompleteContext           // typed-context.ts
RequiredContext           // typed-context.ts
ProvidedOutput            // typed-context.ts
NextContext               // typed-context.ts
StandaloneProjectOptions  // generator/types.ts
TestSuiteOptions          // generator/types.ts
GeneratorInput            // index-new-refactored.ts
```

**Action:** 
- If part of public API → Keep
- If internal only → Remove or mark @internal

---

### Duplicate Exports: 1

```typescript
// packages/gen/src/index-new-refactored.ts
generateFromSchema | runGenerator
```

**Issue:** Both names export the same function

**Action:** Pick one canonical name:
- Keep: `generateFromSchema` (used by CLI)
- Remove: `runGenerator` (legacy alias?)

---

## 📋 Action Plan

### Priority 1: Critical (Do Before Release)

- [ ] **Fix 3 circular dependencies**
  - [ ] api/public-api.ts ↔ api/implementation.ts
  - [ ] code-generator.ts ↔ checklist-generator.ts
  - [ ] phase-runner.ts ↔ phase-hooks.ts

- [ ] **Fix duplicate export**
  - [ ] Remove `runGenerator` alias, keep only `generateFromSchema`

### Priority 2: High (Should Do)

- [ ] **Update knip.json**
  - [ ] Ignore sdk-runtime (it's used by external generated projects)
  - [ ] Mark api/examples as documentation
  - [ ] Mark generator/hooks/examples as documentation

- [ ] **Remove obvious dead code (11 files)**
  - [ ] base-generator.ts
  - [ ] checklist-generator-v2.ts
  - [ ] generator-interface.ts
  - [ ] route-generator.templated.ts
  - [ ] validator-generator-lean.ts
  - [ ] plugin-manager-v2.ts
  - [ ] plugin-v2.interface.ts
  - [ ] template-registry.ts
  - [ ] config-loader.ts
  - [ ] vitest.plugins.config.ts
  - [ ] plugins/index.ts

### Priority 3: Medium (Nice to Have)

- [ ] **Review and remove unused exports** (40 functions)
  - Start with phase-hooks functions (6 functions)
  - Review utility functions for public API needs
  
- [ ] **Clean up unused types** (8 types)
  - Review if they're part of public API
  - Add @internal JSDoc if keeping for future use

### Priority 4: Low (Future)

- [ ] **Remove unused framework strategy files** (4 files)
- [ ] **Remove unused plugin AI files** (3 files)
- [ ] **Investigate checklist template files** (2 files)

---

## 🔧 Knip Configuration Improvements

Create/update `knip.json`:

```json
{
  "workspaces": {
    "packages/gen": {
      "ignore": [
        "src/api/examples/**",
        "src/generator/hooks/examples/**"
      ]
    },
    "packages/sdk-runtime": {
      "entry": ["src/index.ts!"],
      "project": ["src/**/*.ts!"]
    }
  },
  "ignoreDependencies": [
    "prisma"
  ]
}
```

---

## 📊 Impact Analysis

### If We Complete All Actions

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Circular Dependencies** | 3 | 0 | ✅ 100% |
| **Unused Files** | 48 | ~30 | ✅ 37% reduction |
| **Dead Code Lines** | ~2000 | ~0 | ✅ Cleaner |
| **Unused Exports** | 40 | ~10 | ✅ 75% reduction |
| **Code Maintainability** | Medium | High | ✅ Better |

---

## 🎯 Recommended Immediate Actions

For **npm release readiness**, focus on:

1. ✅ **Already done:** Removed cli.ts and index-new.ts
2. 🔴 **Critical:** Fix 3 circular dependencies
3. 🟡 **Important:** Update knip.json to reduce false positives
4. 🟡 **Important:** Remove `runGenerator` duplicate export

**Post-Release Cleanup:**
- Remove obvious dead code (Priority 2)
- Clean up unused exports (Priority 3)

---

## 📝 Notes

### False Positives

**sdk-runtime flagged as unused:** This is expected - it's used by generated projects outside the repo. Mark as library in knip config.

### Documentation Files

Example files in `api/examples/` and `generator/hooks/examples/` are intentionally unused - they're documentation. Keep them but mark as ignored in knip.

### Conservative Approach

When in doubt, keep exports that might be part of the public API. We can always remove later based on actual usage patterns from users.

---

## ✅ After Fixes - Re-run

```bash
# After making fixes
pnpm build
pnpm knip
pnpm madge

# Should see:
# - No circular dependencies ✅
# - Fewer unused files ✅
# - Cleaner export tree ✅
```

---

**Status:** Audit complete. Follow action plan for production readiness.


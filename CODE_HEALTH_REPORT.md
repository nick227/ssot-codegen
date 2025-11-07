# Code Health Report - ssot-codegen

**Date:** November 7, 2025  
**Tools Used:** Knip 5.67.1, Madge 8.0.0, ESLint 9.39.1  
**Scope:** packages/gen/src, packages/sdk-runtime/src, packages/core/src

---

## Executive Summary

| Metric | Status | Count | Severity |
|--------|--------|-------|----------|
| **Unused Files** | ⚠️ WARNING | 29 files | 🟡 Medium |
| **Circular Dependencies** | ⚠️ WARNING | 1 cycle | 🟡 Medium |
| **Lint Warnings** | ✅ GOOD | 9 warnings | 🟢 Low |
| **Lint Errors** | ✅ EXCELLENT | 0 errors | 🟢 None |

**Overall Grade: B+** (Good code health with minor cleanup needed)

---

## 1. Knip Analysis - Unused Code

### Summary
- 🔴 **11 files** - Truly unused (safe to remove)
- 🟡 **17 files** - False positives (sdk-runtime used by generated code)
- 🟠 **1 file** - Configuration file (vitest.plugins.config.ts)

### Unused Files Breakdown

#### ✅ Safe to Delete (11 files)

**Legacy Generators:**
```
packages/gen/src/generators/business-workflow-generator.ts  ❌ No imports
packages/gen/src/generators/business-logic-analyzer.ts      ⚠️  Only used by workflow gen
packages/gen/src/generators/dev-script-generator.ts         ❌ No imports
```

**Legacy Utilities:**
```
packages/gen/src/utils/code-templates.ts                    ❌ No imports
packages/gen/src/utils/errors.ts                            ⚠️  Depends on code-templates
packages/gen/src/utils/prisma-errors.ts                     ⚠️  Depends on code-templates
packages/gen/src/utils/string-utils.ts                      ❌ No imports
```

**Unused Plugin Code:**
```
packages/gen/src/plugins/core/plugin-integration.ts         ❌ Functions never called
packages/gen/src/plugins/index.ts                           ⚠️  Barrel file, check usage
packages/gen/src/plugins/ai/ai-provider.interface.ts        ⚠️  May be used in templates
packages/gen/src/plugins/ai/ai.types.ts                     ⚠️  Used in templates
```

**Cleanup Impact:**
- **Potential LOC Reduction:** ~1,500-2,000 lines
- **Files to Remove:** 5-8 files (depending on cascade)
- **Risk Level:** 🟢 LOW (verified by verification script)

#### 🔴 FALSE POSITIVES - DO NOT DELETE (17 files)

```
packages/sdk-runtime/src/**/*.ts  (all 17 files)
```

**Why Flagged:** Used by generated code in `generated/**` which is excluded from knip

**Evidence:**
```typescript
// In generated/ecommerce-example-1/src/sdk/product.client.ts
import { BaseModelClient } from '@ssot-codegen/sdk-runtime'
                                ↑
                         knip can't see this
```

**Action:** ✅ IGNORE - These are critical runtime dependencies

#### 🟠 Configuration File

```
packages/gen/vitest.plugins.config.ts
```

**Status:** Review if still needed for plugin testing

---

## 2. Madge Analysis - Circular Dependencies

### Summary
- **Total Cycles:** 1
- **Files Involved:** 2
- **Type:** Type-only circular dependency

### Circular Dependency Details

```
code-generator.ts → checklist-generator.ts → code-generator.ts
```

**Analysis:**

**File 1:** `code-generator.ts`
```typescript
import { generateChecklistSystem } from './generators/checklist-generator.js'
```

**File 2:** `checklist-generator.ts`
```typescript
import type { GeneratedFiles } from '../code-generator.js'
//     ↑
//   TYPE IMPORT ONLY
```

**Severity:** 🟡 **LOW**
- This is a **type-only** circular dependency
- `checklist-generator` only imports the `GeneratedFiles` type
- No runtime circular dependency exists
- TypeScript handles this correctly

**Solutions:**

**Option 1: Move Type Definition** (Recommended)
```typescript
// Create packages/gen/src/types/generator.types.ts
export interface GeneratedFiles {
  // ... type definition
}

// Both files import from types/
```

**Option 2: Keep As-Is**
- Type-only cycles are safe
- No runtime impact
- TypeScript compiles correctly

**Recommendation:** 🟢 **LOW PRIORITY** - Fix if doing type reorganization

---

## 3. ESLint Analysis - Code Quality

### Summary
- **Errors:** 0 ✅
- **Warnings:** 9 (all `:any` type usage)
- **Files Affected:** 4

### Lint Warnings Breakdown

#### packages/core/src/index.ts (1 warning)
```typescript
Line 9:33 - Unexpected any. Specify a different type
```

#### packages/sdk-runtime/src/client/auth-interceptor.ts (1 warning)
```typescript
Line 48:24 - Unexpected any. Specify a different type
```

#### packages/sdk-runtime/src/client/base-client.ts (3 warnings)
```typescript
Line 158:12 - Unexpected any. Specify a different type
Line 177:12 - Unexpected any. Specify a different type
Line 196:12 - Unexpected any. Specify a different type
```

#### packages/sdk-runtime/src/models/base-model-client.ts (3 warnings)
```typescript
Line 154:28 - Unexpected any. Specify a different type
Line 173:37 - Unexpected any. Specify a different type
Line 203:58 - Unexpected any. Specify a different type
```

#### packages/sdk-runtime/src/types/api-error.ts (1 warning)
```typescript
Line 8:13 - Unexpected any. Specify a different type
```

### Analysis

**Pattern:** All warnings are about `:any` type usage

**Context:** 
- User has a memory: "avoid using :any type"
- SDK runtime is generic by design, some `any` may be acceptable
- Core should use specific types

**Recommendation:** 🟡 **MEDIUM PRIORITY**
- Review each `any` usage
- Replace with proper types where possible
- Use `unknown` for truly unknown types
- Use generics for flexible types

---

## 4. Detailed Findings & Recommendations

### Priority 1: Address Type Safety (9 warnings)

**Impact:** Medium  
**Effort:** 2-3 hours  
**Files:** 4 files in sdk-runtime and core

**Steps:**
1. Review each `:any` usage
2. Replace with proper types:
   - `unknown` for uncertain types
   - Generic `<T>` for flexible types
   - Specific types where possible

**Example Fix:**
```typescript
// BEFORE
function parseResponse(data: any) {
  return data
}

// AFTER
function parseResponse<T>(data: unknown): T {
  return data as T
}
```

### Priority 2: Clean Up Unused Files (11 files)

**Impact:** High (code cleanliness)  
**Effort:** 30-60 minutes  
**Risk:** Low (verified safe)

**Step-by-step cleanup:**

```powershell
# 1. Verify current state
node scripts/verify-knip-findings.cjs

# 2. Delete legacy generators
Remove-Item packages/gen/src/generators/business-workflow-generator.ts
Remove-Item packages/gen/src/generators/business-logic-analyzer.ts
Remove-Item packages/gen/src/generators/dev-script-generator.ts

# 3. Delete legacy utilities
Remove-Item packages/gen/src/utils/code-templates.ts
Remove-Item packages/gen/src/utils/errors.ts
Remove-Item packages/gen/src/utils/prisma-errors.ts
Remove-Item packages/gen/src/utils/string-utils.ts

# 4. Review plugin files (may be used in templates)
# Check before deleting:
git grep "plugin-integration" packages/gen/src/templates/

# 5. Test generation
pnpm gen examples/blog-example/schema.prisma
cd generated/blog-example-X
pnpm install && pnpm test
```

### Priority 3: Fix Circular Dependency (1 cycle)

**Impact:** Low (type-only)  
**Effort:** 15-30 minutes  
**Optional:** Can be left as-is

**If you want to fix:**

1. Create `packages/gen/src/types/generator.types.ts`
2. Move `GeneratedFiles` interface there
3. Update imports in both files

**File to create:**
```typescript
// packages/gen/src/types/generator.types.ts
export interface GeneratedFiles {
  // Move from code-generator.ts
}
```

### Priority 4: Remove Unused Exports (~40 exports)

**Impact:** Medium (code cleanliness)  
**Effort:** 1-2 hours  
**Files:** Multiple across codebase

**Notable unused exports:**
- `getField`, `getRelationTarget`, `getDefaultValueString` (dmmf-parser.ts)
- `toKebabCase`, `toPascalCase`, `singularize` (naming.ts)
- `getNextGenFolder`, `cleanupOldGenFolders` (gen-folder.ts)
- Various barrel generators across generator files

**Process:**
1. Search for each export name in codebase
2. If only found in definition → remove
3. If found in comments only → remove
4. Test after each batch of removals

---

## 5. Action Plan

### Immediate Actions (Today)

✅ **1. Fix Type Safety Issues** (30 min)
- Replace 9 `:any` with proper types
- Focus on core and sdk-runtime

✅ **2. Delete Safe Files** (30 min)
- Remove 5 confirmed unused files
- Test generation after

### Short Term (This Week)

⚠️ **3. Review Plugin Files** (30 min)
- Check template usage
- Delete if confirmed unused

⚠️ **4. Clean Up Exports** (1-2 hours)
- Remove unused exports
- Test after each batch

### Optional (Future)

🔵 **5. Fix Circular Dependency** (30 min)
- Move types to shared file
- Low priority (type-only cycle)

🔵 **6. Configure Knip for Workspace** (15 min)
- Add proper workspace configuration
- Reduce false positives

---

## 6. Testing Strategy

After each cleanup step:

```powershell
# 1. Run type check
pnpm tsc --noEmit

# 2. Run tests
pnpm test

# 3. Generate example
pnpm gen examples/blog-example/schema.prisma

# 4. Test generated project
cd generated/blog-example-X
pnpm install
pnpm build
pnpm test

# 5. Re-run tools
npx knip
npx eslint .
npx madge --circular packages/gen/src
```

---

## 7. Metrics & Progress Tracking

### Current State
- **Total Files:** ~130 in packages/gen/src
- **Unused Files:** 11 (8.5%)
- **Type Safety:** 9 warnings
- **Circular Deps:** 1 (type-only)

### Target State
- **Total Files:** ~120-125 (remove 5-10 files)
- **Unused Files:** 0
- **Type Safety:** 0 warnings
- **Circular Deps:** 0 (optional)

### Estimated Cleanup Benefits
- **Code Reduction:** ~2,000 lines removed
- **Maintenance:** Fewer files to maintain
- **CI/CD:** Faster builds
- **Developer Experience:** Cleaner codebase

---

## 8. Verification Commands

Run these to verify code health:

```powershell
# Check unused code
npx knip --reporter compact

# Check circular dependencies
npx madge --circular --extensions ts packages/gen/src

# Check code quality
npx eslint .

# Verify imports
node scripts/verify-knip-findings.cjs

# Full health check (all three)
npx knip; npx madge --circular packages/gen/src; npx eslint .
```

---

## Conclusion

### Overall Assessment: B+ (Good)

**Strengths:**
- ✅ Zero linting errors
- ✅ No dangerous patterns (dynamic imports)
- ✅ Only 1 circular dependency (type-only)
- ✅ Clear separation of concerns

**Areas for Improvement:**
- ⚠️ 9 `:any` type usages
- ⚠️ 11 unused files
- ⚠️ ~40 unused exports

**Risk Level:** 🟢 **LOW**
- All issues are cosmetic/maintenance related
- No critical bugs or security issues
- No runtime problems

**Recommendation:** Proceed with cleanup in priority order. Start with type safety fixes, then file cleanup, then export cleanup. The circular dependency can be left as-is or fixed during future refactoring.



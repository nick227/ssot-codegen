# Quick Fixes Summary - Generated Code Optimization

**Priority Order:** High → Medium → Low Impact

---

## 🔴 Phase 1: High Impact, Low Effort (2-3 hours)

### 1. Remove Service Try-Catch Boilerplate

**Problem:** Every service method wraps Prisma in try-catch that just re-throws.

**Fix:** Remove try-catch, let errors bubble to controller.

**Impact:** 30% code reduction in services.

**Files:**
- `packages/gen/src/generators/service-generator.ts`
- `packages/gen/src/generators/service-generator-enhanced.ts`

---

### 2. Fix Service Error Handling

**Problem:** Services return null/false on P2025, inconsistent types.

**Fix:** Always throw, handle P2025 at controller with 404.

**Impact:** Better separation of concerns, consistent types.

**Files:**
- Same as above

---

## 🟡 Phase 2: Medium Impact, Medium Effort (4-6 hours)

### 3. Derive DTOs from Zod Schemas

**Problem:** DTOs and Zod schemas duplicate structure.

**Fix:** Generate Zod first, derive DTOs with `z.infer<typeof Schema>`.

**Impact:** Single source of truth, ~20% code reduction.

**Files:**
- `packages/gen/src/generators/dto-generator.ts`
- `packages/gen/src/generators/validator-generator.ts`

---

### 4. Simplify React Hooks Generation

**Problem:** Repetitive hook patterns, lots of boilerplate.

**Fix:** Use factory pattern to generate hooks more efficiently.

**Impact:** ~40% code reduction in hooks.

**Files:**
- `packages/gen/src/generators/hooks/react-adapter-generator.ts`

---

## 🟢 Phase 3: Low Impact, Low Effort (1-2 hours each)

### 5. Extract stableKey to Shared Utility

**Problem:** Duplicated in every query file.

**Fix:** Create `shared/query-helpers.ts`, import everywhere.

**Files:**
- `packages/gen/src/generators/hooks/core-queries-generator.ts`

---

### 6. Simplify Hook Adapters

**Problem:** Unnecessary `useModel` wrapper adds indirection.

**Fix:** Direct hook exports, simpler pattern.

**Files:**
- `packages/gen/src/utils/hook-adapter.ts`
- `packages/gen/src/generators/ui/hook-linker-generator.ts`

---

### 7. Standardize Import Paths

**Problem:** Mixed `@/` aliases and relative paths.

**Fix:** Standardize on `@/` for generated code.

**Files:**
- All generators

---

## 📊 Expected Overall Impact

- **Code Reduction:** 25-30%
- **Complexity:** Significantly reduced
- **Performance:** Better (fewer function calls)
- **Maintainability:** Much improved

---

**Total Estimated Time:** 10-15 hours for all phases  
**Expected ROI:** High - Significant code reduction and simplification


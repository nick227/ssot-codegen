# SSOT Codegen - Architectural Improvements Roadmap

## ✅ High-Impact, Low-Risk Wins (COMPLETED)

### 1. ✅ Duplication Elimination
**Status:** COMPLETE

**Changes:**
- Centralized `defaultPaths` in `packages/gen/src/config/default-paths.ts`
- Centralized junction table detection in `packages/gen/src/utils/junction-table.ts`
- Consolidated barrel generation logic in `packages/gen/src/utils/barrel-orchestrator.ts`
- Removed duplicates from `index.ts`, `index-new.ts`, phases, and analyzers

**Benefits:**
- Single source of truth for path configuration
- Consistent junction table detection across all analyzers
- ~50% reduction in barrel generation code
- Easier to maintain and extend

### 2. ✅ Consistent Naming
**Status:** COMPLETE

**Verification:**
- `toKebabCase()` centralized in `utils/naming.ts`
- 59 consistent references across 20 files
- All model subfolders use kebab-case consistently

### 3. ✅ Version & Manifest Integrity
**Status:** COMPLETE

**Changes:**
- Created `packages/gen/src/utils/version.ts` with `getGeneratorVersion()`
- Dynamically reads version from `package.json`
- Updated all hardcoded versions in `index-new.ts`, `index.ts`, and manifest phase
- No more version drift

### 4. ⏸️ Simplified Generated APIs
**Status:** DEFERRED (requires API design review)

**Reason:** Needs careful analysis of which service methods are actually used to avoid breaking changes

---

## 🔄 Medium-Term Architectural Improvements (NEXT PHASE)

### 5. Strongly-typed Phase Context
**Status:** Planned

**Goal:** Add compile-time safety to the phase pipeline by evolving context type as phases run

### 6. Public Generator API
**Status:** Planned

**Goal:** Surface a minimal `generateFromSchema(config)` entry point with clear config types

### 7. Template Override Mechanism
**Status:** Planned

**Goal:** Support `--template-dir` flag or config that points at user templates

### 8. Incremental Formatting Phase
**Status:** Planned

**Goal:** Add final "FormatPhase" that runs Prettier/ESLint on generated tree

---

## 🚀 Long-Term Ecosystem Play

### 9. Plugin Hook API
**Status:** Planned

**Goal:** Add `beforePhase()` / `afterPhase()` hooks for better plugin integration

---

## Summary

**Completed:** 3 of 4 high-impact, low-risk wins
**Time Invested:** ~2 hours
**Impact:** Reduced maintenance burden, eliminated duplication, improved consistency

**Next Steps:**
1. Review simplified generated APIs (requires API design discussion)
2. Begin medium-term improvements starting with strongly-typed phase context
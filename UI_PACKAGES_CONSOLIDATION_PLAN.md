# 📦 UI Packages Consolidation Plan

**Current State**: 17 ui-* packages  
**Goal**: Consolidate to 3-4 essential packages  
**Approach**: Merge related, archive deprecated, keep core

---

## 📊 Current UI Packages Analysis

### **Core (Keep - 2 packages)**:

**1. @ssot-ui/expressions** ✅ KEEP
- 1,500 lines, 95% tested
- Integrated with V2 smart components
- Essential for dynamic logic
- **Status**: Active, core functionality

**2. @ssot-ui/schemas** ✅ KEEP
- Zod schemas for validation
- Used across system
- **Status**: Active, core functionality

---

### **V3 Runtime (Deprecated - 4 packages)**:

**3. @ssot-ui/runtime** ⚠️ ARCHIVE
- V3 JSON runtime renderers
- 520 lines
- Deprecated in favor of V2 code generation
- **Action**: Move to packages/archived/

**4. @ssot-ui/loader** ⚠️ ARCHIVE
- V3 template loader
- Not used by V2 approach
- **Action**: Move to packages/archived/

**5. @ssot-ui/templates** ⚠️ DELETE
- JSON templates for V3 runtime
- V3 deprecated
- **Action**: Delete (no longer needed)

---

### **Adapters (6 packages)** ⚠️ CONSOLIDATE:

**Individual Adapter Packages**:
1. ui-adapter-auth-nextauth
2. ui-adapter-data-prisma
3. ui-adapter-format-intl
4. ui-adapter-router-next
5. ui-adapter-ui-internal

**Consolidated Package**:
6. ui-adapters (barrel re-exports above)

**Problem**: 6 packages for adapters is too many

**Solution**: Consolidate into one `@ssot-ui/adapters` package

**Structure**:
```
packages/ui-adapters/
├── src/
│   ├── auth/nextauth.ts
│   ├── data/prisma.ts
│   ├── format/intl.ts
│   ├── router/next.ts
│   ├── ui/internal.ts
│   └── index.ts
└── package.json
```

**Action**: Merge 5 individual packages into ui-adapters/

---

### **UI Components (3 packages)** ⚠️ EVALUATE:

**7. @ssot-ui/data-table** ❓ KEEP or REPLACE
- Used by generated V2 code
- But we also have smart components now
- **Decision needed**: Keep for legacy or replace with smart DataTable?

**8. @ssot-ui/tokens** ✅ KEEP (if keeping data-table)
- Design tokens
- Used by ui-data-table
- Small, useful

**9. @ssot-ui/shared** ⚠️ MERGE
- Shared components
- Small package
- **Action**: Merge into ui-tokens or smart components

---

## 🎯 Proposed Final Structure

### **Option A: Minimal** (3 packages)

```
packages/
├── ui-expressions/     ✅ Core expression engine
├── ui-schemas/         ✅ Zod validation schemas
└── ui-adapters/        ✅ All adapters consolidated
    ├── auth/
    ├── data/
    ├── format/
    ├── router/
    └── ui/

archived/               ⚠️ Deprecated V3 packages
├── ui-runtime/
├── ui-loader/
└── ui-templates/

DELETED:
❌ ui-adapter-* (5 individual packages - merged)
❌ ui-data-table (replaced by smart components)
❌ ui-tokens (merged into ui-adapters or smart components)
❌ ui-shared (merged into ui-adapters)
```

**Result**: 17 packages → 3 packages

---

### **Option B: Conservative** (5 packages)

```
packages/
├── ui-expressions/     ✅ Core expression engine
├── ui-schemas/         ✅ Zod validation schemas
├── ui-adapters/        ✅ All adapters (consolidated from 6)
├── ui-components/      ✅ All UI components (data-table + smart components)
└── ui-tokens/          ✅ Design tokens

archived/
├── ui-runtime/         ⚠️ V3 runtime
├── ui-loader/          ⚠️ V3 loader
└── ui-templates/       ⚠️ V3 templates
```

**Result**: 17 packages → 5 packages

---

## 🔄 Migration Plan

### **Phase 1: Consolidate Adapters** (1 hour)

**Move everything into ui-adapters/**:
```bash
# Merge individual adapters
mv ui-adapter-auth-nextauth/src/* ui-adapters/src/auth/
mv ui-adapter-data-prisma/src/* ui-adapters/src/data/
mv ui-adapter-format-intl/src/* ui-adapters/src/format/
mv ui-adapter-router-next/src/* ui-adapters/src/router/
mv ui-adapter-ui-internal/src/* ui-adapters/src/ui/

# Update ui-adapters/src/index.ts
export * from './auth/nextauth.js'
export * from './data/prisma.js'
export * from './format/intl.js'
export * from './router/next.js'
export * from './ui/internal.js'

# Delete individual packages
rm -rf ui-adapter-*
```

---

### **Phase 2: Archive V3 Packages** (30 min)

```bash
# Create archived/ directory
mkdir packages/archived

# Move deprecated packages
mv ui-runtime/ packages/archived/
mv ui-loader/ packages/archived/

# Delete templates (not needed)
rm -rf ui-templates/
```

---

### **Phase 3: Consolidate Components** (1 hour)

**Option A**: Replace ui-data-table with smart components
```bash
# Smart components already generated in gen/src/generators/ui/
# Delete ui-data-table (replaced)
rm -rf ui-data-table/

# Merge ui-tokens into smart components
# Merge ui-shared into smart components
```

**Option B**: Keep both
- ui-data-table for legacy
- Smart components for new generation

---

## 📋 Recommended Action

**Conservative Consolidation** (Option B):

1. ✅ Consolidate 6 adapter packages → 1 ui-adapters
2. ✅ Archive 2 V3 packages (ui-runtime, ui-loader)
3. ✅ Delete ui-templates (V3 JSON templates)
4. ✅ Keep ui-expressions, ui-schemas (core)
5. ✅ Keep ui-data-table, ui-tokens (still used)
6. ⚠️ Evaluate ui-shared (merge later)

**Result**: 17 packages → 7 packages (59% reduction)

**Risk**: LOW (V3 packages archived, not deleted)

---

## ✅ Benefits

**Clearer Structure**:
- 3 core packages (expressions, schemas, adapters)
- 4 component packages (if keeping legacy)
- 0 scattered adapter packages

**Easier Maintenance**:
- One place for all adapters
- Clear V2 vs V3 separation
- Archived packages for reference

**Better DX**:
- Fewer dependencies to manage
- Clearer import paths
- Less confusion

---

**Should we proceed with conservative consolidation?**
- Consolidate adapters (6 → 1)
- Archive V3 packages
- Keep components for now


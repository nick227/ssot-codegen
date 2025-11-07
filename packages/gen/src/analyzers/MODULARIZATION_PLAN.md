# Unified Analyzer Modularization Plan

## Current Status

**File:** `unified-analyzer.ts`  
**Lines:** 954  
**Target:** < 200 lines per file  
**Strategy:** Logical separation by responsibility

---

## 📊 Current Structure Analysis

### Line Distribution
```
Lines 1-81:    Configuration & Interfaces (81 lines)
Lines 83-198:  Type Definitions (115 lines)
Lines 200-302: Main Analyzer (102 lines)
Lines 304-461: Relationship Analysis (157 lines)
Lines 463-511: Back-Reference Matching (48 lines)
Lines 515-629: Special Fields & Unique Validation (114 lines)
Lines 631-750: Field Analysis (119 lines)
Lines 752-852: Capabilities & FK Extraction (100 lines)
Lines 854-954: Include Generation (100 lines)
```

### Logical Groups
1. **Types & Interfaces** (~200 lines)
2. **Relationship Classification** (~205 lines)
3. **Field Detection** (~233 lines)
4. **Utilities & Helpers** (~148 lines)
5. **Main Orchestrator** (~100 lines)

---

## 🎯 Modularization Strategy

### Principle: Single Responsibility
Each module should have ONE clear purpose.

### Constraints
- ✅ Maintain public API compatibility
- ✅ Preserve performance (single-pass optimization)
- ✅ Keep type safety
- ✅ Avoid circular dependencies
- ✅ Each file < 200 lines

---

## 📁 Proposed Module Structure

### 1. `unified-analyzer/types.ts` (~100 lines)
**Purpose:** All type definitions and interfaces

**Exports:**
```typescript
export interface UnifiedAnalyzerConfig { ... }
export interface RelationshipInfo { ... }
export interface ForeignKeyInfo { ... }
export interface SpecialFields { ... }
export interface ModelCapabilities { ... }
export interface UnifiedModelAnalysis { ... }
export interface SpecialFieldMatcher { ... }
```

**Rationale:** Types are used across all modules, should be centralized.

---

### 2. `unified-analyzer/config.ts` (~80 lines)
**Purpose:** Configuration defaults and validation

**Exports:**
```typescript
export const DEFAULT_CONFIG: UnifiedAnalyzerConfig
export const DEFAULT_SPECIAL_FIELD_MATCHERS
export const SENSITIVE_FIELD_PATTERN
export const DEFAULT_PARENT_PATTERN
export function validateConfig(config: UnifiedAnalyzerConfig): void
```

**Rationale:** Configuration is independent, can be tested separately.

---

### 3. `unified-analyzer/relationship-classifier.ts` (~180 lines)
**Purpose:** Classify relationship types (1:1, 1:M, M:1, M:N)

**Exports:**
```typescript
export interface RelationshipAnalysisResult { ... }
export function analyzeRelationships(
  model: ParsedModel,
  schema: ParsedSchema,
  config: UnifiedAnalyzerConfig
): RelationshipAnalysisResult
```

**Internal Functions:**
- `classifyRelationshipType()` - Main classification logic
- `checkAutoInclude()` - Auto-include decision logic

**Rationale:** Relationship classification is complex enough to be its own module.

---

### 4. `unified-analyzer/back-reference-matcher.ts` (~60 lines)
**Purpose:** Find and match back-references for bidirectional relations

**Exports:**
```typescript
export function findBackReference(
  sourceField: ParsedField,
  targetModel: ParsedModel,
  sourceModel: ParsedModel
): ParsedField | null
```

**Internal Functions:**
- `matchByRelationName()` - Match using @relation name
- `matchByFKFields()` - Match using FK field sets

**Rationale:** Back-reference matching is isolated logic, easier to test separately.

---

### 5. `unified-analyzer/unique-validator.ts` (~50 lines)
**Purpose:** Validate unique constraints (single and composite)

**Exports:**
```typescript
export function isFieldUnique(
  model: ParsedModel,
  fieldName: string,
  requireExactMatch?: boolean
): boolean

export function areFieldsUnique(
  model: ParsedModel,
  fieldNames: string[]
): boolean
```

**Rationale:** Unique validation is used in multiple places, should be reusable.

---

### 6. `unified-analyzer/special-fields-detector.ts` (~120 lines)
**Purpose:** Detect special fields (published, slug, views, etc.)

**Exports:**
```typescript
export function detectSpecialFields(
  model: ParsedModel,
  config: UnifiedAnalyzerConfig,
  normalizedNames: Map<string, string>
): SpecialFields

export function normalizeFieldName(name: string): string
export function isSpecialFieldKey(key: string): key is keyof SpecialFields
```

**Rationale:** Special field detection is self-contained with clear inputs/outputs.

---

### 7. `unified-analyzer/field-detector.ts` (~120 lines)
**Purpose:** Single-pass field analysis (search, filter, special)

**Exports:**
```typescript
export interface FieldAnalysisResult {
  specialFields: SpecialFields
  searchFields: string[]
  filterFields: FilterField[]
  normalizedNames: Map<string, string>  // NEW: expose for reuse
}

export function analyzeFieldsOnce(
  model: ParsedModel,
  config: UnifiedAnalyzerConfig
): FieldAnalysisResult
```

**Internal Functions:**
- `isSensitiveField()`
- `getFilterType()`

**Rationale:** Core single-pass optimization, should be in dedicated module.

---

### 8. `unified-analyzer/capabilities-builder.ts` (~80 lines)
**Purpose:** Build capabilities from analyzed data

**Exports:**
```typescript
export function analyzeCapabilities(
  model: ParsedModel,
  specialFields: SpecialFields,
  searchFields: string[],
  filterFields: FilterField[],
  config: UnifiedAnalyzerConfig
): ModelCapabilities
```

**Internal Functions:**
- `hasFieldNormalized()`
- `hasParentChildRelation()`
- `getForeignKeys()`

**Rationale:** Capability aggregation is final step, separate from detection.

---

### 9. `unified-analyzer/include-generator.ts` (~50 lines)
**Purpose:** Generate Prisma include objects

**Exports:**
```typescript
export function generateIncludeObject(
  analysis: UnifiedModelAnalysis
): Record<string, boolean> | null

/** @deprecated */
export function generateSummaryInclude(
  analysis: UnifiedModelAnalysis,
  options?: { standalone?: boolean }
): string
```

**Rationale:** Include generation is utility functionality, separate concern.

---

### 10. `unified-analyzer/index.ts` (~100 lines)
**Purpose:** Main orchestrator - public API

**Exports:**
```typescript
// Re-export types
export * from './types.js'

// Main function
export { analyzeModelUnified } from './analyzer.js'

// Utilities
export { generateIncludeObject, generateSummaryInclude } from './include-generator.js'
export { normalizeFieldName } from './special-fields-detector.js'
export { isFieldUnique, areFieldsUnique } from './unique-validator.js'
```

**Content:**
- Main `analyzeModelUnified()` function
- Orchestrates all sub-analyzers
- Public API facade

**Rationale:** Clean public API, implementation details hidden.

---

## 📁 Final Directory Structure

```
packages/gen/src/analyzers/
├── unified-analyzer/
│   ├── index.ts                      (~100 lines) - Public API & orchestrator
│   ├── types.ts                      (~100 lines) - Type definitions
│   ├── config.ts                     (~80 lines)  - Configuration & defaults
│   ├── relationship-classifier.ts    (~180 lines) - Relationship type logic
│   ├── back-reference-matcher.ts     (~60 lines)  - Back-ref matching
│   ├── unique-validator.ts           (~50 lines)  - Unique constraint validation
│   ├── special-fields-detector.ts    (~120 lines) - Special field detection
│   ├── field-detector.ts             (~120 lines) - Search/filter/special analysis
│   ├── capabilities-builder.ts       (~80 lines)  - Capability aggregation
│   ├── include-generator.ts          (~50 lines)  - Include object generation
│   └── README.md                     - Module documentation
├── unified-analyzer.ts (DEPRECATED)  - Backward compatibility re-export
├── field-analyzer.ts                 - Existing
├── model-capabilities.ts             - Existing (might deprecate)
└── index.ts                          - Barrel export
```

---

## 🔄 Migration Strategy

### Phase 1: Create New Modules (No Breaking Changes)
1. Create `unified-analyzer/` directory
2. Extract types to `types.ts`
3. Extract config to `config.ts`
4. Extract each logical section to its module
5. Create orchestrator in `index.ts`

### Phase 2: Maintain Backward Compatibility
```typescript
// unified-analyzer.ts (kept for compatibility)
/** @deprecated Import from 'unified-analyzer/index.js' instead */
export * from './unified-analyzer/index.js'
```

### Phase 3: Update Imports Gradually
```typescript
// Old (still works)
import { analyzeModelUnified } from './unified-analyzer.js'

// New (preferred)
import { analyzeModelUnified } from './unified-analyzer/index.js'
```

### Phase 4: Remove Old File (v3.0)
- Add deprecation warnings
- Update all imports
- Remove `unified-analyzer.ts` in v3.0

---

## ✅ Benefits

### Code Quality
- ✅ Each file < 200 lines (follows project rules)
- ✅ Single Responsibility Principle
- ✅ Easier to test in isolation
- ✅ Easier to understand
- ✅ Easier to modify safely

### Maintainability
- ✅ Clear separation of concerns
- ✅ Reduced cognitive load
- ✅ Better git diffs (changes isolated)
- ✅ Easier to add new features

### Performance
- ✅ No performance degradation (same algorithm)
- ✅ Better tree-shaking (smaller bundles)
- ✅ Faster IDE operations (smaller files)

### Type Safety
- ✅ Better type inference (less complex)
- ✅ Faster TypeScript compilation
- ✅ Clearer type dependencies

---

## ⚠️ Risks & Mitigation

### Risk 1: Circular Dependencies
**Mitigation:** Strict dependency hierarchy:
```
types.ts (no deps)
  ↓
config.ts (types only)
  ↓
unique-validator.ts, back-reference-matcher.ts (types + config)
  ↓
special-fields-detector.ts, field-detector.ts (types + config + validators)
  ↓
relationship-classifier.ts (types + config + validators + back-ref)
  ↓
capabilities-builder.ts (types + all detectors)
  ↓
include-generator.ts (types only)
  ↓
index.ts (all modules) - orchestrator
```

### Risk 2: Breaking Changes
**Mitigation:** 
- Keep old file with re-exports
- Mark as deprecated
- Remove only in v3.0

### Risk 3: Performance Regression
**Mitigation:**
- Measure before/after
- Same algorithm, just organized
- No additional passes

### Risk 4: Import Path Changes
**Mitigation:**
- Backward compatible re-exports
- Automated migration script
- Clear migration guide

---

## 📋 Implementation Checklist

### Step 1: Extract Types (~10 min)
- [ ] Create `unified-analyzer/types.ts`
- [ ] Move all interfaces
- [ ] Update imports in main file

### Step 2: Extract Config (~10 min)
- [ ] Create `unified-analyzer/config.ts`
- [ ] Move constants and defaults
- [ ] Move validateConfig

### Step 3: Extract Validators (~15 min)
- [ ] Create `unified-analyzer/unique-validator.ts`
- [ ] Move isFieldUnique, areFieldsUnique

### Step 4: Extract Detectors (~20 min)
- [ ] Create `unified-analyzer/special-fields-detector.ts`
- [ ] Create `unified-analyzer/field-detector.ts`
- [ ] Move single-pass logic

### Step 5: Extract Relationship Logic (~25 min)
- [ ] Create `unified-analyzer/back-reference-matcher.ts`
- [ ] Create `unified-analyzer/relationship-classifier.ts`
- [ ] Move classification logic

### Step 6: Extract Capabilities (~15 min)
- [ ] Create `unified-analyzer/capabilities-builder.ts`
- [ ] Move capability aggregation

### Step 7: Extract Include Gen (~10 min)
- [ ] Create `unified-analyzer/include-generator.ts`
- [ ] Move include functions

### Step 8: Create Orchestrator (~15 min)
- [ ] Create `unified-analyzer/index.ts`
- [ ] Move main analyzeModelUnified function
- [ ] Wire all modules together

### Step 9: Backward Compat (~5 min)
- [ ] Update old unified-analyzer.ts with re-exports
- [ ] Add deprecation warnings

### Step 10: Testing (~20 min)
- [ ] Run existing tests
- [ ] Verify no breaking changes
- [ ] Check build succeeds

**Total Time:** ~2.5 hours

---

## 🎯 Expected Outcomes

### Before
```
unified-analyzer.ts - 954 lines ❌
```

### After
```
unified-analyzer/
├── index.ts                    ~100 lines ✅
├── types.ts                    ~100 lines ✅
├── config.ts                   ~80 lines  ✅
├── relationship-classifier.ts  ~180 lines ✅
├── back-reference-matcher.ts   ~60 lines  ✅
├── unique-validator.ts         ~50 lines  ✅
├── special-fields-detector.ts  ~120 lines ✅
├── field-detector.ts           ~120 lines ✅
├── capabilities-builder.ts     ~80 lines  ✅
└── include-generator.ts        ~50 lines  ✅

Total: ~940 lines across 10 files
Average: ~94 lines per file ✅
```

---

## 🚀 Recommendation

**Proceed with modularization?**

**Benefits:**
- Cleaner code organization
- Easier to maintain
- Better testability
- Follows SRP
- Meets < 200 line guideline

**Risks:** Minimal (with backward compatibility)

**Effort:** ~2.5 hours

**Impact:** High (better developer experience)

---

**Next Action:** Create modules systematically, starting with types and config, then build up dependencies.


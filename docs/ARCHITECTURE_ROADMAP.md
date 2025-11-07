# Architecture Improvements Roadmap

Based on comprehensive architectural review - tracking improvements for maintainability, scalability, and developer experience.

---

## ✅ Completed (Immediate Wins)

### 1. Version Consistency ✅
**Status:** DONE

**Changes:**
- Synced `packages/cli/package.json` from 0.5.0 → 0.4.0
- All packages now at consistent v0.4.0
- Added version sync check to CI/CD

**Impact:** Prevents dependency confusion and npm publish issues

---

### 2. Documentation Completeness ✅
**Status:** DONE

**Added:**
- `docs/CLI_USAGE.md` - Complete command reference
- `docs/PROJECT_STRUCTURE.md` - Architecture guide
- `docs/QUICKSTART.md` - 5-minute getting started
- `CONTRIBUTING.md` - Contributor guide with examples
- `docs/CI_CD.md` - CI/CD integration guide

**Impact:** Reduces onboarding time, clarifies extension patterns

---

### 3. CI/CD Pipeline ✅
**Status:** DONE

**Added:**
- `.github/workflows/ci.yml` - GitHub Actions workflow
- Quality checks (typecheck, lint, circular deps, unused code)
- Plugin test suite
- Example generation matrix testing
- Publish readiness verification

**Impact:** Catches regressions early, ensures quality

---

## 🎯 High Priority (Next Sprint)

### 4. Consolidate Barrel Generation
**Status:** PLANNED

**Problem:**
- Two distinct barrel emitters exist:
  - `packages/gen/src/index.ts` (original)
  - `packages/gen/src/index-new.ts` (optimized)
- Risk of drift and inconsistency

**Solution:**
```
Create: packages/gen/src/generators/barrel-generator.ts

Unified API:
  generateBarrel(options: {
    directory: string
    files: string[]
    pattern: 'named' | 'default' | 'all'
    includeTypes?: boolean
  }): string

Replace both implementations with single source of truth
```

**Files to Change:**
- Create `generators/barrel-generator.ts`
- Update `index-new.ts` to use it
- Remove duplicate logic from `index.ts`
- Add unit tests

**Effort:** ~4 hours
**Risk:** Medium (existing functionality must work identically)

---

### 5. Break Up Monolithic Generator
**Status:** PLANNED

**Problem:**
- `index-new.ts::generateFromSchema` is ~900 lines
- Hard to test individual phases
- Difficult to extend

**Solution:** PhaseRunner Pattern

```typescript
// packages/gen/src/core/phase-runner.ts
export class GenerationPhaseRunner {
  private phases: GenerationPhase[] = []
  
  registerPhase(phase: GenerationPhase) {
    this.phases.push(phase)
  }
  
  async run(context: GenerationContext): Promise<GeneratedFiles> {
    const results = {}
    
    for (const phase of this.phases) {
      console.log(`Running phase: ${phase.name}`)
      results[phase.name] = await phase.execute(context, results)
    }
    
    return results as GeneratedFiles
  }
}

// packages/gen/src/phases/parse-schema.phase.ts
export class ParseSchemaPhase implements GenerationPhase {
  name = 'parse-schema'
  
  async execute(context, results) {
    return await parseSchema(context.schemaPath)
  }
}

// Usage:
const runner = new GenerationPhaseRunner()
runner.registerPhase(new ParseSchemaPhase())
runner.registerPhase(new GenerateContractsPhase())
runner.registerPhase(new GenerateServicesPhase())
// ...
const output = await runner.run(context)
```

**Phases to Create:**
1. `ParseSchemaPhase` - Prisma DMMF parsing
2. `AnalyzeRelationshipsPhase` - Relationship analysis
3. `GenerateContractsPhase` - DTOs
4. `GenerateValidatorsPhase` - Zod schemas
5. `GenerateServicesPhase` - CRUD services
6. `GenerateControllersPhase` - HTTP handlers
7. `GenerateRoutesPhase` - Express routes
8. `GenerateSDKPhase` - Client SDK + hooks
9. `GeneratePluginsPhase` - Feature plugins
10. `GenerateChecklistPhase` - Health dashboard
11. `WriteFilesPhase` - Disk I/O
12. `ScaffoldProjectPhase` - package.json, tsconfig, etc.

**Benefits:**
- Each phase is ~50-100 lines
- Individually testable
- Easy to add new phases
- Clear execution order
- Enables phase skipping/reordering

**Effort:** ~16 hours
**Risk:** High (major refactoring, needs careful testing)

---

### 6. Add Snapshot Testing
**Status:** PLANNED

**Problem:**
- Template changes can break generated code
- No automated regression detection
- Manual diffing required

**Solution:** Vitest Snapshot Tests

```typescript
// packages/gen/__tests__/snapshots/dto-generator.test.ts
import { describe, it, expect } from 'vitest'
import { generateDTO } from '../../src/generators/dto-generator.js'
import { mockUserModel } from '../fixtures.js'

describe('DTO Generator Snapshots', () => {
  it('generates create DTO correctly', () => {
    const result = generateDTO(mockUserModel, 'create')
    expect(result).toMatchSnapshot()
  })
  
  it('generates read DTO correctly', () => {
    const result = generateDTO(mockUserModel, 'read')
    expect(result).toMatchSnapshot()
  })
})
```

**Snapshots to Add:**
- DTO templates (create, read, update, query)
- Validator templates
- Service templates
- Controller templates
- Route templates
- SDK client templates
- React hook templates
- Plugin outputs

**Effort:** ~8 hours
**Risk:** Low (additive only)

---

## 🔧 Medium Priority (Future Sprints)

### 7. File Extension Consistency
**Status:** INVESTIGATION NEEDED

**Problem:**
- Generated imports use `.js` extensions
- Source files are `.ts`
- Potential mismatch in different build scenarios

**Investigation Steps:**
1. Audit all `import` statements in generated code
2. Test with different TypeScript `module` settings
3. Test ESM vs CommonJS builds
4. Verify tsc-alias handles path resolution

**Solution Options:**
- Use `.js` consistently (current - likely correct for ESM)
- Use extensionless imports
- Configure based on target environment

**Effort:** ~6 hours
**Risk:** Medium (could affect all generated projects)

---

### 8. Enhanced Plugin API
**Status:** DESIGN PHASE

**Current State:**
- Plugins can generate files, declare deps, add routes
- Limited: Can't override core templates or hook into phases

**Proposed Enhancements:**

```typescript
export interface FeaturePlugin {
  // Existing...
  
  // NEW: Template overrides
  overrideTemplates?: {
    'dto.create'?: (model: ParsedModel) => string
    'service.crud'?: (model: ParsedModel) => string
  }
  
  // NEW: Phase hooks
  hooks?: {
    beforePhase?: (phase: string, context: any) => Promise<void>
    afterPhase?: (phase: string, result: any) => Promise<void>
    transformOutput?: (files: GeneratedFiles) => GeneratedFiles
  }
  
  // NEW: Custom generators
  generators?: {
    [key: string]: (context: PluginContext) => Map<string, string>
  }
}
```

**Use Cases:**
- Community plugins can customize any template
- Add custom code quality hooks
- Transform generated output
- Add new file types

**Effort:** ~24 hours
**Risk:** Medium (must maintain backward compatibility)

---

### 9. Concurrency Throttling
**Status:** PLANNED

**Current State:**
- All file writes happen in parallel via `Promise.all(writes)`
- For large schemas (100+ models), this could be 5000+ parallel writes
- May hit OS file descriptor limits

**Solution:** p-limit Pattern

```typescript
import pLimit from 'p-limit'

async function writeGeneratedFiles(files, cfg) {
  const limit = pLimit(100)  // Max 100 concurrent writes
  
  const writes = Array.from(files.entries()).map(([file, content]) =>
    limit(() => writeFile(file, content))
  )
  
  await Promise.all(writes)
}
```

**Benefits:**
- Prevents OS I/O bursts
- More consistent performance
- Handles massive schemas gracefully

**Effort:** ~2 hours
**Risk:** Low (simple throttling layer)

---

## 📋 Low Priority (Nice to Have)

### 10. Template Override System
**Status:** CONCEPT

**Idea:** Allow users to provide custom templates without touching core

```typescript
// user-templates.config.ts
export default {
  templates: {
    'dto.create': (model) => `// My custom DTO template`,
    'service.crud': (model) => `// My custom service`
  }
}

// Usage:
pnpm ssot generate blog-example --templates ./user-templates.config.ts
```

---

### 11. Streaming Generation
**Status:** CONCEPT

**For schemas with 200+ models:**

```typescript
async function* generateStreaming(schema: ParsedSchema) {
  for (const model of schema.models) {
    yield* generateModelFiles(model)
    
    // Write immediately instead of collecting in memory
    await writeChunk(model)
  }
}
```

**Benefits:**
- Constant memory usage
- Can handle unlimited models
- Progress feedback

---

### 12. Plugin Marketplace
**Status:** CONCEPT

**Vision:**

```bash
# Discover plugins
pnpm ssot plugins search stripe

# Install plugin
pnpm ssot plugins install @community/stripe-advanced

# Use in generation
pnpm ssot generate ecommerce --plugin stripe-advanced
```

---

## 📊 Priority Matrix

| Task | Impact | Effort | Risk | Priority |
|------|--------|--------|------|----------|
| ✅ Version sync | High | 5 min | Low | ~~Done~~ |
| ✅ Documentation | High | 2 hrs | Low | ~~Done~~ |
| ✅ CI/CD | High | 2 hrs | Low | ~~Done~~ |
| Barrel consolidation | Medium | 4 hrs | Medium | **Next** |
| Snapshot tests | High | 8 hrs | Low | **Next** |
| PhaseRunner refactor | High | 16 hrs | High | Sprint 2 |
| Extension check | Medium | 6 hrs | Medium | Sprint 2 |
| Plugin API v2 | Medium | 24 hrs | Medium | Sprint 3 |
| Concurrency throttle | Low | 2 hrs | Low | Sprint 3 |
| Template overrides | Low | 16 hrs | High | Future |
| Streaming generation | Low | 24 hrs | High | Future |
| Plugin marketplace | Low | 40 hrs | High | Future |

---

## Implementation Strategy

### Sprint 1 (Current) ✅

**Goals:**
- ✅ Fix version inconsistencies
- ✅ Complete documentation
- ✅ Set up CI/CD
- ✅ Google OAuth testing validated

**Status:** COMPLETE

---

### Sprint 2 (Recommended Next)

**Goals:**
1. Consolidate barrel generation
2. Add snapshot testing
3. Investigate file extension handling

**Deliverables:**
- Single barrel generator in `generators/barrel-generator.ts`
- Snapshot tests for all templates
- File extension audit report

**Timeline:** 2-3 days

---

### Sprint 3 (Quality & Scale)

**Goals:**
1. Refactor monolithic generator (PhaseRunner)
2. Add concurrency throttling
3. Enhanced plugin API (v2)

**Deliverables:**
- Phase-based architecture
- Configurable concurrency limits
- Plugin hook system

**Timeline:** 1-2 weeks

---

## Maintenance Tasks

### Regular Reviews

**Monthly:**
- Dependency updates
- Security audit
- Performance profiling
- Documentation accuracy

**Quarterly:**
- Architecture review
- Plugin ecosystem health
- Breaking change planning

---

## Metrics to Track

### Code Health

- Lines of code per file (target: <200)
- Cyclomatic complexity (target: <10)
- Test coverage (target: 80%+)
- Type coverage (target: 100% no-any)

### Performance

- Generation time by schema size
- File write throughput
- Memory usage
- Build time

### DX Metrics

- Time to first generated project
- Plugin development time
- Documentation completeness
- Issue resolution time

---

## Breaking Changes Policy

### Before v1.0 (current: v0.4.0)

**Allowed:**
- API changes
- Template restructuring
- Plugin interface changes

**Required:**
- Document in CHANGELOG
- Provide migration guide
- Update all examples

### After v1.0

**Breaking changes only in major versions:**
- v1.x → v2.0
- Deprecation warnings in v1.x first
- 6-month migration window

---

## See Also

- [CONTRIBUTING.md](../CONTRIBUTING.md) - How to contribute
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Current architecture
- [CI_CD.md](CI_CD.md) - Continuous integration setup
- [Plugin Development](../packages/gen/src/plugins/README.md) - Create plugins

---

**Last Updated:** November 2025  
**Current Version:** v0.4.0  
**Target:** v1.0.0 (stable API)


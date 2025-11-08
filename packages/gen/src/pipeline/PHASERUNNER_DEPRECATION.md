# PhaseRunner Deprecation Notice

**Status:** ⚠️ **DEPRECATED** as of v2.0  
**Replacement:** `CodeGenerationPipeline`  
**Removal:** Planned for v3.0

---

## Summary

`PhaseRunner` has been **deprecated** in favor of the unified `CodeGenerationPipeline` implementation. The two implementations have been consolidated to reduce maintenance burden and eliminate architectural inconsistencies.

## Migration Path

### Quick Migration (Adapter)

For immediate compatibility, use `UnifiedPipelineAdapter`:

```typescript
// OLD: PhaseRunner
import { PhaseRunner } from '@/pipeline/phase-runner.js'
const runner = new PhaseRunner(config, logger)
runner.registerPhases(createAllPhases())
const result = await runner.run()

// NEW: UnifiedPipelineAdapter (drop-in replacement)
import { createUnifiedPipeline } from '@/pipeline/unified-pipeline-adapter.js'
const pipeline = createUnifiedPipeline(config, logger)
const result = await pipeline.run()
```

### Direct Migration (Recommended)

For new code, use `CodeGenerationPipeline` directly:

```typescript
// Parse schema
const schema = await parseDMMFFromFile(schemaPath)

// Create config
const config: CodeGeneratorConfig = {
  framework: 'express',
  useEnhancedGenerators: true,
  usePipeline: true,
  // ... other options
}

// Create and execute pipeline
const pipeline = new CodeGenerationPipeline(schema, config)
const files = await pipeline.execute()

// files is GeneratedFiles (actual content), not GeneratorResult
```

---

## Key Differences

| Feature | PhaseRunner (OLD) | CodeGenerationPipeline (NEW) |
|---------|-------------------|------------------------------|
| **Return Type** | `GeneratorResult` (metadata) | `GeneratedFiles` (actual content) |
| **Schema Input** | Parsed internally from config | Passed as constructor argument |
| **Context** | `PhaseContext` (string-indexed) | `GenerationContext` (type-safe) |
| **Rollback** | None | Automatic snapshots |
| **Hooks** | PhaseHookRegistry (built-in) | PhaseHookRegistry (built-in) |
| **Error Handling** | Manual try-catch | Centralized ErrorCollector |
| **Config** | `GeneratorConfig` | `CodeGeneratorConfig` |

---

## Why Deprecated?

### Problems with Dual Implementation

1. **Maintenance Burden:** Two codebases doing the same thing
2. **Feature Drift:** Changes made to one but not the other
3. **Confusion:** Developers unsure which to use
4. **Inconsistent Behavior:** Different error handling, different defaults
5. **Testing Overhead:** Need to test both paths

### Benefits of Unified Implementation

1. ✅ **Single Source of Truth:** One canonical pipeline
2. ✅ **Better Type Safety:** GenerationContext is strongly typed
3. ✅ **Rollback Support:** Automatic snapshots before each phase
4. ✅ **Direct Output:** Returns actual GeneratedFiles content
5. ✅ **Hook System:** Full hook support (beforePhase, afterPhase, replacePhase)
6. ✅ **Error Handling:** Centralized with ErrorCollector
7. ✅ **Better Testing:** Single implementation to test

---

## Migration Timeline

### Phase 1: ⏳ **Current** (v2.0 - v2.x)
- PhaseRunner marked as **DEPRECATED**
- UnifiedPipelineAdapter provides compatibility layer
- Both implementations work side-by-side
- New code should use CodeGenerationPipeline

### Phase 2: 🔔 **Warning** (v2.5)
- Runtime warnings when PhaseRunner is used
- Documentation updated to recommend CodeGenerationPipeline
- Examples updated to use new API

### Phase 3: 🗑️ **Removal** (v3.0)
- PhaseRunner completely removed
- UnifiedPipelineAdapter removed
- Only CodeGenerationPipeline remains

---

## Migration Examples

### Example 1: CLI Entry Point

**Before:**
```typescript
// packages/gen/src/index-new-refactored.ts
import { PhaseRunner } from '@/pipeline/phase-runner.js'
import { createAllPhases } from '@/pipeline/phases/index.js'

export async function generateFromSchema(config: GeneratorConfig) {
  const logger = createLogger(...)
  const runner = new PhaseRunner(config, logger)
  runner.registerPhases(createAllPhases())
  return await runner.run()
}
```

**After (Adapter):**
```typescript
// packages/gen/src/index-new-refactored.ts
import { createUnifiedPipeline } from '@/pipeline/unified-pipeline-adapter.js'

export async function generateFromSchema(config: GeneratorConfig) {
  const logger = createLogger(...)
  const pipeline = createUnifiedPipeline(config, logger)
  return await pipeline.run()
}
```

**After (Direct):**
```typescript
// Recommended for new code
import { CodeGenerationPipeline } from '@/pipeline/code-generation-pipeline.js'
import { parseDMMF } from '@/dmmf-parser.js'

export async function generateFromSchema(config: GeneratorConfig) {
  // Parse schema
  const schema = await parseSchemaFromConfig(config)
  
  // Convert config
  const pipelineConfig: CodeGeneratorConfig = {
    framework: config.framework || 'express',
    useEnhancedGenerators: true,
    usePipeline: true,
    projectName: config.projectName,
    features: config.features
  }
  
  // Execute
  const pipeline = new CodeGenerationPipeline(schema, pipelineConfig)
  const files = await pipeline.execute()
  
  // Convert to GeneratorResult if needed
  return convertFilesToResult(files)
}
```

### Example 2: With Hooks

**Before:**
```typescript
const runner = new PhaseRunner(config, logger)
const hooks = runner.getHookRegistry()

hooks.beforePhase('generateCode', async (ctx) => {
  console.log(`Generating for ${ctx.modelNames.length} models`)
})

runner.registerPhases(createAllPhases())
await runner.run()
```

**After:**
```typescript
const hookRegistry = new PhaseHookRegistry()

hookRegistry.beforePhase('dto-generation', async (ctx: any) => {
  console.log(`Generating DTOs...`)
})

const pipeline = new CodeGenerationPipeline(schema, config, hookRegistry)
await pipeline.execute()
```

### Example 3: Testing

**Before:**
```typescript
describe('PhaseRunner', () => {
  it('should generate code', async () => {
    const runner = new PhaseRunner(config, logger)
    runner.registerPhases(createAllPhases())
    const result = await runner.run()
    
    expect(result.files).toBeGreaterThan(0)
  })
})
```

**After:**
```typescript
describe('CodeGenerationPipeline', () => {
  it('should generate code', async () => {
    const pipeline = new CodeGenerationPipeline(schema, config)
    const files = await pipeline.execute()
    
    expect(files.contracts.size).toBeGreaterThan(0)
    expect(files.services.size).toBeGreaterThan(0)
  })
})
```

---

## FAQs

### Q: Can I still use PhaseRunner?
A: Yes, but it's deprecated. Use UnifiedPipelineAdapter for compatibility, or migrate to CodeGenerationPipeline.

### Q: What if I have custom phases?
A: CodeGenerationPipeline accepts phases through its hook system. Use `hookRegistry.replacePhase()` to override phases.

### Q: Will my existing code break?
A: No, PhaseRunner still works in v2.x. It will be removed in v3.0.

### Q: How do I get hooks with CodeGenerationPipeline?
A: Pass a PhaseHookRegistry to the constructor:
```typescript
const hooks = new PhaseHookRegistry()
const pipeline = new CodeGenerationPipeline(schema, config, hooks)
```

### Q: What about the numbered phases (00-13)?
A: Those are specific to file I/O. CodeGenerationPipeline uses named phases (validation, analysis, dto-generation, etc.). Use the adapter if you need backward compatibility.

### Q: Why not keep both?
A: Maintaining two implementations leads to bugs, inconsistency, and wasted effort. One implementation is better.

---

## Need Help?

If you encounter issues migrating:

1. Check the migration examples above
2. Use `UnifiedPipelineAdapter` for gradual migration
3. Review the architectural analysis document: `docs/PIPELINE_ARCHITECTURE_ANALYSIS.md`
4. Open an issue with your use case

---

**Deprecated:** 2025-11-08  
**Replacement:** CodeGenerationPipeline  
**Status:** Active (v2.x), Removed (v3.0)


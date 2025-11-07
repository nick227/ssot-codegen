# Strongly-Typed Phase Context Migration Guide

## Overview

The strongly-typed context system provides **compile-time safety** for the phase pipeline by:

1. ✅ Each phase declares what it **requires** (input)
2. ✅ Each phase declares what it **provides** (output)  
3. ✅ Context type **evolves** as phases run
4. ✅ TypeScript **catches missing data at compile time**

## Benefits

### Before (Runtime Errors)

```ts
class MyPhase extends GenerationPhase {
  async execute(context: PhaseContext) {
    // Runtime check required!
    if (!context.schema) {
      throw new Error('Schema not found') // 💥 Runtime error
    }
    
    // TypeScript doesn't know schema exists
    const models = context.schema.models
  }
}
```

### After (Compile-Time Safety)

```ts
class MyPhase extends TypedPhaseAdapter<ContextAfterPhase1, MyOutput> {
  async executeTyped(context: ContextAfterPhase1) {
    // ✅ TypeScript GUARANTEES schema exists!
    const models = context.schema.models
    
    // ❌ TypeScript PREVENTS accessing future data
    // const files = context.generatedFiles  // Compile error!
  }
}
```

## Type System Architecture

### Phase Output Types

Each phase defines what it provides:

```ts
// Phase 0 provides outputDir
interface SetupOutputDirOutput {
  readonly outputDir: string
}

// Phase 1 provides schema data
interface ParseSchemaOutput {
  readonly schema: ParsedSchema
  readonly schemaContent: string
  readonly modelNames: string[]
}
```

### Evolving Context Types

Context type accumulates as phases run:

```ts
// After Phase 0
type ContextAfterPhase0 = BaseContext & SetupOutputDirOutput
// Has: config, logger, outputDir

// After Phase 1  
type ContextAfterPhase1 = ContextAfterPhase0 & ParseSchemaOutput
// Has: config, logger, outputDir, schema, schemaContent, modelNames

// After Phase 2
type ContextAfterPhase2 = ContextAfterPhase1 & ValidateSchemaOutput
// And so on...
```

### Type Safety in Action

```ts
// ✅ TypeScript allows this (outputDir exists in ContextAfterPhase0)
function usePhase0Output(ctx: ContextAfterPhase0) {
  return ctx.outputDir
}

// ❌ TypeScript prevents this (schema doesn't exist until Phase 1)
function usePhase1Output(ctx: ContextAfterPhase0) {
  return ctx.schema  // 💥 Compile error!
  //        ^^^^^^ Property 'schema' does not exist
}

// ✅ TypeScript allows this (schema exists in ContextAfterPhase1)
function usePhase1Output(ctx: ContextAfterPhase1) {
  return ctx.schema  // ✅ TypeScript knows this exists
}
```

## Migration Steps

### Step 1: Create Typed Phase Class

```ts
// Old (runtime checks):
export class MyPhase extends GenerationPhase {
  readonly name = 'myPhase'
  readonly order = 5
  
  async execute(context: PhaseContext): Promise<PhaseResult> {
    // Runtime validation
    if (!context.schema || !context.outputDir) {
      throw new Error('Missing required data')
    }
    
    // Do work
    const result = processSchema(context.schema)
    
    // Store in context
    context.myData = result
    
    return { success: true, data: result }
  }
}
```

```ts
// New (compile-time safety):
import { TypedPhaseAdapter } from '../typed-phase-adapter.js'
import type { ContextAfterPhase1, MyOutput } from '../typed-context.js'

export class MyPhaseTyped extends TypedPhaseAdapter<
  ContextAfterPhase1,  // Requires: Phase 1 output
  MyOutput  // Provides: MyOutput
> {
  readonly name = 'myPhase'
  readonly order = 5
  
  // NO RUNTIME CHECKS NEEDED!
  async executeTyped(context: ContextAfterPhase1): Promise<MyOutput> {
    // TypeScript guarantees schema and outputDir exist
    const result = processSchema(context.schema)
    
    return { myData: result }
  }
}
```

### Step 2: Define Output Type

```ts
// In typed-context.ts:
export interface MyOutput {
  readonly myData: ProcessedData
}

// Add to evolution chain:
export type ContextAfterMyPhase = ContextAfterPhase1 & MyOutput
```

### Step 3: Remove Runtime Checks

Before:
```ts
async execute(context: PhaseContext) {
  // Defensive runtime checks
  if (!context.schema) throw new Error('Schema required')
  if (!context.modelNames) throw new Error('Models required')
  if (!context.outputDir) throw new Error('Output dir required')
  
  // Now we can use them (maybe)
  const { schema, modelNames, outputDir } = context
}
```

After:
```ts
async executeTyped(context: ContextAfterPhase1) {
  // NO CHECKS NEEDED! TypeScript guarantees these exist
  const { schema, modelNames, outputDir } = context
}
```

### Step 4: Update Tests

```ts
// Old tests (mocking untyped context):
it('processes schema', async () => {
  const context = { schema: mockSchema } as PhaseContext
  await phase.execute(context)
})
```

```ts
// New tests (typed context):
it('processes schema', async () => {
  const context: ContextAfterPhase1 = {
    config: mockConfig,
    logger: mockLogger,
    outputDir: '/path',
    schema: mockSchema,
    schemaContent: 'content',
    modelNames: ['User']
  }
  await phase.executeTyped(context)
})
```

## Common Patterns

### Pattern 1: Accessing Previous Phase Data

```ts
// Phase requires Phase 3 output
class MyPhase extends TypedPhaseAdapter<ContextAfterPhase3, MyOutput> {
  async executeTyped(context: ContextAfterPhase3) {
    // ✅ Can access ALL previous phase data
    context.config           // From BaseContext
    context.logger           // From BaseContext
    context.outputDir        // From Phase 0
    context.schema           // From Phase 1
    context.schemaContent    // From Phase 1
    context.modelNames       // From Phase 1
    context.relationshipCount // From Phase 3
    
    // ❌ Cannot access future phase data
    // context.generatedFiles // Compile error! (Phase 4)
  }
}
```

### Pattern 2: Optional Runtime Validation (During Migration)

```ts
import { validateContext } from '../typed-phase-adapter.js'

async executeTyped(context: ContextAfterPhase1) {
  // Optional: Extra safety during migration
  validateContext(context, ['schema', 'modelNames'])
  
  // Continue with confidence
  const { schema, modelNames } = context
}
```

### Pattern 3: Conditional Phases

```ts
class MyPhase extends TypedPhaseAdapter<ContextAfterPhase4, MyOutput> {
  shouldRunTyped(context: ContextAfterPhase4): boolean {
    // Type-safe access to context for conditional logic
    return context.config.standalone ?? false
  }
  
  async executeTyped(context: ContextAfterPhase4) {
    // Only runs if shouldRunTyped returned true
  }
}
```

## Migration Checklist

For each phase:

- [ ] Create `*Phase.typed.ts` file
- [ ] Extend `TypedPhaseAdapter<TRequires, TProvides>`
- [ ] Determine required context type (`ContextAfterPhaseN`)
- [ ] Define output interface in `typed-context.ts`
- [ ] Implement `executeTyped()` method
- [ ] Remove runtime checks (TypeScript handles them!)
- [ ] Update tests to use typed context
- [ ] Verify compile errors for invalid access

## Testing Compile-Time Safety

See `__tests__/typed-context.test.ts` for examples of:

- ✅ Valid typed contexts that compile
- ❌ Invalid contexts that produce compile errors (commented out)
- Type evolution demonstrations
- Phase dependency enforcement

## Phase Dependency Graph

```
BaseContext (config, logger)
  ↓
Phase 0: Setup Output Dir → outputDir
  ↓
Phase 1: Parse Schema → schema, schemaContent, modelNames
  ↓
Phase 2: Validate Schema → (validation)
  ↓
Phase 3: Analyze Relationships → relationshipCount
  ↓
Phase 4: Generate Code → pathsConfig, generatedFiles, totalFiles, breakdown
  ↓
Phase 5-13: File operations, formatting, etc.
```

## Benefits Summary

| Before | After |
|--------|-------|
| ❌ Runtime errors | ✅ Compile-time errors |
| ❌ Defensive checks everywhere | ✅ TypeScript guarantees |
| ❌ Easy to access undefined data | ✅ Impossible to access undefined data |
| ❌ Phases can run out of order silently | ✅ TypeScript enforces order |
| ❌ Refactoring is risky | ✅ Refactoring is safe |

## Questions?

- See `typed-context.ts` for all type definitions
- See `typed-phase-adapter.ts` for adapter implementation
- See `__tests__/typed-context.test.ts` for examples
- See `*phase.typed.ts` files for migration examples


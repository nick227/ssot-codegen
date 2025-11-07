# Phase Hook System

Powerful hook system for extending SSOT Codegen generation phases with **compile-time type safety**.

## Overview

The Phase Hook System allows you to:
- ✅ Run code **before** any phase
- ✅ Run code **after** any phase  
- ✅ **Replace** entire phases with custom logic
- ✅ **Wrap** phases with before/after hooks
- ✅ Handle **errors** globally
- ✅ Access **strongly-typed context** in all hooks

## Quick Start

```ts
import { beforePhase, afterPhase } from '@ssot-codegen/gen/hooks'
import type { ContextAfterPhase1 } from '@ssot-codegen/gen/typed-context'

// Log after schema parsing
afterPhase('parseSchema', async (context: ContextAfterPhase1) => {
  console.log(`Parsed ${context.modelNames.length} models`)
})

// Add validation before code generation
beforePhase('generateCode', async (context: ContextAfterPhase3) => {
  // TypeScript knows context.schema and context.modelNames exist!
  validateBusinessRules(context.schema)
})
```

## API Reference

### `beforePhase(phaseName, hook)`

Run code before a phase executes.

**Parameters:**
- `phaseName: string` - Name of phase to hook
- `hook: (context: TContext) => Promise<void>` - Hook function

**Example:**
```ts
beforePhase('writeFiles', async (context: ContextAfterPhase4) => {
  // TypeScript guarantees generatedFiles exists
  console.log(`Writing ${context.totalFiles} files...`)
})
```

### `afterPhase(phaseName, hook)`

Run code after a phase completes.

**Parameters:**
- `phaseName: string` - Name of phase to hook
- `hook: (context: TContext, result: PhaseResult) => Promise<void>` - Hook function

**Example:**
```ts
afterPhase('generateCode', async (context: ContextAfterPhase4, result) => {
  console.log(`Generated ${result.filesGenerated} files`)
  
  // Can access phase output
  const { generatedFiles, breakdown } = context
})
```

### `replacePhase(phaseName, hook)`

Completely replace a phase with custom implementation.

**Parameters:**
- `phaseName: string` - Name of phase to replace
- `hook: (context: TContext) => Promise<PhaseResult>` - Replacement function

**Example:**
```ts
replacePhase('generateOpenAPI', async (context: ContextAfterPhase7) => {
  // Custom OpenAPI generation
  const spec = generateCustomOpenAPI(context.schema)
  
  await writeFile('./custom-openapi.json', JSON.stringify(spec))
  
  return {
    success: true,
    filesGenerated: 1
  }
})
```

### `wrapPhase(phaseName, hooks)`

Wrap a phase with before and/or after hooks.

**Parameters:**
- `phaseName: string` - Name of phase to wrap
- `hooks: { before?: Hook, after?: Hook }` - Wrapper hooks

**Example:**
```ts
wrapPhase('writeFiles', {
  before: async (ctx) => console.log('Starting file writes...'),
  after: async (ctx, result) => console.log(`Wrote ${result.filesGenerated} files`)
})
```

### `onError(hook)`

Run code when any phase fails.

**Parameters:**
- `hook: (phaseName: string, error: Error, context: BaseContext) => Promise<void>` - Error handler

**Example:**
```ts
onError(async (phaseName, error, context) => {
  // Send to error tracking service
  await errorTracker.report({
    phase: phaseName,
    error: error.message,
    project: context.config.projectName
  })
})
```

## Phase Names

Available phases to hook into:

| Phase Name | Order | Context Type | Output Type |
|------------|-------|--------------|-------------|
| `setupOutputDir` | 0 | BaseContext | SetupOutputDirOutput |
| `parseSchema` | 1 | ContextAfterPhase0 | ParseSchemaOutput |
| `validateSchema` | 2 | ContextAfterPhase1 | ValidateSchemaOutput |
| `analyzeRelationships` | 3 | ContextAfterPhase2 | AnalyzeRelationshipsOutput |
| `generateCode` | 4 | ContextAfterPhase3 | GenerateCodeOutput |
| `writeFiles` | 5 | ContextAfterPhase4 | WriteFilesOutput |
| `writeInfrastructure` | 6 | ContextAfterPhase5 | WriteBaseInfrastructureOutput |
| `generateBarrels` | 7 | ContextAfterPhase6 | GenerateBarrelsOutput |
| `generateOpenAPI` | 8 | ContextAfterPhase7 | GenerateOpenAPIOutput |
| `writeManifest` | 9 | ContextAfterPhase8 | WriteManifestOutput |
| `generateTsConfig` | 10 | ContextAfterPhase9 | GenerateTsConfigOutput |
| `writeStandalone` | 11 | ContextAfterPhase10 | WriteStandaloneProjectOutput |
| `writeTests` | 12 | ContextAfterPhase11 | GenerateTestSuiteOutput |
| `formatCode` | 13 | ContextAfterPhase12 | FormatCodeOutput |

## Type Safety

### Strongly-Typed Context

Hooks receive context with **guaranteed** fields based on phase dependencies:

```ts
// ✅ TypeScript allows (schema exists in ContextAfterPhase1)
afterPhase('parseSchema', async (context: ContextAfterPhase1) => {
  const models = context.schema.models  // ✅ TypeScript knows this exists
})

// ❌ TypeScript prevents (generatedFiles doesn't exist until Phase 4)
afterPhase('parseSchema', async (context: ContextAfterPhase1) => {
  const files = context.generatedFiles
  //                     ^^^^^^^^^^^^^^ Compile error!
})
```

### Type-Safe Replacements

Replacement hooks must return the exact output type:

```ts
// ✅ Correct return type
replacePhase<ContextAfterPhase0, SetupOutputDirOutput>(
  'setupOutputDir',
  async (context) => {
    return {
      success: true,
      data: { outputDir: '/custom/path' }
    }
  }
)

// ❌ Wrong return type - TypeScript error!
replacePhase<ContextAfterPhase0, SetupOutputDirOutput>(
  'setupOutputDir',
  async (context) => {
    return {
      success: true,
      data: { wrongField: 'oops' }
      //     ^^^^^^^^^^^^^^^^^^^ Compile error!
    }
  }
)
```

## Usage Examples

### Example 1: Logging Plugin

```ts
import { beforePhase, afterPhase } from '@ssot-codegen/gen/hooks'

export function registerLoggingHooks() {
  beforePhase('generateCode', async (ctx) => {
    console.log(`\n🏗️  Generating code...`)
  })
  
  afterPhase('generateCode', async (ctx, result) => {
    console.log(`✅ Generated ${result.filesGenerated} files`)
  })
}
```

### Example 2: Performance Monitoring

```ts
import { wrapPhase } from '@ssot-codegen/gen/hooks'

const startTimes = new Map()

wrapPhase('generateCode', {
  before: async () => {
    startTimes.set('generateCode', performance.now())
  },
  after: async (ctx, result) => {
    const duration = performance.now() - startTimes.get('generateCode')
    console.log(`Code generation took ${Math.round(duration)}ms`)
  }
})
```

### Example 3: Custom Validation

```ts
import { afterPhase } from '@ssot-codegen/gen/hooks'
import type { ContextAfterPhase1 } from '@ssot-codegen/gen/typed-context'

afterPhase('parseSchema', async (context: ContextAfterPhase1) => {
  const { schema, logger } = context
  
  // Custom validation rule
  for (const model of schema.models) {
    const emailField = model.fields.find(f => f.name === 'email')
    if (emailField && !emailField.isUnique) {
      logger.error(`Model ${model.name}: email field must be @unique`)
    }
  }
})
```

### Example 4: Audit Logging

```ts
import { beforePhase, afterPhase, onError } from '@ssot-codegen/gen/hooks'

const auditLog: AuditEntry[] = []

// Track all phases
const phases = ['parseSchema', 'generateCode', 'writeFiles']

for (const phase of phases) {
  beforePhase(phase, async () => {
    auditLog.push({ phase, type: 'start', timestamp: new Date() })
  })
  
  afterPhase(phase, async (ctx, result) => {
    auditLog.push({ 
      phase, 
      type: 'success', 
      files: result.filesGenerated,
      timestamp: new Date() 
    })
  })
}

// Track errors
onError(async (phase, error) => {
  auditLog.push({ phase, type: 'error', error: error.message, timestamp: new Date() })
})
```

### Example 5: Custom Code Generation

```ts
import { replacePhase } from '@ssot-codegen/gen/hooks'
import type { ContextAfterPhase3, GenerateCodeOutput } from '@ssot-codegen/gen/typed-context'

replacePhase<ContextAfterPhase3, GenerateCodeOutput>(
  'generateCode',
  async (context) => {
    // Completely custom code generation
    const customFiles = await generateMyCustomCode(context.schema)
    
    return {
      success: true,
      data: {
        pathsConfig: defaultPaths,
        generatedFiles: customFiles,
        totalFiles: customFiles.size,
        breakdown: []
      },
      filesGenerated: customFiles.size
    }
  }
)
```

## Advanced Patterns

### Multi-Phase Tracking

```ts
class GenerationTracker {
  private events: Array<{ phase: string, event: string, data: any }> = []
  
  track(phase: string, event: string, data: any = {}) {
    this.events.push({ phase, event, data, timestamp: new Date() })
  }
  
  getReport() {
    return {
      phases: this.events.length,
      timeline: this.events
    }
  }
}

const tracker = new GenerationTracker()

// Track all phases
const phases = ['parseSchema', 'generateCode', 'writeFiles']

for (const phase of phases) {
  wrapPhase(phase, {
    before: async (ctx) => tracker.track(phase, 'start'),
    after: async (ctx, result) => tracker.track(phase, 'complete', { files: result.filesGenerated })
  })
}
```

### Conditional Hooks

```ts
beforePhase('generateCode', async (context: ContextAfterPhase3) => {
  // Only run in production
  if (process.env.NODE_ENV === 'production') {
    await validateProductionRequirements(context.schema)
  }
})
```

### Chaining Hooks

Multiple hooks for the same phase run in registration order:

```ts
// Hook 1: Validate
beforePhase('generateCode', async (ctx) => {
  validateSchema(ctx.schema)
})

// Hook 2: Log
beforePhase('generateCode', async (ctx) => {
  console.log('Validation passed, generating...')
})

// Both hooks run in order
```

## Integration with PhaseRunner

### Manual Hook Registration

```ts
import { PhaseRunner } from '@ssot-codegen/gen'
import { PhaseHookRegistry, beforePhase, afterPhase } from '@ssot-codegen/gen/hooks'

// Create registry
const hooks = new PhaseHookRegistry()

// Register hooks
hooks.beforePhase('generateCode', async (ctx) => { /* ... */ })
hooks.afterPhase('writeFiles', async (ctx, result) => { /* ... */ })

// Pass to PhaseRunner
const runner = new PhaseRunner(config, logger, hooks)
runner.registerPhases(createAllTypedPhases())

await runner.run()
```

### Global Hook Registration

```ts
import { beforePhase, afterPhase } from '@ssot-codegen/gen/hooks'

// Register hooks globally (will be picked up by default PhaseRunner)
beforePhase('parseSchema', async (ctx) => { /* ... */ })
afterPhase('generateCode', async (ctx, result) => { /* ... */ })

// PhaseRunner uses global registry automatically
const runner = new PhaseRunner(config, logger)
// ...
```

## Best Practices

### 1. Use Specific Context Types

```ts
// ✅ Good: Specific type
afterPhase('parseSchema', async (context: ContextAfterPhase1) => {
  // TypeScript knows exactly what's available
  const models = context.schema.models
})

// ❌ Avoid: Untyped or BaseContext
afterPhase('parseSchema', async (context) => {
  // No type safety
})
```

### 2. Handle Errors in Hooks

```ts
beforePhase('generateCode', async (ctx) => {
  try {
    await validateCustomRules(ctx.schema)
  } catch (error) {
    ctx.logger.error('Custom validation failed:', error)
    throw error  // Fail the phase
  }
})
```

### 3. Don't Mutate Context Unnecessarily

```ts
// ✅ Good: Read-only access
afterPhase('parseSchema', async (context) => {
  const modelCount = context.modelNames.length
})

// ⚠️  Caution: Mutating context
afterPhase('parseSchema', async (context) => {
  // This affects subsequent phases - be intentional
  context.modelNames = context.modelNames.filter(m => m !== 'IgnoredModel')
})
```

### 4. Use wrapPhase for Related Logic

```ts
// ✅ Good: Related before/after logic together
wrapPhase('generateCode', {
  before: async (ctx) => {
    console.log('Starting code generation...')
  },
  after: async (ctx, result) => {
    console.log(`Completed! Generated ${result.filesGenerated} files`)
  }
})

// ❌ Avoid: Separate registration for related logic
beforePhase('generateCode', async (ctx) => { /* ... */ })
afterPhase('generateCode', async (ctx, result) => { /* ... */ })
```

## Common Use Cases

### 1. Custom Logging

```ts
import { registerLoggingHooks } from './examples/logging-plugin.js'

registerLoggingHooks()
// Adds comprehensive logging to all phases
```

### 2. Performance Monitoring

```ts
const metrics = new Map<string, number>()

wrapPhase('generateCode', {
  before: async () => metrics.set('start', performance.now()),
  after: async () => {
    const duration = performance.now() - metrics.get('start')!
    console.log(`Code generation: ${Math.round(duration)}ms`)
  }
})
```

### 3. Audit Trails

```ts
import { registerAuditHooks } from './examples/audit-plugin.js'

registerAuditHooks('./generation-audit.json')
// Creates detailed audit log of all phases
```

### 4. Custom Validation

```ts
import { registerValidationHooks } from './examples/validation-plugin.js'

registerValidationHooks()
// Adds custom validation rules after schema parsing
```

### 5. Third-Party Integrations

```ts
// Notify external service when generation completes
afterPhase('formatCode', async (context) => {
  await fetch('https://api.myservice.com/notify', {
    method: 'POST',
    body: JSON.stringify({
      project: context.config.projectName,
      models: context.modelNames,
      files: context.totalFiles
    })
  })
})
```

## Hook Execution Order

For a single phase:

```
1. beforePhase hooks (in registration order)
2. Phase execution (or replacement)
3. afterPhase hooks (in registration order)
4. onError hooks (if phase failed)
```

Example:

```ts
beforePhase('generateCode', async () => console.log('Before 1'))
beforePhase('generateCode', async () => console.log('Before 2'))
afterPhase('generateCode', async () => console.log('After 1'))
afterPhase('generateCode', async () => console.log('After 2'))

// Output:
// Before 1
// Before 2
// [Phase executes]
// After 1
// After 2
```

## Testing Hooks

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { PhaseHookRegistry } from './phase-hooks.js'

describe('Phase Hooks', () => {
  let registry: PhaseHookRegistry
  
  beforeEach(() => {
    registry = new PhaseHookRegistry()
  })
  
  it('executes before hooks', async () => {
    let called = false
    
    registry.beforePhase('parseSchema', async (ctx) => {
      called = true
    })
    
    await registry.executeBeforeHooks('parseSchema', mockContext)
    
    expect(called).toBe(true)
  })
})
```

## FAQ

### Q: Can I modify the context in hooks?

**Yes**, but be careful. Modifications affect subsequent phases:

```ts
afterPhase('parseSchema', async (context) => {
  // Filter out test models
  context.modelNames = context.modelNames.filter(m => !m.startsWith('Test'))
})
```

### Q: Can I have multiple hooks for the same phase?

**Yes!** Hooks execute in registration order:

```ts
beforePhase('generateCode', hook1)
beforePhase('generateCode', hook2)
beforePhase('generateCode', hook3)

// Execution: hook1 → hook2 → hook3 → phase
```

### Q: What happens if a hook throws an error?

The phase fails and error hooks execute:

```ts
beforePhase('generateCode', async () => {
  throw new Error('Validation failed')
})
// Phase will not execute, onError hooks will run
```

### Q: Can I replace core phases?

**Yes**, but use carefully. You're responsible for providing correct output:

```ts
replacePhase('generateCode', async (context) => {
  // Must return GenerateCodeOutput with exact shape
  return {
    success: true,
    data: {
      pathsConfig: /* ... */,
      generatedFiles: /* ... */,
      totalFiles: 42,
      breakdown: []
    }
  }
})
```

### Q: How do I access typed context in hooks?

Import the context type you need:

```ts
import type { ContextAfterPhase1, ContextAfterPhase4 } from '@ssot-codegen/gen/typed-context'

afterPhase('parseSchema', async (context: ContextAfterPhase1) => {
  // Full type safety!
})
```

## See Also

- [Typed Context System](../TYPED_CONTEXT_MIGRATION.md)
- [Plugin Authoring Guide](../../docs/PLUGIN_AUTHORING_GUIDE.md)
- [Phase Architecture](../TYPED_PHASES_COMPLETE.md)
- [Examples](./examples/)


# Code Generator Refactoring Plan

## Current Issues

### 1. Massive Function Length (700+ lines)
**Problem**: `generateCode()` violates Single Responsibility Principle
- Validation
- Analysis
- Generation (DTOs, services, controllers, routes, SDK, hooks)
- Plugin management
- Error handling
- Checklist generation

### 2. Deep Nesting (7+ levels)
**Problem**: Registry mode section is deeply nested, hard to follow
```typescript
if (config.useRegistry) {
  try {
    for (const model of schema.models) {
      try {
        if (serviceAnnotation) {
          if (isPathAvailable(...)) {
            if (validateGeneratedCode(...)) {
              // Finally do work
            }
          }
        }
      } catch {}
    }
  } catch {}
}
```

### 3. Mixed Error Handling Strategies
**Problem**: Inconsistent error handling
- Some phases throw errors
- Some add to errors array
- Some log and continue
- Makes failure modes unpredictable

### 4. State Management Sprawl
**Problem**: `GeneratedFiles` mutated throughout
- Maps within Maps
- Hard to track what's been generated
- No clear ownership

### 5. Config Object Overload
**Problem**: 15+ options with complex interactions
- `failFast` vs `continueOnError` vs `strictPluginValidation`
- Hard to understand precedence
- No validation of conflicting options

---

## Refactoring Strategy

### Phase 1: Extract Phases into Classes

```typescript
// New architecture: Phase-based generation pipeline

interface GenerationPhase {
  name: string
  execute(context: GenerationContext): Promise<PhaseResult>
}

class AnalysisPhase implements GenerationPhase {
  name = 'analysis'
  
  async execute(context: GenerationContext): Promise<PhaseResult> {
    // All analysis logic here
    // Returns structured result
  }
}

class DTOGenerationPhase implements GenerationPhase {
  name = 'dto-generation'
  
  async execute(context: GenerationContext): Promise<PhaseResult> {
    // All DTO generation logic
  }
}

class SDKGenerationPhase implements GenerationPhase {
  name = 'sdk-generation'
  
  async execute(context: GenerationContext): Promise<PhaseResult> {
    // All SDK generation logic
  }
}
```

### Phase 2: Unified Error Handling

```typescript
// Result pattern for consistent error handling

type Result<T, E = GenerationError> = 
  | { success: true; value: T }
  | { success: false; error: E }

class GenerationContext {
  private errors: GenerationError[] = []
  private results: Map<string, any> = new Map()
  
  addError(error: GenerationError): void {
    this.errors.push(error)
    
    // Consistent error handling based on severity
    if (error.severity === ErrorSeverity.FATAL || error.blocksGeneration) {
      throw new GenerationFailedError(error)
    }
    
    if (error.severity === ErrorSeverity.ERROR) {
      if (this.config.failFast) {
        throw new GenerationFailedError(error)
      }
      if (!this.config.continueOnError) {
        throw new GenerationFailedError(error)
      }
    }
  }
  
  addResult(phase: string, data: any): void {
    this.results.set(phase, data)
  }
  
  getErrors(): GenerationError[] {
    return this.errors
  }
}
```

### Phase 3: Immutable File Builder

```typescript
// Builder pattern for file generation

class FileBuilder {
  private files: Map<string, string> = new Map()
  private readonly generatedPaths = new Set<string>()
  
  addFile(path: string, content: string, context: GenerationContext): boolean {
    if (!this.isPathAvailable(path)) {
      context.addError({
        severity: ErrorSeverity.WARNING,
        message: `Duplicate path: ${path}`,
        phase: 'file-builder'
      })
      return false
    }
    
    if (!validateGeneratedCode(content, path, context)) {
      return false
    }
    
    this.files.set(path, content)
    this.generatedPaths.add(path)
    return true
  }
  
  build(): Map<string, string> {
    // Returns immutable copy
    return new Map(this.files)
  }
}

class GeneratedFilesBuilder {
  private contracts = new FileBuilder()
  private validators = new FileBuilder()
  private services = new FileBuilder()
  private controllers = new FileBuilder()
  private routes = new FileBuilder()
  private sdk = new FileBuilder()
  
  build(): GeneratedFiles {
    return {
      contracts: this.buildContractsMap(),
      validators: this.buildValidatorsMap(),
      services: this.services.build(),
      controllers: this.controllers.build(),
      routes: this.routes.build(),
      sdk: this.sdk.build(),
      // ...
    }
  }
}
```

### Phase 4: Config Normalization

```typescript
// Normalize and validate config upfront

interface NormalizedConfig {
  readonly framework: 'express' | 'fastify'
  readonly useEnhanced: boolean
  readonly useRegistry: boolean
  readonly errorHandling: {
    readonly failFast: boolean
    readonly continueOnError: boolean
    readonly strictPluginValidation: boolean
  }
  readonly generation: {
    readonly checklist: boolean
    readonly autoOpen: boolean
    readonly hookFrameworks: HookFramework[]
  }
  readonly metadata: {
    readonly projectName: string
    readonly schemaHash: string
    readonly toolVersion: string
  }
}

function normalizeConfig(config: CodeGeneratorConfig): NormalizedConfig {
  // Validate conflicting options
  if (config.failFast && config.continueOnError) {
    throw new Error('failFast and continueOnError cannot both be true')
  }
  
  return {
    framework: config.framework || 'express',
    useEnhanced: config.useEnhancedGenerators ?? true,
    useRegistry: config.useRegistry ?? false,
    errorHandling: {
      failFast: config.failFast ?? false,
      continueOnError: config.continueOnError ?? true,
      strictPluginValidation: config.strictPluginValidation ?? false
    },
    generation: {
      checklist: config.generateChecklist ?? true,
      autoOpen: config.autoOpenChecklist ?? false,
      hookFrameworks: validateHookFrameworks(config.hookFrameworks)
    },
    metadata: {
      projectName: config.projectName || 'Generated Project',
      schemaHash: config.schemaHash || 'development',
      toolVersion: config.toolVersion || '0.0.0-dev'
    }
  }
}
```

### Phase 5: Pipeline Orchestration

```typescript
// Clean pipeline orchestration

class CodeGenerationPipeline {
  private phases: GenerationPhase[] = []
  
  constructor(private config: NormalizedConfig) {
    this.initializePhases()
  }
  
  private initializePhases(): void {
    this.phases = [
      new ValidationPhase(),
      new AnalysisPhase(),
      new NamingConflictPhase(),
      
      // Conditional phases based on config
      ...(this.config.useRegistry 
        ? [new RegistryGenerationPhase()] 
        : [
            new DTOGenerationPhase(),
            new ValidatorGenerationPhase(),
            new ServiceGenerationPhase(),
            new ControllerGenerationPhase(),
            new RouteGenerationPhase()
          ]
      ),
      
      new SDKGenerationPhase(),
      new HooksGenerationPhase(),
      
      ...(this.config.generation.checklist 
        ? [new ChecklistGenerationPhase()] 
        : []
      )
    ]
  }
  
  async execute(schema: ParsedSchema): Promise<GeneratedFiles> {
    const context = new GenerationContext(this.config, schema)
    
    // Execute phases sequentially
    for (const phase of this.phases) {
      try {
        console.log(`[ssot-codegen] Running phase: ${phase.name}`)
        const result = await phase.execute(context)
        
        if (!result.success) {
          context.addError(result.error)
        }
      } catch (error) {
        context.addError({
          severity: ErrorSeverity.FATAL,
          message: `Phase ${phase.name} failed`,
          phase: phase.name,
          error: error as Error
        })
        throw error
      }
    }
    
    // Build final result
    return context.getFilesBuilder().build()
  }
}

// Main entry point becomes simple
export function generateCode(
  schema: ParsedSchema,
  config: CodeGeneratorConfig
): GeneratedFiles {
  const normalizedConfig = normalizeConfig(config)
  const pipeline = new CodeGenerationPipeline(normalizedConfig)
  
  try {
    return pipeline.execute(schema)
  } catch (error) {
    // Centralized error logging
    console.error('[ssot-codegen] Generation failed:', error)
    throw error
  }
}
```

---

## Refactoring Benefits

### Before
- ❌ 700+ line function
- ❌ 7+ levels of nesting
- ❌ Mixed error handling
- ❌ Mutable state sprawl
- ❌ Config option chaos

### After
- ✅ Single responsibility per phase (~50-100 lines each)
- ✅ Max 2-3 levels of nesting
- ✅ Consistent Result-based error handling
- ✅ Immutable builders with clear ownership
- ✅ Normalized, validated config
- ✅ Easy to add/remove phases
- ✅ Testable in isolation
- ✅ Clear execution flow

---

## Migration Strategy

### Step 1: Extract Phases (No Breaking Changes)
```typescript
// Keep existing function, delegate to phases
export function generateCode(
  schema: ParsedSchema,
  config: CodeGeneratorConfig
): GeneratedFiles {
  const normalizedConfig = normalizeConfig(config)
  
  // Use new pipeline internally
  const pipeline = new CodeGenerationPipeline(normalizedConfig)
  return pipeline.execute(schema)
}
```

### Step 2: Deprecate Old Function
```typescript
/**
 * @deprecated Use CodeGenerationPipeline directly
 */
export function generateCode(...) { ... }
```

### Step 3: Remove After Migration Period

---

## File Structure

```
packages/gen/src/
├── code-generator.ts              # Main entry point (simplified)
├── pipeline/
│   ├── types.ts                   # Interfaces, types
│   ├── context.ts                 # GenerationContext
│   ├── pipeline.ts                # CodeGenerationPipeline
│   ├── config-normalizer.ts      # Config validation
│   └── phases/
│       ├── validation-phase.ts
│       ├── analysis-phase.ts
│       ├── dto-generation-phase.ts
│       ├── service-generation-phase.ts
│       ├── sdk-generation-phase.ts
│       └── checklist-phase.ts
├── builders/
│   ├── file-builder.ts
│   └── generated-files-builder.ts
└── ...existing files...
```

---

## Testing Strategy

### Before (Hard to Test)
```typescript
// Need to test entire 700-line function
// Can't test individual phases
// Hard to mock dependencies
```

### After (Easy to Test)
```typescript
describe('AnalysisPhase', () => {
  it('should analyze all models', async () => {
    const phase = new AnalysisPhase()
    const context = createMockContext()
    
    const result = await phase.execute(context)
    
    expect(result.success).toBe(true)
    expect(context.getCacheSize()).toBe(3)
  })
  
  it('should handle analysis errors gracefully', async () => {
    // Test error handling in isolation
  })
})
```

---

## Next Steps

1. ✅ Review this plan with team
2. Create `GenerationContext` class
3. Create `FileBuilder` classes
4. Extract `ValidationPhase` (smallest, easiest first)
5. Extract `AnalysisPhase`
6. Extract generation phases one by one
7. Create `CodeGenerationPipeline`
8. Update main `generateCode()` to use pipeline
9. Write tests for each phase
10. Deprecate old patterns


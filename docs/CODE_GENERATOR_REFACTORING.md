# Code Generator Refactoring Plan

## Current Issues - Comprehensive Analysis

### Design Issues

#### 1. Massive Function Length (700+ lines)
**Problem**: `generateCode()` violates Single Responsibility Principle
- Validation
- Analysis
- Generation (DTOs, services, controllers, routes, SDK, hooks)
- Plugin management
- Error handling
- Checklist generation

#### 2. Deep Nesting (7+ levels)
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

#### 3. Mixed Error Handling Strategies
**Problem**: Inconsistent error handling
- Some phases throw errors
- Some add to errors array
- Some log and continue
- Makes failure modes unpredictable

#### 4. State Management Sprawl
**Problem**: `GeneratedFiles` mutated throughout
- Maps within Maps
- Hard to track what's been generated
- No clear ownership

#### 5. Config Object Overload
**Problem**: 15+ options with complex interactions
- `failFast` vs `continueOnError` vs `strictPluginValidation`
- Hard to understand precedence
- No validation of conflicting options

### Maintainability Issues

#### 6. Comment Density (100+ lines)
**Problem**: Over 100 lines of comments explaining phases, caveats, TODOs
```typescript
// PHASE 1: Pre-analyze all models ONCE (O(n) instead of O(n×5))
// CRITICAL FIX: Analyze ALL models first, THEN filter for generation
// This ensures cache consistency and proper junction table detection
```
**Why This Is Bad**: Comments explain *what* code does, meaning code isn't self-documenting

#### 7. Placeholder Replacement Contract
**Problem**: Critical cross-phase dependency undocumented
```typescript
// line 1028: "CRITICAL: Use real values if available, otherwise fail generation"
// Depends on "manifest phase" that's not part of this module
```
**Why This Is Bad**: Fragile contract between phases, no validation that replacement happens

#### 8. Duplicate Code
**Problem**: `generateModelCode()` and registry mode model loop have similar logic
```typescript
// Registry mode (line 475):
const dtos = generateAllDTOs(model)
const dtoMap = new Map<string, string>()
// ... 20 lines of DTO/validator setup

// generateModelCode() (line 950):
const dtos = generateAllDTOs(model)
const dtoMap = new Map<string, string>()
// ... 20 lines of DTO/validator setup
```

#### 9. Magic Phases
**Problem**: Six numbered phases (0-6) with no state machine
```typescript
// PHASE 0: Pre-validation
// PHASE 1: Pre-analyze
// PHASE 1.5: Validate analysis
// PHASE 1.6: Detect conflicts
// PHASE 2: Generate code
// ...
```
**Why This Is Bad**: Just sequential if-blocks, no phase coordinator, hard to add/reorder phases

#### 10. Error Array Side Effects
**Problem**: `errors` array mutated throughout call chain
```typescript
function validateServiceAnnotation(..., errors: GenerationError[])
function isPathAvailable(..., errors: GenerationError[])
function generateSDKClients(..., errors: GenerationError[])
```
**Why This Is Bad**: Hard to track where errors originate, no call stack

### Type Safety Issues

#### 11. Optional Chain Overuse
**Problem**: Non-null assertions bypass type safety
```typescript
// line 807
files.plugins!.set(pluginName, output.files)
// plugins is optional in GeneratedFiles type
```
**Why This Is Bad**: Runtime error if plugins is undefined

#### 12. Unsafe Map Access
**Problem**: `Map.get()` returns `T | undefined` but used without checks
```typescript
// line 905
const analysis = cache.modelAnalysis.get(model.name)
// Used as: analysis.isJunctionTable (no null check)
```
**Why This Is Bad**: Runtime error if model wasn't analyzed

#### 13. Type Widening
**Problem**: `errors: GenerationError[]` accepts any severity but logic assumes specific ones
```typescript
const hasCriticalErrors = errors.some(e => 
  e.severity === ErrorSeverity.ERROR || 
  e.severity === ErrorSeverity.FATAL
)
// No validation that these severities actually exist
```

### Performance Issues

#### 14. Redundant Analysis
**Problem**: Models analyzed then filtered for junction tables
```typescript
// Phase 1: Analyze ALL models (expensive)
for (const model of schema.models) {
  cache.modelAnalysis.set(model.name, analyzeModelUnified(model, schema))
}

// Phase 1.5: Filter out junction tables
const modelsToGenerate = schema.models.filter(m => 
  !cache.modelAnalysis.get(m.name)?.isJunctionTable
)
```
**Why This Is Bad**: Junction detection could happen *before* expensive analysis

#### 15. Repeated Map Lookups
**Problem**: Same map lookup multiple times per model
```typescript
// Line 422, 467, 905 - same lookup
const serviceAnnotation = cache.serviceAnnotations.get(model.name)
```
**Performance Impact**: O(n) string comparison per lookup

#### 16. Blocking SDK Generation
**Problem**: SDK generated serially after all models
```typescript
// Phase 3: Generate SDK clients (after all models are processed)
for (const model of schema.models) {
  const modelClient = generateModelSDK(model, schema)
  // ... wait for completion
}
```
**Why This Is Bad**: Could parallelize or stream results

### Error Handling Issues

#### 17. Silent Plugin Failures
**Problem**: Plugin validation errors become warnings
```typescript
// line 799
if (pluginErrors) {
  if (config.strictPluginValidation) {
    throw new Error(message)
  }
  console.warn(`\n${message}`)  // Silently continue!
}
```
**Why This Is Bad**: Broken auth/features deployed to production

#### 18. Incomplete Rollback
**Problem**: `failFast=true` throws but leaves files partially populated
```typescript
if (failFast || !continueOnError) {
  throw error  // files object already partially populated
}
```
**Why This Is Bad**: Invalid state exposed to caller

#### 19. Error Context Loss
**Problem**: Original error stored but stack traces not logged
```typescript
catch (error) {
  const genError: GenerationError = {
    // ... stores error
    error: error as Error
  }
  console.error(`[ssot-codegen] ${genError.message}:`, error)
  // Doesn't log error.stack
}
```

#### 20. Validation After Generation
**Problem**: Code validation happens after expensive generation
```typescript
// line 492
const dtos = generateAllDTOs(model)  // Generate first
if (validateGeneratedCode(dtos.create, ...)) {  // Validate second
  // Wasted work if validation fails
}
```

### Documentation Issues

#### 21. Misleading Comments
**Problem**: "OPTIMIZED: Pre-analyze all models once" but does per-model work in multiple phases
```typescript
// line 245: "OPTIMIZED: Pre-analyze all models once"
// Reality: Still loops through models in Phases 2, 3, 4, 5, 6
```

#### 22. Incomplete Error Recovery Docs
**Problem**: No docs on what happens to partial files on error
```typescript
// When error occurs:
// - Are files rolled back?
// - Are partial results returned?
// - What state is the files object in?
// NO DOCUMENTATION
```

#### 23. Cache Lifecycle Unclear
**Problem**: "Safe for watch mode" but doesn't explain how
```typescript
// line 321: "Safe for watch mode / multiple invocations"
// Reality: Cache created fresh each call, but how does watch mode work?
```

---

## Refactoring Strategy - Comprehensive Solutions

### Strategy 1: Extract Phases into Classes (Issues 1, 2, 9)

**Solves**: Massive function, deep nesting, magic phases

```typescript
// New architecture: Phase-based generation pipeline with state machine

enum PhaseStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped'
}

interface PhaseResult {
  success: boolean
  status: PhaseStatus
  errors: GenerationError[]
  data?: unknown
}

interface GenerationPhase {
  readonly name: string
  readonly order: number
  
  // Determine if phase should run
  shouldExecute(context: GenerationContext): boolean
  
  // Execute phase logic
  execute(context: GenerationContext): Promise<PhaseResult>
  
  // Rollback if needed
  rollback?(context: GenerationContext): Promise<void>
}

// Each phase is self-contained (50-100 lines)
class AnalysisPhase implements GenerationPhase {
  name = 'analysis'
  order = 1
  
  shouldExecute(context: GenerationContext): boolean {
    return context.config.useEnhanced
  }
  
  async execute(context: GenerationContext): Promise<PhaseResult> {
    const errors: GenerationError[] = []
    
    for (const model of context.schema.models) {
      try {
        const analysis = analyzeModelUnified(model, context.schema)
        context.cache.setAnalysis(model.name, analysis)
      } catch (error) {
        errors.push(context.createError({
          severity: ErrorSeverity.ERROR,
          message: `Failed to analyze ${model.name}`,
          model: model.name,
          error: error as Error
        }))
      }
    }
    
    return {
      success: errors.length === 0,
      status: errors.length === 0 ? PhaseStatus.COMPLETED : PhaseStatus.FAILED,
      errors
    }
  }
}

class DTOGenerationPhase implements GenerationPhase {
  name = 'dto-generation'
  order = 3
  
  shouldExecute(context: GenerationContext): boolean {
    return !context.config.useRegistry  // Skip in registry mode
  }
  
  async execute(context: GenerationContext): Promise<PhaseResult> {
    // Clean, focused DTO generation logic
    // No nesting, clear flow
  }
  
  async rollback(context: GenerationContext): Promise<void> {
    // Clear DTOs from builder
    context.filesBuilder.clearDTOs()
  }
}
```

### Strategy 2: Unified Error Handling (Issues 3, 10, 18, 19)

**Solves**: Mixed error strategies, side effects, incomplete rollback, context loss

```typescript
// Error handling with proper context and stack traces

class ErrorCollector {
  private readonly errors: GenerationError[] = []
  
  addError(error: GenerationError): void {
    // Always log with full context including stack trace
    const logLevel = this.getLogLevel(error.severity)
    console[logLevel](`[ssot-codegen] ${error.message}`, {
      severity: error.severity,
      model: error.model,
      phase: error.phase,
      stack: error.error?.stack  // Preserve stack traces
    })
    
    this.errors.push(error)
  }
  
  hasBlockingErrors(): boolean {
    return this.errors.some(e => 
      e.severity === ErrorSeverity.VALIDATION || 
      e.severity === ErrorSeverity.FATAL ||
      e.blocksGeneration === true
    )
  }
  
  getErrors(): readonly GenerationError[] {
    return Object.freeze([...this.errors])  // Immutable copy
  }
}

class GenerationContext {
  private readonly errorCollector = new ErrorCollector()
  private readonly filesBuilder: GeneratedFilesBuilder
  private readonly cache: AnalysisCache
  private readonly snapshots: Map<string, GeneratedFiles> = new Map()
  
  constructor(
    readonly config: NormalizedConfig,
    readonly schema: ParsedSchema
  ) {
    this.filesBuilder = new GeneratedFilesBuilder()
    this.cache = new AnalysisCache()
  }
  
  // Error handling
  addError(error: GenerationError): void {
    this.errorCollector.addError(error)
    
    // Centralized error escalation logic
    if (this.shouldThrow(error)) {
      throw new GenerationFailedError(error)
    }
  }
  
  private shouldThrow(error: GenerationError): boolean {
    // VALIDATION errors always throw
    if (error.severity === ErrorSeverity.VALIDATION || error.blocksGeneration) {
      return true
    }
    
    // FATAL errors always throw
    if (error.severity === ErrorSeverity.FATAL) {
      return true
    }
    
    // ERROR severity respects config
    if (error.severity === ErrorSeverity.ERROR) {
      return this.config.errorHandling.failFast || 
             !this.config.errorHandling.continueOnError
    }
    
    // WARNING never throws
    return false
  }
  
  // Snapshot/rollback support (fixes issue 18)
  createSnapshot(phaseName: string): void {
    this.snapshots.set(phaseName, this.filesBuilder.build())
  }
  
  rollbackToSnapshot(phaseName: string): void {
    const snapshot = this.snapshots.get(phaseName)
    if (snapshot) {
      this.filesBuilder.restore(snapshot)
    }
  }
  
  // Immutable access
  getErrors(): readonly GenerationError[] {
    return this.errorCollector.getErrors()
  }
}
```

### Strategy 3: Immutable File Builder (Issues 4, 11, 20)

**Solves**: State sprawl, type safety, validation after generation

```typescript
// Builder with upfront validation and type safety

class FileBuilder {
  private readonly files = new Map<string, string>()
  private readonly generatedPaths = new Set<string>()
  
  constructor(private readonly context: GenerationContext) {}
  
  addFile(path: string, content: string, modelName?: string): boolean {
    // VALIDATE BEFORE GENERATION (fixes issue 20)
    if (!validateGeneratedCode(content, path, this.context)) {
      return false
    }
    
    // Check path availability
    if (!this.isPathAvailable(path, modelName)) {
      return false
    }
    
    this.files.set(path, content)
    this.generatedPaths.add(path)
    return true
  }
  
  private isPathAvailable(path: string, modelName?: string): boolean {
    if (this.generatedPaths.has(path)) {
      this.context.addError({
        severity: ErrorSeverity.WARNING,
        message: `Duplicate path: ${path}`,
        model: modelName,
        phase: 'file-builder'
      })
      return false
    }
    return true
  }
  
  build(): ReadonlyMap<string, string> {
    return new Map(this.files)  // Immutable copy
  }
  
  clear(): void {
    this.files.clear()
    this.generatedPaths.clear()
  }
}

class GeneratedFilesBuilder {
  private readonly contracts = new FileBuilder(this.context)
  private readonly validators = new FileBuilder(this.context)
  private readonly services = new FileBuilder(this.context)
  private readonly controllers = new FileBuilder(this.context)
  private readonly routes = new FileBuilder(this.context)
  private readonly sdk = new FileBuilder(this.context)
  private readonly plugins = new Map<string, FileBuilder>()
  
  constructor(private readonly context: GenerationContext) {}
  
  // Type-safe accessors (fixes issue 11)
  getPluginBuilder(pluginName: string): FileBuilder {
    if (!this.plugins.has(pluginName)) {
      this.plugins.set(pluginName, new FileBuilder(this.context))
    }
    return this.plugins.get(pluginName)!  // Safe: just created above
  }
  
  build(): GeneratedFiles {
    return {
      contracts: this.buildContractsMap(),
      validators: this.buildValidatorsMap(),
      services: this.services.build(),
      controllers: this.controllers.build(),
      routes: this.routes.build(),
      sdk: this.sdk.build(),
      plugins: this.buildPluginsMap(),
      hooks: this.buildHooksMap()
    }
  }
  
  restore(snapshot: GeneratedFiles): void {
    // Rollback support (fixes issue 18)
    this.contracts.clear()
    this.validators.clear()
    // ... restore from snapshot
  }
}
```

### Strategy 4: Config Normalization (Issues 5, 21, 22)

**Solves**: Config overload, conflicting options, incomplete docs

```typescript
// Normalized, validated config with clear documentation

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

class ConfigNormalizer {
  normalize(config: CodeGeneratorConfig): NormalizedConfig {
    this.validateConflicts(config)
    this.validateRequiredFields(config)
    
    return {
      framework: config.framework || 'express',
      useEnhanced: config.useEnhancedGenerators ?? true,
      useRegistry: config.useRegistry ?? false,
      errorHandling: this.normalizeErrorHandling(config),
      generation: this.normalizeGeneration(config),
      metadata: this.normalizeMetadata(config)
    }
  }
  
  private validateConflicts(config: CodeGeneratorConfig): void {
    // Detect conflicting options (fixes issue 5)
    if (config.failFast && config.continueOnError) {
      throw new Error('Cannot set both failFast=true and continueOnError=true')
    }
    
    if (config.useRegistry && config.strictPluginValidation) {
      console.warn('[ssot-codegen] strictPluginValidation has limited effect in registry mode')
    }
  }
  
  private validateRequiredFields(config: CodeGeneratorConfig): void {
    // Warn about missing critical fields
    if (!config.schemaHash && process.env.NODE_ENV === 'production') {
      throw new Error('schemaHash required for production builds')
    }
    
    if (!config.toolVersion) {
      console.warn('[ssot-codegen] toolVersion not set, using default')
    }
  }
  
  private normalizeErrorHandling(config: CodeGeneratorConfig) {
    return {
      failFast: config.failFast ?? false,
      continueOnError: config.continueOnError ?? true,
      strictPluginValidation: config.strictPluginValidation ?? false
    }
  }
  
  private normalizeGeneration(config: CodeGeneratorConfig) {
    return {
      checklist: config.generateChecklist ?? true,
      autoOpen: config.autoOpenChecklist ?? false,
      hookFrameworks: validateHookFrameworks(config.hookFrameworks)
    }
  }
  
  private normalizeMetadata(config: CodeGeneratorConfig) {
    return {
      projectName: config.projectName || 'Generated Project',
      schemaHash: config.schemaHash || 'development',
      toolVersion: config.toolVersion || '0.0.0-dev'
    }
  }
}
```

### Strategy 5: Type-Safe Cache (Issues 12, 13)

**Solves**: Unsafe map access, type widening

```typescript
// Type-safe cache with guaranteed lookups

class AnalysisCache {
  private readonly modelAnalysis = new Map<string, UnifiedModelAnalysis>()
  private readonly serviceAnnotations = new Map<string, ServiceAnnotation>()
  
  // Type-safe setters
  setAnalysis(modelName: string, analysis: UnifiedModelAnalysis): void {
    this.modelAnalysis.set(modelName, analysis)
  }
  
  setServiceAnnotation(modelName: string, annotation: ServiceAnnotation): void {
    this.serviceAnnotations.set(modelName, annotation)
  }
  
  // Type-safe getters with validation (fixes issue 12)
  getAnalysis(modelName: string): UnifiedModelAnalysis {
    const analysis = this.modelAnalysis.get(modelName)
    if (!analysis) {
      throw new Error(`No analysis found for model: ${modelName}. Call setAnalysis() first.`)
    }
    return analysis
  }
  
  // Safe getter that returns undefined (for optional checks)
  tryGetAnalysis(modelName: string): UnifiedModelAnalysis | undefined {
    return this.modelAnalysis.get(modelName)
  }
  
  getServiceAnnotation(modelName: string): ServiceAnnotation {
    const annotation = this.serviceAnnotations.get(modelName)
    if (!annotation) {
      throw new Error(`No service annotation for model: ${modelName}`)
    }
    return annotation
  }
  
  hasServiceAnnotation(modelName: string): boolean {
    return this.serviceAnnotations.has(modelName)
  }
  
  // Iteration support with type safety
  getAllAnalyzedModels(): ReadonlyArray<[string, UnifiedModelAnalysis]> {
    return Array.from(this.modelAnalysis.entries())
  }
  
  getAllServiceAnnotations(): ReadonlyArray<[string, ServiceAnnotation]> {
    return Array.from(this.serviceAnnotations.entries())
  }
  
  // Statistics
  getAnalysisCount(): number {
    return this.modelAnalysis.size
  }
  
  getExpectedCount(schema: ParsedSchema): number {
    // Non-junction models only
    return schema.models.filter(m => {
      const analysis = this.tryGetAnalysis(m.name)
      return !analysis?.isJunctionTable
    }).length
  }
}
```

### Strategy 6: Eliminate Duplicate Code (Issue 8)

**Solves**: DTO/validator generation duplication

```typescript
// Shared DTO/validator generation helper

class DTOValidatorGenerator {
  constructor(private readonly context: GenerationContext) {}
  
  generateForModel(model: ParsedModel): void {
    const modelKebab = toKebabCase(model.name)
    const builder = this.context.filesBuilder
    
    // Generate DTOs
    const dtos = generateAllDTOs(model)
    builder.contracts.addFile(`${modelKebab}.create.dto.ts`, dtos.create, model.name)
    builder.contracts.addFile(`${modelKebab}.update.dto.ts`, dtos.update, model.name)
    builder.contracts.addFile(`${modelKebab}.read.dto.ts`, dtos.read, model.name)
    builder.contracts.addFile(`${modelKebab}.query.dto.ts`, dtos.query, model.name)
    
    // Generate validators
    const validators = generateAllValidators(model)
    builder.validators.addFile(`${modelKebab}.create.zod.ts`, validators.create, model.name)
    builder.validators.addFile(`${modelKebab}.update.zod.ts`, validators.update, model.name)
    builder.validators.addFile(`${modelKebab}.query.zod.ts`, validators.query, model.name)
  }
}

// Used in both registry and legacy modes:
const dtoGenerator = new DTOValidatorGenerator(context)
for (const model of modelsToGenerate) {
  dtoGenerator.generateForModel(model)
}
```

### Strategy 7: Performance Optimizations (Issues 14, 15, 16)

**Solves**: Redundant analysis, repeated lookups, blocking generation

```typescript
// Lazy analysis with caching

class OptimizedAnalysisPhase implements GenerationPhase {
  name = 'analysis'
  order = 1
  
  async execute(context: GenerationContext): Promise<PhaseResult> {
    const errors: GenerationError[] = []
    
    // Quick junction detection BEFORE expensive analysis (fixes issue 14)
    const modelsToAnalyze = context.schema.models.filter(m => 
      !this.isLikelyJunction(m)
    )
    
    // Analyze only non-junction models
    for (const model of modelsToAnalyze) {
      try {
        const analysis = analyzeModelUnified(model, context.schema)
        context.cache.setAnalysis(model.name, analysis)
      } catch (error) {
        errors.push(/* ... */)
      }
    }
    
    return { success: errors.length === 0, errors, status: /* ... */ }
  }
  
  private isLikelyJunction(model: ParsedModel): boolean {
    // Lightweight heuristic (no expensive analysis)
    const relationCount = model.fields.filter(f => f.relationName).length
    const scalarCount = model.fields.filter(f => f.kind === 'scalar').length
    return relationCount >= 2 && scalarCount <= 2 && model.fields.length <= 4
  }
}

// Cached lookups (fixes issue 15)
class ModelProcessor {
  private readonly lookupCache = new Map<string, {
    analysis: UnifiedModelAnalysis | undefined
    serviceAnnotation: ServiceAnnotation | undefined
  }>()
  
  process(model: ParsedModel, context: GenerationContext): void {
    // Single lookup per model
    const cached = this.getCachedData(model.name, context)
    
    // Use cached data throughout processing
    if (cached.analysis?.isJunctionTable) {
      this.generateJunctionFiles(model, context)
      return
    }
    
    if (cached.serviceAnnotation) {
      this.generateServiceIntegration(model, cached.serviceAnnotation, context)
      return
    }
    
    this.generateStandardCRUD(model, cached.analysis, context)
  }
  
  private getCachedData(modelName: string, context: GenerationContext) {
    if (!this.lookupCache.has(modelName)) {
      this.lookupCache.set(modelName, {
        analysis: context.cache.tryGetAnalysis(modelName),
        serviceAnnotation: context.cache.tryGetServiceAnnotation(modelName)
      })
    }
    return this.lookupCache.get(modelName)!
  }
}

// Parallel SDK generation (fixes issue 16)
class ParallelSDKPhase implements GenerationPhase {
  name = 'sdk-generation'
  order = 5
  
  async execute(context: GenerationContext): Promise<PhaseResult> {
    const modelPromises = context.schema.models
      .filter(m => !context.cache.tryGetAnalysis(m.name)?.isJunctionTable)
      .map(model => this.generateModelSDK(model, context))
    
    // Parallel generation
    const results = await Promise.allSettled(modelPromises)
    
    const errors = results
      .filter(r => r.status === 'rejected')
      .map(r => /* create error from rejection */)
    
    return { success: errors.length === 0, errors, status: /* ... */ }
  }
  
  private async generateModelSDK(model: ParsedModel, context: GenerationContext) {
    const client = generateModelSDK(model, context.schema)
    const path = `models/${model.name.toLowerCase()}.client.ts`
    context.filesBuilder.sdk.addFile(path, client, model.name)
  }
}
```

### Strategy 8: Self-Documenting Code (Issues 6, 21, 22, 23)

**Solves**: Comment density, misleading comments, incomplete docs

```typescript
// Code that explains itself through clear naming and structure

// BEFORE (needs comments):
// PHASE 1: Pre-analyze all models ONCE (O(n) instead of O(n×5))
for (const model of schema.models) {
  if (config.useEnhancedGenerators ?? true) {
    cache.modelAnalysis.set(model.name, analyzeModelUnified(model, schema))
  }
}

// AFTER (self-explanatory):
class AnalysisPhase implements GenerationPhase {
  name = 'model-analysis'
  
  execute(context: GenerationContext): PhaseResult {
    return this.analyzeAllModels(context)
  }
  
  private analyzeAllModels(context: GenerationContext): PhaseResult {
    const models = this.filterJunctionTables(context.schema.models)
    const results = models.map(m => this.analyzeModel(m, context))
    return this.aggregateResults(results)
  }
}

// Documentation through types, not comments
interface GenerationContract {
  /**
   * State after successful generation:
   * - All files validated
   * - No blocking errors
   * - Cache populated for all non-junction models
   * 
   * State after failed generation:
   * - Partial files discarded (rolled back)
   * - Errors logged with full context
   * - GenerationFailedError thrown
   */
  guarantees: {
    onSuccess: 'all-files-valid' | 'cache-complete'
    onFailure: 'rollback-complete' | 'errors-logged'
  }
}
```

### Strategy 9: Pipeline Orchestration (Issues 7, 17)

**Solves**: Placeholder contracts, silent plugin failures

```typescript
// Clean pipeline with explicit contracts

class CodeGenerationPipeline {
  private readonly phases: GenerationPhase[]
  private readonly context: GenerationContext
  
  constructor(config: NormalizedConfig, schema: ParsedSchema) {
    this.context = new GenerationContext(config, schema)
    this.phases = this.createPhases()
  }
  
  private createPhases(): GenerationPhase[] {
    const phases: GenerationPhase[] = [
      new ValidationPhase(),
      new AnalysisPhase(),
      new NamingConflictPhase()
    ]
    
    // Conditional phases
    if (this.context.config.useRegistry) {
      phases.push(
        new RegistryGenerationPhase(),
        new RegistryServiceIntegrationPhase()  // Explicit phase
      )
    } else {
      phases.push(
        new DTOGenerationPhase(),
        new ValidatorGenerationPhase(),
        new ServiceGenerationPhase(),
        new ControllerGenerationPhase(),
        new RouteGenerationPhase()
      )
    }
    
    phases.push(
      new SDKGenerationPhase(),
      new SDKVersionPhase(),  // Explicit phase with validation
      new HooksGenerationPhase()
    )
    
    // Plugin phase with strict error handling (fixes issue 17)
    if (this.context.config.features) {
      phases.push(new PluginGenerationPhase())
    }
    
    // Checklist only if requested
    if (this.context.config.generation.checklist) {
      phases.push(new ChecklistPhase())
    }
    
    return phases.sort((a, b) => a.order - b.order)
  }
  
  async execute(): Promise<GeneratedFiles> {
    const phaseResults = new Map<string, PhaseResult>()
    
    for (const phase of this.phases) {
      // Check if phase should run
      if (!phase.shouldExecute(this.context)) {
        phaseResults.set(phase.name, {
          success: true,
          status: PhaseStatus.SKIPPED,
          errors: []
        })
        continue
      }
      
      // Create snapshot before phase
      this.context.createSnapshot(phase.name)
      
      try {
        console.log(`[ssot-codegen] ▶ ${phase.name}`)
        const result = await phase.execute(this.context)
        phaseResults.set(phase.name, result)
        
        // Handle phase failure
        if (!result.success && this.shouldRollback(result.errors)) {
          await this.rollbackPhase(phase)
          throw new GenerationFailedError(`Phase ${phase.name} failed`)
        }
      } catch (error) {
        // Rollback on error
        await this.rollbackPhase(phase)
        throw error
      }
    }
    
    // All phases completed
    this.logPipelineSummary(phaseResults)
    
    // Final validation
    if (this.context.hasBlockingErrors()) {
      throw new GenerationFailedError('Generation blocked by validation errors')
    }
    
    return this.context.filesBuilder.build()
  }
  
  private shouldRollback(errors: GenerationError[]): boolean {
    return errors.some(e => 
      e.severity === ErrorSeverity.FATAL || 
      e.blocksGeneration === true
    )
  }
  
  private async rollbackPhase(phase: GenerationPhase): Promise<void> {
    console.warn(`[ssot-codegen] ↩ Rolling back ${phase.name}`)
    
    if (phase.rollback) {
      await phase.rollback(this.context)
    } else {
      // Default rollback: restore snapshot
      this.context.rollbackToSnapshot(phase.name)
    }
  }
}

// SDK Version Phase with contract enforcement (fixes issue 7)
class SDKVersionPhase implements GenerationPhase {
  name = 'sdk-version'
  order = 6
  
  shouldExecute(context: GenerationContext): boolean {
    return true
  }
  
  async execute(context: GenerationContext): Promise<PhaseResult> {
    const { schemaHash, toolVersion } = context.config.metadata
    
    // CONTRACT: Must have real values (no placeholders)
    if (schemaHash === 'development' && process.env.NODE_ENV === 'production') {
      return {
        success: false,
        status: PhaseStatus.FAILED,
        errors: [{
          severity: ErrorSeverity.FATAL,
          message: 'Production builds require real schemaHash (not "development")',
          phase: this.name,
          blocksGeneration: true
        }]
      }
    }
    
    const versionFile = generateSDKVersion(schemaHash, toolVersion)
    
    // Validate no placeholders in output
    if (versionFile.includes('PLACEHOLDER')) {
      return {
        success: false,
        status: PhaseStatus.FAILED,
        errors: [{
          severity: ErrorSeverity.VALIDATION,
          message: 'SDK version contains unresolved placeholders',
          phase: this.name,
          blocksGeneration: true
        }]
      }
    }
    
    context.filesBuilder.sdk.addFile('version.ts', versionFile)
    
    return {
      success: true,
      status: PhaseStatus.COMPLETED,
      errors: []
    }
  }
}

// Plugin Phase with strict validation (fixes issue 17)
class PluginGenerationPhase implements GenerationPhase {
  name = 'plugins'
  order = 7
  
  async execute(context: GenerationContext): Promise<PhaseResult> {
    const errors: GenerationError[] = []
    const pluginManager = new PluginManager({
      schema: context.schema,
      projectName: context.config.metadata.projectName,
      framework: context.config.framework,
      outputDir: '',
      features: context.config.features || {}
    })
    
    // Validate plugins
    const validations = pluginManager.validateAll()
    const hasInvalidPlugins = Array.from(validations.values()).some(v => !v.valid)
    
    if (hasInvalidPlugins) {
      const error: GenerationError = {
        severity: context.config.errorHandling.strictPluginValidation 
          ? ErrorSeverity.ERROR 
          : ErrorSeverity.WARNING,
        message: 'Plugin validation failed',
        phase: this.name,
        blocksGeneration: context.config.errorHandling.strictPluginValidation
      }
      errors.push(error)
      
      if (context.config.errorHandling.strictPluginValidation) {
        // Fail immediately in strict mode (fixes issue 17)
        return {
          success: false,
          status: PhaseStatus.FAILED,
          errors
        }
      }
    }
    
    // Generate plugins
    const outputs = pluginManager.generateAll()
    for (const [name, output] of outputs) {
      const builder = context.filesBuilder.getPluginBuilder(name)
      for (const [filename, content] of output.files) {
        builder.addFile(filename, content, name)
      }
    }
    
    return {
      success: errors.length === 0,
      status: errors.length === 0 ? PhaseStatus.COMPLETED : PhaseStatus.FAILED,
      errors
    }
  }
}

// Main entry point becomes simple and clear
export function generateCode(
  schema: ParsedSchema,
  config: CodeGeneratorConfig
): GeneratedFiles {
  const normalizer = new ConfigNormalizer()
  const normalizedConfig = normalizer.normalize(config)
  
  const pipeline = new CodeGenerationPipeline(normalizedConfig, schema)
  
  try {
    return await pipeline.execute()
  } catch (error) {
    if (error instanceof GenerationFailedError) {
      // Expected failure with context
      throw error
    }
    
    // Unexpected error
    console.error('[ssot-codegen] Unexpected generation failure:', error)
    throw new GenerationFailedError('Unexpected error during generation', error)
  }
}
```

---

## Comprehensive Issue Resolution Map

| # | Issue | Current Problem | Solution Strategy | Impact |
|---|-------|----------------|-------------------|---------|
| 1 | Massive Function | 700+ lines, multiple responsibilities | Extract into phase classes | High |
| 2 | Deep Nesting | 7+ levels in registry mode | Early returns, phase extraction | High |
| 3 | Mixed Error Handling | Throw/accumulate/log inconsistent | Unified ErrorCollector | High |
| 4 | State Sprawl | Maps mutated throughout | Immutable FileBuilder | High |
| 5 | Config Overload | 15+ options, conflicts unclear | ConfigNormalizer validation | Medium |
| 6 | Comment Density | 100+ lines explaining code | Self-documenting names | Medium |
| 7 | Placeholder Contract | Cross-phase dependency fragile | Explicit SDKVersionPhase | Critical |
| 8 | Duplicate Code | DTO generation x2 | DTOValidatorGenerator | Medium |
| 9 | Magic Phases | Numbered phases, no coordinator | PhaseStatus state machine | Medium |
| 10 | Error Side Effects | Mutated errors array | Immutable error collection | High |
| 11 | Optional Chain Abuse | files.plugins! bypasses safety | Type-safe getPluginBuilder() | Low |
| 12 | Unsafe Map Access | No undefined checks | getAnalysis() with validation | High |
| 13 | Type Widening | errors array unvalidated | ErrorCollector type guards | Low |
| 14 | Redundant Analysis | Analyze then filter junctions | Pre-filter with heuristics | Medium |
| 15 | Repeated Lookups | Same Map.get() multiple times | ModelProcessor lookup cache | Low |
| 16 | Blocking SDK | Serial generation | Promise.allSettled parallel | Low |
| 17 | Silent Plugin Fails | Warnings in production | PluginGenerationPhase strict | Critical |
| 18 | Incomplete Rollback | Partial state on failure | Snapshot/rollback support | High |
| 19 | Error Context Loss | Stack traces not logged | ErrorCollector preserves stacks | Medium |
| 20 | Late Validation | Validate after generation | FileBuilder validates upfront | Medium |
| 21 | Misleading Comments | Claims optimization, isn't | Self-documenting code | Low |
| 22 | Missing Docs | Error recovery undefined | GenerationContract type | Medium |
| 23 | Cache Lifecycle | Watch mode unclear | Fresh cache per call documented | Low |

---

## Refactoring Benefits

### Architecture

**Before**:
- ❌ 700+ line monolithic function
- ❌ 7+ levels of nesting
- ❌ 100+ lines of comments explaining logic
- ❌ Mixed error handling (throw/log/accumulate)
- ❌ Mutable state mutated throughout
- ❌ 15+ config options with undefined interactions
- ❌ Magic phase numbers (0, 1, 1.5, 1.6, 2, 3, 4, 5, 6)

**After**:
- ✅ ~10 phase classes (~50-100 lines each)
- ✅ Max 2-3 levels of nesting
- ✅ Self-documenting code, minimal comments
- ✅ Unified Result-based error handling
- ✅ Immutable builders with snapshots
- ✅ Normalized, validated config with conflict detection
- ✅ Explicit phase ordering with state machine

### Type Safety

**Before**:
- ❌ Non-null assertions (files.plugins!)
- ❌ Unsafe Map.get() without null checks
- ❌ Type widening in error arrays
- ❌ Optional fields used without validation

**After**:
- ✅ Type-safe builders with guaranteed initialization
- ✅ AnalysisCache with getAnalysis() validation
- ✅ ErrorCollector with type guards
- ✅ NormalizedConfig with readonly properties

### Error Handling

**Before**:
- ❌ Inconsistent: some throw, some accumulate, some log
- ❌ Error array mutated via side effects
- ❌ No rollback on partial failures
- ❌ Stack traces lost in error wrapping
- ❌ Silent plugin failures in production

**After**:
- ✅ Consistent: all errors through ErrorCollector
- ✅ Immutable error collection
- ✅ Automatic snapshot/rollback support
- ✅ Full stack traces preserved
- ✅ Plugin failures fail build in strict mode

### Performance

**Before**:
- ❌ Analyzes junction tables then filters (wasted work)
- ❌ Repeated Map lookups (O(n) per lookup)
- ❌ Serial SDK generation (blocks on each model)

**After**:
- ✅ Pre-filters junctions with heuristics
- ✅ Single lookup cached per model
- ✅ Parallel SDK generation with Promise.allSettled

### Maintainability

**Before**:
- ❌ Hard to add new phases (edit 700-line function)
- ❌ Hard to test (need full schema + config)
- ❌ Hard to debug (which phase failed?)
- ❌ Duplicate logic across modes

**After**:
- ✅ Easy to add phases (new class, add to pipeline)
- ✅ Easy to test (mock context, test phase)
- ✅ Easy to debug (phase name in every error)
- ✅ Shared helpers (DTOValidatorGenerator)

---

## Migration Strategy (Non-Breaking)

### Phase 1: Foundation Classes (Week 1)
```typescript
// Create new infrastructure without breaking existing code

// packages/gen/src/pipeline/context.ts
export class GenerationContext { /* ... */ }

// packages/gen/src/pipeline/error-collector.ts
export class ErrorCollector { /* ... */ }

// packages/gen/src/builders/file-builder.ts
export class FileBuilder { /* ... */ }

// packages/gen/src/pipeline/config-normalizer.ts
export class ConfigNormalizer { /* ... */ }
```

### Phase 2: Extract First Phases (Week 2)
```typescript
// Start with simplest phases

// packages/gen/src/pipeline/phases/validation-phase.ts
export class ValidationPhase implements GenerationPhase { /* ... */ }

// packages/gen/src/pipeline/phases/analysis-phase.ts
export class AnalysisPhase implements GenerationPhase { /* ... */ }
```

### Phase 3: Create Pipeline (Week 3)
```typescript
// packages/gen/src/pipeline/pipeline.ts
export class CodeGenerationPipeline {
  constructor(config: NormalizedConfig, schema: ParsedSchema) { /* ... */ }
  async execute(): Promise<GeneratedFiles> { /* ... */ }
}

// packages/gen/src/code-generator.ts (updated, not replaced)
export function generateCode(
  schema: ParsedSchema,
  config: CodeGeneratorConfig
): GeneratedFiles {
  const normalizer = new ConfigNormalizer()
  const normalizedConfig = normalizer.normalize(config)
  
  // Delegate to pipeline (no breaking changes)
  const pipeline = new CodeGenerationPipeline(normalizedConfig, schema)
  return await pipeline.execute()
}
```

### Phase 4: Parallel Execution (Week 4)
```typescript
// Add parallel execution to compatible phases

class ParallelPipeline extends CodeGenerationPipeline {
  async execute(): Promise<GeneratedFiles> {
    // Run independent phases in parallel
    const [analysisResult, validationResult] = await Promise.all([
      this.phases.find(p => p.name === 'analysis')!.execute(this.context),
      this.phases.find(p => p.name === 'validation')!.execute(this.context)
    ])
    // ...
  }
}
```

### Phase 5: Deprecation (Week 5+)
```typescript
/**
 * @deprecated Use CodeGenerationPipeline directly for better control
 * 
 * Migration guide:
 * ```typescript
 * // Before
 * const files = generateCode(schema, config)
 * 
 * // After
 * const normalizer = new ConfigNormalizer()
 * const normalizedConfig = normalizer.normalize(config)
 * const pipeline = new CodeGenerationPipeline(normalizedConfig, schema)
 * const files = await pipeline.execute()
 * ```
 */
export function generateCode(...) { ... }
```

---

## File Structure

```
packages/gen/src/
├── code-generator.ts              # Main entry point (50 lines)
│
├── pipeline/
│   ├── types.ts                   # Interfaces, enums, types
│   ├── context.ts                 # GenerationContext (150 lines)
│   ├── error-collector.ts         # ErrorCollector (100 lines)
│   ├── config-normalizer.ts      # ConfigNormalizer (100 lines)
│   ├── pipeline.ts                # CodeGenerationPipeline (200 lines)
│   │
│   └── phases/
│       ├── base-phase.ts          # Abstract base class
│       ├── validation-phase.ts    # Model validation (80 lines)
│       ├── analysis-phase.ts      # Unified analysis (100 lines)
│       ├── conflict-phase.ts      # Naming conflict detection (60 lines)
│       ├── dto-phase.ts           # DTO generation (80 lines)
│       ├── validator-phase.ts     # Validator generation (80 lines)
│       ├── service-phase.ts       # Service generation (100 lines)
│       ├── controller-phase.ts    # Controller generation (100 lines)
│       ├── route-phase.ts         # Route generation (80 lines)
│       ├── sdk-phase.ts           # SDK generation (150 lines)
│       ├── sdk-version-phase.ts   # SDK version (60 lines)
│       ├── hooks-phase.ts         # Hooks generation (80 lines)
│       ├── plugin-phase.ts        # Plugin generation (120 lines)
│       ├── checklist-phase.ts     # Checklist generation (80 lines)
│       └── registry-phase.ts      # Registry mode (150 lines)
│
├── builders/
│   ├── file-builder.ts            # FileBuilder (100 lines)
│   ├── generated-files-builder.ts # GeneratedFilesBuilder (150 lines)
│   └── dto-validator-generator.ts # Shared DTO/validator logic (80 lines)
│
├── cache/
│   └── analysis-cache.ts          # Type-safe AnalysisCache (100 lines)
│
└── ...existing files...
```

**Total New Code**: ~2,000 lines across 20 focused files  
**Replaced Code**: 700 lines in code-generator.ts  
**Net Addition**: ~1,300 lines (but dramatically more maintainable)

---

## Testing Strategy

### Unit Tests (Per Phase)
```typescript
describe('AnalysisPhase', () => {
  it('should analyze all non-junction models', async () => {
    const phase = new AnalysisPhase()
    const context = createMockContext({
      schema: createMockSchema(),
      config: createMockConfig()
    })
    
    const result = await phase.execute(context)
    
    expect(result.success).toBe(true)
    expect(result.status).toBe(PhaseStatus.COMPLETED)
    expect(context.cache.getAnalysisCount()).toBe(3)
  })
  
  it('should skip junction tables', async () => {
    // Test junction filtering
  })
  
  it('should handle analysis errors gracefully', async () => {
    // Test error handling
  })
})

describe('DTOGenerationPhase', () => {
  it('should generate all DTOs for valid models', async () => {
    // Test DTO generation
  })
  
  it('should validate generated code', async () => {
    // Test validation integration
  })
  
  it('should handle duplicate paths', async () => {
    // Test path deduplication
  })
})
```

### Integration Tests (Pipeline)
```typescript
describe('CodeGenerationPipeline', () => {
  it('should execute all phases in order', async () => {
    const pipeline = new CodeGenerationPipeline(config, schema)
    const files = await pipeline.execute()
    
    expect(files.services.size).toBeGreaterThan(0)
    expect(files.sdk.size).toBeGreaterThan(0)
  })
  
  it('should rollback on fatal errors', async () => {
    // Mock phase to throw
    // Verify rollback occurred
  })
  
  it('should respect failFast configuration', async () => {
    // Verify early termination
  })
})
```

### End-to-End Tests
```typescript
describe('generateCode', () => {
  it('should generate complete project', () => {
    const files = generateCode(blogSchema, {
      framework: 'express',
      useEnhanced: true
    })
    
    expect(countGeneratedFiles(files)).toBe(42)
  })
})
```

---

## Implementation Roadmap

### Sprint 1: Foundation (40 hours)
- [ ] Create `GenerationContext` class
- [ ] Create `ErrorCollector` class
- [ ] Create `AnalysisCache` class with type-safe accessors
- [ ] Create `ConfigNormalizer` class
- [ ] Create `FileBuilder` class
- [ ] Create `GeneratedFilesBuilder` class
- [ ] Write unit tests for all foundation classes

### Sprint 2: Core Phases (60 hours)
- [ ] Extract `ValidationPhase`
- [ ] Extract `AnalysisPhase`
- [ ] Extract `NamingConflictPhase`
- [ ] Extract `DTOValidatorGenerator` helper
- [ ] Extract `DTOGenerationPhase`
- [ ] Extract `ValidatorGenerationPhase`
- [ ] Write unit tests for core phases

### Sprint 3: Generation Phases (60 hours)
- [ ] Extract `ServiceGenerationPhase`
- [ ] Extract `ControllerGenerationPhase`
- [ ] Extract `RouteGenerationPhase`
- [ ] Extract `ServiceIntegrationPhase`
- [ ] Extract `RegistryGenerationPhase`
- [ ] Write unit tests for generation phases

### Sprint 4: SDK & Extensions (40 hours)
- [ ] Extract `SDKGenerationPhase` with parallel support
- [ ] Extract `SDKVersionPhase` with contract validation
- [ ] Extract `HooksGenerationPhase`
- [ ] Extract `PluginGenerationPhase` with strict validation
- [ ] Extract `ChecklistPhase`
- [ ] Write unit tests for SDK/extension phases

### Sprint 5: Pipeline & Integration (40 hours)
- [ ] Create `CodeGenerationPipeline` orchestrator
- [ ] Implement snapshot/rollback support
- [ ] Add phase dependency tracking
- [ ] Update main `generateCode()` to use pipeline
- [ ] Write integration tests
- [ ] Write end-to-end tests

### Sprint 6: Migration & Cleanup (20 hours)
- [ ] Deprecate old patterns
- [ ] Update all examples to use new API
- [ ] Performance benchmarks (before/after)
- [ ] Update documentation
- [ ] Clean up legacy code

**Total Effort**: ~260 hours (~6-7 weeks for 1 dev, ~3-4 weeks for 2 devs)

---

## Estimated Impact

### Code Quality
- **Cyclomatic Complexity**: 150+ → ~10 per function
- **Function Length**: 700 lines → 50-100 lines per phase
- **Nesting Depth**: 7 levels → 2-3 levels
- **Test Coverage**: ~40% → ~85%

### Performance
- **Junction Analysis**: 100% → ~20% (80% reduction)
- **Map Lookups**: 5x per model → 1x per model
- **SDK Generation**: Serial → Parallel (3-5x faster for 10+ models)

### Maintainability
- **Time to Add Phase**: 4-6 hours → 1-2 hours
- **Time to Debug Issue**: 2-3 hours → 30 minutes
- **Time to Write Test**: N/A (too complex) → 15-30 minutes

---

## Risk Assessment

### Low Risk Changes
- ✅ Create foundation classes (no integration)
- ✅ Extract validation/analysis phases (well-isolated)
- ✅ Add unit tests (only adds value)

### Medium Risk Changes
- ⚠️ Extract generation phases (complex logic)
- ⚠️ Implement pipeline orchestrator (integration points)
- ⚠️ Add parallel SDK generation (async complexity)

### High Risk Changes
- ⛔ Replace main generateCode() (public API)
- ⛔ Change error handling contract (caller expectations)
- ⛔ Modify GeneratedFiles structure (breaking change)

### Mitigation Strategy
1. Implement behind feature flag: `config.usePipeline = true`
2. Run both old and new in parallel, compare outputs
3. Gradual rollout: 10% → 50% → 100%
4. Keep old code for 2+ major versions
5. Comprehensive integration tests before switch

---

## Success Criteria

### Must Have (P0)
- ✅ No breaking changes to public API
- ✅ All existing tests pass
- ✅ Generated output identical to current implementation
- ✅ Error handling behavior preserved

### Should Have (P1)
- ✅ 10% performance improvement minimum
- ✅ 80%+ test coverage for new code
- ✅ Cyclomatic complexity < 15 per function
- ✅ No function > 150 lines

### Nice to Have (P2)
- ✅ Parallel SDK generation (3-5x faster)
- ✅ Plugin hot-reload support
- ✅ Watch mode optimization
- ✅ Phase-level caching

---

## Decision Log

### Why Phase-Based Architecture?
- **Clear separation of concerns**: Each phase has one job
- **Testability**: Mock context, test phase in isolation
- **Flexibility**: Easy to add/remove/reorder phases
- **Rollback**: Snapshot before each phase
- **Observability**: Clear progress tracking

### Why Not Streaming?
- **Complexity**: Streams add async complexity
- **Limited benefit**: Not I/O bound, CPU bound
- **Debugging**: Harder to snapshot/rollback
- **Decision**: Use phases first, add streaming later if needed

### Why Immutable Builders?
- **Safety**: Can't accidentally mutate shared state
- **Rollback**: Easy to restore snapshots
- **Debugging**: Clear ownership and lifecycle
- **Decision**: Immutability worth the memory overhead

### Why Not Event-Driven?
- **Overkill**: Generation is linear, not reactive
- **Complexity**: Events harder to reason about than phases
- **Debugging**: Event chains harder to trace
- **Decision**: Keep it simple with sequential phases

---

## Conclusion

This refactoring addresses **23 identified issues** across architecture, type safety, performance, error handling, and maintainability.

The phase-based architecture provides:
1. **Clear separation of concerns** (each phase does one thing)
2. **Consistent error handling** (unified ErrorCollector)
3. **Type safety** (no more unsafe casts or optional abuse)
4. **Performance** (parallel execution, cached lookups)
5. **Testability** (mock context, test phases)
6. **Rollback support** (snapshots before each phase)
7. **Self-documenting code** (clear names, minimal comments)

**Recommendation**: Implement incrementally over 6-7 weeks with feature flag and gradual rollout.


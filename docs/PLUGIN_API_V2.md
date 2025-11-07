# Plugin API v2

## Overview

Plugin API v2 introduces powerful new capabilities for extending SSOT Codegen with template overrides, lifecycle hooks, plugin dependencies, and custom phase injection. This provides a flexible, composable plugin ecosystem.

## What's New in v2

### Template Override System
Plugins can now override or extend any generated template:
```typescript
overrideTemplates(registry: TemplateRegistry): void {
  // Replace entire template
  registry.override('user.service', customTemplate)
  
  // Extend existing template
  registry.extend('app.ts', {
    before: '// Custom initialization',
    after: '// Custom teardown',
    replace: [{ pattern: /old/g, replacement: 'new' }]
  })
}
```

### Extended Lifecycle Hooks
Seven new hooks for fine-grained control:
```typescript
lifecycle: {
  beforeGeneration,      // v1: Before any generation
  onSchemaValidated,     // v2: After schema validation
  onModelGenerated,      // v2: After each model
  onFilesWritten,        // v2: After files written
  onError,               // v2: On any error
  onComplete,            // v2: Generation complete
  afterGeneration        // v1: After all generation
}
```

### Plugin Dependencies
Declare dependencies on other plugins:
```typescript
class MyPlugin implements FeaturePluginV2 {
  dependencies = ['google-auth', 'stripe']  // Must be registered first
}
```

### Configuration Validation
JSON Schema-based config validation:
```typescript
configSchema: PluginConfigSchema = {
  type: 'object',
  properties: {
    apiKey: { type: 'string', pattern: '^sk-' },
    timeout: { type: 'number', minimum: 100, maximum: 30000 }
  },
  required: ['apiKey']
}
```

### Custom Phase Injection
Add custom generation phases:
```typescript
registerPhases(): GenerationPhase[] {
  return [new MyCustomPhase()]
}
```

## Complete API Reference

### FeaturePluginV2 Interface

```typescript
interface FeaturePluginV2 {
  // Metadata (required)
  name: string
  version: string
  description: string
  enabled: boolean
  
  // v2: Configuration schema (optional)
  configSchema?: PluginConfigSchema
  
  // v2: Plugin dependencies (optional)
  dependencies?: string[]
  
  // Requirements (required)
  requirements: PluginRequirementsV2
  
  // Core methods (required)
  validate(context: PluginContextV2): ValidationResultV2
  generate(context: PluginContextV2): PluginOutputV2
  
  // Optional methods
  healthCheck?(context: PluginContextV2): HealthCheckSection
  lifecycle?: PluginLifecycleHooks
  overrideTemplates?(registry: TemplateRegistry): void
  registerPhases?(): GenerationPhase[]
}
```

### PluginContextV2

```typescript
interface PluginContextV2 {
  schema: ParsedSchema
  projectName: string
  framework: 'express' | 'fastify'
  outputDir: string
  config: Record<string, unknown>
  
  // v2: New context properties
  templates?: TemplateRegistry
  phases?: Map<string, GenerationPhase>
}
```

### PluginOutputV2

```typescript
interface PluginOutputV2 {
  files: Map<string, string>
  routes: PluginRoute[]
  middleware: PluginMiddleware[]
  envVars: Record<string, string>
  packageJson?: {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    peerDependencies?: Record<string, string>  // v2: New
    scripts?: Record<string, string>
  }
  migrations?: string[]
  
  // v2: New output properties
  templateOverrides?: Map<string, string>
  customPhases?: GenerationPhase[]
}
```

## Usage Examples

### Basic v2 Plugin

```typescript
import { BasePluginV2 } from '../plugin-v2.interface.js'

class MyPlugin extends BasePluginV2 {
  name = 'my-plugin'
  version = '2.0.0'
  description = 'My awesome plugin'
  
  requirements = {
    models: { required: ['User'] },
    envVars: { required: ['MY_API_KEY'] },
    dependencies: { runtime: { 'my-sdk': '^1.0.0' } }
  }
  
  validate(context) {
    return {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: []
    }
  }
  
  generate(context) {
    const files = new Map()
    files.set('my-feature/index.ts', '// Generated code')
    
    return {
      files,
      routes: [],
      middleware: [],
      envVars: { MY_API_KEY: 'your-key-here' }
    }
  }
}
```

### Template Overrides

```typescript
class CustomAuthPlugin extends BasePluginV2 {
  overrideTemplates(registry: TemplateRegistry): void {
    // Complete replacement
    registry.override('auth.middleware', `
export const authMiddleware = async (req, res, next) => {
  // My custom auth logic
  next()
}
    `)
    
    // Partial extension
    registry.extend('server.ts', {
      before: 'import { initCustomAuth } from "./auth.js"',
      after: 'initCustomAuth()',
      replace: [{
        pattern: /port = 3000/,
        replacement: 'port = process.env.PORT || 3000'
      }]
    })
  }
}
```

### Lifecycle Hooks

```typescript
class AnalyticsPlugin extends BasePluginV2 {
  lifecycle = {
    async beforeGeneration(context) {
      // Setup analytics
      this.startTime = Date.now()
    },
    
    async onModelGenerated(model, files) {
      // Track model generation
      analytics.track('model_generated', {
        model: model.name,
        files: files.size
      })
    },
    
    async onComplete(result) {
      // Report stats
      const duration = Date.now() - this.startTime
      analytics.track('generation_complete', {
        files: result.files,
        duration
      })
    }
  }
}
```

### Plugin Dependencies

```typescript
class MultiTenantPlugin extends BasePluginV2 {
  name = 'multi-tenant'
  
  // This plugin requires google-auth to be enabled
  dependencies = ['google-auth']
  
  validate(context) {
    // google-auth is guaranteed to be registered
    // (PluginManagerV2 enforces dependency order)
    return { valid: true, errors: [], warnings: [], suggestions: [] }
  }
}
```

### Configuration Schema

```typescript
class ConfigurablePlugin extends BasePluginV2 {
  configSchema = {
    type: 'object',
    properties: {
      apiEndpoint: {
        type: 'string',
        description: 'API endpoint URL',
        pattern: '^https://',
        default: 'https://api.example.com'
      },
      retryAttempts: {
        type: 'number',
        minimum: 1,
        maximum: 10,
        default: 3
      },
      features: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['feature-a', 'feature-b', 'feature-c']
        }
      }
    },
    required: ['apiEndpoint']
  }
  
  generate(context) {
    const config = context.config
    // Config is validated against schema before generate() is called
    // ...
  }
}
```

### Custom Phases

```typescript
import { GenerationPhase, PhaseContext, PhaseResult } from '../generator/phase-runner.js'

class CustomAnalyticsPhase extends GenerationPhase {
  readonly name = 'analytics'
  readonly order = 13  // After standard phases
  
  async execute(context: PhaseContext): Promise<PhaseResult> {
    // Send analytics
    await sendAnalytics({
      models: context.modelNames?.length,
      files: context.totalFiles
    })
    
    return { success: true }
  }
}

class AnalyticsPlugin extends BasePluginV2 {
  registerPhases() {
    return [new CustomAnalyticsPhase()]
  }
}
```

## Migration Guide v1 → v2

### Breaking Changes

1. **ValidationResult** → **ValidationResultV2**
```typescript
// v1
interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// v2
interface ValidationResultV2 {
  valid: boolean
  errors: ValidationMessage[]     // Enhanced with severity
  warnings: ValidationMessage[]   // Enhanced with severity
  suggestions: ValidationMessage[] // New
}
```

2. **PluginContext** → **PluginContextV2**
```typescript
// v2 adds:
context.templates  // Template registry access
context.phases     // Phase registry access
```

3. **PluginOutput** → **PluginOutputV2**
```typescript
// v2 adds:
output.templateOverrides  // Template overrides
output.customPhases       // Custom phases
packageJson.peerDependencies  // Peer deps
```

### Migration Steps

#### Step 1: Update Interface
```typescript
// Before (v1)
class MyPlugin implements FeaturePlugin {
  // ...
}

// After (v2)
import { BasePluginV2 } from '../plugin-v2.interface.js'

class MyPlugin extends BasePluginV2 {
  // Same implementation works!
}
```

#### Step 2: Update Validation (if needed)
```typescript
// Before (v1)
validate(context: PluginContext): ValidationResult {
  return {
    valid: true,
    errors: [],
    warnings: []
  }
}

// After (v2)
validate(context: PluginContextV2): ValidationResultV2 {
  return {
    valid: true,
    errors: [],      // Now ValidationMessage[]
    warnings: [],    // Now ValidationMessage[]
    suggestions: []  // New
  }
}
```

#### Step 3: Add New Features (optional)
```typescript
class MyPlugin extends BasePluginV2 {
  // Add configuration schema
  configSchema = { /* ... */ }
  
  // Add lifecycle hooks
  lifecycle = { /* ... */ }
  
  // Add template overrides
  overrideTemplates(registry) { /* ... */ }
  
  // Add custom phases
  registerPhases() { /* ... */ }
}
```

### Backwards Compatibility

**v1 plugins work in v2!**

The `BasePluginV2` class provides backwards compatibility:
- v1 plugins can extend `BasePluginV2` without changes
- All v1 methods work as-is
- New v2 features are opt-in

## Best Practices

### 1. Use BasePluginV2

```typescript
// ✅ GOOD: Extend base class
class MyPlugin extends BasePluginV2 {
  name = 'my-plugin'
  // ...
}

// ❌ BAD: Implement interface directly
class MyPlugin implements FeaturePluginV2 {
  // Have to implement ALL methods manually
}
```

### 2. Declare Dependencies

```typescript
// ✅ GOOD: Explicit dependencies
class MyPlugin extends BasePluginV2 {
  dependencies = ['auth', 'database']
}

// ❌ BAD: Assume other plugins exist
class MyPlugin extends BasePluginV2 {
  generate(context) {
    // This might fail if 'auth' plugin isn't registered
    const authConfig = context.config.auth
  }
}
```

### 3. Use Configuration Schema

```typescript
// ✅ GOOD: Validate configuration
class MyPlugin extends BasePluginV2 {
  configSchema = {
    type: 'object',
    properties: {
      apiKey: { type: 'string', pattern: '^sk-' }
    },
    required: ['apiKey']
  }
}

// ❌ BAD: Assume config is valid
class MyPlugin extends BasePluginV2 {
  generate(context) {
    const apiKey = context.config.apiKey  // Might be undefined!
  }
}
```

### 4. Use Lifecycle Hooks Appropriately

```typescript
// ✅ GOOD: Use specific hooks
class MyPlugin extends BasePluginV2 {
  lifecycle = {
    onSchemaValidated: async (schema) => {
      // Schema is guaranteed to be valid
      console.log(`Found ${schema.models.length} models`)
    }
  }
}

// ❌ BAD: Do everything in afterGeneration
class MyPlugin extends BasePluginV2 {
  lifecycle = {
    afterGeneration: async (context, output) => {
      // Too late for many operations
      // Should use more specific hooks
    }
  }
}
```

### 5. Prefer Template Extensions over Replacements

```typescript
// ✅ GOOD: Extend template
registry.extend('server.ts', {
  before: 'import myFeature from "./my-feature.js"',
  after: 'initializeMyFeature()'
})

// ❌ BAD: Replace entire template
registry.override('server.ts', `
// Entire server.ts template duplicated here
// Hard to maintain, breaks on upstream changes
`)
```

## Advanced Usage

### Composable Plugins

```typescript
class BaseAuthPlugin extends BasePluginV2 {
  name = 'base-auth'
  
  generate(context) {
    // Base auth implementation
  }
}

class EnhancedAuthPlugin extends BasePluginV2 {
  name = 'enhanced-auth'
  dependencies = ['base-auth']
  
  overrideTemplates(registry) {
    // Enhance base-auth templates
    registry.extend('auth/middleware.ts', {
      after: '// Enhanced security checks'
    })
  }
}
```

### Conditional Features

```typescript
class ConditionalPlugin extends BasePluginV2 {
  lifecycle = {
    beforeGeneration: async (context) => {
      // Disable if condition not met
      if (!context.schema.models.some(m => m.name === 'User')) {
        this.enabled = false
        console.warn('User model not found, disabling plugin')
      }
    }
  }
}
```

### Multi-Phase Plugins

```typescript
class ComplexPlugin extends BasePluginV2 {
  registerPhases() {
    return [
      new SetupPhase(),
      new ProcessPhase(),
      new FinalizePhase()
    ]
  }
}

class SetupPhase extends GenerationPhase {
  readonly order = 4.5  // Between code generation and file writing
  
  async execute(context) {
    // Custom setup logic
    return { success: true }
  }
}
```

## Template Override System

### TemplateRegistry API

```typescript
interface TemplateRegistry {
  get(name: string): string | undefined
  set(name: string, template: string): void
  override(name: string, template: string): void
  extend(name: string, extension: TemplateExtension): void
}
```

### Template Extension

```typescript
interface TemplateExtension {
  before?: string   // Prepend content
  after?: string    // Append content
  replace?: Array<{
    pattern: RegExp
    replacement: string
  }>
}
```

### Example: Extend Controller Template

```typescript
overrideTemplates(registry) {
  registry.extend('user.controller', {
    // Add import at top
    before: 'import { auditLog } from "@/utils/audit.js"',
    
    // Add method at end
    after: `
export async function auditUserAction(req, res) {
  await auditLog(req.user, req.method, req.path)
  res.json({ success: true })
}
    `,
    
    // Modify existing code
    replace: [{
      pattern: /res\.json\(user\)/g,
      replacement: 'res.json({ ...user, enhanced: true })'
    }]
  })
}
```

## Lifecycle Hooks Deep Dive

### Hook Execution Order

1. `beforeGeneration` - Before any generation starts
2. `onSchemaValidated` - After schema validation passes
3. `onModelGenerated` - After each model is generated (called N times)
4. `afterGeneration` - After all code generation
5. `onFilesWritten` - After files written to disk
6. `onComplete` - Generation fully complete
7. `onError` - On any error (can be called multiple times)

### Hook Use Cases

| Hook | Use Case |
|------|----------|
| `beforeGeneration` | Setup, validation, external API calls |
| `onSchemaValidated` | Schema analysis, model counting |
| `onModelGenerated` | Per-model analytics, custom generation |
| `afterGeneration` | Merge outputs, validate generated code |
| `onFilesWritten` | Post-processing, file transformations |
| `onComplete` | Cleanup, reporting, notifications |
| `onError` | Error logging, rollback, alerts |

### Example: Progress Tracking

```typescript
class ProgressPlugin extends BasePluginV2 {
  private totalModels = 0
  private processedModels = 0
  
  lifecycle = {
    onSchemaValidated: async (schema) => {
      this.totalModels = schema.models.length
      console.log(`Starting generation for ${this.totalModels} models`)
    },
    
    onModelGenerated: async (model, files) => {
      this.processedModels++
      const progress = Math.round((this.processedModels / this.totalModels) * 100)
      console.log(`[${progress}%] Generated ${model.name}`)
    },
    
    onComplete: async (result) => {
      console.log(`✅ Complete! Generated ${result.files} files in ${result.duration}ms`)
    }
  }
}
```

## Configuration Validation

### Schema Definition

```typescript
configSchema: PluginConfigSchema = {
  type: 'object',
  properties: {
    // String validation
    apiKey: {
      type: 'string',
      description: 'API key for authentication',
      pattern: '^sk-[A-Za-z0-9]{32}$'
    },
    
    // Number validation
    timeout: {
      type: 'number',
      description: 'Request timeout in milliseconds',
      minimum: 100,
      maximum: 60000,
      default: 5000
    },
    
    // Boolean validation
    enableCache: {
      type: 'boolean',
      description: 'Enable response caching',
      default: true
    },
    
    // Enum validation
    region: {
      type: 'string',
      description: 'AWS region',
      enum: ['us-east-1', 'us-west-2', 'eu-west-1']
    },
    
    // Array validation
    allowedOrigins: {
      type: 'array',
      description: 'CORS allowed origins',
      items: {
        type: 'string',
        pattern: '^https?://'
      }
    },
    
    // Nested object validation
    redis: {
      type: 'object',
      properties: {
        host: { type: 'string', default: 'localhost' },
        port: { type: 'number', default: 6379 }
      }
    }
  },
  required: ['apiKey', 'region'],
  additionalProperties: false
}
```

### Validation Errors

```typescript
// Invalid config
const config = {
  apiKey: 'invalid-key',  // Doesn't match pattern
  timeout: 100000,        // Exceeds maximum
  region: 'invalid'       // Not in enum
}

// Validation result
{
  valid: false,
  errors: [
    {
      severity: 'error',
      message: "Property 'apiKey' does not match pattern '^sk-[A-Za-z0-9]{32}$'",
      field: 'apiKey',
      code: 'PATTERN_MISMATCH'
    },
    {
      severity: 'error',
      message: "Property 'timeout' exceeds maximum 60000",
      field: 'timeout',
      code: 'MAXIMUM_EXCEEDED'
    }
  ]
}
```

## Testing v2 Plugins

### Unit Testing

```typescript
import { describe, it, expect } from 'vitest'
import { MyPluginV2 } from './my-plugin-v2.js'

describe('MyPluginV2', () => {
  const plugin = new MyPluginV2()
  const context = {
    schema: mockSchema,
    projectName: 'test',
    framework: 'express',
    outputDir: '/tmp',
    config: {}
  }
  
  it('should validate successfully', () => {
    const result = plugin.validate(context)
    expect(result.valid).toBe(true)
  })
  
  it('should generate files', () => {
    const output = plugin.generate(context)
    expect(output.files.size).toBeGreaterThan(0)
  })
  
  it('should execute lifecycle hooks', async () => {
    const spy = vi.fn()
    plugin.lifecycle = {
      beforeGeneration: spy
    }
    
    await plugin.lifecycle.beforeGeneration(context)
    expect(spy).toHaveBeenCalled()
  })
  
  it('should override templates', () => {
    const registry = new MockTemplateRegistry()
    plugin.overrideTemplates(registry)
    
    expect(registry.get('custom.template')).toBeDefined()
  })
})
```

### Integration Testing

```typescript
import { PluginManagerV2 } from './plugin-manager-v2.js'

describe('PluginManagerV2 Integration', () => {
  it('should enforce plugin dependencies', () => {
    const manager = new PluginManagerV2(config)
    const depPlugin = new DependencyPlugin()
    const mainPlugin = new MainPlugin()  // depends on DependencyPlugin
    
    // Should work
    manager.register(depPlugin)
    manager.register(mainPlugin)
    
    // Should throw
    expect(() => {
      manager.register(mainPlugin)  // dependency not registered
    }).toThrow('depends on')
  })
  
  it('should execute hooks in order', async () => {
    const calls: string[] = []
    
    plugin.lifecycle = {
      beforeGeneration: async () => calls.push('before'),
      onSchemaValidated: async () => calls.push('schema'),
      afterGeneration: async () => calls.push('after')
    }
    
    await manager.generateAll()
    
    expect(calls).toEqual(['before', 'schema', 'after'])
  })
})
```

## Performance Considerations

### Template Overrides

- ✅ **Efficient**: Template resolution is cached
- ✅ **Fast**: Regex replacements are O(n)
- ⚠️ **Memory**: Large overrides use more memory

### Lifecycle Hooks

- ✅ **Async**: Hooks run in parallel where possible
- ⚠️ **Blocking**: `beforeGeneration` blocks all generation
- ⚠️ **Serial**: `onModelGenerated` is called sequentially

### Custom Phases

- ✅ **Flexible**: Can run in any order
- ⚠️ **Overhead**: Each phase adds ~1-2ms
- ⚠️ **Complexity**: Many custom phases can be hard to debug

## Security Considerations

### Template Injection

```typescript
// ❌ DANGEROUS: Unsanitized user input
registry.override('config.ts', `
export const config = {
  key: "${userInput}"  // Potential code injection!
}
`)

// ✅ SAFE: Validate and escape
registry.override('config.ts', `
export const config = {
  key: ${JSON.stringify(sanitize(userInput))}
}
`)
```

### Lifecycle Hook Errors

```typescript
// ✅ GOOD: Handle errors gracefully
lifecycle = {
  onError: async (error, phase) => {
    // Log error securely
    logger.error({ phase }, error.message)
    
    // Don't expose sensitive data
    // Don't throw in onError hook
  }
}
```

## Future Enhancements

### Plugin Marketplace
- npm registry for community plugins
- Version compatibility checking
- Security audits

### Hot Reload
- Reload plugins without restarting
- Development mode with watch
- Plugin debugging tools

### Plugin Composition
- Combine multiple plugins
- Plugin presets (e.g., "starter pack")
- Conflict resolution

### Visual Editor
- GUI for configuring plugins
- Drag-and-drop plugin ordering
- Real-time validation

## References

- [Plugin v1 Interface](./plugin.interface.ts)
- [Plugin Manager v2](../plugins/plugin-manager-v2.ts)
- [Example v2 Plugin](../plugins/examples/example-v2-plugin.ts)
- [Phase Runner Architecture](./PHASE_RUNNER_ARCHITECTURE.md)

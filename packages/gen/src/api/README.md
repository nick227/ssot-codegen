# @ssot-codegen/gen - Public API

Clean, minimal API for embedding SSOT Codegen in your own tools.

## Installation

```bash
npm install @ssot-codegen/gen
# or
pnpm add @ssot-codegen/gen
```

## Quick Start

```ts
import { generate } from '@ssot-codegen/gen/api'

const result = await generate({
  schema: './prisma/schema.prisma',
  framework: 'express',
  standalone: true
})

console.log(`✅ Generated ${result.filesCreated} files for ${result.models.length} models`)
```

## API Reference

### `generate(options)`

Main entry point for code generation.

**Parameters:**
- `options: GenerateOptions` - Configuration object

**Returns:**
- `Promise<GenerateResult>` - Generation result with stats

**Example:**

```ts
const result = await generate({
  schema: './prisma/schema.prisma',  // Or inline schema text
  output: './generated/my-api',      // Optional: auto-generated if omitted
  projectName: 'My API',             // Optional: derived from schema path
  framework: 'express',              // 'express' | 'fastify'
  standalone: true,                  // Generate full runnable project
  format: false,                     // Format with Prettier
  verbosity: 'normal',               // Log level
  onProgress: (event) => {           // Progress callback
    console.log(`[${event.phase}] ${event.message}`)
  }
})
```

### `validateSchema(schemaPathOrText)`

Validate a Prisma schema without generating code.

**Parameters:**
- `schemaPathOrText: string` - Path to schema file or inline schema

**Returns:**
- `Promise<{ valid: boolean; errors: string[]; warnings: string[] }>`

**Example:**

```ts
const validation = await validateSchema('./prisma/schema.prisma')

if (!validation.valid) {
  console.error('Schema errors:', validation.errors)
  process.exit(1)
}

console.log('✅ Schema is valid')
```

### `analyzeSchema(schemaPathOrText)`

Analyze a schema to get information about models, relationships, etc.

**Parameters:**
- `schemaPathOrText: string` - Path to schema file or inline schema

**Returns:**
- `Promise<{ models: string[]; enums: string[]; relationships: number; junctionTables: string[] }>`

**Example:**

```ts
const info = await analyzeSchema('./prisma/schema.prisma')

console.log(`Models: ${info.models.length}`)
console.log(`Enums: ${info.enums.length}`)
console.log(`Relationships: ${info.relationships}`)
console.log(`Junction Tables: ${info.junctionTables.join(', ')}`)
```

### `getVersion()`

Get the generator version.

**Returns:**
- `Promise<string>` - Version string

**Example:**

```ts
const version = await getVersion()
console.log(`SSOT Codegen v${version}`)
```

## Types

### `GenerateOptions`

```ts
interface GenerateOptions {
  schema: string                           // Path or inline text
  output?: string                          // Output directory
  projectName?: string                     // Project name
  framework?: 'express' | 'fastify'        // Web framework
  standalone?: boolean                     // Generate full project
  paths?: Partial<PathsConfig>             // Custom paths
  onProgress?: (event: ProgressEvent) => void  // Progress callback
  verbosity?: LogLevel                     // Log level
  format?: boolean                         // Format with Prettier
  concurrency?: number                     // Max concurrent writes
  features?: Record<string, any>           // Plugin features
}
```

### `GenerateResult`

```ts
interface GenerateResult {
  success: boolean                         // Generation success
  models: string[]                         // Generated models
  filesCreated: number                     // Total files
  relationships: number                    // Detected relationships
  breakdown: Array<{                       // Files by layer
    layer: string
    count: number
  }>
  outputDir?: string                       // Output path
  duration?: number                        // Time in ms
  errors?: Error[]                         // Any errors
  warnings?: string[]                      // Any warnings
}
```

### `ProgressEvent`

```ts
interface ProgressEvent {
  type: 'phase:start' | 'phase:end' | 'model:start' | 'model:complete' | 'file:created' | 'warning' | 'error'
  phase?: string                           // Phase name
  model?: string                           // Model name
  message: string                          // Event message
  filesGenerated?: number                  // Files in this event
  timestamp: Date                          // Event time
}
```

## Usage Examples

### Example 1: Basic Generation

```ts
import { generate } from '@ssot-codegen/gen/api'

const result = await generate({
  schema: './prisma/schema.prisma',
  framework: 'express'
})

if (result.success) {
  console.log(`✅ Generated ${result.filesCreated} files`)
  console.log(`📁 Output: ${result.outputDir}`)
} else {
  console.error('❌ Generation failed:', result.errors)
}
```

### Example 2: Inline Schema

```ts
const result = await generate({
  schema: `
    model User {
      id    Int     @id @default(autoincrement())
      email String  @unique
      posts Post[]
    }
    
    model Post {
      id       Int    @id @default(autoincrement())
      title    String
      author   User   @relation(fields: [authorId], references: [id])
      authorId Int
    }
  `,
  output: './my-blog-api',
  projectName: 'Blog API',
  framework: 'fastify'
})
```

### Example 3: Progress Monitoring

```ts
const result = await generate({
  schema: './schema.prisma',
  onProgress: (event) => {
    switch (event.type) {
      case 'phase:start':
        console.log(`⏳ ${event.message}`)
        break
      case 'phase:end':
        console.log(`✅ ${event.message} (${event.filesGenerated} files)`)
        break
      case 'model:start':
        console.log(`  📦 Processing ${event.model}...`)
        break
      case 'model:complete':
        console.log(`  ✅ ${event.model} (${event.filesGenerated} files)`)
        break
    }
  }
})
```

### Example 4: Custom Paths

```ts
const result = await generate({
  schema: './schema.prisma',
  paths: {
    alias: '@api',
    rootDir: './src/generated',
    layers: {
      contracts: 'dtos',
      validators: 'schemas',
      services: 'services',
      controllers: 'handlers',
      routes: 'routes'
    }
  }
})
```

### Example 5: Build Tool Integration

```ts
// Vite plugin example
export function ssotCodegenPlugin() {
  return {
    name: 'ssot-codegen',
    async buildStart() {
      const result = await generate({
        schema: './prisma/schema.prisma',
        output: './src/api',
        standalone: false,
        verbosity: 'minimal'
      })
      
      if (!result.success) {
        throw new Error('Code generation failed')
      }
    }
  }
}
```

### Example 6: CI/CD Integration

```ts
// GitHub Actions, GitLab CI, etc.
import { generate, validateSchema } from '@ssot-codegen/gen/api'

async function ciGenerate() {
  // 1. Validate first
  const validation = await validateSchema('./prisma/schema.prisma')
  if (!validation.valid) {
    console.error('Schema validation failed:', validation.errors)
    process.exit(1)
  }
  
  // 2. Generate
  const result = await generate({
    schema: './prisma/schema.prisma',
    output: process.env.OUTPUT_DIR || './generated',
    verbosity: 'minimal',  // Less noise in CI logs
    format: true           // Ensure consistent formatting
  })
  
  if (!result.success) {
    process.exit(1)
  }
  
  console.log(`Generated ${result.filesCreated} files in ${result.duration}ms`)
}
```

### Example 7: Testing Framework Integration

```ts
// Vitest/Jest setup
import { generate } from '@ssot-codegen/gen/api'
import { beforeAll } from 'vitest'

beforeAll(async () => {
  // Generate fresh code before tests
  await generate({
    schema: './test-schema.prisma',
    output: './test-generated',
    standalone: false,
    verbosity: 'silent'
  })
})
```

### Example 8: Programmatic Multi-Schema Generation

```ts
// Generate multiple APIs from different schemas
import { generate } from '@ssot-codegen/gen/api'

const schemas = [
  { name: 'Users API', path: './schemas/users.prisma' },
  { name: 'Products API', path: './schemas/products.prisma' },
  { name: 'Orders API', path: './schemas/orders.prisma' }
]

for (const schema of schemas) {
  const result = await generate({
    schema: schema.path,
    projectName: schema.name,
    output: `./services/${schema.name.toLowerCase().replace(' ', '-')}`
  })
  
  console.log(`✅ ${schema.name}: ${result.filesCreated} files`)
}
```

## Advanced Usage

### Custom Progress Tracking

```ts
class GenerationProgressTracker {
  private phases: Map<string, number> = new Map()
  
  track(event: ProgressEvent) {
    if (event.type === 'phase:end') {
      this.phases.set(event.phase!, event.filesGenerated || 0)
    }
  }
  
  getReport() {
    return Array.from(this.phases.entries())
      .map(([phase, files]) => `${phase}: ${files} files`)
      .join('\n')
  }
}

const tracker = new GenerationProgressTracker()

const result = await generate({
  schema: './schema.prisma',
  onProgress: (event) => tracker.track(event)
})

console.log('\nGeneration Report:')
console.log(tracker.getReport())
```

### Error Handling

```ts
import { generate, GeneratorError } from '@ssot-codegen/gen/api'

try {
  const result = await generate({
    schema: './schema.prisma'
  })
  
  if (!result.success) {
    // Partial failure (some files generated)
    console.warn(`Generation completed with errors`)
    console.warn(`Files created: ${result.filesCreated}`)
    console.warn(`Errors:`, result.errors)
  }
  
} catch (error) {
  if (error instanceof GeneratorError) {
    console.error(`Generator failed at phase: ${error.phase}`)
    console.error(`Cause:`, error.cause)
  } else {
    console.error('Unexpected error:', error)
  }
}
```

## vs CLI

| Feature | Public API | CLI |
|---------|------------|-----|
| **Import** | `import { generate }` | `npx ssot generate` |
| **Progress** | Callback function | Colored terminal output |
| **Errors** | Structured objects | Chalk-formatted messages |
| **Side Effects** | None | Auto-setup, execSync, browser |
| **Embeddable** | ✅ Yes | ❌ No |
| **Programmatic** | ✅ Yes | ❌ No (shell only) |
| **TypeScript** | ✅ Fully typed | Partial |

## Key Benefits

### ✅ No Side Effects
- No `console.log` calls
- No `execSync` or shell commands
- No colors/formatting in output
- Pure data in, data out

### ✅ Fully Typed
- TypeScript definitions for all options
- IntelliSense autocomplete
- Compile-time validation
- Type-safe results

### ✅ Embeddable
- Use in build tools (Vite, Webpack, Rollup)
- Integrate in CI/CD pipelines
- Add to testing frameworks
- Embed in your own CLIs

### ✅ Progress Monitoring
- Real-time progress callbacks
- Structured event data
- Filter by event type
- Build custom UIs

### ✅ Error Recovery
- Structured error objects
- Phase-level error reporting
- Partial generation support
- Graceful degradation

## Migration from Old API

### Before (index-new-refactored.ts)

```ts
import { generateFromSchema } from '@ssot-codegen/gen'

await generateFromSchema({
  schemaPath: './schema.prisma',
  output: './gen',
  framework: 'express',
  standalone: true
})
// ❌ Logs to console automatically
// ❌ Has side effects (console.log, colors)
// ❌ No structured progress
```

### After (Public API)

```ts
import { generate } from '@ssot-codegen/gen/api'

const result = await generate({
  schema: './schema.prisma',
  output: './gen',
  framework: 'express',
  standalone: true,
  onProgress: (event) => {
    // ✅ You control output
    console.log(event.message)
  }
})

// ✅ Structured result
// ✅ No side effects
// ✅ Fully typed
```

## Best Practices

### 1. Always Check Result Success

```ts
const result = await generate({ schema: './schema.prisma' })

if (!result.success) {
  // Handle failure
  console.error('Errors:', result.errors)
  process.exit(1)
}

// Success path
console.log(`Generated ${result.filesCreated} files`)
```

### 2. Use Verbosity Levels

```ts
// CI/CD: minimal logging
await generate({
  schema: './schema.prisma',
  verbosity: 'silent'  // No logs at all
})

// Development: detailed logging
await generate({
  schema: './schema.prisma',
  verbosity: 'verbose',  // Detailed progress
  onProgress: (event) => console.log(event)
})
```

### 3. Handle Progress Events

```ts
await generate({
  schema: './schema.prisma',
  onProgress: (event) => {
    if (event.type === 'error') {
      logger.error(event.message)
    } else if (event.type === 'warning') {
      logger.warn(event.message)
    } else {
      logger.info(event.message)
    }
  }
})
```

### 4. Validate Before Generating

```ts
// Step 1: Validate
const validation = await validateSchema('./schema.prisma')
if (!validation.valid) {
  throw new Error(`Invalid schema: ${validation.errors.join(', ')}`)
}

// Step 2: Analyze
const analysis = await analyzeSchema('./schema.prisma')
console.log(`Will generate code for ${analysis.models.length} models`)

// Step 3: Generate
const result = await generate({
  schema: './schema.prisma'
})
```

## Common Use Cases

### Build Tool Plugin

```ts
// rollup.config.js
import { generate } from '@ssot-codegen/gen/api'

export default {
  plugins: [
    {
      name: 'ssot-codegen',
      async buildStart() {
        await generate({
          schema: './schema.prisma',
          output: './src/api',
          standalone: false,
          verbosity: 'minimal'
        })
      }
    }
  ]
}
```

### Watch Mode Script

```ts
import { watch } from 'chokidar'
import { generate } from '@ssot-codegen/gen/api'

const watcher = watch('./prisma/schema.prisma')

watcher.on('change', async () => {
  console.log('Schema changed, regenerating...')
  
  const result = await generate({
    schema: './prisma/schema.prisma',
    verbosity: 'minimal'
  })
  
  console.log(`Regenerated ${result.filesCreated} files`)
})
```

### Microservices Generator

```ts
// Generate multiple services from different schemas
import { generate } from '@ssot-codegen/gen/api'

const services = ['auth', 'products', 'orders', 'users']

for (const service of services) {
  const result = await generate({
    schema: `./services/${service}/schema.prisma`,
    output: `./services/${service}/generated`,
    projectName: `${service}-service`,
    framework: 'fastify',
    standalone: false
  })
  
  console.log(`${service}: ${result.filesCreated} files`)
}
```

## FAQ

### Q: Can I use this without the CLI?

**Yes!** The public API is completely independent of the CLI. Install `@ssot-codegen/gen` and use the API directly.

### Q: Does it work with inline schemas?

**Yes!** Pass schema text instead of a file path:

```ts
await generate({
  schema: 'model User { id Int @id }'
})
```

### Q: Can I disable console output?

**Yes!** Use `verbosity: 'silent'` and don't pass `onProgress`:

```ts
await generate({
  schema: './schema.prisma',
  verbosity: 'silent'  // No output
})
```

### Q: Can I integrate with my own logger?

**Yes!** Use the `onProgress` callback:

```ts
import winston from 'winston'

const logger = winston.createLogger({...})

await generate({
  schema: './schema.prisma',
  onProgress: (event) => {
    logger.info(event.message, { phase: event.phase })
  }
})
```

### Q: Is it async?

**Yes!** All API functions return Promises. Use `await` or `.then()`.

### Q: Can I generate multiple projects in parallel?

**Yes!** Each `generate()` call is independent:

```ts
const results = await Promise.all([
  generate({ schema: './schema1.prisma' }),
  generate({ schema: './schema2.prisma' }),
  generate({ schema: './schema3.prisma' })
])
```

## Comparison: API vs CLI

### When to Use the API

✅ Embedding in build tools  
✅ CI/CD automation  
✅ Custom tooling  
✅ Programmatic generation  
✅ Testing frameworks  
✅ Watch mode scripts  

### When to Use the CLI

✅ Manual development workflow  
✅ Quick prototyping  
✅ Interactive setup  
✅ Terminal-based workflows  

## See Also

- [Migration Guide](../generator/TYPED_CONTEXT_MIGRATION.md)
- [Phase Architecture](../generator/TYPED_PHASES_COMPLETE.md)
- [Generator Types](../generator/types.ts)


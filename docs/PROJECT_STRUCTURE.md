# Project Structure & Architecture

Understanding the SSOT Codegen monorepo organization.

---

## Monorepo Layout

```
ssot-codegen/
├── packages/              # Core packages (npm workspaces)
│   ├── gen/              # Code generator engine
│   ├── cli/              # Command-line interface
│   ├── core/             # Shared utilities
│   ├── sdk-runtime/      # SDK runtime support
│   ├── schema-lint/      # Schema validation
│   └── templates-default/# Default templates
│
├── examples/             # Source schemas (version controlled)
│   ├── minimal/
│   ├── blog-example/
│   ├── ecommerce-example/
│   └── ai-chat-example/
│
├── generated/            # Output directory (gitignored)
│   └── <project>-<n>/    # Standalone projects
│
├── docs/                 # Documentation
├── scripts/              # Build & test scripts
└── .env                  # Development credentials (gitignored)
```

---

## Core Packages

### `packages/gen` - Generator Engine

**Purpose:** Parse Prisma schemas and generate code

**Key Files:**
- `src/index-new.ts` - Main generator orchestrator (~900 lines)
- `src/code-generator.ts` - Core generation logic
- `src/dmmf-parser.ts` - Prisma DMMF schema parser
- `src/generators/` - Template generators by category
- `src/plugins/` - Feature plugins (20 provider integrations)
- `src/templates/` - Code templates

**Exports:**
```typescript
export { generateFromSchema } from './index-new.js'
export { generateCode } from './code-generator.js'
export { PluginManager } from './plugins/plugin-manager.js'
```

---

### `packages/cli` - Command Line Interface

**Purpose:** User-facing CLI tool

**Key Files:**
- `src/cli.ts` - Commander.js setup
- `src/commands/` - Command implementations

**Commands:**
- `ssot list` - List examples
- `ssot generate <name>` - Generate project

**Binary:** `@ssot-codegen/cli/dist/cli.js`

---

### `packages/core` - Shared Utilities

**Purpose:** Common code shared across packages

**Contents:**
- Type definitions
- Utility functions
- Constants

---

### `packages/sdk-runtime` - SDK Runtime

**Purpose:** Runtime support for generated SDKs

**Contains:**
- Query builder utilities
- HTTP client abstractions
- Type helpers

---

### `packages/schema-lint` - Schema Validation

**Purpose:** Validate Prisma schemas before generation

**Features:**
- Detect invalid annotations
- Check model relationships
- Warn about anti-patterns

---

### `packages/templates-default` - Default Templates

**Purpose:** Default code templates

**Status:** Placeholder for future template override system

---

## Generator Architecture

### Phase-Based Generation

```
1. Parse Schema
   ↓ Prisma DMMF → ParsedSchema
   
2. Analyze
   ↓ Relationships, dependencies → ModelAnalysis
   
3. Validate
   ↓ Check models, fields, plugins → ValidationResult
   
4. Generate Code
   ↓ Templates → GeneratedFiles (Map<string, string>)
   
5. Write Files
   ↓ Parallel async writes → Disk
   
6. Scaffold Project
   ↓ package.json, tsconfig, etc. → Complete project
   
7. Generate Tests
   ↓ Self-validation suite → tests/
```

### Code Generation Flow

```typescript
generateFromSchema(config)
  ├─> parseSchema(schemaPath)
  ├─> validateSchema(parsed)
  ├─> analyzeRelationships(parsed)
  ├─> generateCode(parsed, config)
  │    ├─> generateContracts (DTOs)
  │    ├─> generateValidators (Zod)
  │    ├─> generateServices (Prisma CRUD)
  │    ├─> generateControllers (HTTP)
  │    ├─> generateRoutes (Express/Fastify)
  │    ├─> generateSDK (Client + React hooks)
  │    └─> generatePlugins (Feature integrations)
  ├─> writeFiles(generated)
  ├─> writeStandaloneProject()
  └─> generateChecklist()
```

---

## Plugin System

### Plugin Architecture

**Location:** `packages/gen/src/plugins/`

**Categories:**
```
plugins/
├── auth/          # Authentication (Google OAuth, JWT, API Keys)
├── ai/            # AI providers (OpenAI, Claude, Gemini, etc.)
├── voice/         # Voice AI (Deepgram, ElevenLabs)
├── storage/       # Cloud storage (S3, R2, Cloudinary)
├── payment/       # Payments (Stripe, PayPal)
├── email/         # Email (SendGrid, Mailgun)
└── monitoring/    # Usage tracking
```

### Plugin Lifecycle

```typescript
1. Registration (plugin-manager.ts)
   PluginManager.registerPlugins()
   
2. Validation
   plugin.validate(context) → ValidationResult
   
3. Generation
   plugin.generate(context) → PluginOutput {
     files: Map<string, string>
     routes: RouteDefinition[]
     middleware: MiddlewareDefinition[]
     envVars: Record<string, string>
     packageJson: { dependencies, devDependencies }
   }
   
4. Health Check (optional)
   plugin.healthCheck(context) → HealthCheckSection
   
5. Integration
   Files merged into generated project
   Routes registered in app
   Env vars added to .env.example
   Dependencies added to package.json
```

---

## Generator Generators

### `generators/` Directory

Each generator focuses on one aspect:

**Core Generators:**
- `dto-generator.ts` - TypeScript DTOs
- `validator-generator.ts` - Zod schemas
- `service-generator.ts` - Prisma CRUD
- `controller-generator.ts` - HTTP handlers
- `route-generator.ts` - Express/Fastify routes

**Advanced Generators:**
- `sdk-generator.ts` - Client SDK
- `hooks/` - React Query hooks
- `openapi-generator.ts` - OpenAPI specs
- `checklist-generator.ts` - Health dashboard
- `service-integration.generator.ts` - `@service` annotations

**Infrastructure:**
- `registry-generator.ts` - Registry pattern (78% less code)
- `barrel-generator.ts` - index.ts files

---

## Templates

### Template Organization

Templates live in `packages/gen/src/templates/`:

```
templates/
├── standalone-project.template.ts  # package.json, tsconfig, etc.
├── dto.template.ts                 # Data transfer objects
├── validator.template.ts           # Zod schemas
├── service.template.ts             # CRUD services
├── controller.template.ts          # HTTP controllers
├── route.template.ts               # Express routes
└── sdk/                            # SDK templates
    ├── client.template.ts
    └── hooks.template.ts
```

### Template Pattern

```typescript
export function generateTemplate(model: ParsedModel): string {
  return `// @generated
${generateImports(model)}

${generateTypeDefinitions(model)}

${generateImplementation(model)}

${generateExports(model)}
`
}
```

---

## File Writing Strategy

### Optimized Parallel Writes

```typescript
// Collect all write operations (no await yet)
const writes: Promise<void>[] = []

for (const [model, files] of generatedFiles) {
  for (const [filename, content] of files) {
    writes.push(writeFile(path, content))
  }
}

// Execute all in parallel
await Promise.all(writes)
```

**Performance:**
- Small schema: ~500 files in 0.1s
- Medium schema: ~1000 files in 0.17s
- Throughput: 900-1200 files/sec

---

## Testing Architecture

### Generator Tests

**Location:** `packages/gen/__tests__/`

**Types:**
- Unit tests - Individual generators
- Integration tests - Full generation cycles
- Plugin tests - Plugin validation & generation

**Framework:** Vitest

```bash
cd packages/gen
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # With coverage
```

### Generated Project Tests

Each generated project includes:

```
tests/
├── setup.ts                   # Vitest configuration
└── self-validation.test.ts    # Comprehensive validation
    ├─ Phase 1: Build & compile
    ├─ Phase 2: Database connection
    ├─ Phase 3: CRUD operations
    └─ Phase 4: API endpoints
```

---

## Extension Points

### 1. Custom Generators

Add new generators in `packages/gen/src/generators/`:

```typescript
export function generateMyFeature(schema: ParsedSchema): Map<string, string> {
  const files = new Map()
  
  for (const model of schema.models) {
    files.set(`${model.name}.my-feature.ts`, generateCode(model))
  }
  
  return files
}
```

Register in `code-generator.ts`:
```typescript
files.myFeature = generateMyFeature(schema)
```

### 2. Custom Plugins

Create plugin in `packages/gen/src/plugins/`:

```typescript
export class MyPlugin implements FeaturePlugin {
  // ... implementation
}
```

Register in `plugin-manager.ts`:
```typescript
if (features.myPlugin?.enabled) {
  this.plugins.set('my-plugin', new MyPlugin(config))
}
```

### 3. Custom Templates

Override templates by:
1. Create new generator function
2. Use template literal or external file
3. Replace existing generator call

---

## Configuration Flow

```
User runs: pnpm ssot generate blog-example

CLI (packages/cli/src/cli.ts)
  ├─> Parses command & options
  ├─> Finds schema path
  └─> Calls generateFromSchema()

Generator (packages/gen/src/index-new.ts)
  ├─> Reads .env (loads plugin config)
  ├─> Parses schema with Prisma
  ├─> Generates all code
  ├─> Writes to generated/<name>-<n>/
  └─> Returns success

Generated Project
  ├─> Has own package.json
  ├─> Includes src/ with all generated code
  ├─> Ready to: pnpm install && pnpm dev
  └─> Independent, standalone application
```

---

## Data Flow

### Prisma DMMF → Generated Code

```
Prisma Schema (.prisma file)
  ↓ @prisma/internals
DMMF (Data Model Meta Format)
  ↓ dmmf-parser.ts
ParsedSchema {
  models: ParsedModel[]
  enums: ParsedEnum[]
}
  ↓ relationship-analyzer.ts
ModelAnalysis {
  relationships: Map<string, Relationship[]>
  dependencies: Map<string, string[]>
}
  ↓ generators/*
GeneratedFiles {
  contracts: Map<model, Map<file, content>>
  services: Map<file, content>
  ...
}
  ↓ file-writer.ts
Disk (generated/<project>/)
```

---

## Performance Characteristics

### Time Complexity

- Schema parsing: O(n) where n = model count
- Relationship analysis: O(n × m) where m = avg fields per model
- Code generation: O(n × f) where f = files per model
- File writing: O(1) with Promise.all parallelization

### Space Complexity

- In-memory: All generated code stored before writing
- Disk: ~50-100 KB per model (varies by features)

### Bottlenecks

1. **Prisma schema parsing** - External dependency
2. **Template string concatenation** - Lots of string ops
3. **File I/O** - Mitigated by parallel writes

---

## Architectural Patterns

### Registry Pattern

**Purpose:** Reduce boilerplate (78% less code)

**Usage:** `--use-registry` flag

**Impact:**
- Centralized model/service registration
- Runtime factory pattern
- Dynamic route generation

### Plugin Pattern

**Purpose:** Extensible third-party integrations

**Benefits:**
- Isolated plugin code
- Declarative requirements
- Automatic dependency management
- Health check integration

### Service Integration Pattern

**Purpose:** Complex orchestration workflows

**Annotation:** `@service <name> <method1> <method2>...`

**Generated:**
- Service scaffold with TODO implementation
- Controller wrappers
- Routes
- SDK client

---

## Build Process

```bash
# From root
pnpm build

# Executes in each package:
pnpm -r --filter ./packages/* run build

# Each package:
cd packages/gen && tsc -p tsconfig.json
cd packages/cli && tsc -p tsconfig.json
...

# Output:
packages/gen/dist/
packages/cli/dist/
```

---

## Type Safety

### TypeScript Strategy

- **Strict mode enabled** throughout
- **No `any` types** (per user rules)
- **Full DMMF types** from `@prisma/internals`
- **Template type safety** via TypeScript template literals

### Generated Code Quality

- All generated code is **valid TypeScript**
- Includes **proper imports**
- Uses **path aliases** (`@/services`, `@/contracts`)
- **Type-safe** Zod validators

---

## Future Architecture

### Planned Improvements

1. **PhaseRunner pattern** - Break up monolithic generator
2. **Plugin hooks API** - Template overrides, lifecycle hooks
3. **Streaming generation** - For massive schemas (100+ models)
4. **Template marketplace** - Community templates
5. **Incremental generation** - Only regenerate changed models

---

## See Also

- [CLI Usage](CLI_USAGE.md) - Command reference
- [Quick Start](QUICKSTART.md) - Getting started guide
- [Plugin Development](../packages/gen/src/plugins/README.md) - Create plugins


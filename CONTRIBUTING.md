# Contributing to SSOT Codegen

Thank you for your interest in contributing! This guide will help you understand the project structure and how to extend it.

---

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm 9+
- Git
- A database (MySQL, PostgreSQL, or SQLite)

### Initial Setup

```bash
# 1. Clone the repository
git clone <repo-url> ssot-codegen
cd ssot-codegen

# 2. Install dependencies
pnpm install

# 3. Build all packages
pnpm build

# 4. Verify setup
pnpm check:all
```

---

## Project Architecture

### Monorepo Structure

```
ssot-codegen/
├── packages/
│   ├── gen/           # Generator engine (main logic)
│   ├── cli/           # CLI interface
│   ├── core/          # Shared utilities
│   └── sdk-runtime/   # SDK runtime support
│
├── examples/          # Test schemas
├── generated/         # Output (gitignored)
├── docs/              # Documentation
└── scripts/           # Build/test scripts
```

### Key Principles

1. **Keep files short** - Max 200 lines for application code
2. **DRY** - Reuse code, avoid redundancy
3. **SRP** - Single Responsibility Principle
4. **No `any` types** - Use proper TypeScript types
5. **Functional** - Prefer pure functions

---

## Adding New Features

### 1. Adding a New Generator

**Example:** Add a GraphQL schema generator

**Step 1:** Create generator file

```bash
touch packages/gen/src/generators/graphql-generator.ts
```

**Step 2:** Implement generator

```typescript
// packages/gen/src/generators/graphql-generator.ts
import type { ParsedSchema, ParsedModel } from '../dmmf-parser.js'

export function generateGraphQLSchema(schema: ParsedSchema): Map<string, string> {
  const files = new Map<string, string>()
  
  for (const model of schema.models) {
    files.set(`${model.name.toLowerCase()}.graphql`, generateModelSchema(model))
  }
  
  files.set('schema.graphql', generateRootSchema(schema))
  
  return files
}

function generateModelSchema(model: ParsedModel): string {
  return `type ${model.name} {
  ${model.scalarFields.map(f => `${f.name}: ${mapPrismaToGraphQL(f.type)}`).join('\n  ')}
}

input Create${model.name}Input {
  ${model.scalarFields.filter(f => !f.isId).map(f => `${f.name}: ${mapPrismaToGraphQL(f.type)}`).join('\n  ')}
}
`
}

function mapPrismaToGraphQL(type: string): string {
  const mapping: Record<string, string> = {
    'String': 'String',
    'Int': 'Int',
    'Boolean': 'Boolean',
    'DateTime': 'DateTime',
    'Float': 'Float'
  }
  return mapping[type] || 'String'
}
```

**Step 3:** Integrate into code generator

```typescript
// packages/gen/src/code-generator.ts
import { generateGraphQLSchema } from './generators/graphql-generator.js'

export interface GeneratedFiles {
  // ... existing
  graphql?: Map<string, string>
}

export function generateCode(...) {
  // ... existing phases
  
  // Add new phase
  files.graphql = generateGraphQLSchema(schema)
  
  return files
}
```

**Step 4:** Write files to disk

```typescript
// packages/gen/src/index-new.ts in writeGeneratedFiles()

// Add GraphQL file writing
if (files.graphql) {
  for (const [filename, content] of files.graphql) {
    const filePath = path.join(cfg.rootDir, 'graphql', filename)
    writes.push(write(filePath, content))
  }
}
```

**Step 5:** Test

```bash
cd packages/gen
pnpm build

cd ../..
pnpm ssot generate minimal

# Check output
ls -la generated/minimal-1/src/graphql/
```

---

### 2. Adding a New Plugin

**Example:** Add a Twilio SMS plugin

**Step 1:** Create plugin file

```bash
mkdir -p packages/gen/src/plugins/messaging
touch packages/gen/src/plugins/messaging/twilio.plugin.ts
```

**Step 2:** Implement plugin

```typescript
// packages/gen/src/plugins/messaging/twilio.plugin.ts
import type { FeaturePlugin, PluginContext, PluginOutput } from '../plugin.interface.js'

export interface TwilioConfig {
  accountSid?: string
  authToken?: string
  phoneNumber?: string
}

export class TwilioPlugin implements FeaturePlugin {
  name = 'twilio'
  version = '1.0.0'
  description = 'Twilio SMS messaging integration'
  enabled = true
  
  private config: TwilioConfig
  
  constructor(config?: TwilioConfig) {
    this.config = config || {}
  }
  
  requirements = {
    models: {},
    envVars: {
      required: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER']
    },
    dependencies: {
      runtime: {
        'twilio': '^4.19.0'
      },
      dev: {
        '@types/node': '^22.0.0'
      }
    }
  }
  
  validate(context: PluginContext) {
    // Validation logic
    return { valid: true, errors: [], warnings: [] }
  }
  
  generate(context: PluginContext): PluginOutput {
    const files = new Map<string, string>()
    
    files.set('providers/twilio.ts', this.generateTwilioProvider())
    files.set('services/sms.service.ts', this.generateSMSService())
    
    return {
      files,
      routes: [
        { path: '/sms/send', method: 'post', handler: 'services/sms.service.js' }
      ],
      envVars: {
        TWILIO_ACCOUNT_SID: this.config.accountSid || 'your_account_sid_here',
        TWILIO_AUTH_TOKEN: this.config.authToken || 'your_auth_token_here',
        TWILIO_PHONE_NUMBER: this.config.phoneNumber || '+1234567890'
      },
      packageJson: {
        dependencies: this.requirements.dependencies.runtime,
        devDependencies: this.requirements.dependencies.dev
      }
    }
  }
  
  private generateTwilioProvider(): string {
    return `// @generated
import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export const twilioProvider = {
  async sendSMS(to: string, message: string) {
    return await client.messages.create({
      to,
      from: process.env.TWILIO_PHONE_NUMBER!,
      body: message
    })
  }
}
`
  }
  
  private generateSMSService(): string {
    return `// @generated
import { twilioProvider } from '../providers/twilio.js'

export const smsService = {
  async sendMessage(to: string, message: string) {
    return await twilioProvider.sendSMS(to, message)
  }
}
`
  }
}
```

**Step 3:** Register plugin

```typescript
// packages/gen/src/plugins/plugin-manager.ts

import { TwilioPlugin } from './messaging/twilio.plugin.js'

export interface PluginManagerConfig {
  features?: {
    // ... existing
    twilio?: { enabled: boolean; accountSid?: string; authToken?: string; phoneNumber?: string }
  }
}

private registerPlugins(config: PluginManagerConfig): void {
  const features = config.features || {}
  
  // ... existing plugins
  
  if (features.twilio?.enabled) {
    this.plugins.set('twilio', new TwilioPlugin(features.twilio))
  }
}
```

**Step 4:** Enable via environment

```bash
# Add to .env
ENABLE_TWILIO=true
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="+1..."
```

**Step 5:** Update code generator

```typescript
// packages/gen/src/index-new.ts

features: {
  // ... existing
  twilio: process.env.ENABLE_TWILIO === 'true' ? {
    enabled: true,
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER
  } : undefined
}
```

**Step 6:** Test

```bash
pnpm build
pnpm ssot generate ai-chat-example

# Check output
ls -la generated/ai-chat-example-1/src/providers/twilio.ts
```

---

### 3. Adding Tests

#### Unit Tests

```typescript
// packages/gen/__tests__/my-feature.test.ts
import { describe, it, expect } from 'vitest'
import { generateMyFeature } from '../src/generators/my-feature.js'
import { createMockSchema } from './test-utils.js'

describe('MyFeature Generator', () => {
  it('should generate files for each model', () => {
    const schema = createMockSchema({
      models: [{ name: 'User', fields: [] }]
    })
    
    const result = generateMyFeature(schema)
    
    expect(result.size).toBe(1)
    expect(result.has('user.feature.ts')).toBe(true)
  })
})
```

#### Plugin Tests

```typescript
// packages/gen/src/plugins/__tests__/twilio.test.ts
import { describe, it, expect } from 'vitest'
import { TwilioPlugin } from '../messaging/twilio.plugin.js'
import { createMockPluginContext } from './plugin-test-utils.js'

describe('TwilioPlugin', () => {
  it('should generate Twilio provider', () => {
    const plugin = new TwilioPlugin()
    const context = createMockPluginContext()
    
    const output = plugin.generate(context)
    
    expect(output.files.has('providers/twilio.ts')).toBe(true)
    expect(output.envVars.TWILIO_ACCOUNT_SID).toBeDefined()
  })
})
```

---

## Code Style Guidelines

### TypeScript

```typescript
// ✅ Good - Typed, pure function
export function generateDTO(model: ParsedModel): string {
  return `export interface ${model.name}DTO {
    ${model.scalarFields.map(f => `${f.name}: ${f.type}`).join('\n  ')}
  }`
}

// ❌ Bad - Using 'any', side effects
export function generateDTO(model: any) {
  console.log('Generating...') // Side effect
  let result = ''  // Mutation
  for (const field of model.fields) {
    result += field.name + ': any\n'  // 'any' type
  }
  return result
}
```

### File Organization

```typescript
// ✅ Good - Short, focused file (~50-150 lines)
// user-dto.generator.ts
export function generateUserDTO(model: ParsedModel): string {
  return generateDTO(model, 'User')
}

// ❌ Bad - Monolithic file (>500 lines)
// all-generators.ts
export function generateEverything(...) {
  // 800 lines of mixed concerns
}
```

### Function Length

```typescript
// ✅ Good - Small, composable functions
export function generateService(model: ParsedModel): string {
  return `${generateImports(model)}

${generateServiceClass(model)}

${generateExports(model)}`
}

function generateServiceClass(model: ParsedModel): string {
  return `export class ${model.name}Service {
  ${generateMethods(model)}
}`
}

// ❌ Bad - Giant function
export function generateService(model: ParsedModel): string {
  // 200 lines of template logic all in one function
}
```

---

## Testing Guidelines

### Test Coverage Expectations

- **Generators:** 80%+ coverage
- **Plugins:** 90%+ coverage (they're isolated)
- **Utilities:** 95%+ coverage

### Test Organization

```
packages/gen/__tests__/
├── unit/              # Unit tests for generators
├── integration/       # Full generation cycles
└── plugins/           # Plugin-specific tests
```

### Mock Utilities

Use provided test utilities:

```typescript
import { 
  createMockSchema,
  createMockPluginContext,
  EnvMocker 
} from './test-utils.js'

// Mock schema
const schema = createMockSchema({
  models: [
    { name: 'User', fields: [...] }
  ]
})

// Mock environment
const envMocker = new EnvMocker()
envMocker.mock('API_KEY', 'test-key')

// ... test code ...

envMocker.restore()
```

---

## Pull Request Process

### 1. Create Feature Branch

```bash
git checkout -b feature/my-feature
# or
git checkout -b fix/issue-123
```

### 2. Make Changes

- Follow code style guidelines
- Keep files short (<200 lines)
- Add tests for new features
- Update documentation

### 3. Test Locally

```bash
# Run all checks
pnpm check:all

# Run generator tests
cd packages/gen
pnpm test

# Test generation
cd ../..
pnpm ssot generate minimal
cd generated/minimal-1
pnpm install
pnpm test:validate
```

### 4. Commit

```bash
git add -A
git commit -m "feat: add GraphQL generator"

# Commit message format:
# feat: New feature
# fix: Bug fix
# docs: Documentation
# test: Tests
# refactor: Code refactoring
# perf: Performance improvement
```

### 5. Push & PR

```bash
git push origin feature/my-feature
```

Create PR on GitHub with:
- Clear description
- Test results
- Screenshots (if UI changes)

---

## Common Tasks

### Add a New Template

**Location:** `packages/gen/src/templates/`

```typescript
// my-feature.template.ts
export function myFeatureTemplate(model: ParsedModel): string {
  return `// @generated
export class ${model.name}Feature {
  // ... your template
}
`
}
```

### Add a Test Utility

**Location:** `packages/gen/__tests__/test-utils.ts`

```typescript
export function createMockModel(name: string, fields: any[] = []): ParsedModel {
  return {
    name,
    scalarFields: fields,
    relationFields: [],
    // ...
  }
}
```

### Update Generated Project Template

**Location:** `packages/gen/src/templates/standalone-project.template.ts`

```typescript
export function packageJsonTemplate(options: StandaloneProjectOptions): string {
  return JSON.stringify({
    name: options.projectName,
    version: '1.0.0',
    // ... your additions
  }, null, 2)
}
```

---

## Plugin Development

### Plugin Interface

All plugins must implement:

```typescript
export interface FeaturePlugin {
  // Metadata
  name: string
  version: string
  description: string
  enabled: boolean
  
  // Requirements
  requirements: PluginRequirements
  
  // Core methods
  validate(context: PluginContext): ValidationResult
  generate(context: PluginContext): PluginOutput
  
  // Optional
  healthCheck?(context: PluginContext): HealthCheckSection
  beforeGeneration?(context: PluginContext): Promise<void>
  afterGeneration?(context: PluginContext, output: PluginOutput): Promise<void>
}
```

### Plugin Checklist

- [ ] Implements `FeaturePlugin` interface
- [ ] Declares all requirements (models, envVars, dependencies)
- [ ] Validates schema compatibility
- [ ] Generates type-safe code
- [ ] Includes health check (for checklist dashboard)
- [ ] Has comprehensive tests
- [ ] Documents setup in `docs/`
- [ ] Registered in `plugin-manager.ts`

---

## Documentation

### When to Document

- **New features** - Always document
- **API changes** - Update relevant docs
- **Bug fixes** - Update if behavior changes
- **Refactoring** - Update architecture docs if structure changes

### Documentation Files

- `README.md` - Main project overview
- `docs/CLI_USAGE.md` - Command reference
- `docs/PROJECT_STRUCTURE.md` - Architecture
- `docs/QUICKSTART.md` - Getting started
- `docs/CONTRIBUTING.md` - This file
- `docs/<PLUGIN>_SETUP.md` - Plugin-specific setup

### Inline Documentation

```typescript
/**
 * Generate DTO files for a Prisma model
 * 
 * @param model - Parsed Prisma model
 * @param config - Generation configuration
 * @returns Map of filename to file content
 * 
 * @example
 * ```typescript
 * const dtos = generateDTO(userModel, { readonly: true })
 * // Returns: { 'user.dto.ts': '...' }
 * ```
 */
export function generateDTO(
  model: ParsedModel,
  config: DTOConfig = {}
): Map<string, string> {
  // ...
}
```

---

## Performance Guidelines

### File Writing

```typescript
// ✅ Good - Parallel writes
const writes: Promise<void>[] = []
for (const file of files) {
  writes.push(writeFile(file))
}
await Promise.all(writes)

// ❌ Bad - Sequential writes
for (const file of files) {
  await writeFile(file)  // Slow!
}
```

### String Concatenation

```typescript
// ✅ Good - Template literals
const code = `export class ${model.name} {
  ${model.fields.map(f => `${f.name}: ${f.type}`).join('\n  ')}
}`

// ⚠️ Okay for small strings
let code = 'export class ' + model.name + ' {\n'
for (const field of model.fields) {
  code += '  ' + field.name + ': ' + field.type + '\n'
}

// ❌ Bad - Array joining for large templates
const lines = []
lines.push('export class')
// ... 100 lines later
return lines.join('\n')
```

### Loop Optimization

```typescript
// ✅ Good - Single pass
const dtos = schema.models.map(model => ({
  dto: generateDTO(model),
  validator: generateValidator(model),
  service: generateService(model)
}))

// ❌ Bad - Multiple passes
const dtos = schema.models.map(generateDTO)
const validators = schema.models.map(generateValidator)  // O(n) again
const services = schema.models.map(generateService)      // O(n) again
```

---

## Debugging

### Debug Generator

```bash
# Enable verbose logging
DEBUG=ssot:* pnpm ssot generate blog-example

# Check generated files
ls -R generated/blog-example-1/
```

### Debug Plugin

```typescript
// Add debug logging in your plugin
generate(context: PluginContext): PluginOutput {
  console.log('[MyPlugin] Generating files...')
  console.log('[MyPlugin] Context:', context)
  
  const files = new Map()
  // ...
  
  console.log('[MyPlugin] Generated files:', Array.from(files.keys()))
  return { files, /* ... */ }
}
```

### Test Single Generator

```typescript
// packages/gen/__tests__/debug.test.ts
import { generateDTO } from '../src/generators/dto-generator.js'

const model = {
  name: 'User',
  scalarFields: [{ name: 'id', type: 'Int' }]
}

const result = generateDTO(model)
console.log(result)  // Inspect output
```

---

## Versioning

### Version Scheme

We use **Semantic Versioning** (semver):
- `0.x.y` - Pre-1.0 (breaking changes allowed)
- `1.x.y` - Stable API
  - Major (1.0.0) - Breaking changes
  - Minor (1.1.0) - New features
  - Patch (1.0.1) - Bug fixes

### Updating Versions

**All packages must stay in sync:**

```bash
# Update root
vim package.json  # version: "0.5.0"

# Update all package versions
vim packages/cli/package.json  # version: "0.5.0"
vim packages/gen/package.json  # version: "0.5.0"
# ... etc
```

**Or use a script:**
```bash
# scripts/bump-version.js
const newVersion = '0.5.0'
// Update all package.json files
```

---

## Git Workflow

### Branches

- `master` - Stable, production-ready
- `develop` - Integration branch
- `feature/*` - New features
- `fix/*` - Bug fixes

### Commit After Milestones

Per user rules: **commit after milestones, never push unless instructed**

```bash
# After completing a feature
git add -A
git commit -m "feat: add Twilio SMS plugin"

# DO NOT push unless user approves
```

---

## Getting Help

### Where to Find Information

1. **This guide** - How to contribute
2. **README.md** - Project overview
3. **docs/PROJECT_STRUCTURE.md** - Architecture
4. **Existing code** - Best examples are in the codebase

### Ask Questions

- Check existing issues
- Review closed PRs for similar work
- Read plugin examples in `packages/gen/src/plugins/`

---

## Code Review Checklist

Before submitting a PR, ensure:

- [ ] Code follows style guidelines
- [ ] Files are short (<200 lines where possible)
- [ ] No `any` types used
- [ ] Tests added for new features
- [ ] All tests passing (`pnpm test`)
- [ ] Type checking passing (`pnpm typecheck`)
- [ ] Linting passing (`pnpm lint`)
- [ ] Documentation updated
- [ ] No console.logs in production code
- [ ] Git history is clean (squash if needed)
- [ ] Commit messages are descriptive

---

## Advanced Topics

### Optimizing Templates

Use **memoization** for expensive operations:

```typescript
const templateCache = new Map<string, string>()

function generateWithCache(model: ParsedModel): string {
  const key = `${model.name}-v1`
  
  if (templateCache.has(key)) {
    return templateCache.get(key)!
  }
  
  const result = generateExpensiveTemplate(model)
  templateCache.set(key, result)
  return result
}
```

### AST Manipulation

For complex code generation, consider using an AST:

```typescript
import * as ts from 'typescript'

function generateViaAST(model: ParsedModel) {
  const sourceFile = ts.createSourceFile(
    `${model.name}.ts`,
    '',
    ts.ScriptTarget.Latest
  )
  
  // Build AST programmatically
  // ...
  
  const printer = ts.createPrinter()
  return printer.printFile(sourceFile)
}
```

---

## Thank You!

Your contributions make SSOT Codegen better for everyone. We appreciate:
- Bug reports
- Feature suggestions
- Code contributions
- Documentation improvements
- Plugin development

**Happy coding!** 🚀


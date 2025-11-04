# Flexible Dependency Management System

A developer-friendly, configuration-driven system for managing project dependencies.

## 🎯 Design Goals

1. **Flexibility** - Choose what you need, skip what you don't
2. **Simplicity** - Sensible defaults, easy to understand
3. **Maintainability** - Centralized version management
4. **Extensibility** - Easy to add new features
5. **Type Safety** - Full TypeScript support

---

## 📦 Quick Start

### Option 1: Use a Profile (Recommended)

```typescript
import { resolveDependencies } from './dependencies/index.js'

// Minimal - just the essentials
const minimal = resolveDependencies({ profile: 'minimal' })

// Standard - balanced for most projects
const standard = resolveDependencies({ profile: 'standard' })

// Production - ready for production
const production = resolveDependencies({ profile: 'production' })

// Full - everything included
const full = resolveDependencies({ profile: 'full' })
```

### Option 2: Use Quick Configs

```typescript
import { resolveDependencies, QUICK_CONFIGS } from './dependencies/index.js'

// Pre-configured scenarios
const deps = resolveDependencies(QUICK_CONFIGS.productionApi)
const deps = resolveDependencies(QUICK_CONFIGS.fullStack)
const deps = resolveDependencies(QUICK_CONFIGS.microservice)
```

### Option 3: Custom Configuration

```typescript
const deps = resolveDependencies({
  profile: 'standard',
  features: ['logging', 'testing', 'linting'],
  framework: {
    name: 'express',
    plugins: ['core', 'security', 'validation']
  },
  versions: {
    'express': '^5.0.0'  // Override specific versions
  }
})
```

---

## 📋 Profiles

### Minimal
```typescript
{ profile: 'minimal' }
```
**Dependencies:**
- `@prisma/client`, `dotenv`
- `typescript`, `tsx`, `prisma`

**Use for:** Learning, prototypes, absolute minimum

### Standard (Recommended)
```typescript
{ profile: 'standard' }
```
**Dependencies:**
- Core: `@prisma/client`, `zod`, `dotenv`
- Security: `cors`, `helmet`
- Utilities: `compression`
- Dev: TypeScript tooling

**Use for:** Most new projects, balanced setup

### Production
```typescript
{ profile: 'production' }
```
**Dependencies:**
- Standard +
- Logging: `pino`, `pino-http`
- Security: `express-rate-limit`
- Error handling: `http-errors`

**Use for:** Production-ready applications

### Full
```typescript
{ profile: 'full' }
```
**Dependencies:**
- Production +
- Testing: `vitest`, `supertest`
- Linting: `eslint`, `@typescript-eslint/*`
- Formatting: `prettier`
- Utilities: `cookie-parser`

**Use for:** Enterprise projects, full development setup

---

## 🎛️ Features (Opt-In)

Add specific features to any profile:

```typescript
{
  profile: 'standard',
  features: [
    'logging',      // Structured logging with Pino
    'rateLimit',    // API rate limiting
    'compression',  // Response compression
    'cookies',      // Cookie support
    'fileUploads',  // Multer for file uploads
    'httpLogging',  // Morgan HTTP logging
    'testing',      // Vitest testing framework
    'linting',      // ESLint code quality
    'formatting',   // Prettier code style
    'validation',   // Express-validator
    'errorHandling' // HTTP-errors
  ]
}
```

### Available Features

| Feature | Description | Dependencies |
|---------|-------------|--------------|
| `logging` | JSON logging with Pino | pino, pino-http |
| `rateLimit` | Protect API from abuse | express-rate-limit |
| `compression` | Gzip/Brotli responses | compression |
| `cookies` | Parse cookies | cookie-parser |
| `fileUploads` | Handle file uploads | multer |
| `httpLogging` | Log HTTP requests | morgan |
| `testing` | Vitest framework | vitest, supertest |
| `linting` | Code quality | eslint, @typescript-eslint/* |
| `formatting` | Code style | prettier |
| `validation` | Request validation | express-validator |
| `errorHandling` | Better errors | http-errors |

### Feature Presets

```typescript
import { FEATURE_PRESETS } from './dependencies/index.js'

// Minimal API
features: FEATURE_PRESETS.api

// Production API
features: FEATURE_PRESETS.production

// Full-featured
features: FEATURE_PRESETS.fullstack

// Development tools only
features: FEATURE_PRESETS.development
```

---

## 🚀 Framework Support

### Express (Default)

```typescript
{
  framework: {
    name: 'express',
    plugins: ['core', 'security', 'validation']
  }
}
```

**Available Plugins:**
- `core` - morgan, compression, cookie-parser
- `security` - helmet, cors, rate-limit
- `validation` - express-validator
- `fileHandling` - multer

### Fastify (Alternative)

```typescript
{
  framework: {
    name: 'fastify',
    plugins: ['core', 'security', 'documentation']
  }
}
```

**Available Plugins:**
- `core` - compress, cookie
- `security` - helmet, cors, rate-limit
- `documentation` - swagger, swagger-ui

---

## 🔧 Version Management

### Centralized Versions

All versions managed in `versions.ts`:

```typescript
export const VERSIONS = {
  prisma: '^5.22.0',
  express: '^4.21.0',
  zod: '^3.25.0',
  // ... all dependencies
}
```

### Override Versions

```typescript
{
  profile: 'standard',
  versions: {
    'express': '^5.0.0',     // Use Express 5
    'typescript': '^5.6.0',  // Newer TypeScript
  }
}
```

### Version Validation

```typescript
import { isValidVersion } from './dependencies/index.js'

isValidVersion('^1.0.0')  // true
isValidVersion('~2.0.0')  // true
isValidVersion('invalid') // false
```

---

## 🗄️ Database Support

Auto-include database drivers:

```typescript
{
  database: {
    provider: 'postgresql',  // or 'mysql', 'sqlite', 'mongodb'
    includeDriver: true
  }
}
```

**Adds:**
- PostgreSQL: `pg`, `@types/pg`
- MySQL: `mysql2`
- SQLite: `better-sqlite3`, `@types/better-sqlite3`
- MongoDB: `mongodb`

---

## 📜 Script Generation

Scripts are generated based on your features:

### Base Scripts (Always Included)
```json
{
  "dev": "tsx watch src/server.ts",
  "build": "rimraf dist && tsc",
  "start": "node dist/server.js",
  "generate": "prisma generate",
  "db:push": "prisma db push",
  "db:migrate": "prisma migrate dev",
  "db:studio": "prisma studio",
  "typecheck": "tsc --noEmit"
}
```

### With Testing Feature
```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

### With Linting Feature
```json
{
  "lint": "eslint src --ext .ts",
  "lint:fix": "eslint src --ext .ts --fix"
}
```

### With Formatting Feature
```json
{
  "format": "prettier --write \"src/**/*.ts\"",
  "format:check": "prettier --check \"src/**/*.ts\""
}
```

### CI Script (Auto-Generated)
```json
{
  "ci": "npm run typecheck && npm run lint && npm run test"
}
```

---

## 💡 Examples

### Example 1: Simple REST API

```typescript
const deps = resolveDependencies({
  profile: 'standard',
  features: ['compression', 'errorHandling'],
  framework: { name: 'express' }
})
```

**Gets:**
- Core: Prisma, Zod, dotenv
- Security: CORS, Helmet
- Performance: Compression
- Error handling: http-errors
- Framework: Express

### Example 2: Production API with Logging

```typescript
const deps = resolveDependencies({
  profile: 'production',
  features: ['logging', 'rateLimit', 'testing'],
  framework: {
    name: 'express',
    plugins: ['core', 'security']
  }
})
```

**Gets:**
- Everything from Example 1
- Logging: Pino, Pino-HTTP
- Rate limiting: express-rate-limit
- Testing: Vitest, Supertest
- Express plugins: Morgan, Cookie-parser

### Example 3: Full Development Setup

```typescript
const deps = resolveDependencies({
  profile: 'full',
  framework: {
    name: 'express',
    plugins: ['core', 'security', 'validation', 'fileHandling']
  },
  database: {
    provider: 'postgresql',
    includeDriver: true
  }
})
```

**Gets:**
- All production dependencies
- Testing suite
- Linting (ESLint + TypeScript-ESLint)
- Formatting (Prettier)
- All Express plugins
- PostgreSQL driver

### Example 4: Fastify Microservice

```typescript
const deps = resolveDependencies({
  profile: 'production',
  features: ['logging', 'compression'],
  framework: {
    name: 'fastify',
    plugins: ['core', 'security', 'documentation']
  }
})
```

**Gets:**
- Core: Prisma, Zod
- Security: Helmet, CORS, Rate-limit (Fastify versions)
- Logging: Pino (native Fastify)
- Documentation: Swagger + Swagger-UI
- Performance: Compression

### Example 5: Using Quick Configs

```typescript
// Microservice with custom features
const deps = resolveDependencies({
  ...QUICK_CONFIGS.microservice,
  features: [...QUICK_CONFIGS.microservice.features, 'testing']
})

// Production API with SQLite
const deps = resolveDependencies({
  ...QUICK_CONFIGS.productionApi,
  database: { provider: 'sqlite', includeDriver: true }
})
```

---

## 🔍 API Reference

### resolveDependencies(config)

Main resolver function.

```typescript
function resolveDependencies(config?: DependencyConfig): ResolvedDependencies
```

**Returns:**
```typescript
{
  runtime: Record<string, string>,  // Runtime dependencies
  dev: Record<string, string>,      // Dev dependencies
  scripts: Record<string, string>,  // NPM scripts
  metadata: {
    profile: string,
    features: string[],
    framework: string
  }
}
```

### getProfile(name)

Get a specific profile.

```typescript
function getProfile(name: 'minimal' | 'standard' | 'production' | 'full'): DependencyProfile
```

### listProfiles()

List all available profiles.

```typescript
function listProfiles(): Array<{ name: string, description: string }>
```

### listFeatures()

List all available features.

```typescript
function listFeatures(): Array<{ name: string, description: string }>
```

### getVersion(key, override?)

Get a dependency version with optional override.

```typescript
function getVersion(key: VersionKey, override?: string): string
```

---

## 📊 Comparison

### Before (Hardcoded)
```typescript
// ❌ Inflexible
const pkg = {
  dependencies: {
    '@prisma/client': '^5.20.0',  // Hardcoded
    'express': '^4.19.2',         // Hardcoded
  }
}
```

### After (Flexible)
```typescript
// ✅ Configurable
const deps = resolveDependencies({
  profile: 'production',
  features: ['logging', 'testing'],
  versions: {
    'express': '^5.0.0'  // Easy to override
  }
})
```

---

## 🎨 Customization

### Add New Feature

```typescript
// In features.ts
export const FEATURES = {
  myFeature: {
    name: 'My Feature',
    description: 'Custom feature description',
    dependencies: {
      runtime: {
        'my-package': '^1.0.0'
      },
      dev: {}
    }
  }
}
```

### Add New Profile

```typescript
// In profiles.ts
export const MY_PROFILE: DependencyProfile = {
  name: 'my-profile',
  description: 'Custom profile',
  runtime: { /* deps */ },
  dev: { /* deps */ }
}
```

### Update Versions

```typescript
// In versions.ts - single source of truth
export const VERSIONS = {
  express: '^5.0.0',  // Update here, affects all
}
```

---

## 🚦 Best Practices

1. **Start with a profile** - Don't build from scratch
2. **Add features incrementally** - Don't enable everything
3. **Use version overrides sparingly** - Trust the defaults
4. **Use Quick Configs for common scenarios** - Pre-tested combinations
5. **Keep versions updated** - Update `versions.ts` regularly

---

## 📝 Maintenance

### Monthly Tasks
- [ ] Update `versions.ts` with latest stable versions
- [ ] Test updated versions
- [ ] Review new features to add
- [ ] Update documentation

### Version Update Checklist
1. Check npm for latest versions
2. Update `VERSIONS` in `versions.ts`
3. Test with all profiles
4. Update examples if needed
5. Document breaking changes

---

## 🐛 Troubleshooting

### Dependencies not resolving
```typescript
// Check metadata
const deps = resolveDependencies({ profile: 'standard' })
console.log(deps.metadata)  // See what was applied
```

### Version conflicts
```typescript
// Override specific versions
const deps = resolveDependencies({
  profile: 'standard',
  versions: {
    'problematic-package': '1.2.3'  // Pin to working version
  }
})
```

### Missing dependencies
```typescript
// Enable feature or add manually
const deps = resolveDependencies({
  profile: 'standard',
  features: ['testing']  // Adds test dependencies
})
```

---

## 🎓 Learning Path

1. **Start Simple** - Use `minimal` profile
2. **Add Features** - Try different features
3. **Try Profiles** - Explore standard/production
4. **Customize** - Override versions, add features
5. **Create Presets** - Build your own quick configs

---

**Next:** See `EXAMPLES.md` for more detailed examples and use cases.


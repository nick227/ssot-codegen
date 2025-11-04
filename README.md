# SSOT Codegen

**Single Source of Truth Code Generator**  
Model-driven code generation from Prisma schema to production-ready backends.

## Version 0.4.0 - POC Complete

A monorepo-based code generator that transforms your Prisma schema into:
- **DTOs** (TypeScript interfaces)
- **Validators** (Zod schemas)
- **Routes** (Express/Fastify-compatible)
- **Controllers** (Type-safe handlers)
- **Services** (Business logic stubs)
- **OpenAPI 3.1** specifications
- **Manifests** (Build metadata with pathMap)
- **Telemetry** hooks

### Architecture

```
Prisma Schema (SSOT)
  ↓
DMMF Ingestion
  ↓
Normalization
  ↓
Per-Model Generation
  ↓
/gen outputs (layer-first, per-model subfolders)
  ↓
Manifest + Path Resolution (@gen alias)
```

### Key Features

- ✅ **Deterministic Output**: Same schema → same code (timestamps vary)
- ✅ **Path Aliasing**: `@gen/*` imports via tsconfig paths
- ✅ **Barrel Exports**: Layer and model-level index files
- ✅ **Type Safety**: Generated imports use `import type`
- ✅ **Manifest Tracking**: Every file tracked with schemaHash
- ✅ **POSIX Paths**: Cross-platform import compatibility

## Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Generate code from example schema
pnpm run generate-example

# Output in examples/minimal/gen/
```

## Packages

- `@ssot-codegen/core` - DMMF normalization and types
- `@ssot-codegen/gen` - Main generator and CLI
- `@ssot-codegen/templates-default` - Handlebars templates (stub)
- `@ssot-codegen/sdk-runtime` - Client SDK runtime
- `@ssot-codegen/schema-lint` - Schema linting rules

## Usage

```bash
node packages/gen/dist/cli.js --out=./gen --models=User,Post
```

Or add to `prisma/schema.prisma`:
```prisma
generator ssot {
  provider = "@ssot-codegen/gen"
  output   = "../gen"
}
```

Then run: `prisma generate`

## Generated Structure

```
gen/
├── contracts/          # DTOs per model
│   ├── user/
│   │   ├── user.create.dto.ts
│   │   └── index.ts
│   └── index.ts
├── validators/         # Zod schemas
├── routes/            # Route definitions
├── controllers/       # Request handlers
├── services/          # Business logic
├── loaders/           # Data loaders
├── auth/              # Policy stubs
├── telemetry/         # Observability
├── openapi/           # OpenAPI spec
└── manifests/         # Build metadata
    └── build.json
```

## Consumer Setup

```typescript
// src/app.ts
import type { UserCreateDTO } from '@gen/contracts/user'
import { createUser } from '@gen/controllers/user'
```

Add to your `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@gen/*": ["./gen/*"]
    }
  }
}
```

## Status

**POC Complete (v0.4.0)**
- ✅ Monorepo build system
- ✅ Path resolver with aliases
- ✅ Barrel generation
- ✅ Manifest with pathMap
- ✅ OpenAPI 3.1 output
- ✅ TypeScript compilation verified
- ✅ Determinism validated

**Roadmap** (see TECHNOTES.md)
- Real DMMF ingestion via `@prisma/generator-helper`
- Schema comment tags (@route, @auth, @expose)
- Handlebars template integration
- Auth policy compiler
- Zod parity with DTOs
- Client SDK generation
- Performance optimizations

## Contributing

Do not edit files in `/gen` - all customization will be via `/src/extensions/*.ext.ts` hooks (future).

## License

MIT

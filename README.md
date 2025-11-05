# SSOT Codegen

**Single Source of Truth Code Generator** - Generate complete, production-ready backends from Prisma schemas.

## Features

- 🚀 **Full-Stack Generation** - DTOs, validators, services, controllers, routes, SDK
- 🧪 **Self-Validating** - Every project includes comprehensive integration tests
- 📦 **Standalone Projects** - Each generation is a complete, runnable project
- 🔄 **Incremental Builds** - Keep multiple generations for comparison
- 🎨 **Extension Patterns** - Examples show how to add custom business logic
- 🛡️ **Type-Safe** - Full TypeScript support throughout
- ⚡ **React Query Hooks** - Framework-agnostic hooks with React bindings

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Build the project
pnpm build

# 3. Generate from an example schema
pnpm ssot generate blog-example

# 4. Test the generated project
cd generated/blog-example-1
pnpm install
pnpm test:validate
pnpm dev
```

## Project Structure

```
ssot-codegen/
├── examples/              # Source schemas (version controlled)
│   ├── minimal/           # Simple: User, Post
│   ├── blog-example/      # Full blog platform
│   ├── ecommerce-example/ # Online store
│   └── ai-chat-example/   # AI integration
│
├── generated/             # Generated projects (gitignored)
│   ├── blog-example-1/    # Complete standalone project
│   ├── blog-example-2/    # Next generation
│   └── minimal-1/
│
└── packages/              # Core packages
    ├── gen/               # Code generator
    ├── cli/               # CLI tool
    ├── sdk-runtime/       # SDK runtime
    └── templates-default/ # Templates
```

## CLI Commands

```bash
# List available examples
pnpm ssot list

# Generate from example
pnpm ssot generate minimal
pnpm ssot generate blog-example
pnpm ssot generate ecommerce-example

# Generate from any schema file
pnpm ssot generate path/to/schema.prisma

# With options
pnpm ssot generate blog-example --name my-api --framework fastify
```

## What Gets Generated

Each project in `generated/` includes:

### Complete Application
- ✅ `package.json` - All dependencies
- ✅ `src/` - Express app, server, config, logger
- ✅ `prisma/schema.prisma` - Copy of source schema
- ✅ `tests/` - Full integration test suite
- ✅ `.env.example` - Environment template

### Generated API Code
- ✅ **DTOs** - TypeScript interfaces
- ✅ **Validators** - Zod schemas
- ✅ **Services** - Prisma CRUD operations
- ✅ **Controllers** - HTTP handlers
- ✅ **Routes** - Express routes
- ✅ **SDK** - TypeScript client + React Query hooks
- ✅ **OpenAPI** - API specification

### Self-Validation Tests
```
Phase 1: Build & Startup ✅
Phase 2: Database Connection ✅
Phase 3: CRUD Operations ✅
Phase 4: API Endpoints ✅
```

## Examples

### Minimal
Simple example with User and Post models.
```bash
pnpm ssot generate minimal
cd generated/minimal-1
pnpm install && pnpm dev
```

### Blog Platform
Complete blog with authors, posts, comments, categories, tags.
```bash
pnpm ssot generate blog-example
cd generated/blog-example-1
pnpm install && pnpm test:validate
```

### E-Commerce
Full online store with products, orders, payments, reviews.
```bash
pnpm ssot generate ecommerce-example
cd generated/ecommerce-1
```

### AI Chat
AI-powered chat with service integration patterns.
```bash
pnpm ssot generate ai-chat-example
cd generated/ai-chat-1
```

## Extension Patterns

Examples include `extensions/` folders showing how to add custom logic:

```typescript
// Import generated service
import { postService as generated } from '@gen/services/post'

// Extend with custom methods
export const postService = {
  ...generated,  // Keep all CRUD
  
  async search(query: string) {
    // Your custom logic
  }
}
```

See individual example READMEs for patterns.

## Documentation

- [CLI Usage](docs/CLI_USAGE.md) - Command reference
- [Project Structure](docs/PROJECT_STRUCTURE.md) - Architecture guide
- [Examples Overview](examples/README.md) - Available schemas
- [Quick Start](docs/QUICKSTART.md) - Getting started

## Development

```bash
# Build all packages
pnpm build

# Run linting
pnpm lint

# Type checking
pnpm typecheck

# Run all checks
pnpm check:all
```

## Benefits

- ✅ **Total Separation** - Source schemas isolated from generated code
- ✅ **Incremental Builds** - Keep multiple generations for comparison
- ✅ **Self-Validating** - Instant confidence with comprehensive tests
- ✅ **Production-Ready** - Complete with logging, error handling, validation
- ✅ **Type-Safe** - Full TypeScript throughout
- ✅ **Extensible** - Add custom logic without touching generated code

## License

MIT


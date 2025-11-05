# SSOT Codegen - Quick Start Guide

Get started with SSOT Codegen in 5 minutes!

## Prerequisites

- Node.js >= 18
- pnpm >= 9
- Git

## Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd ssot-codegen

# Install dependencies
pnpm install

# Build all packages
pnpm run build
```

## Try It Out - 3 Ways

### Option 1: Ultra-Light Demo (Recommended for First Time)

Generate a simple Todo application:

```bash
pnpm run demo
```

This will:
1. Generate code for a single Todo model
2. Run tests to verify everything works
3. Output ~20 files in `examples/demo-example/gen/`

**Generated files include:**
- DTOs (TypeScript interfaces)
- Validators (Zod schemas)
- Routes (Express/Fastify)
- Controllers (Request handlers)
- Services (Business logic)
- OpenAPI specification

### Option 2: Full Blog Platform

Generate a complete blog with 7 models:

```bash
pnpm run examples:blog
pnpm run test:blog
```

**Includes:**
- Author management with roles
- Posts with categories and tags
- Nested comment system
- Many-to-many relationships
- ~70+ generated files

### Option 3: Complete E-commerce Store

Generate a production-ready online store with 17 models:

```bash
pnpm run examples:ecommerce
pnpm run test:ecommerce
```

**Includes:**
- Customer & address management
- Product catalog with variants
- Shopping cart & wishlist
- Order processing
- Payment integration
- Shipment tracking
- Product reviews
- ~170+ generated files

## Understanding the Output

After generation, explore the `gen/` directory:

```
gen/
├── contracts/         # TypeScript DTOs
│   ├── todo/
│   │   ├── todo.create.dto.ts
│   │   └── index.ts
│   └── index.ts
├── validators/        # Zod validation schemas
├── routes/           # API routes
├── controllers/      # Request handlers
├── services/         # Business logic
├── loaders/          # DataLoader for N+1
├── auth/             # Auth policies
├── telemetry/        # Observability
├── openapi/          # OpenAPI 3.1 spec
└── manifests/        # Build metadata
    └── build.json
```

## Using Generated Code

### Import DTOs

```typescript
import type { TodoCreateDTO } from '@gen/contracts/todo'

const newTodo: TodoCreateDTO = {
  title: 'Learn SSOT Codegen',
  completed: false
}
```

### Import Controllers

```typescript
import { createTodo, getTodos } from '@gen/controllers/todo'

// In your Express app
app.post('/todos', createTodo)
app.get('/todos', getTodos)
```

### Import Routes

```typescript
import { todoRoutes } from '@gen/routes/todo'
import express from 'express'

const app = express()
app.use('/api', todoRoutes)
```

### Use OpenAPI Spec

```typescript
import openapiSpec from '@gen/openapi/openapi.json'

// Serve with Swagger UI
import swaggerUi from 'swagger-ui-express'
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec))
```

## Create Your Own Schema

### Step 1: Create a New Example

```bash
mkdir -p examples/my-project/prisma
cd examples/my-project
```

### Step 2: Define Your Schema

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  createdAt DateTime @default(now())
}
```

### Step 3: Create Generation Script

Create `scripts/generate.js`:

```javascript
#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { runGenerator } from '@ssot-codegen/gen';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

await runGenerator({
  outDir: resolve(projectRoot, 'gen'),
  models: ['User']
});

console.log('✅ Generation complete!');
```

### Step 4: Create package.json

```json
{
  "name": "my-project",
  "type": "module",
  "scripts": {
    "generate": "node ./scripts/generate.js"
  },
  "devDependencies": {
    "@ssot-codegen/gen": "workspace:*"
  }
}
```

### Step 5: Generate!

```bash
pnpm run generate
```

## Next Steps

### Test All Examples

```bash
pnpm run full-test
```

This runs:
1. Build all packages
2. Generate all examples
3. Run all tests

### Customize Generated Code

Currently (v0.4.0 POC), generated code is stubbed. Future versions will support:
- Extension hooks for custom logic
- Template customization
- Real Prisma DMMF integration

### Add to Your Existing Project

```bash
# Install in your project
npm install @ssot-codegen/gen @ssot-codegen/templates-default

# Add to prisma/schema.prisma
generator ssot {
  provider = "@ssot-codegen/gen"
  output   = "../src/generated"
}

# Generate
npx prisma generate
```

## Available Commands

### Build & Setup
```bash
pnpm install          # Install dependencies
pnpm run build        # Build all packages
pnpm run clean        # Clean dist folders
```

### Generate Examples
```bash
pnpm run demo                # Demo only (with tests)
pnpm run examples:demo       # Generate demo
pnpm run examples:blog       # Generate blog
pnpm run examples:ecommerce  # Generate e-commerce
pnpm run examples:all        # Generate all examples
```

### Testing
```bash
pnpm run test:demo           # Test demo
pnpm run test:blog           # Test blog
pnpm run test:ecommerce      # Test e-commerce
pnpm run test:examples       # Test all examples
pnpm run full-test           # Build + generate + test all
```

## Troubleshooting

### Generation Fails

1. Ensure packages are built: `pnpm run build`
2. Check Node version: `node --version` (should be >= 18)
3. Try cleaning: `pnpm run clean && pnpm run build`

### Import Errors

1. Check `tsconfig.json` includes path mapping:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@gen/*": ["./gen/*"]
       }
     }
   }
   ```

2. Ensure `tsconfig.paths.json` exists in project root

### Tests Failing

1. Regenerate: `pnpm run examples:all`
2. Check that `gen/` directory exists
3. Verify manifest: `cat examples/demo-example/gen/manifests/build.json`

## What's Next?

### Explore Examples
- [Demo README](./examples/demo-example/README.md) - Understand basics
- [Blog README](./examples/blog-example/README.md) - Learn relationships
- [E-commerce README](./examples/ecommerce-example/README.md) - See full complexity

### Read Documentation
- [EXAMPLES.md](./EXAMPLES.md) - Complete examples guide
- [TECHNOTES.md](./TECHNOTES.md) - Architecture details
- [ROADMAP.md](./ROADMAP.md) - Future features

### Learn More
- OpenAPI specs in `gen/openapi/openapi.json`
- Manifest tracking in `gen/manifests/build.json`
- Import patterns in generated controllers

## Get Help

- Check [EXAMPLES.md](./EXAMPLES.md) for detailed guides
- Review [TEST_RESULTS.md](./TEST_RESULTS.md) for test examples
- Read [VERIFICATION.md](./VERIFICATION.md) for validation steps

---

**Ready to build?** Start with `pnpm run demo` and explore the generated code! 🚀


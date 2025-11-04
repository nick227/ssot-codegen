# 🚀 SSOT Codegen Examples - Usage Guide

## Quick Command Reference

### 🎯 Try the Demo (Recommended First Step)
```bash
pnpm run demo
```
This will:
1. Build packages (if needed)
2. Generate Todo app (~20 files)
3. Run tests automatically
4. Show you what SSOT Codegen does

**Output**: `examples/demo-example/gen/`

---

### 📦 Generate Individual Examples

#### Demo - Single Table Todo
```bash
pnpm run examples:demo
```
- 1 model (Todo)
- ~20 files generated
- Perfect for learning

#### Blog - Complete Platform
```bash
pnpm run examples:blog
```
- 7 models (Author, Post, Comment, Category, Tag, etc.)
- ~70+ files generated
- Production-ready blog

#### E-commerce - Online Store
```bash
pnpm run examples:ecommerce
```
- 17 models (Product, Order, Customer, Cart, Payment, etc.)
- ~170+ files generated
- Production-ready store

#### All Examples at Once
```bash
pnpm run examples:all
```
Generates all 3 examples sequentially.

---

### 🧪 Run Tests

#### Test Individual Examples
```bash
pnpm run test:demo          # Test demo (7 tests)
pnpm run test:blog          # Test blog (8 tests)
pnpm run test:ecommerce     # Test e-commerce (12 tests)
```

#### Test All Examples
```bash
pnpm run test:examples
```
Runs master test suite for all examples with summary.

#### Full Test Pipeline
```bash
pnpm run full-test
```
Complete workflow:
1. Build all packages
2. Generate all examples
3. Run all tests
4. Show comprehensive results

---

## 📖 What Gets Generated?

### Every Example Creates:

```
gen/
├── contracts/         # TypeScript DTOs (Data Transfer Objects)
│   ├── {model}/
│   │   ├── {model}.create.dto.ts
│   │   └── index.ts
│   └── index.ts
│
├── validators/        # Zod validation schemas
│   ├── {model}/
│   │   ├── {model}.create.zod.ts
│   │   └── index.ts
│   └── index.ts
│
├── routes/           # Express/Fastify route definitions
│   ├── {model}/
│   │   ├── {model}.routes.ts
│   │   └── index.ts
│   └── index.ts
│
├── controllers/      # Request handlers
│   ├── {model}/
│   │   ├── {model}.controller.ts
│   │   └── index.ts
│   └── index.ts
│
├── services/         # Business logic layer
│   ├── {model}/
│   │   ├── {model}.service.ts
│   │   └── index.ts
│   └── index.ts
│
├── loaders/          # DataLoader for N+1 query prevention
├── auth/             # Authentication policies
├── telemetry/        # Observability hooks
├── openapi/          # OpenAPI 3.1 specification
│   └── openapi.json
│
└── manifests/        # Build metadata and tracking
    └── build.json    # Schema hash, outputs, pathMap
```

---

## 💻 Using Generated Code

### Import DTOs (Type Definitions)

```typescript
// Demo example
import type { TodoCreateDTO } from '@gen/contracts/todo'

const newTodo: TodoCreateDTO = {
  title: 'Learn SSOT Codegen',
  completed: false
}

// Blog example
import type { PostCreateDTO, PostReadDTO } from '@gen/contracts/post'

// E-commerce example
import type { 
  ProductCreateDTO, 
  OrderCreateDTO,
  CustomerReadDTO 
} from '@gen/contracts/{model}'
```

### Import Controllers

```typescript
// Demo
import { createTodo, getTodos, updateTodo } from '@gen/controllers/todo'

// Blog
import { 
  createPost, 
  getPosts, 
  getPostBySlug 
} from '@gen/controllers/post'

// E-commerce
import { 
  createOrder, 
  getOrders,
  processPayment 
} from '@gen/controllers/order'
```

### Import Routes

```typescript
import express from 'express'

// Demo
import { todoRoutes } from '@gen/routes/todo'
app.use('/api', todoRoutes)

// Blog
import { postRoutes } from '@gen/routes/post'
import { commentRoutes } from '@gen/routes/comment'
app.use('/api', postRoutes)
app.use('/api', commentRoutes)

// E-commerce
import { productRoutes } from '@gen/routes/product'
import { orderRoutes } from '@gen/routes/order'
import { cartRoutes } from '@gen/routes/cart'
app.use('/api', productRoutes)
app.use('/api', orderRoutes)
app.use('/api', cartRoutes)
```

### Use OpenAPI Spec

```typescript
import openapiSpec from '@gen/openapi/openapi.json'
import swaggerUi from 'swagger-ui-express'

// Serve API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec))

// Now visit: http://localhost:3000/api-docs
```

### Import Services (Business Logic)

```typescript
// E-commerce example
import { 
  createProduct,
  updateInventory,
  processOrder,
  calculateShipping
} from '@gen/services/{service}'
```

---

## 🎯 Example Scenarios

### Scenario 1: Learning SSOT Codegen

**Goal**: Understand how code generation works

**Steps**:
```bash
# 1. Generate demo
pnpm run examples:demo

# 2. Explore generated files
code examples/demo-example/gen/

# 3. Read generated DTO
cat examples/demo-example/gen/contracts/todo/todo.create.dto.ts

# 4. Check OpenAPI spec
cat examples/demo-example/gen/openapi/openapi.json

# 5. Run tests to verify
pnpm run test:demo
```

---

### Scenario 2: Building a Blog

**Goal**: Create a production blog platform

**Steps**:
```bash
# 1. Copy blog example as template
cp -r examples/blog-example my-blog

# 2. Customize schema (optional)
code my-blog/prisma/schema.prisma

# 3. Generate code
cd my-blog
pnpm run generate

# 4. Build your frontend
# - Import from @gen/contracts/post
# - Use @gen/controllers for API
# - Deploy!
```

**What You Get**:
- ✅ Author authentication
- ✅ Post CRUD with drafts
- ✅ Comment system
- ✅ Categories & tags
- ✅ OpenAPI spec
- ✅ Ready to deploy

---

### Scenario 3: Launching an E-commerce Store

**Goal**: Build a complete online store

**Steps**:
```bash
# 1. Copy e-commerce example
cp -r examples/ecommerce-example my-store

# 2. Setup database
createdb my_store
edit my-store/.env  # Add DATABASE_URL

# 3. Generate code
cd my-store
pnpm run generate

# 4. Run migrations
npx prisma migrate dev

# 5. Build storefront
# - Product catalog from @gen/contracts/product
# - Shopping cart from @gen/controllers/cart
# - Checkout from @gen/controllers/order
# - Payment integration ready
```

**What You Get**:
- ✅ Product catalog with variants
- ✅ Shopping cart
- ✅ Order processing
- ✅ Payment integration ready
- ✅ Shipment tracking
- ✅ Customer management
- ✅ Reviews & ratings
- ✅ Complete backend API

---

### Scenario 4: Creating Custom Schema

**Goal**: Generate code for your own schema

**Steps**:
```bash
# 1. Create project directory
mkdir my-project
cd my-project

# 2. Create prisma schema
mkdir -p prisma
cat > prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Task {
  id          Int      @id @default(autoincrement())
  title       String
  description String?
  status      String   @default("TODO")
  priority    Int      @default(0)
  dueDate     DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
EOF

# 3. Create generation script
mkdir scripts
cat > scripts/generate.js << 'EOF'
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { runGenerator } from '@ssot-codegen/gen';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

await runGenerator({
  outDir: resolve(projectRoot, 'gen'),
  models: ['Task']
});
EOF

# 4. Create package.json
cat > package.json << 'EOF'
{
  "name": "my-project",
  "type": "module",
  "scripts": {
    "generate": "node scripts/generate.js"
  }
}
EOF

# 5. Generate!
pnpm run generate

# 6. Check output
ls -la gen/
```

---

## 📊 Example Comparison

### When to Use Each Example

| Need | Use | Why |
|------|-----|-----|
| Learn basics | Demo | Simplest possible example |
| Quick POC | Demo | Fast to understand |
| Blog/CMS | Blog | Production-ready blog schema |
| News site | Blog | Content + comments + categories |
| Magazine | Blog | Multi-author platform |
| Online store | E-commerce | Complete store backend |
| Marketplace | E-commerce | Multi-vendor ready (extend) |
| B2B platform | E-commerce | Order management included |
| Custom project | Any | Copy and customize |

### Complexity Levels

```
Demo          [▓░░░░░░░░░] 10%  - 1 model, no relationships
Blog          [▓▓▓▓▓░░░░░] 50%  - 7 models, relationships
E-commerce    [▓▓▓▓▓▓▓▓▓▓] 100% - 17 models, all patterns
```

---

## 🔍 Exploring Generated Code

### Check What Was Generated

```bash
# List all generated files
ls -R examples/demo-example/gen/

# Count files
find examples/demo-example/gen -type f | wc -l

# View manifest
cat examples/demo-example/gen/manifests/build.json | jq

# Check OpenAPI
cat examples/blog-example/gen/openapi/openapi.json | jq '.paths'
```

### Understand Import Patterns

```bash
# Check how controllers import DTOs
grep -r "@gen/contracts" examples/demo-example/gen/controllers/

# Verify no deep relative imports
grep -r "\.\./\.\./\.\." examples/demo-example/gen/ || echo "✅ No deep imports!"

# Check barrel exports
cat examples/blog-example/gen/contracts/index.ts
```

---

## ⚙️ Configuration

### Path Aliases

Each example includes `tsconfig.json` with path mapping:

```json
{
  "compilerOptions": {
    "paths": {
      "@gen/*": ["./gen/*"]
    }
  }
}
```

This enables clean imports:
```typescript
import { Todo } from '@gen/contracts/todo'  // ✅ Clean
// Instead of:
// import { Todo } from '../../../gen/contracts/todo'  // ❌ Messy
```

### Environment Variables

For blog and e-commerce examples:

```bash
# Create .env file
echo 'DATABASE_URL="postgresql://user:pass@localhost:5432/mydb"' > .env
```

---

## 🐛 Troubleshooting

### Generation Fails

```bash
# Solution 1: Rebuild packages
pnpm run clean
pnpm run build

# Solution 2: Clear example gen folder
rm -rf examples/demo-example/gen
pnpm run examples:demo
```

### Tests Fail

```bash
# Regenerate examples
pnpm run examples:all

# Run tests again
pnpm run test:examples
```

### Import Errors

```bash
# Check tsconfig.paths.json exists
ls examples/demo-example/tsconfig.paths.json

# Check @gen mapping
grep "@gen" examples/demo-example/tsconfig.json
```

---

## 📈 Next Steps

### 1. Start Simple
```bash
pnpm run demo
```

### 2. Explore Output
```bash
code examples/demo-example/gen/
```

### 3. Try Blog
```bash
pnpm run examples:blog
```

### 4. Go Big
```bash
pnpm run examples:ecommerce
```

### 5. Build Your Own
```bash
cp -r examples/blog-example my-app
# Customize and deploy!
```

---

## 📚 Documentation

- [EXAMPLES.md](./EXAMPLES.md) - Comprehensive guide
- [QUICKSTART.md](./QUICKSTART.md) - 5-minute start
- [EXAMPLES_SUMMARY.md](./EXAMPLES_SUMMARY.md) - Implementation details
- Individual READMEs in each example folder

---

## 🎉 You're Ready!

```bash
# Start now
pnpm run demo

# Build production apps
pnpm run examples:blog        # → Blog
pnpm run examples:ecommerce   # → Store

# Ship it! 🚀
```

---

**SSOT Codegen v0.4.0**  
**"Complete websites in a box!"** 📦✨


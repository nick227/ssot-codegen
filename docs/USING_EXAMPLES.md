# How to Use SSOT Codegen Examples

A complete guide to loading, generating, and understanding the example projects.

---

## 🎯 Quick Start (First Time Users)

### Step 1: Install Everything
```bash
# Clone or navigate to the project
cd ssot-codegen

# Install dependencies (one time)
pnpm install

# Build all packages (one time)
pnpm run build
```

**What happens**: 
- Installs all dependencies for the monorepo
- Builds 5 packages: core, gen, templates-default, sdk-runtime, schema-lint
- Takes ~2 minutes

**Expected output**:
```
✅ @ssot-codegen/core built
✅ @ssot-codegen/gen built
✅ @ssot-codegen/templates-default built
✅ @ssot-codegen/sdk-runtime built
✅ @ssot-codegen/schema-lint built
```

---

### Step 2: Try Your First Example
```bash
# Generate the simple demo (recommended first)
pnpm run demo
```

**What happens**:
1. Reads `examples/demo-example/prisma/schema.prisma` (1 Todo model)
2. Generates ~20 files in `examples/demo-example/gen/`
3. Runs 7 automated tests
4. Shows you what was created

**Expected output**:
```
[demo-example] Generating code for Todo model...
[demo-example] Generation complete!

[demo-example] Running tests...

✅ Generated files exist
✅ Todo DTO generated correctly
✅ Controller uses @gen alias imports
✅ Routes file generated
✅ OpenAPI includes Todo paths
✅ Manifest tracks all generated files
✅ Barrel exports generated

7 passed, 0 failed
```

---

## 📦 Understanding What Gets Generated

### Every Example Creates This Structure:

```
examples/{example-name}/gen/
├── contracts/          # TypeScript DTOs (Data Transfer Objects)
│   ├── {model}/
│   │   ├── {model}.create.dto.ts     # For creating records
│   │   └── index.ts                   # Barrel export
│   └── index.ts                       # Layer barrel
│
├── validators/         # Zod validation schemas
│   ├── {model}/
│   │   ├── {model}.create.zod.ts
│   │   └── index.ts
│   └── index.ts
│
├── routes/            # Express/Fastify routes
│   ├── {model}/
│   │   ├── {model}.routes.ts
│   │   └── index.ts
│   └── index.ts
│
├── controllers/       # Request handlers
│   ├── {model}/
│   │   ├── {model}.controller.ts
│   │   └── index.ts
│   └── index.ts
│
├── services/          # Business logic
│   ├── {model}/
│   │   ├── {model}.service.ts
│   │   └── index.ts
│   └── index.ts
│
├── loaders/           # DataLoader (N+1 prevention)
│   ├── {model}/
│   │   ├── {model}.loader.ts
│   │   └── index.ts
│   └── index.ts
│
├── auth/              # Auth policies (stub)
│   └── index.ts
│
├── telemetry/         # Observability hooks
│   ├── {model}/
│   │   └── {model}.telemetry.ts
│   └── index.ts
│
├── openapi/           # OpenAPI 3.1 specification
│   ├── openapi.json   # Complete API spec
│   └── index.ts
│
├── manifests/         # Build tracking
│   ├── build.json     # Schema hash, file list, pathMap
│   └── index.ts
│
├── shared/            # Common utilities
│   └── index.ts
│
└── sdk/               # SDK stubs
    └── index.ts
```

---

## 🎨 The Three Examples

### 1. 🎯 Demo Example (Ultra-Simple)

**Purpose**: Learn the basics with minimal complexity

```bash
pnpm run demo
```

**Schema**: 1 model (Todo)
```prisma
model Todo {
  id        Int      @id @default(autoincrement())
  title     String
  completed Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**What you get**:
- ~20 files generated
- 1 API route (`/todos`)
- All layers (contracts, controllers, routes, etc.)
- OpenAPI spec
- Complete CRUD operations

**Generated endpoints**:
- `GET /todos` - List all
- `GET /todos/:id` - Get one
- `POST /todos` - Create
- `PUT /todos/:id` - Update
- `DELETE /todos/:id` - Delete

**Explore the output**:
```bash
# See what was generated
ls -la examples/demo-example/gen/

# Read a generated file
cat examples/demo-example/gen/contracts/todo/todo.create.dto.ts

# Check the OpenAPI spec
cat examples/demo-example/gen/openapi/openapi.json
```

---

### 2. 📝 Blog Example (Medium Complexity)

**Purpose**: Learn relationships and real-world patterns

```bash
pnpm run examples:blog
pnpm run test:blog
```

**Schema**: 7 models
- Author (with roles)
- Post (with categories & tags)
- Comment (nested replies)
- Category
- Tag
- PostCategory (junction)
- PostTag (junction)

**What you get**:
- ~70+ files generated
- 7 models with full CRUD
- Many-to-many relationships
- Nested comments
- Role-based access patterns
- Complete blog backend

**Generated endpoints**:
- `/authors` - User management
- `/posts` - Blog posts
- `/comments` - Comment system
- `/categories` - Content organization
- `/tags` - Flexible tagging

**Use case**: Copy this for:
- Personal blogs
- Company blogs
- News websites
- Content management systems
- Publishing platforms

---

### 3. 🛒 E-commerce Example (Production Ready)

**Purpose**: Complete online store, ready to deploy

```bash
pnpm run examples:ecommerce
pnpm run test:ecommerce
```

**Schema**: 24 models (PRODUCTION-READY)
- Customer (with auth & loyalty)
- Product (with SEO & variants)
- Order (with tracking)
- Cart (with variants)
- Payment
- Shipment
- **Coupon** (discounts)
- **Refund** (returns)
- **StockReservation** (prevent overselling)
- Review (with images)
- And 14 more...

**What you get**:
- ~240+ files generated
- 24 models with full CRUD
- Complete inventory management
- Marketing & promotions
- Returns & refunds system
- Customer engagement
- Production-ready e-commerce

**Generated endpoints**:
- `/customers` - User accounts
- `/products` - Product catalog
- `/cart` - Shopping cart
- `/orders` - Order processing
- `/coupons` - Discount codes
- `/refunds` - Returns handling
- And 18 more endpoints...

**Use case**: Deploy this for:
- Online stores
- Marketplaces
- B2B platforms
- Subscription services

---

## 🔍 Exploring Generated Code

### Example: Todo DTO (Demo Example)

```typescript
// examples/demo-example/gen/contracts/todo/todo.create.dto.ts

// @generated
// This file is automatically generated. Do not edit manually.

export interface TodoCreateDTO {
  title: string
  completed?: boolean
}
```

### Example: Controller (Demo Example)

```typescript
// examples/demo-example/gen/controllers/todo/todo.controller.ts

// @generated
import type { TodoCreateDTO } from '@gen/contracts/todo'

export async function createTodo(dto: TodoCreateDTO) {
  // TODO: Implement create logic
  console.log('Creating todo:', dto)
}

export async function getTodos() {
  // TODO: Implement list logic
  console.log('Getting todos')
}
```

**Notice**:
- ✅ Uses `@gen/contracts/todo` alias (not `../../../`)
- ✅ Has `@generated` marker
- ✅ Type-safe imports
- ✅ Ready to implement

### Example: OpenAPI Spec

```json
// examples/demo-example/gen/openapi/openapi.json
{
  "openapi": "3.1.0",
  "info": {
    "title": "Generated API",
    "version": "1.0.0"
  },
  "paths": {
    "/todo": {
      "get": { /* List todos */ },
      "post": { /* Create todo */ }
    }
  },
  "components": {
    "schemas": {
      "TodoReadDTO": { /* Schema definition */ }
    }
  }
}
```

---

## 🎯 Using Generated Code in Your Project

### Step 1: Import What You Need

```typescript
// src/app.ts
import express from 'express'
import type { TodoCreateDTO } from '@gen/contracts/todo'
import { createTodo, getTodos } from '@gen/controllers/todo'
import { todoRoutes } from '@gen/routes/todo'

const app = express()
app.use(express.json())

// Option 1: Use routes directly
app.use('/api', todoRoutes)

// Option 2: Use controllers manually
app.post('/api/todos', async (req, res) => {
  const dto: TodoCreateDTO = req.body
  const result = await createTodo(dto)
  res.json(result)
})

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})
```

### Step 2: Configure TypeScript

Your `tsconfig.json` should have:
```json
{
  "compilerOptions": {
    "paths": {
      "@gen/*": ["./gen/*"]
    }
  }
}
```

**This is automatically created** in each example as `tsconfig.paths.json`

### Step 3: Implement Business Logic

Generated files are **stubs** - you add the logic:

```typescript
// gen/controllers/todo/todo.controller.ts

import type { TodoCreateDTO } from '@gen/contracts/todo'
import prisma from '@/lib/prisma'  // Your Prisma client

export async function createTodo(dto: TodoCreateDTO) {
  // Replace stub with real implementation
  return await prisma.todo.create({
    data: dto
  })
}

export async function getTodos() {
  return await prisma.todo.findMany()
}
```

---

## 🧪 Understanding Tests

### What Tests Check

Each example includes automated tests that verify:

1. ✅ **Files Generated** - All expected files exist
2. ✅ **Import Patterns** - Uses `@gen` alias, no deep relatives
3. ✅ **OpenAPI Spec** - Valid 3.1.0 specification
4. ✅ **Manifest** - All files tracked with schema hash
5. ✅ **Barrel Exports** - Index files work correctly
6. ✅ **Type Safety** - TypeScript types are correct

### Running Tests

```bash
# Test individual examples
pnpm run test:demo
pnpm run test:blog
pnpm run test:ecommerce

# Test all at once
pnpm run test:examples
```

### Example Test Output

```
[demo-example] Running tests...

✅ Generated files exist
✅ Todo DTO generated correctly
✅ Controller uses @gen alias imports
✅ Routes file generated
✅ OpenAPI includes Todo paths
✅ Manifest tracks all generated files
✅ Barrel exports generated

7 passed, 0 failed
```

---

## 🔄 Regenerating Code

### When to Regenerate

You'll regenerate when you:
- Change the Prisma schema
- Add new models
- Modify existing models
- Update field types

### How to Regenerate

```bash
# Demo
pnpm run examples:demo

# Blog
pnpm run examples:blog

# E-commerce
pnpm run examples:ecommerce

# All examples
pnpm run examples:all
```

**What happens**:
- Reads your schema
- Generates fresh code
- Updates manifest with new schema hash
- Overwrites all files in `/gen`

⚠️ **Important**: Never edit files in `/gen` directly - they'll be overwritten!

---

## 📋 Common Workflows

### Workflow 1: "I'm Learning"

```bash
# Start here
pnpm install && pnpm run build

# Try the simplest example
pnpm run demo

# Explore what was created
code examples/demo-example/gen/

# Read the generated files
cat examples/demo-example/gen/contracts/todo/todo.create.dto.ts
cat examples/demo-example/gen/controllers/todo/todo.controller.ts
```

---

### Workflow 2: "I'm Building a Blog"

```bash
# Generate blog example
pnpm run examples:blog

# Copy to your project
cp -r examples/blog-example my-blog
cd my-blog

# Customize the schema
edit prisma/schema.prisma

# Regenerate with your changes
pnpm run generate

# Start implementing
code gen/controllers/post/post.controller.ts
```

---

### Workflow 3: "I'm Launching a Store"

```bash
# Generate e-commerce
pnpm run examples:ecommerce

# Copy to your project
cp -r examples/ecommerce-example my-store
cd my-store

# Set up database
edit .env  # Add DATABASE_URL

# Run migrations
npx prisma migrate dev

# Regenerate
pnpm run generate

# Start building your frontend
# Import from @gen/contracts/product, etc.
```

---

### Workflow 4: "I'm Customizing"

```bash
# Start with closest example
cp -r examples/ecommerce-example my-app

# Edit schema
edit prisma/schema.prisma

# Add your models
model MyCustomModel {
  id    Int    @id @default(autoincrement())
  name  String
  // ... your fields
}

# Update generation script
edit scripts/generate.js
// Add 'MyCustomModel' to models array

# Generate
pnpm run generate

# Use your custom model
import type { MyCustomModelCreateDTO } from '@gen/contracts/mycustommodle'
```

---

## ⚡ Quick Reference

### Generate Commands
```bash
pnpm run demo                  # Demo + tests
pnpm run examples:demo         # Demo only
pnpm run examples:blog         # Blog only
pnpm run examples:ecommerce    # E-commerce only
pnpm run examples:all          # All three
```

### Test Commands
```bash
pnpm run test:demo
pnpm run test:blog
pnpm run test:ecommerce
pnpm run test:examples         # All tests
```

### Utility Commands
```bash
pnpm run build                 # Build packages
pnpm run clean                 # Clean dist folders
pnpm run full-test             # Build + generate + test
```

---

## 🎓 What to Expect - Step by Step

### First Time (Cold Start)

**Commands**:
```bash
pnpm install   # ~2 minutes
pnpm run build # ~30 seconds
pnpm run demo  # ~5 seconds
```

**Total time**: ~3 minutes

**What you see**:
1. Installing dependencies progress bar
2. Building 5 packages with TypeScript
3. Generation output
4. Test results

---

### Subsequent Runs (Hot Start)

**Commands**:
```bash
pnpm run demo  # ~2 seconds (already built)
```

**What you see**:
```
[demo-example] Generating code for Todo model...
[demo-example] Generation complete!
✅ All tests passed
```

---

### When You Customize

**Steps**:
1. Edit `prisma/schema.prisma`
2. Run `pnpm run generate`
3. See new files in `gen/`
4. Import and use them

**Time**: ~2-5 seconds per generation

---

## 🚨 Troubleshooting

### "Generation fails"

**Solution**:
```bash
pnpm run clean
pnpm run build
pnpm run examples:demo
```

### "Imports don't work"

**Check**:
1. `tsconfig.json` has `paths` configuration
2. `@gen/*` points to `./gen/*`
3. You're in the right directory

### "Tests fail"

**Common causes**:
- Didn't generate first
- Old generated files

**Solution**:
```bash
rm -rf examples/demo-example/gen
pnpm run examples:demo
pnpm run test:demo
```

---

## 📚 Next Steps

### 1. **Try It**
```bash
pnpm run demo
```

### 2. **Explore**
```bash
code examples/demo-example/gen/
```

### 3. **Learn**
- Read generated files
- Check OpenAPI spec
- Review tests

### 4. **Build**
- Copy an example
- Customize schema
- Implement business logic
- Deploy!

---

## 💡 Pro Tips

1. **Start Simple**: Use demo first, then blog, then e-commerce
2. **Read Generated Code**: Learn patterns from the output
3. **Use OpenAPI**: Generate client SDKs from openapi.json
4. **Copy & Customize**: Examples are templates - make them yours
5. **Don't Edit /gen**: Regenerate instead of manual edits
6. **Use Tests**: They show what's working

---

## 🎯 Remember

### Generated Code is a **Starting Point**

- ✅ DTOs define your types
- ✅ Controllers are stubs - you implement logic
- ✅ Routes are templates - customize as needed
- ✅ OpenAPI is complete - use for client SDKs
- ✅ Manifest tracks everything - use for audits

### You **Own** the Code

- Copy examples to your project
- Modify schemas freely
- Regenerate anytime
- Build your application!

---

**Ready to generate?** → `pnpm run demo` 🚀


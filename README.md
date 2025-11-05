# SSOT Codegen - Single Source of Truth Code Generator

> Transform your Prisma schema into production-ready, type-safe CRUD APIs in seconds.

[![Coverage](https://img.shields.io/badge/coverage-98.5%25-brightgreen)]()
[![Tests](https://img.shields.io/badge/tests-532%20passing-brightgreen)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)]()

## Why SSOT Codegen?

Stop writing repetitive CRUD code. Define your data models once in Prisma, and get:

- **Full-stack type safety** from database to API to client
- **Production-ready code** with validation, error handling, and best practices
- **40+ files per model** including services, controllers, routes, DTOs, and SDKs
- **Zero boilerplate** - focus on business logic, not infrastructure

### Example: 2 Models → 40 Files → 5 Minutes

```prisma
model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  posts Post[]
}

model Post {
  id       Int    @id @default(autoincrement())
  title    String
  authorId Int
  author   User   @relation(fields: [authorId], references: [id])
}
```

Run `npx ssot generate` and get a complete, working API with TypeScript types, Zod validation, REST endpoints, and a type-safe SDK.

## Features

| Feature | Description |
|---------|-------------|
| **Full CRUD Generation** | Complete backend operations (create, read, update, delete, list, count) |
| **Type Safety** | End-to-end TypeScript with strict types and Zod validation |
| **Framework Support** | Express and Fastify adapters |
| **Client SDK** | Auto-generated type-safe frontend SDK with error handling |
| **Production Ready** | Proper error handling, validation, pagination, and filtering |
| **Service Integration** | External API integration via `@service` annotations |
| **OpenAPI Spec** | Auto-generated OpenAPI 3.0 documentation |
| **Domain Methods** | Smart generation based on field patterns (e.g., `findBySlug`, `publish`) |
| **Extensible** | Easy to customize and extend generated code |

## Quick Start

### Installation

Choose your preferred method:

#### Option 1: Add to Existing Project

```bash
npm install -D @ssot-codegen/gen
# or
pnpm add -D @ssot-codegen/gen
# or
yarn add -D @ssot-codegen/gen
```

#### Option 2: Clone Repository (for development)

```bash
git clone https://github.com/your-org/ssot-codegen
cd ssot-codegen
pnpm install
pnpm build
```

### Your First Generation

#### Step 1: Create Your Schema

Create or use an existing `prisma/schema.prisma`:

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
  updatedAt DateTime @updatedAt
}
```

#### Step 2: Create Generation Script

Create `scripts/generate.js`:

```javascript
#!/usr/bin/env node
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { runGenerator } from '@ssot-codegen/gen'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')

await runGenerator({
  outDir: resolve(projectRoot, 'gen'),
  models: ['User'] // or leave empty to generate all models
})

console.log('✅ Generation complete!')
```

#### Step 3: Generate

```bash
node scripts/generate.js
```

#### Step 4: Use Generated Code

```typescript
// Import generated service
import { userService } from './gen/services/user/user.service.js'

// Create a user
const user = await userService.create({
  email: 'alice@example.com',
  name: 'Alice Smith'
})

// Query users with filtering and pagination
const users = await userService.findMany({
  where: { 
    email: { contains: 'example.com' }
  },
  skip: 0,
  take: 10,
  orderBy: 'createdAt:desc'
})

// Get single user
const foundUser = await userService.findUnique({ 
  where: { id: user.id } 
})

// Update user
await userService.update({
  where: { id: user.id },
  data: { name: 'Alice Johnson' }
})

// Delete user
await userService.delete({ where: { id: user.id } })
```

## What Gets Generated

From a simple Prisma schema:

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  slug      String   @unique
  content   String
  published Boolean  @default(false)
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

SSOT Codegen generates **~40 files** of production-ready code:

```
gen/
├── contracts/          # TypeScript DTOs for each operation
│   ├── user/
│   │   ├── user.create.dto.ts      ← Type for creating users
│   │   ├── user.update.dto.ts      ← Type for updating users
│   │   ├── user.read.dto.ts        ← Type for reading users
│   │   ├── user.query.dto.ts       ← Type for querying users
│   │   └── index.ts
│   └── post/...                    ← Same structure for posts
│
├── validators/         # Zod validation schemas
│   ├── user/
│   │   ├── user.create.schema.ts   ← Validates create payload
│   │   ├── user.query.schema.ts    ← Validates query params
│   │   └── index.ts
│   └── post/...
│
├── services/           # Database operations layer
│   ├── user/
│   │   ├── user.service.ts         ← findMany, create, update, delete, count
│   │   └── index.ts
│   └── post/
│       ├── post.service.ts         ← + findBySlug, publish, unpublish
│       └── index.ts
│
├── controllers/        # HTTP request handlers
│   ├── user/
│   │   ├── user.controller.ts      ← Express/Fastify handlers
│   │   └── index.ts
│   └── post/...
│
├── routes/             # Route definitions
│   ├── user/
│   │   ├── user.routes.ts          ← REST endpoint mappings
│   │   └── index.ts
│   └── post/...
│
├── sdk/                # Type-safe client SDK
│   ├── user.client.ts              ← Frontend API client
│   ├── post.client.ts
│   ├── index.ts                    ← Aggregated SDK
│   └── ARCHITECTURE.md             ← SDK documentation
│
├── base/               # Base classes and utilities
│   ├── base.service.ts             ← Common service patterns
│   ├── base.controller.ts          ← Common controller patterns
│   └── index.ts
│
├── openapi/            # API documentation
│   └── openapi.json                ← OpenAPI 3.0 specification
│
└── manifests/          # Build metadata
    └── build.json                  ← Generation manifest
```

### Generated Code Quality

- **Type-safe**: Full TypeScript with no `any` types
- **Validated**: Zod schemas for runtime validation
- **Tested**: 98.5% test coverage
- **Documented**: Inline JSDoc comments
- **Production-ready**: Error handling, logging hooks, pagination

## Working Examples

Explore complete, runnable examples showing real-world usage:

### 🚀 [Minimal Example](./examples/minimal) - Your Starting Point

**Best for**: First-time users, understanding core concepts

```bash
cd examples/minimal
pnpm install && pnpm generate && pnpm test
```

**What you'll learn**:
- Basic CRUD operations
- Simple one-to-many relationships (User → Todo)
- Type-safe service usage
- DTO patterns

**Stats**: 2 models → ~40 generated files → 5 min setup

---

### 📝 [Blog Example](./examples/blog-example) - Content Management

**Best for**: Learning relationships, auth, and complex workflows

```bash
cd examples/blog-example
pnpm install && pnpm generate && pnpm db:setup && pnpm dev
```

**What you'll learn**:
- Multi-model relationships (1-to-many, many-to-many)
- Role-based access control (RBAC)
- Publishing workflows (draft → published)
- Nested comment threads
- Category and tag systems
- Full integration testing

**Stats**: 7 models → ~100 generated files → 10 min setup

**Includes**:
- JWT authentication
- Author/Editor/Admin roles
- SEO-friendly slugs
- View counters
- Comment approval system

---

### 🛒 [E-Commerce Example](./examples/ecommerce-example) - Online Store

**Best for**: Complex domains, production patterns

```bash
cd examples/ecommerce-example
pnpm install && pnpm generate && pnpm db:setup && pnpm dev
```

**What you'll learn**:
- Complex multi-table relationships
- Shopping cart management
- Order processing workflows
- Inventory tracking
- Product variants
- Coupon systems

**Stats**: 24 models → ~387 generated files → 15 min setup

**Includes**:
- Customer management
- Product catalog with variants
- Order lifecycle
- Payment integration
- Shipment tracking
- Review and rating system

---

### 🤖 [AI Chat Example](./examples/ai-chat-example) - Service Integration

**Best for**: External API integration, AI features

```bash
cd examples/ai-chat-example
pnpm install && pnpm generate && pnpm db:setup && pnpm dev
```

**What you'll learn**:
- `@service` annotations for external APIs
- AI conversation management
- File upload services
- Payment processing
- Email notifications
- Service-oriented architecture

**Stats**: 11 models → ~140 generated files → 10 min setup

**Includes**:
- AI chat service integration
- File storage service
- Email service
- Payment service
- Custom service clients

---

### 📊 Example Comparison

| Example | Models | Generated Files | Complexity | Setup Time | Use Case |
|---------|--------|-----------------|------------|------------|----------|
| **Minimal** | 2 | ~40 | Simple | 5 min | Learning basics |
| **Blog** | 7 | ~100 | Medium | 10 min | Content platforms |
| **E-Commerce** | 24 | ~387 | Complex | 15 min | Online stores |
| **AI Chat** | 11 | ~140 | Medium | 10 min | Service integration |

[📚 See detailed examples guide →](./examples/README.md)

## Core Features Deep Dive

### 1. Type-Safe DTOs (Data Transfer Objects)

Generated TypeScript interfaces for every operation:

```typescript
// gen/contracts/user/user.create.dto.ts
export interface UserCreateDTO {
  email: string
  name: string
}

// gen/contracts/user/user.update.dto.ts
export interface UserUpdateDTO {
  email?: string
  name?: string
}

// gen/contracts/user/user.query.dto.ts
export interface UserQueryDTO {
  skip?: number
  take?: number
  where?: {
    email?: { equals?: string; contains?: string }
    name?: { contains?: string }
    createdAt?: { gte?: Date; lte?: Date }
  }
  orderBy?: string  // e.g., "createdAt:desc", "email:asc"
  include?: {
    posts?: boolean
  }
}

// gen/contracts/user/user.read.dto.ts
export interface UserReadDTO {
  id: number
  email: string
  name: string
  createdAt: Date
  updatedAt: Date
  posts?: PostReadDTO[]  // If included in query
}
```

### 2. Runtime Validation with Zod

Auto-generated validation schemas based on Prisma types:

```typescript
// gen/validators/user/user.create.schema.ts
import { z } from 'zod'

export const UserCreateSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required').max(100)
})

// gen/validators/user/user.query.schema.ts
export const UserQuerySchema = z.object({
  skip: z.coerce.number().min(0).optional(),
  take: z.coerce.number().min(1).max(100).default(20),
  where: z.object({
    email: z.object({
      equals: z.string().optional(),
      contains: z.string().optional()
    }).optional(),
    name: z.object({ contains: z.string() }).optional()
  }).optional(),
  orderBy: z.string().optional()
})
```

### 3. Service Layer with Business Logic

Clean, testable service layer:

```typescript
// gen/services/user/user.service.ts
import { prisma } from '../../db.js'
import type { UserCreateDTO, UserUpdateDTO, UserQueryDTO } from '../../contracts/user'

export const userService = {
  async findMany(query?: UserQueryDTO) {
    return prisma.user.findMany({
      skip: query?.skip,
      take: query?.take,
      where: query?.where,
      orderBy: parseOrderBy(query?.orderBy),
      include: query?.include
    })
  },
  
  async findUnique(where: { id: number }) {
    return prisma.user.findUnique({ where })
  },
  
  async create(data: UserCreateDTO) {
    return prisma.user.create({ data })
  },
  
  async update(params: { where: { id: number }, data: UserUpdateDTO }) {
    return prisma.user.update(params)
  },
  
  async delete(where: { id: number }) {
    return prisma.user.delete({ where })
  },
  
  async count(query?: Pick<UserQueryDTO, 'where'>) {
    return prisma.user.count({ where: query?.where })
  }
}
```

### 4. HTTP Controllers (Express/Fastify)

Request handlers with automatic validation and error handling:

```typescript
// gen/controllers/user/user.controller.ts
import { Request, Response, NextFunction } from 'express'
import { userService } from '../../services/user/user.service.js'
import { UserQuerySchema, UserCreateSchema } from '../../validators/user'

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const query = UserQuerySchema.parse(req.query)
    const users = await userService.findMany(query)
    const total = await userService.count({ where: query.where })
    
    res.json({ 
      data: users,
      meta: { total, skip: query.skip ?? 0, take: query.take ?? 20 }
    })
  } catch (error) {
    next(error)  // Caught by error middleware
  }
}

export async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id)
    const user = await userService.findUnique({ id })
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    res.json(user)
  } catch (error) {
    next(error)
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const data = UserCreateSchema.parse(req.body)
    const user = await userService.create(data)
    res.status(201).json(user)
  } catch (error) {
    next(error)
  }
}
```

### 5. RESTful Routes

Clean route definitions:

```typescript
// gen/routes/user/user.routes.ts
import { Router } from 'express'
import { listUsers, getUser, createUser, updateUser, deleteUser } from '../../controllers/user'

export const userRoutes = Router()

userRoutes.get('/users', listUsers)           // GET /users?skip=0&take=10
userRoutes.get('/users/:id', getUser)         // GET /users/123
userRoutes.post('/users', createUser)         // POST /users
userRoutes.put('/users/:id', updateUser)      // PUT /users/123
userRoutes.delete('/users/:id', deleteUser)   // DELETE /users/123
```

### 6. Type-Safe Client SDK

Auto-generated frontend SDK with full type safety:

```typescript
// Import the SDK
import { createSDK } from './gen/sdk/index.js'

// Create SDK instance
const api = createSDK({
  baseUrl: 'http://localhost:3000/api',
  auth: {
    type: 'bearer',
    token: () => localStorage.getItem('jwt')
  },
  onError: (error) => {
    console.error('API Error:', error)
  }
})

// ✅ Type-safe API calls with autocomplete
const users = await api.users.list({ 
  skip: 0, 
  take: 10,
  where: { email: { contains: '@example.com' } }
})
// users is typed as UserReadDTO[]

const user = await api.users.get(123)
// user is typed as UserReadDTO | null

const newUser = await api.users.create({ 
  email: 'alice@example.com',
  name: 'Alice'
})
// newUser is typed as UserReadDTO

// ❌ TypeScript error - invalid field
const invalid = await api.users.create({ 
  email: 'alice@example.com',
  invalidField: 'oops'  // Type error!
})
```

## Advanced Features

### 1. Smart Domain-Specific Methods

SSOT Codegen analyzes your schema and generates domain-specific methods based on field patterns:

```prisma
model Post {
  id        Int      @id @default(autoincrement())
  slug      String   @unique
  published Boolean  @default(false)
  views     Int      @default(0)
  deletedAt DateTime?
  // ... other fields
}
```

**Generates these additional methods:**

```typescript
// gen/services/post/post.service.ts
export const postService = {
  // Standard CRUD
  findMany, findUnique, create, update, delete, count,
  
  // Smart methods based on 'slug' field
  async findBySlug(slug: string) {
    return prisma.post.findUnique({ where: { slug } })
  },
  
  // Smart methods based on 'published' boolean
  async listPublished(query?: PostQueryDTO) {
    return prisma.post.findMany({ 
      ...query, 
      where: { ...query?.where, published: true } 
    })
  },
  
  async publish(id: number) {
    return prisma.post.update({ 
      where: { id }, 
      data: { published: true } 
    })
  },
  
  async unpublish(id: number) {
    return prisma.post.update({ 
      where: { id }, 
      data: { published: false } 
    })
  },
  
  // Smart methods based on 'views' counter field
  async incrementViews(id: number) {
    return prisma.post.update({ 
      where: { id }, 
      data: { views: { increment: 1 } } 
    })
  },
  
  // Smart methods based on 'deletedAt' (soft delete pattern)
  async softDelete(id: number) {
    return prisma.post.update({ 
      where: { id }, 
      data: { deletedAt: new Date() } 
    })
  },
  
  async restore(id: number) {
    return prisma.post.update({ 
      where: { id }, 
      data: { deletedAt: null } 
    })
  }
}
```

**Pattern Detection**:
- `@unique` fields → `findBy<Field>(value)` methods
- `Boolean` fields → `list<Field>()`, `set<Field>(true/false)` methods  
- Counter fields (`Int @default(0)`) → `increment<Field>()`, `decrement<Field>()` methods
- `deletedAt` pattern → `softDelete()`, `restore()` methods
- Status enums → State transition methods

### 2. External Service Integration

Integrate external APIs using `@service` annotations:

```prisma
/// @service ai-agent
/// @methods sendMessage, getHistory, clearConversation
/// @baseUrl https://api.example.com/ai
model Conversation {
  id        Int      @id @default(autoincrement())
  userId    Int
  messages  Json[]
  createdAt DateTime @default(now())
}

/// @service file-storage
/// @methods upload, download, delete
/// @baseUrl https://storage.example.com
model FileUpload {
  id       Int    @id @default(autoincrement())
  filename String
  url      String
  size     Int
}
```

**Generates service clients:**

```typescript
// gen/services/conversation/ai-agent.service.ts
export const aiAgentService = {
  async sendMessage(data: { conversationId: number, message: string }) {
    return httpClient.post('/ai/send-message', data)
  },
  
  async getHistory(conversationId: number) {
    return httpClient.get(`/ai/history/${conversationId}`)
  },
  
  async clearConversation(conversationId: number) {
    return httpClient.delete(`/ai/conversation/${conversationId}`)
  }
}

// gen/services/file-upload/file-storage.service.ts
export const fileStorageService = {
  async upload(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return httpClient.post('/storage/upload', formData)
  },
  
  async download(fileId: number) {
    return httpClient.get(`/storage/download/${fileId}`, { 
      responseType: 'blob' 
    })
  },
  
  async delete(fileId: number) {
    return httpClient.delete(`/storage/delete/${fileId}`)
  }
}
```

### 3. OpenAPI 3.0 Documentation

Every generation creates a complete OpenAPI specification:

```typescript
// gen/openapi/openapi.json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Generated API",
    "version": "1.0.0"
  },
  "paths": {
    "/users": {
      "get": {
        "summary": "List users",
        "parameters": [
          {
            "name": "skip",
            "in": "query",
            "schema": { "type": "integer", "minimum": 0 }
          },
          {
            "name": "take",
            "in": "query",
            "schema": { "type": "integer", "minimum": 1, "maximum": 100 }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful response",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/UserListResponse" }
              }
            }
          }
        }
      }
    }
  }
}
```

**Use with Swagger UI:**

```typescript
import swaggerUi from 'swagger-ui-express'
import openapiSpec from './gen/openapi/openapi.json'

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec))
```

### 4. Extend Generated Code

Generated code is designed to be extended, not modified:

```typescript
// src/services/user-extended.service.ts
import { userService } from '../gen/services/user/user.service.js'
import { sendWelcomeEmail } from './email.service.js'

export const userExtendedService = {
  ...userService,  // Include all generated methods
  
  // Add custom business logic
  async createWithWelcome(data: UserCreateDTO) {
    const user = await userService.create(data)
    await sendWelcomeEmail(user.email)
    return user
  },
  
  async getActiveUsers() {
    return userService.findMany({ 
      where: { active: true },
      orderBy: 'lastLoginAt:desc'
    })
  }
}
```

### 5. Complete Application Setup

Wire everything together in your Express/Fastify app:

```typescript
// src/app.ts
import express from 'express'
import { userRoutes } from './gen/routes/user'
import { postRoutes } from './gen/routes/post'

const app = express()

app.use(express.json())

// Mount generated routes
app.use('/api', userRoutes)
app.use('/api', postRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ 
      error: 'Validation error', 
      details: err.errors 
    })
  }
  
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})
```

## Testing & Quality

### Test Coverage

**532 comprehensive tests** with **98.5% coverage**:

```bash
# Run all tests across packages
pnpm test

# Run tests with coverage report
pnpm test:coverage

# Run integration tests
pnpm test:integration

# Test all examples
pnpm test:examples

# Full test suite (build + generate + test)
pnpm full-test
```

### Code Quality Tools

```bash
# TypeScript type checking
pnpm typecheck

# ESLint linting
pnpm lint
pnpm lint:fix

# Check for unused exports (Knip)
pnpm knip

# Check for circular dependencies (Madge)
pnpm madge

# Run all quality checks
pnpm check:all
```

## Project Architecture

This is a monorepo with multiple packages:

```
ssot-codegen/
├── packages/
│   ├── gen/                    # Core code generator
│   │   ├── src/
│   │   │   ├── generators/     # Code generation logic
│   │   │   ├── parsers/        # Schema parsing
│   │   │   ├── templates/      # Handlebars templates
│   │   │   └── utils/          # Helper utilities
│   │   └── tests/              # 532 tests
│   │
│   ├── sdk-runtime/            # Runtime for generated SDKs
│   │   └── src/
│   │       ├── http-client.ts  # HTTP client with retry logic
│   │       ├── error-handler.ts # Error handling
│   │       └── auth.ts         # Authentication helpers
│   │
│   ├── templates-default/      # Default Handlebars templates
│   │   └── src/
│   │       ├── contracts/      # DTO templates
│   │       ├── services/       # Service templates
│   │       └── controllers/    # Controller templates
│   │
│   ├── schema-lint/            # Prisma schema linting
│   │   └── src/
│   │       └── rules/          # Linting rules
│   │
│   └── core/                   # Shared utilities
│       └── src/
│           └── utils/          # Common helpers
│
└── examples/                   # Working examples
    ├── minimal/                # 2 models, basic setup
    ├── blog-example/           # 7 models, full features
    ├── ecommerce-example/      # 24 models, complex domain
    └── ai-chat-example/        # 11 models, service integration
```

### Package Dependencies

```
@ssot-codegen/gen
  ├─ @ssot-codegen/templates-default
  ├─ @ssot-codegen/core
  └─ Handlebars, Zod, TypeScript

@ssot-codegen/sdk-runtime
  └─ Axios, retry logic

Examples depend on:
  ├─ @ssot-codegen/gen (dev dependency)
  ├─ @prisma/client
  └─ Express/Fastify
```

## Requirements

| Requirement | Version | Notes |
|------------|---------|-------|
| **Node.js** | >= 18 | Uses native fetch, ESM modules |
| **pnpm** | >= 9 | Workspace support required |
| **Prisma** | >= 5 | Schema parsing compatibility |
| **TypeScript** | >= 5 | For generated code |
| **Database** | Any | PostgreSQL, MySQL, SQLite, etc. |

## Configuration

### Generation Options

```javascript
// scripts/generate.js
import { runGenerator } from '@ssot-codegen/gen'

await runGenerator({
  // Required
  outDir: './gen',                    // Output directory for generated code
  
  // Optional
  models: ['User', 'Post'],          // Specific models (empty = all)
  framework: 'express',               // 'express' or 'fastify'
  templatePath: './custom-templates', // Custom template directory
  skipValidation: false,              // Skip Prisma schema validation
  includeTests: true,                 // Generate test files
  prettierConfig: {                   // Prettier formatting
    semi: false,
    singleQuote: true
  }
})
```

### TypeScript Configuration

Add path mapping for generated code:

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@gen/*": ["./gen/*"],
      "@/services/*": ["./gen/services/*"],
      "@/contracts/*": ["./gen/contracts/*"]
    }
  }
}
```

## Common Workflows

### After Schema Changes

```bash
# 1. Edit your Prisma schema
vim prisma/schema.prisma

# 2. Regenerate code
pnpm generate

# 3. Update database
pnpm prisma db push

# 4. Restart your server
pnpm dev
```

### Adding a New Model

```prisma
// Add to prisma/schema.prisma
model Product {
  id          Int      @id @default(autoincrement())
  name        String
  price       Decimal
  inStock     Boolean  @default(true)
  createdAt   DateTime @default(now())
}
```

```bash
# Regenerate (automatically includes new model)
pnpm generate

# Use in your app
import { productService } from './gen/services/product'
```

### Customizing Generated Code

Don't edit `gen/` directly - extend it:

```typescript
// src/services/custom-user.service.ts
import { userService } from '../gen/services/user'

export const customUserService = {
  ...userService,
  
  async findByEmailWithPosts(email: string) {
    return userService.findUnique({
      where: { email },
      include: { posts: true }
    })
  }
}
```

## Documentation

### Core Documentation
- 📘 [Quick Start Guide](./docs/QUICKSTART.md) - Get up and running in 5 minutes
- 📗 [Production Guide](./docs/QUICK_START_PRODUCTION.md) - Deploy to production
- 📙 [Examples Guide](./examples/README.md) - Detailed examples walkthrough
- 📕 [Using Examples](./docs/USING_EXAMPLES.md) - How to work with examples
- 📔 [Roadmap](./docs/ROADMAP.md) - Planned features and improvements

### Example-Specific Docs
- [Blog Example - Authorization Guide](./examples/blog-example/AUTHORIZATION_GUIDE.md)
- [Blog Example - Search API](./examples/blog-example/SEARCH_API_DOCUMENTATION.md)
- [E-Commerce - Schema Review](./examples/ecommerce-example/SCHEMA_REVIEW.md)
- [E-Commerce - Improvements](./examples/ecommerce-example/IMPROVEMENTS_COMPARISON.md)

### Technical Documentation
- [SDK Architecture](./examples/blog-example/gen/sdk/ARCHITECTURE.md) (after generation)
- [Production Readiness Review](./PRODUCTION_READINESS_REVIEW.md)
- [Examples Architecture](./EXAMPLES_ARCHITECTURE_RECOMMENDATION.md)

## FAQ

### Q: Do I commit generated code to git?

**A**: No, add `gen/` to `.gitignore`. Generated code is recreated from your schema, keeping your repository clean.

### Q: Can I customize the generated code?

**A**: Yes! Either extend generated services (recommended) or provide custom templates via `templatePath` option.

### Q: Does this work with my existing Prisma project?

**A**: Yes! Install `@ssot-codegen/gen`, create a generation script, and run it. It reads your existing `schema.prisma`.

### Q: What databases are supported?

**A**: All databases supported by Prisma: PostgreSQL, MySQL, SQLite, SQL Server, MongoDB, CockroachDB.

### Q: Can I use this in production?

**A**: Yes! Generated code includes production-ready patterns: error handling, validation, pagination, and proper TypeScript types. 98.5% test coverage.

### Q: How do I add authentication?

**A**: Generated routes are plain Express/Fastify routes - add your auth middleware as usual. See the [Blog Example](./examples/blog-example) for JWT auth implementation.

### Q: Can I generate only specific models?

**A**: Yes, pass `models: ['User', 'Post']` to `runGenerator()`.

## Troubleshooting

### Generation fails with "Cannot find module"

```bash
# Ensure packages are built
pnpm build

# Clear node_modules and reinstall
rm -rf node_modules
pnpm install
```

### TypeScript can't find generated types

```json
// Add to tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@gen/*": ["./gen/*"]
    }
  },
  "include": ["src/**/*", "gen/**/*"]
}
```

### Database connection errors

```bash
# Ensure DATABASE_URL is set
echo $DATABASE_URL

# Test Prisma connection
npx prisma db push
npx prisma studio
```

## Contributing

Contributions are welcome! Here's how to get started:

```bash
# 1. Fork and clone
git clone https://github.com/your-username/ssot-codegen
cd ssot-codegen

# 2. Install dependencies
pnpm install

# 3. Build packages
pnpm build

# 4. Run tests
pnpm test

# 5. Make your changes and test
# ...

# 6. Run quality checks
pnpm check:all

# 7. Submit a pull request
```

### Development Commands

```bash
pnpm build              # Build all packages
pnpm test               # Run all tests
pnpm test:coverage      # With coverage
pnpm examples:all       # Generate all examples
pnpm test:examples      # Test all examples
pnpm check:all          # Lint, typecheck, knip, madge
```

## License

MIT © [Your Organization]

See [LICENSE](./LICENSE) for details.

## Support

- 📫 Issues: [GitHub Issues](https://github.com/your-org/ssot-codegen/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/your-org/ssot-codegen/discussions)
- 📧 Email: support@example.com

## Acknowledgments

Built with:
- [Prisma](https://www.prisma.io/) - Database toolkit
- [Zod](https://zod.dev/) - TypeScript-first schema validation
- [Handlebars](https://handlebarsjs.com/) - Template engine
- [TypeScript](https://www.typescriptlang.org/) - Type safety

---

<div align="center">

**Transform your Prisma schema into production-ready APIs** 🚀

[Get Started](#quick-start) • [Examples](./examples) • [Documentation](./docs) • [Contributing](#contributing)

Made with ❤️ by developers, for developers

</div>


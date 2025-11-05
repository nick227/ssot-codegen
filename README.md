# SSOT Codegen - Single Source of Truth Code Generator

Type-safe, production-ready CRUD code generation from your Prisma schema.

[![Coverage](https://img.shields.io/badge/coverage-98.5%25-brightgreen)]()
[![Tests](https://img.shields.io/badge/tests-532%20passing-brightgreen)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

## Features

- ✅ **Full CRUD Generation** - Complete backend from Prisma schema
- ✅ **Type Safety** - End-to-end TypeScript with Zod validation
- ✅ **Framework Support** - Express & Fastify
- ✅ **Client SDK** - Type-safe frontend SDK
- ✅ **Production Ready** - Error handling, validation, auth patterns
- ✅ **Service Integration** - External APIs via @service annotations
- ✅ **OpenAPI** - Auto-generated API documentation
- ✅ **Extensible** - Easy to customize generated code

## Quick Start

### Installation

```bash
npm install -D @ssot-codegen/gen
# or
pnpm add -D @ssot-codegen/gen
```

### Generate Code

```bash
# From your Prisma schema
npx ssot generate

# Or programmatically
node scripts/generate.js
```

### Use Generated Code

```typescript
// Import generated service
import { userService } from './gen/services/user/user.service.js'

// Type-safe operations
const user = await userService.create({
  email: 'user@example.com',
  name: 'John Doe'
})

const users = await userService.findMany({
  where: { active: true },
  skip: 0,
  take: 10
})
```

## What Gets Generated

From this Prisma schema:

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

You get:

```
gen/
├── contracts/      ← TypeScript DTOs (CreateDTO, UpdateDTO, ReadDTO, QueryDTO)
├── validators/     ← Zod validation schemas
├── services/       ← Database operations (findMany, create, update, delete)
├── controllers/    ← Express/Fastify request handlers
├── routes/         ← Route definitions
├── sdk/            ← Type-safe client SDK
└── openapi/        ← OpenAPI 3.0 specification
```

**~40 files** of production-ready code from 2 models!

## Examples

Explore complete, real-world examples:

### [Minimal](./examples/minimal) - Quick Start ⚡
```bash
cd examples/minimal
pnpm setup && pnpm test
```
- 2 models (User, Todo)
- ~5 minute setup
- Perfect for learning basics

### [Blog Example](./examples/blog-example) - Content Platform 📝
```bash
cd examples/blog-example
pnpm setup && pnpm dev
```
- 7 models with relationships
- Authentication & authorization
- Publishing workflow
- Full integration tests

### [E-Commerce](./examples/ecommerce-example) - Online Store 🛒
```bash
cd examples/ecommerce-example
pnpm setup && pnpm dev
```
- 24 models
- Shopping cart & orders
- Payment processing
- Inventory management

### [AI Chat](./examples/ai-chat-example) - Service Integration 🤖
```bash
cd examples/ai-chat-example
pnpm setup && pnpm dev
```
- AI conversation service
- File upload service
- External API patterns
- Service-oriented architecture

[See all examples →](./examples)

## Core Features

### Type-Safe DTOs

```typescript
// Generated TypeScript interfaces
export interface UserCreateDTO {
  email: string
  name: string
}

export interface UserQueryDTO {
  skip?: number
  take?: number
  where?: {
    email?: { contains?: string }
    active?: boolean
  }
  orderBy?: string
}
```

### Validation Schemas

```typescript
// Generated Zod schemas
export const UserCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1, 'name is required')
})

export const UserQuerySchema = z.object({
  skip: z.coerce.number().min(0).optional(),
  take: z.coerce.number().min(1).max(100).default(20),
  where: z.object({
    email: z.object({ contains: z.string() }).optional(),
    active: z.boolean().optional()
  }).optional()
})
```

### Database Services

```typescript
// Generated Prisma service
export const userService = {
  async findMany(query?: UserQueryDTO) {
    return prisma.user.findMany({
      skip: query?.skip,
      take: query?.take,
      where: query?.where
    })
  },
  
  async create(data: UserCreateDTO) {
    return prisma.user.create({ data })
  },
  
  // + update, delete, findUnique, count
}
```

### Request Handlers

```typescript
// Generated Express controllers
export async function listUsers(req: Request, res: Response) {
  const query = UserQuerySchema.parse(req.query)
  const users = await userService.findMany(query)
  res.json({ data: users })
}

export async function createUser(req: Request, res: Response) {
  const data = UserCreateSchema.parse(req.body)
  const user = await userService.create(data)
  res.status(201).json(user)
}
```

### Client SDK

```typescript
// Generated type-safe client
import { createSDK } from './gen/sdk/index.js'

const api = createSDK({
  baseUrl: 'http://localhost:3000',
  auth: { token: () => localStorage.getItem('jwt') }
})

// Type-safe API calls
const users = await api.users.list({ skip: 0, take: 10 })
const user = await api.users.get(123)
const newUser = await api.users.create({ 
  email: 'user@example.com',
  name: 'John'
})
```

## Special Features

### Domain-Specific Methods

Generated based on field patterns:

```prisma
model Post {
  slug      String  @unique    // → findBySlug()
  published Boolean            // → listPublished(), publish(), unpublish()
  views     Int     @default(0) // → incrementViews()
  deletedAt DateTime?          // → softDelete(), restore()
}
```

### Service Integration

```prisma
/// @service ai-agent
/// @methods sendMessage, getHistory
model AIPrompt {
  // ... fields
}
```

Generates service client with inferred HTTP methods and paths.

## Documentation

- [Quick Start Guide](./docs/QUICKSTART.md)
- [Examples Guide](./examples/README.md)
- [Production Deployment](./docs/QUICK_START_PRODUCTION.md)
- [API Reference](./docs/README.md)
- [Roadmap](./docs/ROADMAP.md)

## Testing

**532 comprehensive tests** with **98.5% coverage**:

```bash
# Run all tests
pnpm test

# With coverage
pnpm test:coverage

# Integration tests
pnpm test:integration
```

## Architecture

```
@ssot-codegen/gen        ← Code generator
@ssot-codegen/sdk-runtime ← Client SDK runtime
@ssot-codegen/core       ← Core utilities
@ssot-codegen/schema-lint ← Schema validation
```

## Requirements

- Node.js 18+
- Prisma 5+
- TypeScript 5+

## License

MIT

## Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md)

---

**Generate production-ready backends from Prisma schemas** 🚀


# Demo Example - Single Table Todo

Ultra-light demonstration of SSOT Codegen with a single `Todo` model.

## What This Demonstrates

- ✅ Single table schema
- ✅ Basic CRUD operations
- ✅ One API route (`/todos`)
- ✅ Generated DTOs, controllers, routes
- ✅ OpenAPI specification
- ✅ Minimal complexity

## Schema

```prisma
model Todo {
  id          Int      @id @default(autoincrement())
  title       String
  completed   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Quick Start

```bash
# Generate code
pnpm run generate

# Run tests
pnpm run test
```

## Generated Structure

```
gen/
├── contracts/todo/     # TodoCreateDTO, TodoReadDTO
├── validators/todo/    # Zod schemas
├── routes/todo/        # Express routes
├── controllers/todo/   # Request handlers
├── services/todo/      # Business logic
└── openapi/           # OpenAPI 3.1 spec
```

## Use Case

Perfect for:
- Learning SSOT Codegen basics
- Quick POC demonstrations
- Testing pipeline changes
- Understanding generated structure


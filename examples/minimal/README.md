# Minimal Example - Quickstart

The simplest possible setup to get started with SSOT Codegen.

## What This Demonstrates

- ✅ Basic model setup (User and Todo)
- ✅ One-to-many relationships
- ✅ Essential CRUD operations
- ✅ Minimal configuration
- ✅ Quick setup (< 5 minutes)

## Schema Overview

**2 Models**:
- **User**: Basic user accounts
- **Todo**: Simple task list

**Features**:
- User authentication ready
- Todo management
- Cascading deletes
- Timestamps

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)
- PostgreSQL or MySQL

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Configure database
# Edit .env and set DATABASE_URL

# 3. Generate code from schema
pnpm generate

# 4. Push schema to database
pnpm db:push

# 5. (Optional) Seed with sample data
pnpm db:seed

# 6. You're ready to use the generated code!
```

## What Gets Generated

Running `pnpm generate` creates:

```
gen/
├── contracts/      ← TypeScript DTOs
├── validators/     ← Zod schemas
├── services/       ← Database operations
├── controllers/    ← Request handlers
├── routes/         ← Route definitions
└── sdk/            ← Type-safe client
```

**~40 files** generated from just 2 models!

## Usage Example

```typescript
// Import generated service
import { userService } from './gen/services/user/user.service.js'

// Create a user
const user = await userService.create({
  email: 'user@example.com',
  name: 'John Doe'
})

// Create a todo for the user
import { todoService } from './gen/services/todo/todo.service.js'

const todo = await todoService.create({
  title: 'Learn SSOT Codegen',
  userId: user.id
})

// List all todos
const todos = await todoService.findMany({
  skip: 0,
  take: 10,
  where: { completed: false }
})
```

## Next Steps

Once you understand this minimal example, explore:
- **blog-example**: Full blog with comments, categories, tags
- **ecommerce-example**: Complete e-commerce platform
- **ai-chat-example**: AI service integration

## File Structure

```
minimal/
├── prisma/
│   └── schema.prisma       ← Your schema (2 models)
├── scripts/
│   ├── generate.js         ← Generation script
│   └── seed.ts             ← Sample data
├── src/
│   └── test-consumer.ts    ← Example usage
├── gen/                    ← Generated code (gitignored)
└── package.json            ← Configuration
```

## Tips

- 💡 **Schema Changes**: Run `pnpm generate && pnpm db:push` after editing `schema.prisma`
- 💡 **Type Safety**: Generated code is fully typed
- 💡 **Customization**: Extend generated services in `src/`
- 💡 **Production**: Generated code is production-ready

## Learn More

- [Main Documentation](../../README.md)
- [Prisma Schema Guide](https://www.prisma.io/docs/concepts/components/prisma-schema)
- [Blog Example](../blog-example) - More complex setup

# SSOT Codegen

**Single Source of Truth Code Generator** - Transform your Prisma schema into production-ready TypeScript APIs with full-stack type safety.

[![NPM Version](https://img.shields.io/npm/v/@ssot-codegen/gen)](https://www.npmjs.com/package/@ssot-codegen/gen)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](package.json)

## What It Does

Generates a complete, production-ready REST API from your Prisma schema:

- ✅ **REST Controllers** - CRUD endpoints with automatic routing
- ✅ **Type-Safe DTOs** - Request/response contracts with full TypeScript support
- ✅ **Zod Validators** - Runtime validation matching your schema
- ✅ **Service Layer** - Business logic with relationship handling
- ✅ **TypeScript SDK** - Type-safe client with IntelliSense
- ✅ **React Hooks** - Pre-built hooks for data fetching
- ✅ **OpenAPI Spec** - Auto-generated API documentation

## Quick Start

### Installation

```bash
npm install -D @ssot-codegen/gen @ssot-codegen/cli
# or
pnpm add -D @ssot-codegen/gen @ssot-codegen/cli
```

### Setup

Add the generator to your `schema.prisma`:

```prisma
generator ssotCodegen {
  provider = "node node_modules/@ssot-codegen/gen"
  output   = "../generated"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
}
```

### Generate

```bash
npx prisma generate
```

### Run

```bash
cd generated
npm install
npm run dev
```

Your API is now running at `http://localhost:3000/api`

## What Gets Generated

```
generated/
├── src/
│   ├── contracts/         # TypeScript DTOs (create, read, update, query)
│   ├── validators/        # Zod schemas for runtime validation
│   ├── services/          # Business logic with Prisma integration
│   ├── controllers/       # Express route handlers
│   ├── routes/            # API route definitions
│   ├── sdk/              # TypeScript client SDK
│   │   ├── models/       # Model-specific clients
│   │   ├── react/        # React hooks (useUser, usePost, etc.)
│   │   └── core/         # Core query builders
│   ├── openapi.json      # OpenAPI 3.0 specification
│   └── server.ts         # Express application
└── package.json
```

## Features

### 🔄 Relationship Handling
Automatically handles all Prisma relationship types:
- One-to-many (`User → Posts`)
- Many-to-many (`Tags ↔ Posts`)
- One-to-one (`User → Profile`)
- Self-relations

### 🛡️ Type Safety
Complete type safety from database to frontend:
- TypeScript interfaces generated from Prisma models
- Zod validators match your schema exactly
- SDK provides full IntelliSense support

### ⚡ React Integration
Pre-built hooks for common operations:

```typescript
import { useUser } from './sdk/react';

function UserProfile({ userId }) {
  const { data: user, isLoading, error } = useUser(userId);
  
  if (isLoading) return <div>Loading...</div>;
  return <div>{user.name}</div>;
}
```

### 📝 Smart Validators
Zod validators respect your Prisma constraints:
- Required vs optional fields
- Unique constraints
- Default values
- Custom validations

### 🔌 Extensible Architecture
- Plugin system for custom generators
- Hook system for lifecycle events
- Template overrides for customization

## Examples

Explore complete examples in the `examples/` directory:

- **[minimal](examples/minimal/)** - Basic blog with Users and Posts
- **[blog-example](examples/blog-example/)** - Full blog with categories and tags
- **[ecommerce-example](examples/ecommerce-example/)** - E-commerce with products, orders, reviews
- **[ai-chat-example](examples/ai-chat-example/)** - Chat application with conversations
- **[05-image-optimizer](examples/05-image-optimizer/)** - Image processing service

## Project Structure

This is a monorepo with the following packages:

### Published Packages

- **[@ssot-codegen/gen](packages/gen/)** - Core code generation engine
- **[@ssot-codegen/cli](packages/cli/)** - Command-line interface
- **[@ssot-codegen/sdk-runtime](packages/sdk-runtime/)** - Runtime SDK for generated clients
- **[@ssot-codegen/templates-default](packages/templates-default/)** - Default code templates
- **[@ssot-codegen/schema-lint](packages/schema-lint/)** - Schema validation and linting

## Development

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0

### Setup

```bash
# Clone the repository
git clone https://github.com/nick227/ssot-codegen.git
cd ssot-codegen

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test:generator
```

### Commands

```bash
pnpm build              # Build all packages
pnpm clean              # Clean dist folders
pnpm lint               # Run ESLint
pnpm typecheck          # TypeScript type checking
pnpm test:generator     # Run generator tests
pnpm examples:all       # Generate all examples
```

## Configuration

Create a `ssot.config.ts` in your project root for advanced options:

```typescript
import { defineConfig } from '@ssot-codegen/gen';

export default defineConfig({
  output: './src/generated',
  features: {
    sdk: true,
    react: true,
    openapi: true,
    validation: 'zod', // or 'yup'
  },
  plugins: [
    // Custom plugins
  ],
});
```

## API Generated

### REST Endpoints

For each model, the following endpoints are generated:

```
GET    /api/users           # List with pagination, filtering, sorting
GET    /api/users/:id       # Get by ID with optional includes
POST   /api/users           # Create with validation
PUT    /api/users/:id       # Update with validation
DELETE /api/users/:id       # Delete (soft or hard)
```

### Query Parameters

```
GET /api/users?page=1&limit=10&sortBy=createdAt&order=desc&name=John
```

## TypeScript SDK Usage

```typescript
import { createSDK } from './sdk';

const sdk = createSDK({ 
  baseURL: 'http://localhost:3000/api' 
});

// CRUD operations
const user = await sdk.users.create({
  email: 'john@example.com',
  name: 'John Doe',
});

const users = await sdk.users.findMany({
  where: { published: true },
  include: { posts: true },
});

await sdk.users.update(user.id, { name: 'Jane Doe' });
await sdk.users.delete(user.id);
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT © [Nick227](https://github.com/nick227)

## Links

- [Documentation](docs/)
- [Examples](examples/)
- [NPM Package](https://www.npmjs.com/package/@ssot-codegen/gen)
- [Issues](https://github.com/nick227/ssot-codegen/issues)
- [Blog Article](https://medium.com/@nick.rios/ssot-codegen-pipeline-with-prisma-backed-dmmf-templates-e0fc152d469f)

---

**Built with ❤️ for developers who value type safety and productivity**


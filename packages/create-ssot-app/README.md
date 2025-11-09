# create-ssot-app

Create a full-stack TypeScript API with Prisma in one command.

## Quick Start

```bash
# Using npx (recommended)
npx create-ssot-app

# Or with pnpm
pnpm create ssot-app

# Or with yarn
yarn create ssot-app
```

## What You Get

A complete, production-ready API with:

- ✅ **Auto-generated API** - Controllers, routes, services from your Prisma schema
- ✅ **Type-safe SDK** - Ready-to-use client for your frontend
- ✅ **React Hooks** - Optional hooks for React apps
- ✅ **DTOs & Validation** - Request/response validation built-in
- ✅ **OpenAPI Docs** - Auto-generated API documentation
- ✅ **Database Setup** - Prisma ORM pre-configured
- ✅ **TypeScript** - Full type safety across the stack
- ✅ **Dev Ready** - Hot reload, database GUI, and more

## Interactive Setup

The CLI will ask you:

1. **Project name** - Name for your project folder
2. **Framework** - Express or Fastify
3. **Database** - PostgreSQL, MySQL, or SQLite
4. **Authentication** - Include auth setup?
5. **Examples** - Include example models (User, Post)?
6. **Package Manager** - npm, pnpm, or yarn

## What Happens

```
✨ Create your project
   ├─ Generate project structure
   ├─ Create Prisma schema
   ├─ Install dependencies (Prisma, Express/Fastify, etc.)
   ├─ Generate Prisma client
   ├─ Generate complete API code
   └─ Initialize git repository

📦 Your project is ready!
   cd my-api
   npm run dev
```

## Project Structure

```
my-api/
├── prisma/
│   └── schema.prisma          # Your data models
├── src/
│   ├── app.ts                 # Express/Fastify app
│   ├── server.ts              # Server entry point
│   └── db.ts                  # Prisma client
├── generated/                 # Auto-generated API code
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── dtos/
│   ├── sdk/
│   └── hooks/
├── package.json
├── tsconfig.json
└── .env
```

## Development Workflow

### 1. Edit Your Schema

```prisma
// prisma/schema.prisma
model Product {
  id          Int      @id @default(autoincrement())
  name        String
  price       Decimal
  description String?
  createdAt   DateTime @default(now())
}
```

### 2. Regenerate

```bash
npm run generate
```

### 3. Start Dev Server

```bash
npm run dev
```

That's it! Your API is running with full CRUD operations.

## Available Scripts

```bash
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run start        # Start production server

npm run db:push      # Push schema changes (dev)
npm run db:migrate   # Create migration (production)
npm run db:studio    # Open database GUI

npm run generate     # Regenerate everything
```

## Example API

With the default User/Post models, you get:

```bash
# Users
GET    /api/users
GET    /api/users/:id
POST   /api/users
PATCH  /api/users/:id
DELETE /api/users/:id

# Posts
GET    /api/posts
GET    /api/posts/:id
POST   /api/posts
PATCH  /api/posts/:id
DELETE /api/posts/:id

# Relations
GET    /api/users/:id/posts
```

## Frontend SDK

Use the generated SDK in your frontend:

```typescript
import { createSDK } from './generated/sdk'

const api = createSDK({ baseURL: 'http://localhost:3000' })

// Fully type-safe API calls
const users = await api.users.findAll()
const user = await api.users.create({
  email: 'user@example.com',
  name: 'John Doe'
})
```

## React Hooks

```typescript
import { useUsers, useCreateUser } from './generated/hooks/react'

function UsersList() {
  const { data: users, isLoading } = useUsers()
  const createUser = useCreateUser()

  // ...
}
```

## Learn More

- [SSOT CodeGen Documentation](https://github.com/yourusername/ssot-codegen)
- [Prisma Documentation](https://www.prisma.io/docs)

## License

MIT


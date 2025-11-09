# create-ssot-app - Complete Guide

## Overview

`create-ssot-app` is an interactive CLI tool that scaffolds a complete, production-ready TypeScript API project with:

- ✅ Prisma ORM with your choice of database
- ✅ Express or Fastify framework
- ✅ Complete auto-generated REST API
- ✅ Type-safe SDK for frontend
- ✅ React hooks (optional)
- ✅ All dependencies installed and configured
- ✅ Ready to run immediately

## Usage

### Create New Project

```bash
# Using npx (recommended - always latest version)
npx create-ssot-app

# Or with pnpm
pnpm create ssot-app

# Or with yarn
yarn create ssot-app
```

### Interactive Setup

The CLI will guide you through configuration:

#### 1. Project Name
```
? Project name: › my-api
```
- Must be a valid directory name
- Only letters, numbers, dashes, and underscores
- Will create a folder with this name

#### 2. Framework Choice
```
? Choose your framework: 
  › Express - Popular, battle-tested
    Fastify - Fast, modern
```
- **Express**: Mature ecosystem, lots of middleware
- **Fastify**: Better performance, built-in TypeScript support

#### 3. Database Selection
```
? Choose your database:
  › PostgreSQL - Recommended for production
    MySQL - Popular, widely supported
    SQLite - Simple, file-based (dev/testing)
```
- PostgreSQL: Best for production, supports advanced features
- MySQL: Good compatibility, widespread hosting support
- SQLite: Perfect for development, no setup required

#### 4. Authentication
```
? Include authentication setup? › Yes / No
```
- Adds User model with password field and role enum
- Sets up basic auth structure

#### 5. Example Models
```
? Include example models (User, Post)? › Yes / No
```
- Creates User and Post models with relationship
- Great for learning and testing
- Remove later if not needed

#### 6. Package Manager
```
? Package manager:
  › pnpm - Fast, efficient
    npm - Default, reliable
    yarn - Classic alternative
```
- Choose your preferred package manager
- All dependencies will be installed with your choice

## What Gets Created

### Project Structure

```
my-api/
├── prisma/
│   └── schema.prisma          # Your data models
├── src/
│   ├── app.ts                 # Express/Fastify app setup
│   ├── server.ts              # Server entry point
│   └── db.ts                  # Prisma client
├── generated/                 # 🚀 Auto-generated API code
│   ├── controllers/           # REST endpoints
│   ├── routes/                # Route definitions
│   ├── services/              # Business logic
│   ├── dtos/                  # Data transfer objects
│   ├── validators/            # Zod schemas
│   ├── sdk/                   # Type-safe client
│   └── hooks/                 # React hooks
├── .env                       # Environment variables
├── .gitignore                 # Git ignore rules
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript config
└── README.md                  # Project documentation
```

### Generated Files

With the example User/Post models, you get:

**Controllers**: Full CRUD operations
```
generated/controllers/
├── user.controller.ts         # User CRUD endpoints
└── post.controller.ts         # Post CRUD endpoints
```

**Routes**: Configured routing
```
generated/routes/
├── user.routes.ts             # GET, POST, PATCH, DELETE /api/users
└── post.routes.ts             # GET, POST, PATCH, DELETE /api/posts
```

**Services**: Business logic with relations
```
generated/services/
├── user.service.ts            # User operations + posts relation
└── post.service.ts            # Post operations + author relation
```

**DTOs & Validators**: Type-safe contracts
```
generated/dtos/
└── user/
    ├── user.create.dto.ts     # CreateUserDto
    ├── user.update.dto.ts     # UpdateUserDto
    ├── user.read.dto.ts       # UserDto
    └── user.query.dto.ts      # QueryUserDto
```

**SDK**: Frontend client
```
generated/sdk/
├── index.ts                   # Main SDK factory
├── user-client.ts             # User API client
├── post-client.ts             # Post API client
└── types.ts                   # Shared types
```

**Hooks**: React integration (optional)
```
generated/hooks/
└── react/
    ├── useUsers.ts            # User data fetching
    ├── useCreateUser.ts       # Create user mutation
    ├── usePosts.ts            # Post data fetching
    └── ...
```

## Available Scripts

After creation, your project has these scripts:

### Development

```bash
# Start dev server with hot reload
npm run dev

# Visit http://localhost:3000
```

### Database

```bash
# Push schema to database (prototyping)
npm run db:push

# Create migration (production)
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio
```

### Code Generation

```bash
# Regenerate everything (Prisma + API)
npm run generate

# Only Prisma client
npm run generate:prisma

# Only API code
npm run generate:api
```

### Production

```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm run start
```

## Development Workflow

### 1. Modify Your Schema

Edit `prisma/schema.prisma`:

```prisma
model Product {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  price       Decimal  @db.Decimal(10, 2)
  inStock     Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 2. Regenerate Code

```bash
npm run generate
```

This will:
1. Update Prisma client
2. Generate new Product controller, routes, services
3. Generate ProductDto types
4. Add Product endpoints to your API
5. Update SDK with product client
6. Generate React hooks for products

### 3. Push to Database

```bash
# Development
npm run db:push

# Production (creates migration)
npm run db:migrate
```

### 4. Start Server

```bash
npm run dev
```

Your new Product API is ready at:
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get one product
- `POST /api/products` - Create product
- `PATCH /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

## Using the Generated Code

### Backend - Use Services

```typescript
// In your custom endpoint
import { ProductService } from './generated/services/product.service'

const service = new ProductService()
const products = await service.findAll({ 
  where: { inStock: true },
  orderBy: { price: 'asc' }
})
```

### Frontend - Use SDK

```typescript
// In your React/Vue/etc app
import { createSDK } from './generated/sdk'

const api = createSDK({ 
  baseURL: 'http://localhost:3000' 
})

// Type-safe API calls
const products = await api.products.findAll()
const product = await api.products.create({
  name: 'New Product',
  price: 29.99,
  inStock: true
})
```

### React - Use Hooks

```typescript
import { useProducts, useCreateProduct } from './generated/hooks/react'

function ProductsList() {
  const { data: products, isLoading } = useProducts()
  const createProduct = useCreateProduct()

  const handleCreate = async () => {
    await createProduct.mutateAsync({
      name: 'New Product',
      price: 29.99
    })
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      {products.map(p => (
        <div key={p.id}>{p.name} - ${p.price}</div>
      ))}
      <button onClick={handleCreate}>Add Product</button>
    </div>
  )
}
```

## Configuration

### Environment Variables

Edit `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
PORT=3000
NODE_ENV=development
```

### Custom Configuration

Create `ssot.config.ts` in project root:

```typescript
import type { SSotConfig } from '@ssot-codegen/gen'

const config: SSotConfig = {
  output: './generated',
  framework: 'express',
  
  // Enable/disable features
  generateChecklist: true,
  
  // Choose hook frameworks
  hookFrameworks: ['react', 'vue'],
  
  // Custom plugins
  plugins: {
    search: {
      models: ['Product', 'User']
    }
  }
}

export default config
```

## Testing Your API

### With curl

```bash
# Create user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","name":"John Doe"}'

# Get all users
curl http://localhost:3000/api/users
```

### With the SDK

```typescript
import { createSDK } from './generated/sdk'

const api = createSDK()

// Create
const user = await api.users.create({
  email: 'user@example.com',
  name: 'John Doe'
})

// Read
const users = await api.users.findAll()
const oneUser = await api.users.findOne(user.id)

// Update
await api.users.update(user.id, { name: 'Jane Doe' })

// Delete
await api.users.delete(user.id)
```

## Troubleshooting

### Port Already in Use

Change the port in `.env`:
```env
PORT=3001
```

### Database Connection Error

1. Make sure your database is running
2. Check `DATABASE_URL` in `.env`
3. For SQLite, no setup needed - it creates the file automatically

### TypeScript Errors After Schema Change

1. Regenerate: `npm run generate`
2. Restart your dev server: `npm run dev`

### Module Not Found

```bash
# Reinstall dependencies
npm install

# Regenerate Prisma client
npm run generate:prisma
```

## Next Steps

1. **Explore the API** - Check `generated/CHECKLIST.md` for all endpoints
2. **Customize** - Add custom logic in `src/`
3. **Add Models** - Edit `prisma/schema.prisma` and regenerate
4. **Deploy** - Build and deploy your production-ready API

## Learn More

- [SSOT CodeGen Documentation](https://github.com/yourusername/ssot-codegen)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express Documentation](https://expressjs.com)
- [Fastify Documentation](https://fastify.dev)

## Support

- 📖 [Full Documentation](../README.md)
- 🐛 [Report Issues](https://github.com/yourusername/ssot-codegen/issues)
- 💬 [Discussions](https://github.com/yourusername/ssot-codegen/discussions)


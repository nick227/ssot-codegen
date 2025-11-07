# Quick Start Guide

Get up and running with SSOT Codegen in 5 minutes.

---

## Prerequisites

- **Node.js** 18+ 
- **pnpm** 9+
- **Database** (MySQL, PostgreSQL, or SQLite)

---

## Installation

### 1. Clone & Install

```bash
git clone <your-repo-url> ssot-codegen
cd ssot-codegen
pnpm install
```

### 2. Build Packages

```bash
pnpm build
```

This compiles:
- `packages/gen` - Generator engine
- `packages/cli` - CLI tool
- All other packages

---

## Generate Your First Project

### Option 1: Use an Example

```bash
# Generate from minimal example
pnpm ssot generate minimal

# Navigate to generated project
cd generated/minimal-1

# Install dependencies
pnpm install

# Set up database
cp .env.example .env
# Edit .env and set DATABASE_URL

# Run migrations
npx prisma migrate dev

# Start server
pnpm dev
```

**Server running at:** http://localhost:3000

**Test dashboard:** http://localhost:3000/checklist.html

---

### Option 2: Use Your Own Schema

**1. Create a Prisma schema:**

```prisma
// my-schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
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
  content   String   @db.Text
  published Boolean  @default(false)
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
}
```

**2. Generate:**

```bash
pnpm ssot generate my-schema.prisma --name my-api
```

**3. Run:**

```bash
cd generated/my-api-1
pnpm install
npx prisma migrate dev
pnpm dev
```

---

## What You Get

### Generated Files

```
generated/my-api-1/
├── src/
│   ├── contracts/         # TypeScript DTOs
│   │   ├── user/
│   │   └── post/
│   │
│   ├── validators/        # Zod schemas
│   │   ├── user/
│   │   └── post/
│   │
│   ├── services/          # Prisma CRUD
│   │   ├── user/
│   │   └── post/
│   │
│   ├── controllers/       # HTTP handlers
│   │   ├── user/
│   │   └── post/
│   │
│   ├── routes/            # Express routes
│   │   ├── user/
│   │   └── post/
│   │
│   ├── sdk/               # Client SDK
│   │   ├── models/        # Model clients
│   │   └── react/         # React Query hooks
│   │
│   ├── app.ts             # Express app
│   ├── server.ts          # HTTP server
│   └── config.ts          # Configuration
│
├── tests/                 # Self-validation
├── package.json
└── .env.example
```

### API Endpoints (Auto-Generated)

For each model, you get:

```
GET    /api/users          - List users
POST   /api/users          - Create user
GET    /api/users/:id      - Get user by ID
PUT    /api/users/:id      - Update user
DELETE /api/users/:id      - Delete user
```

---

## Using the Generated SDK

### TypeScript Client

```typescript
import { UserClient } from './sdk/models/user.client'

const userClient = new UserClient('http://localhost:3000')

// Create
const user = await userClient.create({
  email: 'test@example.com',
  name: 'Test User'
})

// List
const users = await userClient.list()

// Get by ID
const user = await userClient.getById(1)

// Update
const updated = await userClient.update(1, { name: 'Updated' })

// Delete
await userClient.delete(1)
```

### React Query Hooks

```tsx
import { useUser, useUsers } from './sdk/react/models/use-user'
import { SSotProvider } from './sdk/react/provider'

function App() {
  return (
    <SSotProvider baseURL="http://localhost:3000">
      <UserList />
    </SSotProvider>
  )
}

function UserList() {
  const { data: users, isLoading } = useUsers()
  const createUser = useCreateUser()
  
  if (isLoading) return <div>Loading...</div>
  
  return (
    <div>
      {users?.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
      
      <button onClick={() => createUser.mutate({ 
        email: 'new@example.com', 
        name: 'New User' 
      })}>
        Add User
      </button>
    </div>
  )
}
```

---

## Testing

### Run Generator Tests

```bash
cd packages/gen
pnpm test
```

### Test Generated Project

```bash
cd generated/my-api-1
pnpm test:validate
```

**What it tests:**
- ✅ TypeScript compilation
- ✅ Database connection
- ✅ CRUD operations work
- ✅ API endpoints respond
- ✅ Validators validate correctly

---

## Adding Plugins

### 1. Configure Environment

Create `.env` at workspace root:

```bash
# Database
DATABASE_URL="mysql://root@localhost:3306/mydb"

# OpenAI
ENABLE_OPENAI=true
OPENAI_API_KEY="sk-..."

# Google OAuth
ENABLE_GOOGLE_AUTH=true
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
JWT_SECRET="your-secret-here"

# See: env.development.template for all options
```

### 2. Generate with Plugins

```bash
pnpm ssot generate ai-chat-example
```

**Result:**
- OpenAI integration in `src/providers/openai.ts`
- Google OAuth in `src/auth/`
- Environment variables in `.env.example`
- Dependencies in `package.json`
- Health checks in checklist

---

## Interactive Dashboard

Every generated project includes a **health check dashboard**:

```bash
pnpm dev
# Visit: http://localhost:3000/checklist.html
```

**Features:**
- 📊 System statistics
- ✅ Environment validation
- 🔍 Code quality checks
- 🧪 Interactive testing (OAuth, AI, etc.)
- 📦 Model CRUD testing
- ⚡ Performance metrics

---

## Common Tasks

### Regenerate After Schema Changes

```bash
# 1. Edit your schema
vim examples/blog-example/schema.prisma

# 2. Regenerate
pnpm ssot generate blog-example
# Creates: generated/blog-example-2/

# 3. Compare
diff -r generated/blog-example-1 generated/blog-example-2

# 4. Test new version
cd generated/blog-example-2
pnpm install
pnpm test:validate
```

### Add Custom Business Logic

Generated code uses **scaffolds** for custom logic:

```typescript
// src/services/ai-agent.ts/ai-agent.service.scaffold.ts

export const aiAgentService = {
  ...baseService,  // Include generated CRUD
  
  /**
   * sendMessage - Custom implementation
   * @exposed - Auto-creates POST /send-message endpoint
   */
  async sendMessage(userId: number, message: string) {
    // TODO: Your implementation here
    const response = await openai.chat.completions.create({ ... })
    
    // Save to database
    await prisma.message.create({ ... })
    
    return { success: true, response }
  }
}
```

**The generator never overwrites** these scaffolds - your code is safe!

---

## Deployment

### Production Build

```bash
cd generated/my-api-1

# Install production dependencies
pnpm install --prod

# Build TypeScript
pnpm build

# Run production server
NODE_ENV=production pnpm start
```

### Docker (Example)

```dockerfile
FROM node:18-alpine
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --prod

# Copy source
COPY . .

# Build
RUN pnpm build

# Run
EXPOSE 3000
CMD ["pnpm", "start"]
```

---

## Next Steps

### Learn More

- [CLI Usage](CLI_USAGE.md) - Full command reference
- [Project Structure](PROJECT_STRUCTURE.md) - Architecture details
- [Plugin Index](PROVIDER_PLUGINS_INDEX.md) - Available plugins
- [Google OAuth Setup](GOOGLE_AUTH_SETUP.md) - OAuth guide

### Explore Examples

- `examples/minimal` - Simple 2-model schema
- `examples/blog-example` - Full blog with relationships
- `examples/ecommerce-example` - Complex business logic
- `examples/ai-chat-example` - Service integrations & plugins

### Build Something

1. Design your schema in Prisma
2. Add `@service` annotations for custom logic
3. Generate with plugins
4. Implement scaffolded methods
5. Deploy!

---

**You're ready to build production backends from schemas!** 🚀


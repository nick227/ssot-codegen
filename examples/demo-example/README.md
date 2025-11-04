# demo-example

Ultra-light demo with WORKING generated code

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and configure your database:

```bash
cp .env.example .env
```

Edit `.env` and set your `DATABASE_URL`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
```

### 3. Setup Database

Push the Prisma schema to your database:

```bash
npm run db:push
```

Or create and run migrations:

```bash
npm run db:migrate
```

### 4. Generate Code

Generate Prisma Client and code artifacts:

```bash
npm run generate
```

### 5. Start Development Server

```bash
npm run dev
```

The server will start on http://localhost:3000

## 📦 Project Structure

```
.
├── prisma/
│   └── schema.prisma       # Database schema (SSOT)
├── src/
│   ├── server.ts           # Entry point
│   ├── app.ts              # Express app setup
│   ├── db.ts               # Prisma client singleton
│   ├── config.ts           # Environment configuration
│   └── middleware.ts       # Error handlers
├── gen/                    # Generated code (do not edit!)
│   ├── contracts/          # TypeScript DTOs
│   ├── validators/         # Zod schemas
│   ├── routes/             # API routes
│   ├── controllers/        # Request handlers
│   ├── services/           # Business logic
│   └── openapi/            # OpenAPI spec
└── scripts/
    └── generate.js         # Code generation script
```

## 📚 API Models

- Todo

## 🛠️ Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Run production server
- `npm run generate` - Generate Prisma Client & code artifacts
- `npm run db:push` - Push schema to database (no migrations)
- `npm run db:migrate` - Create and apply migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run lint` - Type check with TypeScript

## 🔧 Implementing Business Logic

The generated code in `gen/` contains type-safe stubs. Implement your business logic in the generated controller files:

```typescript
// Example: Implement a controller
import type { TodoCreateDTO } from '@gen/contracts/todo'
import prisma from '@/db'

export const createTodo = async (input: TodoCreateDTO) => {
  return await prisma.todo.create({
    data: input
  })
}
```

## 🔒 Security

- Helmet.js for security headers
- CORS configured
- Input validation with Zod
- Prisma prevents SQL injection
- Environment variables for secrets

## 📖 Documentation

- OpenAPI spec: `gen/openapi/openapi.json`
- View in Swagger UI or import into Postman

## 🧪 Testing

Add tests in `src/__tests__/` directory. Use Node's built-in test runner or add Jest/Vitest.

## 🚢 Deployment

### Build for production:

```bash
npm run build
```

### Set production environment:

```env
NODE_ENV=production
DATABASE_URL="your-production-db-url"
```

### Run:

```bash
npm start
```

## 📝 Regenerating Code

Whenever you modify `prisma/schema.prisma`:

1. Run `npm run generate`
2. Update your route registrations in `src/app.ts`
3. Implement new controller logic

**⚠️ Never edit files in `gen/` directory - they will be overwritten!**

## 📄 License

MIT

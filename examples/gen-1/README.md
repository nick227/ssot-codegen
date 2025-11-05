# minimal-generated

Generated standalone project from SSOT Codegen.

## Models

- User
- Post

## Getting Started

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Setup database:**
   ```bash
   # Run Prisma migrations (if you have a schema)
   npx prisma migrate dev
   ```

4. **Run self-validation tests:**
   ```bash
   pnpm test:validate
   ```
   This validates that:
   - TypeScript compiles
   - Server starts
   - Database connection works
   - All CRUD operations function
   - API endpoints respond

5. **Start development server:**
   ```bash
   pnpm dev
   ```

6. **Access the API:**
   - Health check: http://localhost:3000/health
   - API endpoints: http://localhost:3000/api/*

## Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm test` - Run tests in watch mode
- `pnpm test:validate` - Run self-validation test suite
- `pnpm test:ui` - Open Vitest UI
- `pnpm validate` - Run typecheck + tests (full validation)
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm clean` - Remove build artifacts

## API Endpoints


### User
- `GET /api/users` - List all
- `GET /api/users/:id` - Get by ID
- `POST /api/users` - Create
- `PUT /api/users/:id` - Update
- `DELETE /api/users/:id` - Delete


### Post
- `GET /api/posts` - List all
- `GET /api/posts/:id` - Get by ID
- `POST /api/posts` - Create
- `PUT /api/posts/:id` - Update
- `DELETE /api/posts/:id` - Delete


## Project Structure

```
minimal-generated/
├── gen/              # Generated code (DTOs, services, controllers, routes, SDK)
├── src/              # Application code
│   ├── app.ts        # Express app configuration
│   ├── server.ts     # Server entry point
│   ├── config.ts     # Configuration
│   ├── db.ts         # Database client
│   ├── logger.ts     # Logging setup
│   └── middleware.ts # Error handlers
├── tests/            # Self-validation tests
│   ├── self-validation.test.ts  # Comprehensive integration tests
│   └── setup.ts      # Test configuration
├── prisma/           # Database schema
│   └── schema.prisma
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── .env.example
```

## Testing

This project includes comprehensive self-validation tests that verify:

- ✅ TypeScript compilation
- ✅ Server startup
- ✅ Database connectivity
- ✅ CRUD operations for all models
- ✅ API endpoint responses

Run `pnpm test:validate` to execute the full test suite.

## Notes

This is a fully standalone, deletable project. All dependencies are self-contained.
You can safely delete this entire folder when done testing.

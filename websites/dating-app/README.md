# dating-app-5

Generated standalone project from SSOT Codegen.

## Models

- User
- Profile
- Photo
- Message
- Quiz
- QuizQuestion
- QuizAnswer
- QuizResult
- BehaviorEvent
- BehaviorEventArchive
- PersonalityDimension
- UserDimensionScore
- CompatibilityScore
- EventWeightConfig

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


### Profile
- `GET /api/profiles` - List all
- `GET /api/profiles/:id` - Get by ID
- `POST /api/profiles` - Create
- `PUT /api/profiles/:id` - Update
- `DELETE /api/profiles/:id` - Delete


### Photo
- `GET /api/photos` - List all
- `GET /api/photos/:id` - Get by ID
- `POST /api/photos` - Create
- `PUT /api/photos/:id` - Update
- `DELETE /api/photos/:id` - Delete


### Message
- `GET /api/messages` - List all
- `GET /api/messages/:id` - Get by ID
- `POST /api/messages` - Create
- `PUT /api/messages/:id` - Update
- `DELETE /api/messages/:id` - Delete


### Quiz
- `GET /api/quizs` - List all
- `GET /api/quizs/:id` - Get by ID
- `POST /api/quizs` - Create
- `PUT /api/quizs/:id` - Update
- `DELETE /api/quizs/:id` - Delete


### QuizQuestion
- `GET /api/quizquestions` - List all
- `GET /api/quizquestions/:id` - Get by ID
- `POST /api/quizquestions` - Create
- `PUT /api/quizquestions/:id` - Update
- `DELETE /api/quizquestions/:id` - Delete


### QuizAnswer
- `GET /api/quizanswers` - List all
- `GET /api/quizanswers/:id` - Get by ID
- `POST /api/quizanswers` - Create
- `PUT /api/quizanswers/:id` - Update
- `DELETE /api/quizanswers/:id` - Delete


### QuizResult
- `GET /api/quizresults` - List all
- `GET /api/quizresults/:id` - Get by ID
- `POST /api/quizresults` - Create
- `PUT /api/quizresults/:id` - Update
- `DELETE /api/quizresults/:id` - Delete


### BehaviorEvent
- `GET /api/behaviorevents` - List all
- `GET /api/behaviorevents/:id` - Get by ID
- `POST /api/behaviorevents` - Create
- `PUT /api/behaviorevents/:id` - Update
- `DELETE /api/behaviorevents/:id` - Delete


### BehaviorEventArchive
- `GET /api/behavioreventarchives` - List all
- `GET /api/behavioreventarchives/:id` - Get by ID
- `POST /api/behavioreventarchives` - Create
- `PUT /api/behavioreventarchives/:id` - Update
- `DELETE /api/behavioreventarchives/:id` - Delete


### PersonalityDimension
- `GET /api/personalitydimensions` - List all
- `GET /api/personalitydimensions/:id` - Get by ID
- `POST /api/personalitydimensions` - Create
- `PUT /api/personalitydimensions/:id` - Update
- `DELETE /api/personalitydimensions/:id` - Delete


### UserDimensionScore
- `GET /api/userdimensionscores` - List all
- `GET /api/userdimensionscores/:id` - Get by ID
- `POST /api/userdimensionscores` - Create
- `PUT /api/userdimensionscores/:id` - Update
- `DELETE /api/userdimensionscores/:id` - Delete


### CompatibilityScore
- `GET /api/compatibilityscores` - List all
- `GET /api/compatibilityscores/:id` - Get by ID
- `POST /api/compatibilityscores` - Create
- `PUT /api/compatibilityscores/:id` - Update
- `DELETE /api/compatibilityscores/:id` - Delete


### EventWeightConfig
- `GET /api/eventweightconfigs` - List all
- `GET /api/eventweightconfigs/:id` - Get by ID
- `POST /api/eventweightconfigs` - Create
- `PUT /api/eventweightconfigs/:id` - Update
- `DELETE /api/eventweightconfigs/:id` - Delete


## Project Structure

```
dating-app-5/
├── src/              # All code here
│   ├── app.ts        # Express app configuration
│   ├── server.ts     # Server entry point
│   ├── config.ts     # Configuration
│   ├── db.ts         # Database client
│   ├── logger.ts     # Logging setup
│   ├── middleware.ts # Error handlers
│   ├── contracts/    # Generated DTOs
│   ├── services/     # Generated services
│   ├── controllers/  # Generated controllers
│   ├── routes/       # Generated routes
│   └── sdk/          # TypeScript SDK + React hooks
├── tests/            # Self-validation tests
│   ├── self-validation.test.ts
│   └── setup.ts
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

# Next Steps - Dating App Backend

## ✅ Completed

1. **Schema Review**: ✅ PASSED
   - All 19 models defined
   - All 8 enums defined
   - All indexes from FEATURES.md included
   - Service annotations correctly placed
   - MySQL compatibility verified

2. **Schema Validation**: ✅ PASSED
   - Prisma schema validated successfully
   - No linting errors

3. **Configuration**: ✅ Created
   - `ssot.config.ts` created with proper settings
   - Registry mode enabled (78% less code)
   - Service integrations enabled

## ⏭️ Next Steps

### 1. Create MySQL Database

```sql
CREATE DATABASE `dating-app` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Set Up Environment Variables

Create `.env` file in `websites/dating-app/`:

```env
DATABASE_URL="mysql://root:password@localhost:3306/dating-app"
```

### 3. Generate Prisma Client

```bash
cd websites/dating-app
npx prisma generate --schema=prisma/schema.prisma
```

### 4. Run Database Migration

```bash
npx prisma migrate dev --name init --schema=prisma/schema.prisma
```

### 5. Generate SSOT Code

From the project root (`ssot-codegen/`):

```bash
# Option 1: Using the CLI
pnpm ssot generate websites/dating-app/prisma/schema.prisma --output websites/dating-app/src --framework express

# Option 2: Using the API (if packages are built)
cd websites/dating-app
node -e "import('@ssot/gen/api').then(m => m.generate({ schema: './prisma/schema.prisma', output: './src', framework: 'express' }))"
```

### 6. Install Dependencies (if needed)

If the dating-app needs its own package.json:

```bash
cd websites/dating-app
npm init -y
npm install express @prisma/client
npm install -D prisma typescript @types/node @types/express
```

## Generated Code Structure

After running SSOT generator, you'll have:

```
websites/dating-app/
├── src/
│   ├── registry/              # Unified CRUD registry
│   ├── services/              # Service implementations
│   │   ├── discovery-service.ts
│   │   ├── admin-config-service.ts
│   │   ├── compatibility-service.ts
│   │   ├── dimension-update-service.ts
│   │   └── quiz-scoring-service.ts
│   ├── controllers/           # HTTP controllers
│   ├── routes/                # Express routes
│   ├── dto/                   # Data Transfer Objects
│   ├── validators/            # Zod validators
│   └── types/                 # TypeScript types
├── prisma/
│   └── schema.prisma          # ✅ Ready
├── ssot.config.ts             # ✅ Ready
└── .env                       # ⏭️ Create this
```

## Service Annotations Detected

The generator will automatically create service implementations for:

1. **Discovery Service** (`@service discovery-service` on Swipe)
   - `getDiscoveryQueue(userId, limit, offset)`
   - `getCandidates(userId, filters, priorities)`
   - `refreshQueue(userId)`

2. **Admin Config Service** (`@service admin-config-service` on DimensionMappingRule)
   - `createRule(ruleData)`
   - `updateRule(ruleId, updates)`
   - `deleteRule(ruleId)`
   - `bulkUpdateRules(rules)`
   - `getRuleHistory(ruleId)`
   - `createEventWeight(eventType, weight)`
   - `updateEventWeight(eventType, weight)`
   - `getConfigStatus()`

3. **Compatibility Service** (`@service compatibility-service` on CompatibilityScore)
   - `calculateCompatibility(user1Id, user2Id)`
   - `getCompatibilityBreakdown(user1Id, user2Id)`
   - `getMatchesByDimension(userId, dimensionId)`

4. **Dimension Update Service** (`@service dimension-update-service` on BehaviorEvent)
   - `processBehaviorEvents(batchSize)`
   - `reprocessEvents(ruleVersion)`
   - `updateDimensionScores(userId, dimensionId, delta)`

5. **Quiz Scoring Service** (`@service quiz-scoring-service` on QuizAnswer)
   - `calculateQuizScore(quizId, userId)`
   - `validateAnswer(questionId, answerJson)`
   - `compareQuizResults(user1Id, user2Id, quizId)`

## Background Jobs (Manual Implementation)

These need to be implemented manually (not auto-generated):

1. **UpdateDimensionScoresJob**
   - Processes `BehaviorEvent` records
   - Updates `UserDimensionScore` records
   - See FEATURES.md section 5.1 for details

2. **NormalizeDimensionScoresJob**
   - Normalizes `rawScore` → `normalizedScore`
   - Runs periodically (hourly/daily)
   - See FEATURES.md section 5.2 for details

3. **CalculateCompatibilityJob** (Optional)
   - Populates `CompatibilityScore` cache
   - Can be on-demand instead

## Testing the Setup

1. **Verify Database Connection**:
   ```bash
   npx prisma db pull --schema=prisma/schema.prisma
   ```

2. **Check Generated Code**:
   ```bash
   ls -la src/
   ```

3. **Start Development Server** (after implementing):
   ```bash
   npm run dev
   ```

## Important Notes

- **CompatibilityScore**: Remember this is a cache only, not source of truth
- **System Dimensions**: Computed on-demand, not stored in UserDimensionScore
- **BehaviorEvent**: Append-only, idempotent processing required
- **Location Indexing**: MySQL doesn't support JSON indexing - use application-level filtering

## Documentation References

- **FEATURES.md**: Complete feature specification
- **SERVICE_GENERATION_GUIDE.md**: Service annotation guide
- **SCHEMA_REVIEW_COMPLETE.md**: Schema compliance review
- **TECHNICAL_SPECIFICATIONS.md**: Technical details and formulas

## Ready to Proceed! 🚀

The schema is production-ready and all configuration is in place. Run the steps above to generate the codebase.


# Service Generation Guide - Dating App

## How SSOT Generator Handles Services

### 1. **Standard CRUD Services** (Auto-Generated)
- ✅ **Automatically generated** for every Prisma model
- ✅ **No explicit definition needed** in FEATURES.md
- ✅ Generates: `{model}.service.ts` with full CRUD operations
- ✅ Auto-detects enhanced methods (search, findBySlug, etc.)
- ✅ Handles relationships automatically (if `useEnhanced=true`)

**Example**: `User`, `Profile`, `Match`, `Message`, `Quiz` models → Auto-generate services

### 2. **Enhanced Services** (Auto-Generated)
- ✅ **Automatically generated** when `useEnhanced=true`
- ✅ Includes relationship handling
- ✅ Domain-specific methods based on field analysis
- ✅ **No explicit definition needed**

### 3. **@service Annotated Services** (Explicit Definition Required)
- ⚠️ **Requires explicit definition** in Prisma schema
- ⚠️ Used for complex workflows that need HTTP endpoints
- ⚠️ Generates scaffold files that developer implements

**When to use @service annotation:**
- Complex business logic that needs HTTP endpoints
- External service integrations (AI, file uploads, payments)
- Multi-step workflows
- Services that don't map directly to a single model

## Services Analysis for Dating App

### ✅ Auto-Generated (No Action Needed)

These models will automatically get CRUD services:
- `User` → `user.service.ts`
- `Profile` → `profile.service.ts`
- `Swipe` → `swipe.service.ts`
- `Match` → `match.service.ts`
- `Message` → `message.service.ts`
- `Quiz` → `quiz.service.ts`
- `QuizQuestion` → `quiz-question.service.ts`
- `QuizAnswer` → `quiz-answer.service.ts`
- `QuizResult` → `quiz-result.service.ts`
- `BehaviorEvent` → `behavior-event.service.ts`
- `PersonalityDimension` → `personality-dimension.service.ts`
- `UserDimensionScore` → `user-dimension-score.service.ts`
- `UserDimensionPriority` → `user-dimension-priority.service.ts`
- `CompatibilityScore` → `compatibility-score.service.ts`
- `DimensionMappingRule` → `dimension-mapping-rule.service.ts`
- `EventWeightConfig` → `event-weight-config.service.ts`
- `Block` → `block.service.ts`

### ⚠️ Consider @service Annotation For

#### 1. **Discovery Service** (Complex Business Logic) ⭐ **RECOMMENDED**
**Why**: Combines compatibility calculation + hard filters + soft weights + pagination (not simple CRUD)

**Prisma Schema Annotation:**
```prisma
/// @service discovery-service
/// @methods getDiscoveryQueue, getCandidates, refreshQueue
/// @description Discovery queue with compatibility-based matching, filters, and pagination
model Swipe {
  // ... fields
}
```

**Generated Methods:**
- `getDiscoveryQueue(userId, limit, offset)` - Get paginated discovery queue
- `getCandidates(userId, filters, priorities)` - Get filtered candidates with compatibility scores
- `refreshQueue(userId)` - Refresh discovery queue (recalculate compatibility)

#### 2. **Compatibility Service** (Complex Business Logic)
**Why**: Multi-step calculation with system dimensions, not just CRUD

**Prisma Schema Annotation:**
```prisma
/// @service compatibility-service
/// @methods calculateCompatibility, getCompatibilityBreakdown, getMatchesByDimension
/// @description Multi-dimensional compatibility calculation service
model CompatibilityScore {
  // ... fields
}
```

**Generated Methods:**
- `calculateCompatibility(userId1, userId2, priorities)` - On-demand calculation
- `getCompatibilityBreakdown(userId1, userId2)` - Dimension breakdown
- `getMatchesByDimension(userId, dimensionId, limit)` - Filtered matches

#### 2. **Dimension Update Service** (Complex Processing)
**Why**: Processes events, applies rules, updates scores (not simple CRUD)

**Prisma Schema Annotation:**
```prisma
/// @service dimension-update-service
/// @methods processBehaviorEvents, reprocessEvents, updateDimensionScores
/// @description Behavioral event processing and dimension score updates
model BehaviorEvent {
  // ... fields
}
```

**Generated Methods:**
- `processBehaviorEvents(batchSize)` - Process unprocessed events
- `reprocessEvents(ruleVersion)` - Reprocess events with new rules
- `updateDimensionScores(userId, dimensionId)` - Manual update trigger

#### 3. **Quiz Scoring Service** (Complex Logic)

#### 4. **Admin Config Service** (Optional) ⭐ **RECOMMENDED IF ADMIN UI PLANNED**
**Why**: Admin UI/API for managing configuration models (DimensionMappingRule, EventWeightConfig)

**Prisma Schema Annotation:**
```prisma
/// @service admin-config-service
/// @methods createRule, updateRule, deleteRule, bulkUpdateRules, getRuleHistory, createEventWeight, updateEventWeight, getConfigStatus
/// @description Admin service for managing dimension mapping rules and event weight configurations
model DimensionMappingRule {
  // ... fields
}
```

**Generated Methods:**
- `createRule(ruleData)` - Create new dimension mapping rule
- `updateRule(ruleId, updates)` - Update existing rule
- `deleteRule(ruleId)` - Soft delete rule (set `isActive = false`)
- `bulkUpdateRules(rules)` - Bulk update multiple rules
- `getRuleHistory(ruleId)` - Get rule version history
- `createEventWeight(eventType, weight)` - Create event weight config
- `updateEventWeight(eventType, weight)` - Update event weight config
- `getConfigStatus()` - Get overall configuration status

#### 3. **Quiz Scoring Service** (Complex Logic)
**Why**: Validates answers, calculates scores per question type

**Prisma Schema Annotation:**
```prisma
/// @service quiz-scoring-service
/// @methods calculateQuizScore, validateAnswer, compareQuizResults
/// @description Quiz answer validation and scoring service
model QuizAnswer {
  // ... fields
}
```

**Generated Methods:**
- `calculateQuizScore(quizId, userId)` - Score calculation
- `validateAnswer(questionId, answerJson)` - Type-specific validation
- `compareQuizResults(userId1, userId2)` - Compatibility comparison

### ❌ Background Jobs (Separate from HTTP Services)

These are **NOT HTTP services** - they're background workers:
- `UpdateDimensionScoresJob` - Background worker (Bull/BullMQ)
- `NormalizeDimensionScoresJob` - Background worker
- `CalculateCompatibilityJob` - Background worker (optional cache population)
- `ProcessMatchesJob` - Background worker

**Recommendation**: Keep these as background jobs, not HTTP services. They're already defined in FEATURES.md.

## Recommendation

### ✅ **Current Approach is Correct**

1. **Standard CRUD**: Let generator auto-create (no changes needed)
2. **Complex Services**: Add `@service` annotations in Prisma schema (not FEATURES.md)
3. **Background Jobs**: Already defined in FEATURES.md (separate concern)

### 📝 **Action Items**

1. **After schema generation**, review which services need `@service` annotation:
   - Compatibility calculation (if needs HTTP endpoint)
   - Dimension updates (if needs HTTP endpoint)
   - Quiz scoring (if needs HTTP endpoint)

2. **Add @service annotations** directly in Prisma schema:
   ```prisma
   /// @service compatibility-service
   /// @methods calculateCompatibility, getBreakdown
   model CompatibilityScore { ... }
   ```

3. **Regenerate services** after adding annotations

### 🎯 **Key Insight**

- **FEATURES.md** defines **WHAT** (business logic, data model, workflows)
- **Prisma Schema** defines **HOW** (database structure, service annotations)
- **Generator** creates **CODE** (services, controllers, routes)

**Services are implicitly defined** through:
1. Prisma models → Auto-generate CRUD services
2. `@service` annotations → Generate complex service scaffolds
3. Background jobs → Defined in FEATURES.md (separate from HTTP services)

## Important Notes

### CompatibilityScore Cache Anchor
- ⚠️ **Explicitly marked as cache**: `CompatibilityScore` table is a cache anchor, NOT source of truth
- Compatibility is computed on-demand from `UserDimensionScore` + `UserDimensionPriority` + system dimension formulas
- Generator should NOT treat `CompatibilityScore` as primary data
- Cache can be cleared/rebuilt at any time without data loss

## Conclusion

**Minimal changes needed to FEATURES.md** for service generation:
- ✅ Added explicit cache anchor comment for `CompatibilityScore`
- ✅ Added Discovery Service annotation documentation
- ✅ Added Admin Config Service annotation documentation (optional)

Services are:
- ✅ Auto-generated from Prisma models (standard CRUD)
- ✅ Explicitly defined via `@service` annotations in schema (complex workflows)
- ✅ Background jobs already documented in FEATURES.md

The current FEATURES.md is complete for schema generation. Service annotations can be added **after** initial schema generation, based on which complex workflows need HTTP endpoints.


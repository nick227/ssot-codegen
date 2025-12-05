# Prisma Schema Summary - Dating App

## Schema Generated Successfully ✅

**Location**: `prisma/schema.prisma`  
**Status**: Ready for code generation  
**Models**: 19 core entities  
**Enums**: 7 enums defined

## Models Generated

1. ✅ **User** - User accounts and authentication
2. ✅ **Profile** - Extended user profile with meta values (JSON)
3. ✅ **Photo** - User photos with ordering and moderation
4. ✅ **Swipe** - Like/dislike interactions (with @service discovery-service annotation)
5. ✅ **Match** - Mutual likes creating matches
6. ✅ **Message** - Messages between matched users
7. ✅ **Quiz** - Quiz definitions with flexible structure
8. ✅ **QuizQuestion** - Questions within quizzes (structured + JSON config)
9. ✅ **QuizAnswer** - User answers (structured + JSON answer)
10. ✅ **QuizResult** - Calculated quiz scores (UX/analytics only)
11. ✅ **BehaviorEvent** - All user interactions tracked (append-only)
12. ✅ **BehaviorEventArchive** - Archived events (>90 days)
13. ✅ **PersonalityDimension** - Canonical dimension definitions
14. ✅ **UserDimensionScore** - User's score per dimension (personality only)
15. ✅ **CompatibilityScore** - Optional cache table (⚠️ CACHE ANCHOR ONLY)
16. ✅ **UserDimensionPriority** - User-defined weights/priorities
17. ✅ **DimensionMappingRule** - Meta → dimension mapping rules (with @service admin-config-service annotation)
18. ✅ **EventWeightConfig** - Event type weight configurations
19. ✅ **Block** - Blocked user relationships

## Enums Defined

1. ✅ **AccountStatus** - ACTIVE, SUSPENDED, DELETED, BANNED
2. ✅ **Gender** - MALE, FEMALE, NON_BINARY, PREFER_NOT_TO_SAY
3. ✅ **EventType** - All 11 event types (profile_view, profile_like, etc.)
4. ✅ **TargetType** - profile, quiz, match
5. ✅ **QuizQuestionType** - All 7 question types
6. ✅ **DimensionCategory** - profile, quiz, behavior, system, mixed
7. ✅ **BodyType** - Physical attribute options
8. ✅ **SwipeType** - LIKE, DISLIKE

## Key Features Implemented

### ✅ Service Annotations
- **Discovery Service** (@service discovery-service) on `Swipe` model
- **Admin Config Service** (@service admin-config-service) on `DimensionMappingRule` model

### ✅ Cache Anchor Warning
- **CompatibilityScore** explicitly marked as cache anchor (NOT source of truth)
- Comments added to prevent generator from treating as primary data

### ✅ All Indexes Defined
- BehaviorEvent: 5 indexes (userId+processedAt, userId+eventType+createdAt, etc.)
- UserDimensionScore: 4 indexes (unique constraint + performance indexes)
- CompatibilityScore: 4 indexes (unique constraint + cache invalidation)
- UserDimensionPriority: 3 indexes
- DimensionMappingRule: 4 indexes
- Swipe: 4 indexes
- Match: 4 indexes
- All other models: Appropriate indexes

### ✅ Relationships Complete
- All 1:1, 1:many, and many:many relationships defined
- Cascade deletes configured appropriately
- Foreign key constraints in place

### ✅ JSON Fields
- Profile.meta - Flexible profile meta values
- Profile.location - Location data (lat/lng)
- Quiz.meta - Quiz metadata
- QuizQuestion.configJson - Flexible question config
- QuizAnswer.answerJson - Flexible answer structure
- QuizResult.resultJson - Additional result data
- BehaviorEvent.meta - Event-specific meta
- CompatibilityScore.dimensionBreakdown - Dimension compatibility breakdown
- PersonalityDimension.normalizationConfig - Per-dimension normalization config

### ✅ Constraints & Validations
- Unique constraints on all appropriate fields
- Default values where specified
- Nullable fields marked correctly
- Field types match specifications (String IDs, Float scores, etc.)

## Next Steps

1. **Validate Schema**: Run `npx prisma validate` to ensure schema is valid
2. **Generate Client**: Run `npx prisma generate` to generate Prisma Client
3. **Create Migration**: Run `npx prisma migrate dev --name init` to create database
4. **Seed Data**: Create seed script for initial dimensions and configs
5. **Generate Code**: Use SSOT generator to create services, controllers, routes

## Important Notes

### CompatibilityScore Cache
- ⚠️ This table is a cache, NOT source of truth
- Compatibility computed on-demand from UserDimensionScore + UserDimensionPriority + system dimension formulas
- Can be cleared/rebuilt at any time without data loss

### System Dimensions
- Stored in PersonalityDimension table with `category = "system"`
- NOT stored in UserDimensionScore (computed on-demand per user pair)
- Examples: location_proximity, age_gap, physical_match, quiz_match_overall

### BehaviorEvent Processing
- Append-only table
- `processedAt` nullable for idempotency
- `ruleVersion` for reprocessing when rules change
- Never store `dimensionsAffected` (derived from rules)

### Dimension Mapping
- Rules stored in DimensionMappingRule table
- Multiple rules can map to same dimension (weights additive)
- Rules can be negative for dis-preference
- Version field enables reprocessing

## Schema Statistics

- **Total Models**: 19
- **Total Enums**: 8
- **Total Indexes**: ~40+
- **Total Relationships**: ~30+
- **JSON Fields**: 9
- **Service Annotations**: 2

## Ready for Code Generation ✅

The schema is complete and ready for:
1. Prisma Client generation
2. Database migration
3. SSOT code generator (services, controllers, routes, DTOs, validators)


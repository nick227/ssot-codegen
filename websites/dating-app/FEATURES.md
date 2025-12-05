# Dating App Backend - MVP Feature Specification

## Project Overview
A data analytics-driven dating app backend that combines profile-based matching with flexible personality quiz systems. The core is a behavioral tracking engine that builds personality dimensions from user interactions, enabling multi-dimensional compatibility matching with user-configurable priorities.

## Core MVP Features

### 1. User Profiles & Authentication

#### 1.1 User Accounts
- **Authentication**: Email/password, OAuth (Google, Facebook, Apple)
- **Basic Profile**: Name, age, gender, location (city, state, country), bio, photos
- **Account Status**: Active, Suspended, Deleted, Banned

#### 1.2 Profile Attributes
- **Demographics**: Age, gender, location, ethnicity (optional)
- **Physical Attributes**: Height, body type, eye color, hair color
- **Lifestyle**: Education, occupation, interests
- **Photos**: Multiple photos with ordering and moderation status

#### 1.3 Profile Meta Values
- **Meta Tags**: Profiles have flexible meta key-value pairs (JSON)
- **Namespacing Rules**: Use dot notation for nested keys to prevent collisions:
  - `personality.type` (not `personality_type`)
  - `lifestyle.activity_level` (not `lifestyle_activity_level`)
  - `values.career` (not `values_career`)
  - `interests` (array, top-level)
- **Meta Normalization**: 
  - Keys: Lowercase, trimmed, no spaces (e.g., `personality.type` not `Personality.Type`)
  - Array values: Trimmed, deduplicated
  - String values: Trimmed, lowercase for matching
- **Examples**: `personality.type`, `interests`, `lifestyle.activity_level`, `values.career`, `goals.relationship`
- **Purpose**: Used for behavioral tracking and dimension weighting

### 2. Likes & Matching System

#### 2.1 Swipe Mechanics
- **Like**: User likes a profile (swipe right/up)
- **Dislike**: User dislikes a profile (swipe left/down)
- **Match**: Mutual like creates a match
- **Unmatch**: Users can unmatch at any time

#### 2.2 Discovery Queue
- **Algorithm**: Show users based on preferences, location, compatibility
- **Filtering**: Exclude already swiped users, blocked users, out of range
- **Sorting**: 
  - Primary: Compatibility score (computed on-demand using user's current `UserDimensionPriority`)
  - Secondary: Distance (for tie-breaking)
  - Tertiary: Activity recency (last login/activity)

**Discovery Service** (Complex Business Logic):
- **Not Simple CRUD**: Discovery combines compatibility calculation + hard filters + soft weights + pagination
- **Service Annotation**: Use `@service` annotation in Prisma schema (anchor on `Swipe` model):
  ```prisma
  /// @service discovery-service
  /// @methods getDiscoveryQueue, getCandidates, refreshQueue
  /// @description Discovery queue with compatibility-based matching, filters, and pagination
  model Swipe {
    // ... fields
  }
  ```
- **Generated Methods**:
  - `getDiscoveryQueue(userId, limit, offset)` - Get paginated discovery queue
  - `getCandidates(userId, filters, priorities)` - Get filtered candidates with compatibility scores
  - `refreshQueue(userId)` - Refresh discovery queue (recalculate compatibility)

**Compatibility Score Computation:**
- Computed on-demand for each candidate user using requesting user's `UserDimensionPriority` weights
- **Batching**: Process candidates in batches (e.g., 50 at a time) to avoid overload
- **Candidate Pool**: Limit initial candidate pool (e.g., 1000 users) before compatibility calculation
- **Caching**: Compatibility scores cached per user pair in Redis:
  - Key: `compat:{userId1}:{userId2}` (always userId1 < userId2)
  - TTL: 15 minutes
  - Cache invalidation triggers:
    - User changes `UserDimensionPriority`
    - User's `UserDimensionScore` updated (personality dimensions)
    - User's profile updated (affects system dimensions)
    - Cache TTL expires

**Cold-Start Handling:**
- Users with < 10 behavior events OR < 3 `UserDimensionScore` records use default compatibility
- Default compatibility: Based on hard filters (location, age) and system dimensions only
- Personality dimensions excluded from calculation until sufficient data

### 3. Flexible Personality Quiz System

#### 3.1 Quiz Structure
- **Quiz Types**: Support wide range (multiple choice, Likert scale, ranking, scenario-based, free text)
- **Flexible Schema**: Questions and answers stored as flexible JSON structures
- **Quiz Metadata**: Title, description, category, estimated time, meta tags (JSON)
- **Question Types**: Single select, multiple select, slider, ranking, text input, matrix

**Question Type Validation & Scoring:**

**multiple_choice** (single select):
- Validation: Answer must be one of the options in `configJson.options`
- Scoring: Exact match = 100, no match = 0
- Answer format: `{"value": "option_text"}`

**multiple_select**:
- Validation: Answer must be array of options, all in `configJson.options`
- Scoring: `(matched_options / total_options) × 100`
- Answer format: `{"value": ["option1", "option2"]}`

**likert** (scale):
- Validation: Answer must be integer in range `[configJson.min, configJson.max]` (default: 1-5)
- Scoring: Direct value (normalized to 0-100): `((value - min) / (max - min)) × 100`
- Answer format: `{"value": 4}`

**slider**:
- Validation: Answer must be float in range `[configJson.min, configJson.max]`
- Scoring: Direct value (normalized to 0-100): `((value - min) / (max - min)) × 100`
- Answer format: `{"value": 7.5}`

**ranking**:
- Validation: Answer must be array containing all options in `configJson.options`, no duplicates
- Scoring: Compare rankings: `100 - (sum of position differences × 10)` (clamped to 0-100)
- Answer format: `{"value": ["option1", "option2", "option3"]}`

**text_input**:
- Validation: Answer must be non-empty string, max length from `configJson.maxLength`
- Scoring: Not scored automatically (requires manual review or NLP analysis)
- Answer format: `{"value": "user text response"}`

**matrix** (multiple questions in grid):
- Validation: Each row must have answer matching row's question type
- Scoring: Average of individual question scores
- Answer format: `{"value": {"row1": "answer1", "row2": "answer2"}}`

#### 3.2 Quiz Meta Values
- **Meta Tags**: Quizzes have flexible meta key-value pairs (JSON)
- **Examples**: `category`, `personality_dimension`, `focus_area`, `difficulty`
- **Purpose**: Used for behavioral tracking and dimension weighting

#### 3.3 Quiz Completion
- **Status**: Not started, In progress, Completed
- **Results**: Store answers as JSON in `QuizAnswer`, calculate scores per quiz in `QuizResult`
- **Retaking**: Allow retaking quizzes (track history via multiple `QuizResult` records)
- **Single Source of Truth**: Quiz-based personality contributions come from `BehaviorEvent` records:
  - `quiz_take` event created when user completes quiz (triggers dimension updates)
  - `quiz_like`/`quiz_dislike` events created when user approves/rejects results (triggers dimension updates)
  - `QuizResult` exists for UX/analytics display only, NOT used for dimension scoring
  - `QuizAnswer` stores raw answers, used to compute `QuizResult`, but dimension updates come from events
- **Matching**: Compare quiz results between users for compatibility (via `quiz_match_overall` system dimension)

### 4. Behavioral Tracking & Personality Dimensions

#### 4.1 Event Tracking
Track all user interactions as behavior events:

**EventType Enum** (exhaustive list):
- `profile_view` - User views another profile
- `profile_like` - User likes a profile
- `profile_dislike` - User dislikes a profile
- `quiz_open` - User opens/views a quiz
- `quiz_take` - User completes a quiz
- `quiz_like` - User likes/approves quiz results
- `quiz_dislike` - User dislikes/rejects quiz results
- `message_sent` - User sends a message in a match
- `match_view` - User views a match profile
- `match_ghost` - No message activity for N days (default: 7)
- `match_streak` - Messages sent on consecutive days

**Rate Limiting & Throttling:**
- **Profile events**: Max 1000 views/likes/dislikes per user per day
- **Message events**: Max 100 messages per user per match per day
- **Quiz events**: No limit (quizzes are intentional)
- **Throttling**: Events exceeding limits are rejected (HTTP 429)
- **Spam Detection**: Rapid-fire events (< 1 second apart) flagged for review

**Event Volume Management:**
- **Sharding**: Partition `BehaviorEvent` table by `userId` hash (e.g., 10 shards)
- **Archiving**: Events older than 90 days moved to `BehaviorEventArchive` table
- **Retention**: Archived events retained for 2 years, then deleted
- **Query Strategy**: Query active table first, archive table only for historical analysis

#### 4.2 Weighted Scoring System
Behavioral events contribute weighted points to personality dimensions based on meta values:

**Event Weights (from EventWeightConfig):**
- `profile_view`: `+1 point`
- `profile_like`: `+3 points`
- `profile_dislike`: `-4 points`
- `quiz_open`: `0 points` (tracked for analytics only)
- `quiz_take`: `+1 point`
- `quiz_like`: `+points` (weighted by match strength)
- `quiz_dislike`: `-points` (weighted by mismatch strength)
- `message_sent`: `+0.5 points` (weighted by message length and response time)
- `match_view`: `+0.2 points`

**Note**: Actual weights are stored in `EventWeightConfig` table, not hard-coded. Default values shown above.

**Processing Rules:**
- Workers use `eventType` and `meta` keys to look up `DimensionMappingRule` records
- Rules map meta keys/values to existing `PersonalityDimension.id` values
- **Complex Meta Handling**: Rules support:
  - **Simple values**: `meta.profile_meta.personality.type = "introvert"` → dimension `introversion`
  - **Array values**: `meta.profile_meta.interests` contains `"music"` → dimension `interests_music`
  - **Nested tags**: `meta.profile_meta.lifestyle.activity_level = "high"` → dimension `activity_level`
  - **Multiple matches**: One meta value can match multiple rules (e.g., `interests: ["music", "travel"]` matches both `interests_music` and `interests_travel`)
- **Meta Parsing Normalization**:
  - Keys: Lowercase, trimmed, dot notation for nesting
  - Array values: Trimmed, deduplicated, lowercase for matching
  - String values: Trimmed, lowercase for matching
  - Numbers: Parsed as floats, validated against ranges
- **Multiple Meta Keys → Same Dimension**:
  - When multiple rules map to same dimension, weights are **additive** (not averaged)
  - Example: `interests: ["music", "travel"]` matches both `interests_music` (weight=1.0) and `interests_travel` (weight=1.0)
  - Total points = `eventWeight × (ruleWeight1 + ruleWeight2 + ...)`
- **Negative Mappings** (dis-preference):
  - `DimensionMappingRule.weight` can be negative (e.g., -1.0)
  - Negative weights create dis-preference (reduce dimension score)
  - Example: `profile_dislike` with `personality.type = "introvert"` → `-4 × -1.0 = +4` points to `introversion` (user dislikes introverts, so they're less introverted)
- Event weights come from `EventWeightConfig` (e.g., view +1, like +3, dislike -4)
- **Dynamic Weighting**: Some event types have dynamic weights:
  - `message_sent`: Base weight × `(message_length / 100)` × `(1 / (response_time_hours + 1))`
  - `match_streak`: Base weight × `consecutive_days`
  - `match_ghost`: Negative weight × `days_since_last_message`
- Point deltas = `eventWeight` × `ruleWeight` × `dynamicMultiplier` (if applicable)
- Point deltas are applied to `UserDimensionScore` records (only for personality dimensions, not system dimensions)
- **Important**: The list of affected dimensions is NOT stored on the event (it's derived from rules)
- **Rule Versioning**: `BehaviorEvent.ruleVersion` stores the rule version used when processed, enabling reprocessing when rules change
- **Concurrency Control**: 
  - Use database transactions with row-level locking on `UserDimensionScore`
  - `UpdateDimensionScoresJob` uses `SELECT ... FOR UPDATE` to prevent concurrent updates
  - Reprocessing uses batch locks to prevent conflicts with real-time updates

**Example Flow:**
1. User views profile with `{"personality": {"type": "introvert"}, "interests": ["music"]}`
2. Worker normalizes meta (lowercase, trim), then looks up rules: `personality.type=introvert` → dimension `introversion`, `interests` contains `music` → dimension `interests_music`
3. Adds +1 point to user's `introversion` and `interests_music` dimension scores (via `UpdateDimensionScoresJob`)
4. If user likes profile, adds +3 points to both dimensions
5. If no rules match a meta value, that value is ignored (no dimension update)

#### 4.3 Personality Dimensions

**Canonical Definition:**
- All dimensions are explicitly defined as records in `PersonalityDimension` table
- Fields: `id` (string key, e.g., "introversion", "interests_music"), `name`, `description`, `category` (profile/quiz/behavior/system/mixed), `isActive` (boolean), `normalizationConfig` (JSON, optional)
- Dimensions are NOT auto-created from JSON meta values

**Meta-Driven Mapping:**
- Profile meta and quiz meta do NOT create dimensions automatically
- Configuration/rules map meta keys/values to existing `PersonalityDimension.id` values
- Example: Rule maps `personality.type=introvert` → dimension `introversion`, `interests` contains `music` → dimension `interests_music`
- Rules are configurable and can be updated without changing event data
- **No Match Handling**: If no `DimensionMappingRule` matches a meta value, that value is ignored (no dimension update occurs)
- **Inactive Dimensions**: If `PersonalityDimension.isActive = false`, rules targeting it are skipped (no dimension update occurs)

**Dimension Values:**
- `UserDimensionScore` stores one row per (`userId`, `dimensionId`) with:
  - `normalizedScore` (0-100 float) - primary score used for compatibility
  - `rawScore` (optional float) - accumulated points before normalization
  - `lastUpdated` (DateTime) - timestamp of last rawScore update
  - `lastNormalizedAt` (DateTime) - timestamp of last normalization
- Scores reflect affinity (higher = stronger preference/fit)
- Raw scores accumulate from events, then normalized periodically

**RawScore Pruning & Overflow Prevention:**
- **Pruning Strategy**: After normalization, reset `rawScore` to 0 if `|rawScore| > 1000` (prevent unbounded growth)
- **Overflow Protection**: Clamp `rawScore` to [-10000, 10000] before normalization (prevent integer overflow)
- **Periodic Cleanup**: Monthly job resets `rawScore` for records where `lastNormalizedAt < NOW() - 30 days` and `|rawScore| < 100`

**Dimension Types:**
- **Profile-based** (`category = "profile"`): From profile meta interactions (e.g., liking profiles with certain meta values)
- **Quiz-based** (`category = "quiz"`): From quiz meta interactions (e.g., completing quizzes tagged with certain dimensions)
- **Behavioral** (`category = "behavior"`): From interaction patterns (e.g., frequent messaging, response times, ghosting patterns)
- **System** (`category = "system"`): Non-personality factors like location, age gap, physical attributes, and aggregate quiz compatibility
- **Mixed-source** (`category = "mixed"`): Dimensions that can be updated from multiple sources:
  - Example: `communication_style` can be updated from:
    - Profile meta (`profile_meta.communication_style`)
    - Quiz results (`quiz_meta.communication_dimension`)
    - Message behavior (`message_sent` events with message length/response time)
  - Multiple `DimensionMappingRule` records can target the same dimension from different sources

**System Dimensions:**
Non-personality factors like location, age gap, physical attributes, and aggregate quiz compatibility are modeled as special `PersonalityDimension` rows (e.g., `location_proximity`, `age_gap`, `physical_match`, `quiz_match_overall`) with `category = "system"`.

**Important**: System dimensions are **pairwise** (depend on both users) and are **NOT stored in `UserDimensionScore`**. They are computed on-demand during compatibility calculation using specialized formulas. However, they are included in `UserDimensionPriority` and treated identically in compatibility calculations, keeping the math unified.

**Storage vs Computation:**
- **Personality dimensions**: Stored in `UserDimensionScore` per user, updated from behavior events
- **System dimensions**: Computed on-demand per user pair, not stored per user

**Score Normalization:**
- All `UserDimensionScore.normalizedScore` values are stored in fixed range (0-100)
- `max_score_range` in compatibility formulas is 100
- Event-based point deltas accumulate into `rawScore`
- **Default Normalization (MVP)**: Use symmetric clamp-based normalization: clamp `rawScore` to [-R, R] (e.g., R=100), then map linearly to 0-100
- Periodic normalization job converts `rawScore` → `normalizedScore` using this clamp-based approach

### 5. Compatibility Engine

#### 5.1 Compatibility Calculation Flow

**Step 1: Personality Dimension Score Aggregation**
- Each user has scores across multiple **personality dimensions** (`UserDimensionScore.normalizedScore`)
- **Only personality dimensions** are stored in `UserDimensionScore` (NOT system dimensions)
- Dimension scores are continuously updated from behavior events
- Scores are normalized (0-100), representing user's affinity (higher = stronger preference/fit)

**Step 2: Personality Dimension Comparison**
- Compare two users' personality dimension scores to calculate dimension-level compatibility
- **Input**: Both users' `normalizedScore` values (0-100 scale)
- Formula: `personality_dimension_compatibility = 1 - |user1_normalizedScore - user2_normalizedScore| / 100`
- Result: 0-1 compatibility per personality dimension (closer scores = higher compatibility)
- **Convert to 0-100 scale**: `personality_dimension_compatibility_100 = personality_dimension_compatibility × 100`
- **Consistency**: All compatibility scores (personality + system) use 0-100 scale for final calculation

**Step 3: System Dimension Calculation**
- System dimensions are **pairwise** (depend on both users), computed on-demand during compatibility calculation
- System dimensions are **NOT stored in `UserDimensionScore`** (they're computed per user pair)
- Specialized formulas compute system dimension compatibility (0-100) per user pair:

**location_proximity** (0-100, higher = closer):
- Formula: `Haversine distance` between user locations (lat/lng)
- Calculation: `distance_km = haversine(user1.lat, user1.lng, user2.lat, user2.lng)`
- Score: `100 × max(0, 1 - (distance_km / max_distance_km))` where `max_distance_km = 100` (configurable)
- If distance > max_distance_km, score = 0

**age_gap** (0-100, higher = smaller gap):
- Formula: `age_difference = |user1.age - user2.age|`
- Score: `100 × max(0, 1 - (age_difference / max_age_gap))` where `max_age_gap = 20` (configurable)
- If age_difference > max_age_gap, score = 0

**physical_match** (0-100, higher = better match):
- Attributes compared: height, body_type, eye_color, hair_color
- Formula: `match_score = Σ(attribute_match × attribute_weight) / Σ(attribute_weight)`
- Attribute weights: height=0.3, body_type=0.4, eye_color=0.15, hair_color=0.15
- Attribute match: 100 if exact match, 50 if similar (e.g., "tall" vs "very_tall"), 0 if different
- Score: `physical_match = match_score` (0-100)

**quiz_match_overall** (0-100, higher = better match):
- Compare all `QuizResult` records for both users
- For each quiz both users completed:
  - Extract answers from `QuizAnswer` records
  - Compare answers per question (exact match = 100, partial match = 50, no match = 0)
  - Quiz score = average of question scores
- Overall score = weighted average of quiz scores (weighted by quiz importance if specified)
- If no shared quizzes, score = 50 (neutral)

- System dimension compatibility scores are computed fresh for each compatibility calculation

**Step 4: User-Defined Priorities**
- Users set weights/priorities for each dimension (`UserDimensionPriority`)
- **Weight Range**: 0.0 to 10.0 (float), default = 1.0
- Default: All dimensions weighted equally (weight = 1.0 for all)
- Users can prioritize any dimension, including:
  - Personality dimensions (e.g., `introversion`, `interests_music`)
  - System dimensions (e.g., `location_proximity`, `age_gap`, `physical_match`, `quiz_match_overall`)
- **New Dimension Handling**: When new dimensions are added:
  - Existing users get default weight = 1.0 for new dimensions
  - Users can update weights via `UserDimensionPriority` API
  - System dimensions can be previewed in compatibility breakdowns (UI shows calculated values)
- **Weight Normalization**: If user defines weights for only some dimensions:
  - Missing dimensions get default weight = 1.0
  - Weights are normalized: `normalized_weight = weight / Σ(all_weights)` to ensure sum = 1.0
  - Formula: `final_compatibility = Σ(dimension_compatibility_100 × normalized_weight)`
- **Deterministic Ordering**: When compatibility scores tie:
  - Primary: Compatibility score (descending)
  - Secondary: Distance (ascending, closer first)
  - Tertiary: Activity recency (descending, more recent first)
  - Quaternary: User ID (ascending, deterministic)

**Step 5: Weighted Compatibility Score**
- Combine personality dimension compatibility (from Step 2) and system dimension compatibility (from Step 3)
- All compatibility scores are on 0-100 scale
- Formula: `overall_compatibility = Σ(dimension_compatibility_100 × normalized_weight)` where sum is over all dimensions (personality + system)
- Result: 0-100 compatibility percentage
- Breakdown: Calculate compatibility per dimension for transparency (all on 0-100 scale)

**Step 6: Hard Filters vs Soft Weights**
- **Hard Filters**: Applied BEFORE compatibility calculation (exclude non-matching users):
  - Location radius (max distance)
  - Age range (min/max age)
  - Gender preferences
  - Blocked users
- **Soft Weights**: Applied DURING compatibility calculation (affect score, don't exclude):
  - `UserDimensionPriority` weights for all dimensions (personality + system)
  - System dimensions computed on-demand (location_proximity, age_gap, etc.)
- **Interaction**: Hard filters reduce candidate pool, then soft weights rank remaining candidates

**Step 7: Final Compatibility Score**
- Combine weighted dimension compatibility (personality + system dimensions)
- Result: 0-100 overall compatibility score
- **On-Demand Calculation**: Compatibility computed on-demand from `UserDimensionScore` + `UserDimensionPriority` + system dimension formulas + hard filters
- **Optional Caching**: Results may be cached (Redis for short TTL, `CompatibilityScore` table for persistent cache/analytics)
- **Cold-Start Handling**: Users with insufficient `UserDimensionScore` data use default compatibility based on hard filters and system dimensions only

#### 5.2 Compatibility Dimensions

Users can view and filter matches by multiple dimensions:
- **Location**: Distance-based matching
- **Age**: Age range matching
- **Physical Attributes**: Height, body type, etc.
- **Personality Dimensions**: All tracked personality dimensions
- **Quiz Compatibility**: Quiz result matching
- **Behavioral Compatibility**: Interaction pattern matching

#### 5.3 Combinatorial Filtering
- **Separate Views**: View matches by single dimension
- **Combined Views**: Combine multiple dimensions (e.g., location + age + personality)
- **User-Defined Priorities**: Users set weights/priorities for each dimension
- **Dynamic Calculation**: Recalculate compatibility based on user priorities

#### 5.4 Compatibility Storage

**MVP Strategy: On-Demand + Optional Cache**

Compatibility is computed on-demand when a user requests matches, using:
- `UserDimensionScore` (normalized scores)
- `UserDimensionPriority` (user-defined weights)
- Hard filters (location, age, gender preferences)

Results may be cached per user (e.g., in Redis) for short TTLs (e.g., 5-15 minutes).

The `CompatibilityScore` table is **optional** and acts as a persistent cache/analytics table, **not the primary source of truth**. The app must work if this table is empty (i.e., compute on-demand).

**CompatibilityScore Table (Optional Cache - ⚠️ CACHE ANCHOR ONLY):**
- **⚠️ IMPORTANT**: This table is a cache, NOT the source of truth. Compatibility is computed on-demand from `UserDimensionScore` + `UserDimensionPriority` + system dimension formulas. The generator should NOT treat this as primary data.
- Stores calculated compatibility between user pairs for caching/analytics
- Fields: `user1Id`, `user2Id`, `overallScore` (0-100), `dimensionBreakdown` (JSON), `calculatedAt`, `cacheVersion` (string)
- **Constraint**: `user1Id < user2Id` uniqueness rule to avoid duplicates (always store smaller ID first)
- Indexed for fast lookups: `@@unique([user1Id, user2Id])` where `user1Id < user2Id`
- Updated by background job or on-demand calculation
- **Cache Behavior**: Can be cleared/rebuilt at any time without data loss (recomputed from source data)
- **Cache Invalidation Rules**:
  - Invalidate when user's `UserDimensionPriority` changes (set `cacheVersion = newVersion`)
  - Invalidate when user's `UserDimensionScore` updated (set `cacheVersion = newVersion`)
  - Invalidate when user's profile updated (affects system dimensions)
  - Invalidate when `DimensionMappingRule` or `EventWeightConfig` changes (mass invalidation)
  - TTL: Records older than 24 hours are considered stale (recalculate on read)
- Can be periodically refreshed or cleared

**Dimension Breakdown Structure (JSON):**
```json
{
  "location_proximity": 85,
  "age_gap": 92,
  "physical_match": 78,
  "quiz_match_overall": 82,
  "introversion": 78,
  "interests_music": 95
}
```

**Note**: 
- Keys use canonical `PersonalityDimension.id` values (e.g., `location_proximity`, not `location`)
- Values are 0-100 compatibility scores per dimension (NOT 0-1)
- All dimensions (personality + system) use same 0-100 scale for consistency

### 6. Messaging System

#### 6.1 Match-Based Messaging
- **Match Requirement**: Only message after matching
- **Message Threads**: One conversation thread per match
- **Message Types**: Text, photos, GIFs
- **Read Receipts**: Track message read status
- **Message History**: Full conversation history

#### 6.2 Message Tracking
- **Behavioral Data**: Track message frequency, response time, message length, ghosting, streaks
- **Event Creation**: Each message sent creates a `BehaviorEvent` with:
  - `eventType = "message_sent"`
  - `targetType = "match"`
  - `meta` includes: `match_id`, `message_length`, `response_time_seconds`, `is_first_message`
- **Additional Events**:
  - `match_ghost`: Created when no message for N days (default: 7 days)
  - `match_streak`: Created when messages sent on consecutive days
- **Dimension Contribution**: Message events contribute to personality dimensions via `DimensionMappingRule`:
  - **Frequent messaging**: `message_sent` events → `communication_frequency` dimension
  - **Fast response times**: `message_sent` events with low `response_time_seconds` → `responsiveness` dimension
  - **Long messages**: `message_sent` events with high `message_length` → `communication_style` dimension
  - **Ghosting**: `match_ghost` events → `communication_reliability` dimension (negative)
  - **Streaks**: `match_streak` events → `communication_consistency` dimension (positive)
- **Weighting**: Message event weights from `EventWeightConfig` with dynamic multipliers:
  - Base weight: +0.5 points
  - Multiplier: `(message_length / 100)` × `(1 / (response_time_hours + 1))`
  - Ghosting: Base weight × `(-days_since_last_message / 7)`
  - Streak: Base weight × `consecutive_days`

## Data Model Overview

### Core Entities

1. **User**: User accounts and authentication
2. **Profile**: Extended user profile with meta values (JSON field)
3. **Photo**: User photos
4. **Swipe**: Like/dislike interactions between users
5. **Match**: Mutual likes creating matches
6. **Message**: Messages between matched users
7. **Quiz**: Quiz definitions with flexible structure and meta values (JSON)
8. **QuizQuestion**: Questions within quizzes (structured columns + flexible config JSON)
9. **QuizAnswer**: User answers to quiz questions (structured columns + flexible answer JSON)
10. **QuizResult**: Calculated quiz scores per user (for UX/analytics display, not primary matching source)
11. **BehaviorEvent**: All user interactions/events tracked (append-only, includes `processedAt` for idempotency, `ruleVersion` for reprocessing)
12. **BehaviorEventArchive**: Archived events older than 90 days (for historical analysis, retention 2 years)
13. **PersonalityDimension**: Canonical dimension definitions (explicitly defined, includes system dimensions with category="system", `isActive` flag)
14. **UserDimensionScore**: User's score for each dimension (normalizedScore 0-100, rawScore optional, lastUpdated, lastNormalizedAt) - **only for personality dimensions, NOT system dimensions**
15. **CompatibilityScore**: Optional cache table for calculated compatibility between user pairs
    - **⚠️ CACHE ANCHOR ONLY**: This table is a cache, NOT the source of truth. Compatibility is computed on-demand from `UserDimensionScore` + `UserDimensionPriority` + system dimension formulas. The generator should NOT treat this as primary data.
16. **UserDimensionPriority**: User-defined weights/priorities for dimensions (includes system dimensions, weight range 0.0-10.0)
17. **DimensionMappingRule**: Configuration rules that map meta keys/values → PersonalityDimension.id (includes `isActive` flag, `version` for reprocessing)
18. **EventWeightConfig**: Configuration for event type weights (view +1, like +3, etc., includes `isActive` flag)
19. **Block**: Blocked user relationships

**Admin Configuration Service** (Optional):
- **Purpose**: Admin UI/API for managing configuration models (`DimensionMappingRule`, `EventWeightConfig`)
- **Service Annotation**: Use `@service` annotation in Prisma schema (anchor on `DimensionMappingRule` model):
  ```prisma
  /// @service admin-config-service
  /// @methods createRule, updateRule, deleteRule, bulkUpdateRules, getRuleHistory, createEventWeight, updateEventWeight, getConfigStatus
  /// @description Admin service for managing dimension mapping rules and event weight configurations
  model DimensionMappingRule {
    // ... fields
  }
  ```
- **Generated Methods**:
  - `createRule(ruleData)` - Create new dimension mapping rule
  - `updateRule(ruleId, updates)` - Update existing rule
  - `deleteRule(ruleId)` - Soft delete rule (set `isActive = false`)
  - `bulkUpdateRules(rules)` - Bulk update multiple rules
  - `getRuleHistory(ruleId)` - Get rule version history
  - `createEventWeight(eventType, weight)` - Create event weight config
  - `updateEventWeight(eventType, weight)` - Update event weight config
  - `getConfigStatus()` - Get overall configuration status (active rules count, pending changes, etc.)

### Key Relationships
- User → Profile (1:1)
- User → Photos (1:many)
- User → Swipes (1:many, as swiper and swiped)
- User → Matches (1:many, as user1 and user2)
- User → Messages (1:many, as sender and receiver)
- User → QuizAnswers (1:many)
- User → QuizResults (1:many)
- User → BehaviorEvents (1:many)
- User → UserDimensionScores (1:many)
- User → UserDimensionPriorities (1:many)
- User → CompatibilityScores (1:many, as user1 and user2)
- Quiz → QuizQuestions (1:many)
- QuizQuestion → QuizAnswers (1:many)
- PersonalityDimension → UserDimensionScores (1:many) - **only for personality dimensions, NOT system dimensions**
- PersonalityDimension → DimensionMappingRules (1:many)
- EventType → EventWeightConfig (1:1 via eventType enum)

### Database Indexes (Performance Critical)

**BehaviorEvent:**
- `@@index([userId, processedAt])` - For finding unprocessed events
- `@@index([userId, eventType, createdAt])` - For analytics queries
- `@@index([targetType, targetId])` - For finding events by target
- `@@index([ruleVersion, processedAt])` - For reprocessing queries

**UserDimensionScore:**
- `@@unique([userId, dimensionId])` - Ensure one score per user per dimension
- `@@index([dimensionId, normalizedScore])` - For compatibility calculations
- `@@index([userId, lastUpdated])` - For normalization job filtering

**CompatibilityScore:**
- `@@unique([user1Id, user2Id])` where `user1Id < user2Id` - Prevent duplicates
- `@@index([user1Id, calculatedAt])` - For cache invalidation
- `@@index([user2Id, calculatedAt])` - For cache invalidation

**UserDimensionPriority:**
- `@@unique([userId, dimensionId])` - One priority per user per dimension
- `@@index([userId])` - For compatibility calculations

**DimensionMappingRule:**
- `@@index([eventType, targetType, isActive])` - For rule lookup
- `@@index([dimensionId, isActive])` - For finding rules per dimension

**Swipe:**
- `@@unique([swiperId, swipedId])` - Prevent duplicate swipes
- `@@index([swiperId, createdAt])` - For discovery queue filtering

**Match:**
- `@@index([user1Id, createdAt])` - For user's matches
- `@@index([user2Id, createdAt])` - For user's matches

### Flexible Data Structures

#### Profile Meta Values (JSON)
```json
{
  "personality": {
    "type": "introvert"
  },
  "interests": ["music", "travel", "reading"],
  "lifestyle": {
    "activity_level": "active"
  },
  "values": {
    "career": "high",
    "family": "high"
  },
  "goals": {
    "relationship": "serious"
  }
}
```

**Namespacing**: Use dot notation for nested keys (e.g., `personality.type` not `personality_type`) to prevent collisions.

#### Quiz Meta Values (JSON)
```json
{
  "category": "personality",
  "personality_dimension": "big_five_openness",
  "focus_area": "creativity",
  "difficulty": "medium"
}
```

#### QuizQuestion Table Structure
**Columns:**
- `id` (string, primary key)
- `quizId` (string, foreign key to Quiz)
- `type` (enum: multiple_choice, likert, slider, ranking, text_input, matrix, etc.)
- `order` (int, for question ordering)
- `configJson` (JSON, flexible: options, scale ranges, question text, etc.)

**Example configJson:**
```json
{
  "question": "How do you prefer to spend your free time?",
  "options": ["Reading", "Sports", "Socializing", "Creative activities"],
  "required": true
}
```

#### QuizAnswer Table Structure
**Columns:**
- `id` (string, primary key)
- `quizId` (string, foreign key to Quiz)
- `questionId` (string, foreign key to QuizQuestion)
- `userId` (string, foreign key to User)
- `answerJson` (JSON, flexible: stores answer based on question type)
- `createdAt` (DateTime)

**Example answerJson:**
```json
{
  "value": ["Reading", "Creative activities"]
}
```

#### Behavior Event Structure

**Base Structure:**
```json
{
  "eventType": "profile_like",
  "userId": "user123",
  "targetType": "profile",
  "targetId": "profile456",
  "meta": { ... },
  "ruleVersion": "v1.0"
}
```

**Meta Shape by Event Type:**

For `eventType = "profile_view"`, `targetType = "profile"`:
```json
{
  "profile_meta": {
    "personality": {
      "type": "introvert"
    },
    "interests": ["music", "travel"]
  }
}
```

For `eventType = "profile_like"`, `targetType = "profile"`:
```json
{
  "profile_meta": {
    "personality": {
      "type": "introvert"
    },
    "interests": ["music", "travel"]
  }
}
```

For `eventType = "profile_dislike"`, `targetType = "profile"`:
```json
{
  "profile_meta": {
    "personality": {
      "type": "introvert"
    },
    "interests": ["music", "travel"]
  }
}
```

For `eventType = "quiz_open"`, `targetType = "quiz"`:
```json
{
  "quiz_meta": {
    "category": "personality",
    "personality_dimension": "big_five_openness"
  }
}
```

For `eventType = "quiz_take"`, `targetType = "quiz"`:
```json
{
  "quiz_meta": {
    "category": "personality",
    "personality_dimension": "big_five_openness"
  },
  "quiz_result_id": "result123"
}
```

For `eventType = "quiz_like" | "quiz_dislike"`, `targetType = "quiz"`:
```json
{
  "quiz_meta": {
    "category": "personality",
    "personality_dimension": "big_five_openness"
  },
  "quiz_result_id": "result123",
  "match_strength": 0.85
}
```

For `eventType = "message_sent"`, `targetType = "match"`:
```json
{
  "match_id": "match123",
  "message_length": 150,
  "response_time_seconds": 3600,
  "is_first_message": false
}
```

For `eventType = "match_view"`, `targetType = "match"`:
```json
{
  "match_id": "match123"
}
```

For `eventType = "match_ghost"`, `targetType = "match"`:
```json
{
  "match_id": "match123",
  "days_since_last_message": 7
}
```

For `eventType = "match_streak"`, `targetType = "match"`:
```json
{
  "match_id": "match123",
  "consecutive_days": 5
}
```

**Meta Key Rules:**
- For each `eventType` + `targetType` combination, we define what keys may exist in `meta`
- `profile_meta` appears when `targetType = "profile"`
- `quiz_meta` appears when `targetType = "quiz"`
- Match interaction events include `match_id` and relevant metrics
- Rules reference these specific keys when mapping to dimensions
- Workers infer affected dimensions from `eventType` + `meta` + `DimensionMappingRule` records

**targetId Consistency:**
- `targetType = "profile"`: `targetId` = `Profile.id` (the profile being viewed/liked/disliked)
- `targetType = "quiz"`: `targetId` = `Quiz.id` (the quiz being opened/taken/liked/disliked)
- `targetType = "match"`: `targetId` = `Match.id` (the match for message/view/ghost/streak events)
- Always references the primary entity ID, never nested IDs

**Rule Versioning:**
- `BehaviorEvent.ruleVersion` stores the version of rules used when event was processed
- When rules change, events with old `ruleVersion` can be reprocessed (set `processedAt = NULL`)
- This enables rule updates without data migration

**Important**: `dimensionsAffected` is NOT stored on the event. Workers infer affected dimensions from `eventType` + `meta` + configurable rules. This keeps events append-only and allows rule changes without data migration.


## Technical Requirements

### Backend
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Job Queue**: Bull/BullMQ for background jobs
- **Caching**: Redis for session management and caching
- **File Storage**: AWS S3 or similar for photos
- **Search**: PostgreSQL full-text search or Elasticsearch

### Background Jobs

#### UpdateDimensionScoresJob
- **Trigger**: When behavior events are created OR when rules change (reprocessing)
- **Process**: 
  1. Read `BehaviorEvent` records where `processedAt IS NULL` in batches (e.g., 1000 at a time)
  2. Extract meta values from event (`meta.profile_meta`, `meta.quiz_meta`, or `meta.match_id` based on `targetType`)
  3. Normalize meta keys/values (lowercase, trim, deduplicate arrays)
  4. Look up `DimensionMappingRule` records (where `isActive = true`) to map meta keys/values → `PersonalityDimension.id` values
  5. Filter: Only process rules where target `PersonalityDimension.isActive = true`
  6. If no rules match, skip event (no dimension update)
  7. Look up `EventWeightConfig` to get base weight for `eventType`
  8. Calculate dynamic multiplier if applicable (message length, response time, streak, etc.)
  9. Calculate weighted points: `points = baseWeight × Σ(ruleWeights) × dynamicMultiplier` (sum for multiple rules mapping to same dimension)
  10. **Transaction with Locking**:
     - Begin transaction
     - `SELECT ... FOR UPDATE` on `UserDimensionScore` rows to lock
     - Update `UserDimensionScore.rawScore` (accumulate points) and `lastUpdated = NOW()` - **only for personality dimensions, NOT system dimensions**
     - Commit transaction
  11. Set `BehaviorEvent.processedAt = NOW()` and `BehaviorEvent.ruleVersion = currentRuleVersion` to mark event as processed
- **Frequency**: Near real-time (process events as they occur) OR batch reprocessing when rules change
- **Batching**: Process in batches to avoid overload, use pagination
- **Performance**: Limit to N events per batch (e.g., 1000), process with rate limiting
- **Idempotency**: Only processes events with `processedAt IS NULL`, then sets `processedAt` when done
- **Concurrency**: 
  - Use database transactions with `SELECT ... FOR UPDATE` to prevent concurrent updates
  - Reprocessing batches use separate lock keys to avoid conflicts with real-time processing
  - Real-time processing has priority (reprocessing waits if conflict)
- **Reprocessing**: When rules change:
  - Set `processedAt = NULL` for events with old `ruleVersion`
  - Process in batches to avoid overload
  - Can take hours/days for large event volumes
  - Uses same transaction/locking strategy to prevent conflicts

#### NormalizeDimensionScoresJob
- **Trigger**: 
  - Periodic (e.g., hourly or daily) - full normalization pass
  - On-demand when `UserDimensionScore.rawScore` changes significantly (threshold-based)
  - After `UpdateDimensionScoresJob` completes a batch (incremental normalization)
- **Process**:
  1. Read `UserDimensionScore` records in batches (e.g., 1000 at a time)
  2. Filter: Only process records where:
     - `rawScore` has changed since last normalization (compare `lastUpdated` vs `lastNormalizedAt`), OR
     - `lastNormalizedAt IS NULL` (never normalized), OR
     - `|rawScore| > 1000` (needs pruning), OR
     - `lastUpdated > lastNormalizedAt + 1 hour` (stale normalization)
  3. For each dimension, get normalization config from `PersonalityDimension.normalizationConfig`:
     - Default: Clamp-based normalization with R=100
     - Per-dimension: Can override R value or use different strategy
  4. **Prune rawScore if needed**:
     - If `|rawScore| > 10000`, clamp to [-10000, 10000] (overflow prevention)
     - If `|rawScore| > 1000` after normalization, reset to 0 (pruning)
  5. Normalize `rawScore` → `normalizedScore` (0-100 range):
     - Clamp `rawScore` to [-R, R] (R from config, default 100)
     - Map linearly: `normalizedScore = ((clamped_rawScore + R) / (2 * R)) * 100`
  6. Update `normalizedScore`, `lastNormalizedAt = NOW()`, and optionally reset `rawScore` if pruned
- **Frequency**: Periodic (hourly/daily) + incremental (after dimension updates)
- **Batching**: Process in batches to avoid overload, use pagination
- **Purpose**: Ensure all dimension scores are normalized for compatibility calculations

#### CalculateCompatibilityJob (Optional Cache Population)
- **Trigger**: 
  - On-demand when user requests matches (primary path)
  - Optional: Periodic batch to populate `CompatibilityScore` cache
- **Process**:
  1. Get user pairs that need calculation (or all active users for batch)
  2. Read `UserDimensionScore.normalizedScore` for both users
  3. Read `UserDimensionPriority` weights
  4. Compare dimension scores and apply priorities
  5. Calculate additional factors (location, age, etc.)
  6. Compute final compatibility score (0-100)
  7. Optionally store in `CompatibilityScore` table (if using persistent cache)
- **Frequency**: On-demand (primary) + optional periodic batch
- **Note**: App must work without this job running (compute on-demand)

#### ProcessMatchesJob
- **Trigger**: When mutual likes occur
- **Process**: Create match records, trigger notifications
- **Frequency**: Real-time

### API Endpoints (High Level)
- **Authentication**: `/auth/*` (register, login, logout, refresh)
- **Users**: `/users/*` (profile CRUD, preferences)
- **Discovery**: `/discovery/*` (get queue, swipe)
- **Matches**: `/matches/*` (list matches, unmatch, get compatibility breakdown)
- **Quizzes**: `/quizzes/*` (list quizzes, get questions, submit answers, get results)
- **Dimensions**: `/dimensions/*` (list dimensions, get user scores, set priorities)
- **Compatibility**: `/compatibility/*` (get compatibility scores, breakdowns, filtered matches)
- **Messages**: `/messages/*` (send, list, read receipts)
- **Analytics**: `/analytics/*` (user insights, behavioral data)
  - `/analytics/user/:userId/dimensions` - Get user's dimension scores
    - Query: `SELECT * FROM UserDimensionScore WHERE userId = ?`
    - Limit: Max 100 dimensions per request
    - Caching: 5 min TTL
  - `/analytics/user/:userId/events` - Get user's behavior events (paginated, filtered by eventType, date range)
    - Query: `SELECT * FROM BehaviorEvent WHERE userId = ? AND eventType IN (?) AND createdAt BETWEEN ? AND ? ORDER BY createdAt DESC LIMIT ? OFFSET ?`
    - Pagination: Max 1000 events per page
    - Date range: Max 90 days
    - Index: `@@index([userId, eventType, createdAt])`
  - `/analytics/user/:userId/compatibility-breakdown/:otherUserId` - Get compatibility breakdown with another user
    - Computes on-demand (not cached)
    - Returns dimension breakdown JSON
  - `/analytics/quiz/:quizId/stats` - Get quiz completion stats
    - Query: `SELECT COUNT(*), AVG(score) FROM QuizResult WHERE quizId = ?`
    - Aggregated stats only (no raw data)
  - `/analytics/dimension/:dimensionId/distribution` - Get dimension score distribution
    - Query: `SELECT normalizedScore, COUNT(*) FROM UserDimensionScore WHERE dimensionId = ? GROUP BY normalizedScore`
    - Bucketed into 10-point ranges (0-10, 10-20, etc.)
    - Max 100 buckets

## Implementation Notes

### Behavioral Tracking
- **Track Everything**: Every user interaction logged as `BehaviorEvent` (append-only)
- **Event Structure**: Store `eventType`, `userId`, `targetType`, `targetId`, `meta` (JSON), `processedAt` (nullable DateTime)
- **Meta Shape**: Defined per `eventType` + `targetType` combination (`profile_meta` for profiles, `quiz_meta` for quizzes)
- **No Derived Data**: Do NOT store `dimensionsAffected` on events (derived from rules)
- **Real-time Processing**: Process events immediately to update dimension scores
- **Efficient Storage**: Use efficient data structures for high-volume event storage
- **Idempotent Processing**: Only process events where `processedAt IS NULL`, then set `processedAt` when done

### Flexible Quiz System
- **Structured + Flexible**: Use structured columns (`id`, `quizId`, `type`, `order`) + flexible JSON (`configJson`, `answerJson`)
- **Type Safety**: `type` enum ensures valid question types, JSON provides flexibility
- **Validation**: Implement validation layer for quiz types while maintaining flexibility
- **Versioning**: Support quiz versions/updates while maintaining backward compatibility
- **QuizResult Purpose**: `QuizResult` exists for UX and analytics (e.g., showing "your Big Five result" per quiz). Matching and dimension scores are driven primarily by `BehaviorEvent` → `UserDimensionScore`, not by `QuizResult`

### Dimension System
- **Canonical Definition**: Dimensions explicitly defined in `PersonalityDimension` table, NOT auto-created from JSON
- **System Dimensions**: Special dimensions (`location_proximity`, `age_gap`, `physical_match`, `quiz_match_overall`) with `category = "system"` for non-personality factors
- **Storage Difference**: 
  - Personality dimensions: Stored in `UserDimensionScore` per user
  - System dimensions: Computed on-demand per user pair, NOT stored per user
- **Unified Treatment**: All dimensions (personality + system) treated identically in `UserDimensionPriority` and compatibility calculations
- **Rule-Based Mapping**: `DimensionMappingRule` records map meta keys/values → dimension IDs
- **Event Weighting**: `EventWeightConfig` stores weights for each event type (not hard-coded)
- **Weighted Contributions**: All dimension contributions weighted by meta values and event types
- **Continuous Updates**: Dimension scores update continuously as new behaviors occur (personality dimensions only)
- **Score Normalization**: Raw scores accumulate, then normalized to 0-100 range via clamp-based normalization (configurable per dimension, default: clamp to [-100, 100], map linearly to 0-100)
- **No Freeform Keys**: All dimension IDs must exist in `PersonalityDimension` table
- **Cold-Start Handling**: Users with insufficient dimension scores use default compatibility based on hard filters and system dimensions only

### Compatibility Engine
- **On-Demand Calculation**: Primary path computes compatibility on-demand from `UserDimensionScore` + `UserDimensionPriority` + system dimension formulas
- **System Dimensions**: Computed on-demand per user pair (NOT stored in UserDimensionScore)
- **Hard Filters vs Soft Weights**: Hard filters (location radius, age range) exclude candidates; soft weights (UserDimensionPriority) rank remaining candidates
- **Optional Caching**: `CompatibilityScore` table is optional cache/analytics, not required
- **Discovery Queue Sorting**: Uses on-demand compatibility score (computed with user's current priorities), cached in Redis (5-15 min TTL)
- **User-Driven**: Users define their own dimension priorities
- **Multi-Dimensional**: Combine all dimensions (personality + system) with user weights
- **Transparent**: Show users why matches were made (dimension breakdowns)
- **Efficient**: Cache results in Redis (short TTL) or `CompatibilityScore` table (persistent cache)
- **Normalized Scores**: All dimension scores normalized to 0-100 range for fair comparison
- **Cold-Start Handling**: Users with insufficient dimension scores use default compatibility based on hard filters and system dimensions only

## Success Metrics

### User Engagement
- Daily active users (DAU)
- Swipes per user per day
- Match rate (matches / likes sent)
- Quiz completion rate
- Message response rate

### Matching Quality
- Average compatibility score of matches
- Match-to-message conversion rate
- User satisfaction with matches
- Dimension accuracy (how well dimensions predict successful matches)

### Analytics Quality
- Behavior event tracking accuracy
- Dimension calculation accuracy
- Compatibility prediction accuracy
- User engagement with dimension insights

## Schema Generation Constraints

### Critical Rules for AI Schema Generator

#### 1. Dimensions Must Be Canonical
- **NO auto-creation** of dimensions from JSON meta values
- All dimensions MUST exist as explicit records in `PersonalityDimension` table
- Includes system dimensions (`location_proximity`, `age_gap`, `physical_match`, `quiz_match_overall`) with `category = "system"`
- **Storage difference**: Personality dimensions stored in `UserDimensionScore` per user; system dimensions computed on-demand per user pair
- Meta keys/values are mapped to dimensions via `DimensionMappingRule` records, not direct creation
- `PersonalityDimension.id` is a string key (e.g., "introversion", "interests_music", "location_proximity")
- All dimensions (personality + system) treated identically in `UserDimensionPriority` and compatibility calculations

#### 2. JSON is Leaf-Data Only
- **Structured columns first**: Use typed columns (`id`, `type`, `order`, etc.) for relational structure
- **JSON for flexibility**: Use JSON fields (`configJson`, `answerJson`, `meta`) only for flexible leaf data
- **Examples**:
  - ✅ `QuizQuestion.type` (enum) + `QuizQuestion.configJson` (JSON)
  - ✅ `Profile.meta` (JSON) + `Profile.age` (int)
  - ❌ Pure JSON tables without structured columns

#### 3. BehaviorEvent is Append-Only
- **NO derived fields**: Do NOT store `dimensionsAffected` on `BehaviorEvent`
- **Event structure**: `eventType`, `userId`, `targetType`, `targetId`, `meta` (JSON), `processedAt` (nullable DateTime), `ruleVersion` (string)
- **Meta shape**: Defined per `eventType` + `targetType` combination:
  - Profiles: `profile_meta`
  - Quizzes: `quiz_meta`
  - Matches: `match_id`, `message_length`, `response_time_seconds` (for message events)
- **Processing**: Workers infer affected dimensions from event + `DimensionMappingRule` records
- **Idempotency**: `BehaviorEvent` includes `processedAt` (nullable) and `ruleVersion`. Dimension update workers must only process events where `processedAt IS NULL`, update scores, then set `processedAt` and `ruleVersion` to current values
- **Reprocessing**: When rules change, set `processedAt = NULL` for events with old `ruleVersion` to enable reprocessing

#### 4. CompatibilityScore is Optional Cache
- **⚠️ CACHE ANCHOR ONLY**: `CompatibilityScore` is a cache table, NOT the source of truth
- **Primary truth**: `UserDimensionScore` + `UserDimensionPriority` + system dimension formulas
- **On-demand calculation**: Compatibility computed from dimension scores + priorities (app must work if cache is empty)
- **Optional cache**: `CompatibilityScore` table is optional, app must work without it
- **Generator Note**: Do NOT treat `CompatibilityScore` as primary data. It's a performance optimization cache that can be cleared/rebuilt at any time.
- **Constraints**: `user1Id < user2Id` uniqueness rule, `overallScore` normalized 0-100

#### 5. Score Normalization
- **Normalized range**: All `UserDimensionScore.normalizedScore` values are 0-100 (float)
- **Raw scores**: Optional `rawScore` field accumulates points before normalization (unbounded)
- **Normalization config**: Stored in `PersonalityDimension.normalizationConfig` (JSON), allows per-dimension strategies
- **Default normalization**: Clamp-based normalization: clamp `rawScore` to [-R, R] (R configurable per dimension, default 100), then map linearly to 0-100
- **Normalization job**: Periodic job converts `rawScore` → `normalizedScore` using config-based approach, processes in batches, only updates changed records
- **max_score_range**: Always 100 in compatibility formulas

#### 6. Event Processing is Idempotent
- `BehaviorEvent` includes `processedAt` (nullable DateTime) and `ruleVersion` (string)
- Dimension update workers must only process events where `processedAt IS NULL`
- After processing, set `processedAt` to current timestamp and `ruleVersion` to current rule version
- Events are append-only, never modified after creation (except `processedAt` and `ruleVersion`)
- **Reprocessing**: When `DimensionMappingRule` or `EventWeightConfig` changes, set `processedAt = NULL` for events with old `ruleVersion` to enable reprocessing

## Critical Implementation Notes

### System Dimensions Storage
- **System dimensions are pairwise**: They depend on both users, NOT stored per-user
- **Computed on-demand**: System dimension compatibility scores computed fresh for each compatibility calculation
- **NOT in UserDimensionScore**: Only personality dimensions stored in `UserDimensionScore`; system dimensions computed per pair

### Dimension Mapping Rules
- **Explicit Configuration**: `DimensionMappingRule` table stores all meta → dimension mappings
- **Not Hard-Coded**: Rules are configurable, stored in database
- **Reprocessing Support**: When rules change, set `BehaviorEvent.processedAt = NULL` for events with old `ruleVersion`

### Event Weighting
- **Explicit Configuration**: `EventWeightConfig` table stores base weights for each event type
- **Not Hard-Coded**: Weights are configurable, stored in database
- **Final Points**: `EventWeightConfig.baseWeight` × `DimensionMappingRule.weight`

### Normalization Strategy
- **Per-Dimension Config**: `PersonalityDimension.normalizationConfig` (JSON) allows per-dimension strategies
- **Default**: Clamp-based normalization with R=100 (configurable per dimension)
- **Batching**: Normalization job processes in batches, only updates changed records

### Cold-Start Users
- **Insufficient Data Thresholds** (formalized):
  - `< 10 behavior events` OR
  - `< 3 UserDimensionScore records` (personality dimensions)
- **Default Compatibility**: Based on hard filters (location, age) and system dimensions only
- **Personality Dimensions**: Excluded from compatibility calculation until threshold met
- **Gradual Improvement**: As users accumulate events, personality dimension scores become meaningful
- **Progressive Inclusion**: Once threshold met, personality dimensions gradually included with lower weight initially (e.g., weight = 0.5 × normal weight until 20 events)

### Score Representation Consistency
- **All compatibility scores use 0-100 scale**:
  - Personality dimension compatibility: Converted from 0-1 to 0-100
  - System dimension compatibility: Computed directly as 0-100
  - Overall compatibility: 0-100 percentage
  - Dimension breakdown JSON: All values 0-100 (NOT 0-1)
- **Internal calculations**: May use 0-1 for intermediate steps (e.g., dimension comparison), but final outputs always 0-100
- **Consistency rule**: All dimension compatibility scores in breakdown JSON use same 0-100 scale

### System Dimensions Preview
- **UI Display**: System dimensions can be previewed in compatibility breakdowns
- **Calculation**: System dimension scores computed on-demand when viewing compatibility breakdown
- **Not Stored**: System dimensions are NOT stored in `UserDimensionScore`, only computed per pair
- **Preview Logic**: When user views another user's profile, system dimensions calculated and shown in breakdown
- **Performance**: System dimension calculation is fast (< 10ms per pair) and cached per session

### Hard Filters vs Soft Weights
- **Hard Filters**: Applied BEFORE compatibility calculation (exclude non-matching users)
  - Location radius (max distance) - users outside radius excluded
  - Age range (min/max age) - users outside range excluded
  - Gender preferences - users not matching preferences excluded
  - Blocked users - blocked users excluded
- **Edge Cases**:
  - **Manual Search**: Users can manually search/view profiles outside hard filters (e.g., out of radius)
  - **Manual Search Behavior**: Manual searches bypass hard filters but still use compatibility scores for ranking
  - **Filter Override**: Users can temporarily override filters (e.g., "show me users further away") - this is a UI preference, not a hard filter change
- **Soft Weights**: Applied DURING compatibility calculation (affect score, don't exclude)
  - `UserDimensionPriority` weights for all dimensions
  - System dimensions computed on-demand
  - Even if user is manually searched (bypassing filters), soft weights still apply

## Future Enhancements (Post-MVP)
- Advanced ML-based matching
- Video profiles and video calls
- Events and group activities
- Social features (friends, groups)
- Premium features and subscriptions
- Advanced moderation and safety features

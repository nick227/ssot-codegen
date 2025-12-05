# Technical Specifications - Dating App Backend

## EventType Enum (Exhaustive List)

```typescript
enum EventType {
  PROFILE_VIEW = "profile_view",
  PROFILE_LIKE = "profile_like",
  PROFILE_DISLIKE = "profile_dislike",
  QUIZ_OPEN = "quiz_open",
  QUIZ_TAKE = "quiz_take",
  QUIZ_LIKE = "quiz_like",
  QUIZ_DISLIKE = "quiz_dislike",
  MESSAGE_SENT = "message_sent",
  MATCH_VIEW = "match_view",
  MATCH_GHOST = "match_ghost",
  MATCH_STREAK = "match_streak"
}
```

## Rate Limiting & Throttling

- **Profile events**: Max 1000 views/likes/dislikes per user per day
- **Message events**: Max 100 messages per user per match per day
- **Quiz events**: No limit (quizzes are intentional)
- **Throttling**: Events exceeding limits are rejected (HTTP 429)
- **Spam Detection**: Rapid-fire events (< 1 second apart) flagged for review

## BehaviorEvent Volume Management

- **Sharding**: Partition `BehaviorEvent` table by `userId` hash (e.g., 10 shards)
- **Archiving**: Events older than 90 days moved to `BehaviorEventArchive` table
- **Retention**: Archived events retained for 2 years, then deleted
- **Query Strategy**: Query active table first, archive table only for historical analysis

## UserDimensionScore Fields

- `normalizedScore` (0-100 float) - primary score used for compatibility
- `rawScore` (optional float) - accumulated points before normalization
- `lastUpdated` (DateTime) - timestamp of last rawScore update
- `lastNormalizedAt` (DateTime) - timestamp of last normalization

## RawScore Pruning & Overflow Prevention

- **Pruning Strategy**: After normalization, reset `rawScore` to 0 if `|rawScore| > 1000` (prevent unbounded growth)
- **Overflow Protection**: Clamp `rawScore` to [-10000, 10000] before normalization (prevent integer overflow)
- **Periodic Cleanup**: Monthly job resets `rawScore` for records where `lastNormalizedAt < NOW() - 30 days` and `|rawScore| < 100`

## System Dimension Formulas

### location_proximity (Haversine)
```javascript
distance_km = haversine(user1.lat, user1.lng, user2.lat, user2.lng)
score = 100 × max(0, 1 - (distance_km / max_distance_km))
// max_distance_km = 100 (configurable)
```

### age_gap
```javascript
age_difference = |user1.age - user2.age|
score = 100 × max(0, 1 - (age_difference / max_age_gap))
// max_age_gap = 20 (configurable)
```

### physical_match
```javascript
// Attributes: height, body_type, eye_color, hair_color
// Weights: height=0.3, body_type=0.4, eye_color=0.15, hair_color=0.15
match_score = Σ(attribute_match × attribute_weight) / Σ(attribute_weight)
// attribute_match: 100 if exact, 50 if similar, 0 if different
```

### quiz_match_overall
```javascript
// Compare all QuizResult records for both users
// For each shared quiz: compare answers per question
// Quiz score = average of question scores
// Overall = weighted average of quiz scores
// If no shared quizzes: score = 50 (neutral)
```

## UserDimensionPriority Weight Range

- **Range**: 0.0 to 10.0 (float)
- **Default**: 1.0 for all dimensions
- **New Dimensions**: Existing users get default weight = 1.0 for new dimensions

## Deterministic Ordering (Tie-Breaking)

1. Compatibility score (descending)
2. Distance (ascending, closer first)
3. Activity recency (descending, more recent first)
4. User ID (ascending, deterministic)

## Meta Parsing Normalization

- **Keys**: Lowercase, trimmed, dot notation for nesting
- **Array values**: Trimmed, deduplicated, lowercase for matching
- **String values**: Trimmed, lowercase for matching
- **Numbers**: Parsed as floats, validated against ranges

## Multiple Meta Keys → Same Dimension

- When multiple rules map to same dimension, weights are **additive** (not averaged)
- Total points = `eventWeight × Σ(ruleWeights)`

## Negative Mappings (Dis-preference)

- `DimensionMappingRule.weight` can be negative (e.g., -1.0)
- Negative weights create dis-preference (reduce dimension score)
- Example: `profile_dislike` with negative weight → user dislikes trait, so they're less of that trait

## Concurrency Control

- Use database transactions with `SELECT ... FOR UPDATE` on `UserDimensionScore`
- Reprocessing uses batch locks to prevent conflicts with real-time updates
- Real-time processing has priority (reprocessing waits if conflict)

## Quiz Question Type Validation & Scoring

See FEATURES.md Section 3.1 for complete validation and scoring logic for each question type.

## Profile Meta Namespacing

- Use dot notation for nested keys: `personality.type` not `personality_type`
- Prevents collisions: `values.career` vs `values.family` vs `values` (array)

## targetId Consistency

- `targetType = "profile"`: `targetId` = `Profile.id`
- `targetType = "quiz"`: `targetId` = `Quiz.id`
- `targetType = "match"`: `targetId` = `Match.id`
- Always references primary entity ID, never nested IDs


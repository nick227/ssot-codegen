# Dimension Mapping Rules - Configuration Guide

## Overview
`DimensionMappingRule` records define how meta keys/values from behavior events map to `PersonalityDimension.id` values.

## Rule Structure

**Example Rule:**
```json
{
  "id": "rule_profile_personality_introvert",
  "eventType": "profile_view|profile_like|profile_dislike",
  "targetType": "profile",
  "metaKey": "personality_type",
  "metaValue": "introvert",
  "dimensionId": "introversion",
  "weight": 1.0,
  "isActive": true
}
```

## Rule Matching Logic

1. Match `eventType` (can be pipe-separated list: "profile_view|profile_like")
2. Match `targetType`
3. Extract value from `meta[metaKey]` (e.g., `meta.profile_meta.personality_type`)
4. Match `metaValue`:
   - **Simple values**: Exact match (e.g., `"introvert"`)
   - **Array values**: Check if array contains value (e.g., `interests: ["music", "travel"]` matches `"music"`)
   - **Nested tags**: Use dot notation (e.g., `lifestyle.activity_level`)
   - **Pattern matching**: Support wildcards/regex (e.g., `"music*"` matches `"music_lover"`)
5. Apply weight multiplier to event weight
6. Update `UserDimensionScore` for `dimensionId` (only personality dimensions, NOT system dimensions)

## Complex Meta Examples

**Array Matching:**
```json
{
  "metaKey": "interests",
  "metaValue": "music",
  "matchType": "array_contains"
}
```
Matches: `meta.profile_meta.interests = ["music", "travel"]`

**Nested Matching:**
```json
{
  "metaKey": "lifestyle.activity_level",
  "metaValue": "high",
  "matchType": "nested"
}
```
Matches: `meta.profile_meta.lifestyle = {"activity_level": "high", "diet": "vegetarian"}`

**Multiple Rules per Meta:**
- One meta value can match multiple rules
- Example: `interests: ["music", "travel"]` matches both `interests_music` and `interests_travel` rules
- All matching rules are applied (points accumulate)

## Event Weight Configuration

`EventWeightConfig` stores base weights for each event type:

```json
{
  "eventType": "profile_view",
  "baseWeight": 1.0,
  "isActive": true
}
```

Final points = `EventWeightConfig.baseWeight` × `DimensionMappingRule.weight`

## Storage

Rules stored in `DimensionMappingRule` table:
- `id` (string, primary key)
- `eventType` (string, can be pipe-separated: "profile_view|profile_like")
- `targetType` (enum: profile, quiz, match)
- `metaKey` (string, e.g., "personality_type")
- `metaValue` (string or pattern)
- `dimensionId` (string, foreign key to PersonalityDimension)
- `weight` (float, multiplier for event weight)
- `isActive` (boolean)
- `version` (string, for tracking rule versions)

## Reprocessing

When rules change:
1. Update `version` field
2. Set `BehaviorEvent.processedAt = NULL` for events with old `ruleVersion`
3. `UpdateDimensionScoresJob` will reprocess those events


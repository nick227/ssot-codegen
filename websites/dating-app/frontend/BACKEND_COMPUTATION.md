# Backend Computation Responsibilities

**Note**: This document describes backend/worker responsibilities. UI roadmap focuses on displaying server-computed results.

---

## 🔧 Backend Computation (Not UI Responsibility)

### Compatibility Calculation

**Backend/Worker**:
- Raw score normalization
- Dimension math (personality + system dimensions)
- System dimension formulas (location_proximity, age_gap, physical_match, quiz_match_overall)
- Weighted compatibility calculation
- Sorting discovery queue by compatibility

**Backend/API**:
- `GET /discovery/queue` - Returns profiles sorted by compatibility
- `GET /compatibility/:userId/:otherUserId` - Returns computed breakdown

**UI Responsibility**: Display server-computed scores, adjust priorities (triggers server recomputation)

---

### Discovery Queue Processing

**Backend/Worker**:
- Compute compatibility for each candidate
- Apply hard filters (location, age, gender)
- Sort by compatibility score (using user's priorities)
- Return sorted queue

**UI Responsibility**: Display sorted queue, adjust priorities (invalidates query, triggers server recomputation)

---

### Dimension Score Aggregation

**Backend/Worker**:
- Process behavior events → update UserDimensionScore
- Normalize raw scores → normalizedScore (0-100)
- Calculate top N dimensions per user
- Aggregate dimension scores for compatibility

**UI Responsibility**: Display dimension scores from server

---

### Behavior Event Processing

**Backend/Worker**:
- Process events in batches
- Look up DimensionMappingRule records
- Apply EventWeightConfig weights
- Update UserDimensionScore records
- Normalize scores periodically

**UI Responsibility**: Emit events via SDK, display updated scores

---

## 📊 Algorithm Optimizations (Backend)

### Discovery Feed Processing

**Backend**: Pre-compute maps, single-pass processing, cached lookups

### Compatibility Calculation

**Backend**: Memoize system dimension calculations, TTL-based cache

### Behavior Event Batching

**Backend**: Batch events, flush periodically

### Top Dimensions Query

**Backend**: Use heap-based top-K selection for efficiency

---

**These optimizations belong in backend/worker code, not UI roadmap.**


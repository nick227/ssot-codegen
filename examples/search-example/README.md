# Full-Text Search Example

This example demonstrates the **full-text search plugin** with multiple models, configurable ranking, and smart scoring.

## Features Demonstrated

✅ **Multi-Model Search** - Products, Users, Blog Posts, Reviews  
✅ **Configurable Weights** - Per-field importance (1-100)  
✅ **Smart Ranking** - Boost recent items, boost popular items  
✅ **Multiple Match Types** - exact, startsWith, contains, fuzzy, wordBoundary  
✅ **Federated Search** - Search across multiple models simultaneously  
✅ **Full Pagination** - Complete metadata for building UI  

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Database

```bash
# Create a PostgreSQL database
createdb search_example

# Set database URL
export DATABASE_URL="postgresql://user:password@localhost:5432/search_example"
```

### 3. Run Migrations

```bash
npx prisma migrate dev --name init
```

### 4. Generate Code

```bash
npx prisma generate
```

This generates:
- REST API with CRUD endpoints
- **Search endpoints** (`/api/search`, `/api/search/all`)
- Search service with intelligent scoring
- Search configuration (just data, no logic)

### 5. Seed Sample Data (Optional)

```bash
npm run seed
```

### 6. Start Server

```bash
cd generated
npm install
npm run dev
```

Server runs at `http://localhost:3000`

## Search API Examples

### Search Products

```bash
# Basic search
GET /api/search?q=laptop&model=product

# With pagination
GET /api/search?q=laptop&model=product&limit=10&skip=0

# Sort by recency
GET /api/search?q=laptop&model=product&sort=recent

# Sort by popularity
GET /api/search?q=laptop&model=product&sort=popular

# Filter by minimum score
GET /api/search?q=laptop&model=product&minScore=10
```

**Response:**
```json
{
  "results": [
    {
      "data": {
        "id": 1,
        "name": "Gaming Laptop",
        "description": "High-performance laptop for gaming",
        "price": 1299.99,
        "category": "Electronics",
        "viewCount": 450
      },
      "score": 35.5,
      "matches": [
        { "field": "name", "type": "startsWith" },
        { "field": "description", "type": "contains" }
      ]
    }
  ],
  "pagination": {
    "total": 12,
    "count": 10,
    "skip": 0,
    "limit": 10,
    "page": 1,
    "totalPages": 2,
    "hasMore": true,
    "hasPrevious": false
  },
  "query": "laptop",
  "model": "product"
}
```

### Search Users

```bash
GET /api/search?q=john&model=user
```

Searches across:
- Email (weight: 100, exact + startsWith)
- Name (weight: 90, all match types)
- Username (weight: 85, exact + startsWith)
- Bio (weight: 30, contains only)

### Search Blog Posts

```bash
GET /api/search?q=typescript&model=blogpost
```

Searches across:
- Title (weight: 100)
- Excerpt (weight: 60)
- Content (weight: 40)
- Tags (weight: 30)

With recency and popularity boosting.

### Search Reviews

```bash
GET /api/search?q=excellent&model=review
```

Searches across:
- Title (weight: 100)
- Content (weight: 70)

Boosts helpful reviews (reviews with more "helpful" votes).

### Federated Search (All Models)

```bash
# Search across all models
GET /api/search/all?q=gaming

# Search specific models only
GET /api/search/all?q=gaming&models=product,blogpost
```

**Response:**
```json
{
  "results": [
    {
      "model": "product",
      "results": [
        {
          "data": { "id": 1, "name": "Gaming Laptop" },
          "score": 35.5,
          "matches": [{ "field": "name", "type": "startsWith" }]
        }
      ]
    },
    {
      "model": "blogpost",
      "results": [
        {
          "data": { "id": 5, "title": "Best Gaming Setups 2024" },
          "score": 28.3,
          "matches": [{ "field": "title", "type": "contains" }]
        }
      ]
    }
  ],
  "pagination": {
    "total": 8,
    "modelsSearched": 2
  },
  "query": "gaming",
  "modelsSearched": ["product", "blogpost"]
}
```

## Search Configuration Breakdown

### Match Types Explained

1. **exact** - Query matches field value exactly
   - Query: `laptop` → Matches: `laptop` (not `Laptop Computer`)
   - Highest weight (20 by default)

2. **startsWith** - Field value starts with query
   - Query: `lap` → Matches: `Laptop`, `Laptop Computer`
   - High weight (15 by default)

3. **contains** - Query appears anywhere in field
   - Query: `game` → Matches: `Gaming Laptop`, `Best games`
   - Medium weight (5 by default)

4. **wordBoundary** - Query matches at word boundaries
   - Query: `comp` → Matches: `Laptop Computer` (matches "Computer")
   - Good weight (10 by default)

5. **fuzzy** - Levenshtein distance matching (typo-tolerant)
   - Query: `compter` → Matches: `computer` (1 letter difference)
   - Low weight (3 by default)

### Field Weights

Field weights determine relative importance:

```typescript
fields: [
  { name: 'name', weight: 100 },        // 2x importance of description
  { name: 'description', weight: 50 },  // 1.67x importance of category
  { name: 'category', weight: 30 }      // Standard importance
]
```

**How it works:**
- Match in `name` field → Score × 1.0 (100%)
- Match in `description` → Score × 0.5 (50%)
- Match in `category` → Score × 0.3 (30%)

### Ranking Boosts

#### Recent Boost
```typescript
boostRecent: { field: 'createdAt', weight: 5 }
```
- Uses exponential decay: `weight × e^(-ageInDays / 30)`
- Recent items get higher scores
- Effect diminishes over ~30 days

#### Popular Boost
```typescript
boostPopular: { field: 'viewCount', weight: 3 }
```
- Uses logarithmic scale: `weight × log(viewCount + 1)`
- Popular items get higher scores
- Prevents outliers from dominating

## Testing Search

### Using curl

```bash
# Search products for "laptop"
curl "http://localhost:3000/api/search?q=laptop&model=product"

# Search users for "john"
curl "http://localhost:3000/api/search?q=john&model=user"

# Federated search
curl "http://localhost:3000/api/search/all?q=gaming&models=product,blogpost"

# With pagination
curl "http://localhost:3000/api/search?q=laptop&model=product&limit=5&skip=10"

# Sort by popularity
curl "http://localhost:3000/api/search?q=laptop&model=product&sort=popular"
```

### Using Generated SDK

```typescript
import { createSDK } from './generated/src/sdk'

const sdk = createSDK({ baseURL: 'http://localhost:3000/api' })

// Search products
const productResults = await sdk.search.search('product', 'laptop', {
  limit: 10,
  skip: 0,
  sort: 'relevance'
})

// Federated search
const allResults = await sdk.search.searchAll('gaming', ['product', 'blogpost'])

console.log(`Found ${productResults.pagination.total} products`)
console.log(`Top result: ${productResults.results[0].data.name}`)
console.log(`Score: ${productResults.results[0].score}`)
```

## Architecture

### DRY Design

The search feature uses **DRY architecture**:

- **SearchEngine** (SDK Runtime): 261 lines of shared logic
- **Generated Config**: ~80 lines of configuration data
- **Generated Service**: ~70 lines (thin wrapper)
- **Generated Controller**: ~95 lines (validation + routing)

**Total Generated**: ~245 lines vs ~1000+ lines traditional approach

### Code Reuse

All search logic lives in `@ssot-codegen/sdk-runtime`:
- Scoring algorithms
- Match type implementations
- Ranking calculations
- Fuzzy matching (Levenshtein)
- Sorting logic

Generated projects only contain:
- Configuration (field weights, match types)
- Prisma queries (standard patterns)
- Thin wrappers around SearchEngine

### Benefits

✅ **Zero Logic Duplication** - SearchEngine implemented once  
✅ **Consistent Behavior** - All projects use same algorithm  
✅ **Easy Updates** - Improve SearchEngine, all projects benefit  
✅ **Testable** - SearchEngine has 27 comprehensive tests  
✅ **Type-Safe** - Full TypeScript support  

## Configuration Options

### Strategy

- `simple` (default) - In-memory scoring after Prisma fetch
- `postgres-fts` (future) - PostgreSQL full-text search
- `elasticsearch` (future) - External search engine

### Match Types

Choose which match types to enable per field:

```typescript
matchTypes: ['exact', 'startsWith', 'contains', 'wordBoundary', 'fuzzy']
```

Recommendations:
- **IDs, Emails**: `['exact', 'startsWith']` - No fuzzy
- **Names, Titles**: `['exact', 'startsWith', 'contains', 'wordBoundary']`
- **Descriptions**: `['contains', 'fuzzy']` - Allow typos
- **Tags, Categories**: `['exact', 'contains']`

### Ranking Options

```typescript
ranking: {
  boostRecent: { 
    field: 'createdAt',  // Date field
    weight: 5            // Boost strength
  },
  boostPopular: { 
    field: 'viewCount',  // Numeric field
    weight: 3 
  }
}
```

## Performance

### Dataset Size Recommendations

| Records | Strategy | Performance |
|---------|----------|-------------|
| < 1K | `simple` | Excellent (<10ms) |
| 1K - 10K | `simple` | Good (<50ms) |
| 10K - 100K | `simple` with tuning | Acceptable (<200ms) |
| 100K+ | `postgres-fts` | Recommended |
| 1M+ | `elasticsearch` | Recommended |

### Tuning

For large datasets, tune `fetchLimit`:

```typescript
const results = await searchService.search('product', 'laptop', {
  limit: 10,
  fetchLimit: 100  // Fetch 100 records, score all, return top 10
})
```

Higher `fetchLimit` = better results, slower performance.

## Advanced Usage

### Custom Scoring

Add custom scoring logic in generated code:

```typescript
// In search.config.ts, add after generation:
export const productSearchConfig: SearchConfig = {
  fields: [/* ... */],
  ranking: {
    customScorer: (record, query) => {
      let boost = 0
      
      // Boost based on rating
      if (record.rating) {
        boost += record.rating * 2  // 5-star = +10 points
      }
      
      // Boost if in stock
      if (record.inStock) {
        boost += 5
      }
      
      return boost
    }
  }
}
```

### Custom Preprocessor

Normalize queries before search:

```typescript
export const productSearchConfig: SearchConfig = {
  fields: [/* ... */],
  preprocessor: (query) => {
    return query
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, '')  // Remove special chars
      .replace(/\s+/g, ' ')          // Normalize whitespace
  }
}
```

### Custom Getter

Search across combined fields:

```typescript
fields: [
  {
    name: 'fullText',
    weight: 100,
    matchTypes: ['contains'],
    getter: (record) => {
      // Search across name, description, and category
      return `${record.name} ${record.description} ${record.category}`.toLowerCase()
    }
  }
]
```

## Testing

```bash
# Run all tests
npm test

# Test search engine (SDK runtime)
npm test search-engine.test.ts --workspace=packages/sdk-runtime

# Test search plugin
npm test full-text-search.plugin.test.ts --workspace=packages/gen
```

## Troubleshooting

### No Results Found

1. Check field names match Prisma schema
2. Verify model name is correct (case-sensitive)
3. Try lowering `minScore` to see weak matches
4. Check if records exist in database

### Poor Search Quality

1. Increase `fetchLimit` to score more records
2. Adjust field weights (higher = more important)
3. Add more match types to fields
4. Enable fuzzy matching for typo tolerance

### Slow Performance

1. Decrease `fetchLimit` (fetch fewer records)
2. Add database indexes on searched fields
3. Use `minScore` to filter weak matches early
4. Consider `postgres-fts` strategy for large datasets

## Next Steps

- Add search UI with highlighting
- Implement search analytics
- Add autocomplete/suggestions
- Upgrade to Postgres FTS for large datasets
- Add Elasticsearch integration

## Learn More

- [Plugin Documentation](../../packages/gen/src/plugins/search/README.md)
- [Review & Fixes](../../packages/gen/src/plugins/search/REVIEW_AND_FIXES.md)
- [SDK Runtime Search](../../packages/sdk-runtime/src/search/)


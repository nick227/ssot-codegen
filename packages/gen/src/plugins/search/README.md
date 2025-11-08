# Full-Text Search Plugin

DRY implementation of full-text search with configurable ranking and scoring.

## Architecture

- **SearchEngine** (SDK Runtime): Shared search logic - ONE implementation for all projects
- **Plugin**: Generates lightweight configuration files - NO duplicated logic
- **Generated Code**: ~50 lines of config vs 500+ lines of search implementation

## Configuration

Add to your `ssot.config.ts`:

```typescript
export default {
  plugins: {
    'full-text-search': {
      enabled: true,
      strategy: 'simple',  // or 'postgres-fts', 'elasticsearch'
      defaultWeights: {
        startsWith: 15,     // Higher weight for prefix matches
        exactMatch: 20,
        contains: 5,
        wordBoundary: 10,
        fuzzy: 3
      },
      models: {
        Product: {
          enabled: true,
          fields: [
            { 
              name: 'name', 
              weight: 100,      // Relative importance
              priority: 'high',
              matchTypes: ['startsWith', 'exact', 'contains', 'wordBoundary']
            },
            { 
              name: 'description', 
              weight: 50, 
              priority: 'medium',
              matchTypes: ['contains', 'fuzzy']
            },
            { 
              name: 'tags', 
              weight: 30, 
              matchTypes: ['exact', 'contains']
            }
          ],
          ranking: {
            boostRecent: { field: 'createdAt', weight: 5 },
            boostPopular: { field: 'viewCount', weight: 3 }
          }
        },
        User: {
          enabled: true,
          fields: [
            { name: 'email', weight: 100, matchTypes: ['startsWith', 'exact'] },
            { name: 'name', weight: 80, matchTypes: ['startsWith', 'contains'] }
          ]
        }
      }
    }
  }
}
```

## Generated Files

The plugin generates:

- `search/search.config.ts` - Configuration data (no logic)
- `search/search.service.ts` - Thin service that uses SearchEngine
- `search/search.controller.ts` - API endpoints
- `search/search.types.ts` - TypeScript types

## API Endpoints

### Search Single Model

```
GET /api/search?q=query&model=product&limit=10&skip=0&minScore=0&sort=relevance
```

Parameters:
- `q` (required): Search query
- `model` (required): Model name (lowercase)
- `limit` (optional): Number of results (default: 10)
- `skip` (optional): Skip for pagination (default: 0)
- `minScore` (optional): Minimum relevance score (default: 0.01)
- `sort` (optional): `relevance` | `recent` | `popular` (default: relevance)

Response:
```json
{
  "results": [
    {
      "data": { /* Product record */ },
      "score": 25.5,
      "matches": [
        { "field": "name", "type": "startsWith" },
        { "field": "description", "type": "contains" }
      ]
    }
  ],
  "total": 1,
  "query": "laptop",
  "model": "product"
}
```

### Federated Search (All Models)

```
GET /api/search/all?q=query&models=product,user&limit=10
```

Response:
```json
{
  "results": [
    {
      "model": "product",
      "results": [ /* SearchResult[] */ ]
    },
    {
      "model": "user",
      "results": [ /* SearchResult[] */ ]
    }
  ],
  "query": "john",
  "modelsSearched": ["product", "user"]
}
```

## Match Types

- **exact**: Exact match (highest weight)
- **startsWith**: Prefix match (e.g., "lap" matches "Laptop")
- **contains**: Substring match
- **wordBoundary**: Match at word boundaries (e.g., "comp" matches "Laptop Computer")
- **fuzzy**: Levenshtein distance matching (typo-tolerant)

## Ranking

### Recent Boost
Boosts items based on recency using exponential decay:
```typescript
ranking: {
  boostRecent: { field: 'createdAt', weight: 5 }
}
```

### Popularity Boost
Boosts items based on a numeric field using logarithmic scale:
```typescript
ranking: {
  boostPopular: { field: 'viewCount', weight: 3 }
}
```

## DRY Design

All search logic lives in `@ssot-codegen/sdk-runtime`. Generated projects only contain:
1. Configuration (data, not code)
2. Prisma queries (standard patterns)
3. Thin wrappers around SearchEngine

### Benefits

✅ **Zero Logic Duplication** - SearchEngine implemented once  
✅ **Consistent Behavior** - All projects use same algorithm  
✅ **Easy Updates** - Improve SearchEngine, all projects benefit  
✅ **Testable** - SearchEngine tested once, thoroughly  
✅ **Type-Safe** - Full TypeScript support  
✅ **Project-Specific** - Configuration per-project, per-model

## Example Usage

```typescript
import { SearchService } from '@/search/search.service'

const searchService = new SearchService()

// Search products
const results = await searchService.search('product', 'laptop', {
  limit: 10,
  skip: 0,
  minScore: 5,
  sort: 'relevance'
})

// Federated search
const allResults = await searchService.searchAll('john', ['product', 'user'])
```

## Testing

```bash
# Test SearchEngine (SDK runtime)
npm test search-engine.test.ts --workspace=packages/sdk-runtime

# Test Plugin
npm test full-text-search.plugin.test.ts --workspace=packages/gen
```

## Strategy Options

### Simple (Default)
- In-memory scoring after Prisma fetch
- Works with any database
- Good for small to medium datasets

### Postgres FTS (Future)
- Uses PostgreSQL full-text search
- Better performance for large datasets
- Requires Postgres-specific indexes

### Elasticsearch (Future)
- External search engine
- Best for very large datasets
- Requires separate ES instance


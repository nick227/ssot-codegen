# SDK Hook Contract - LOCKED v1.0.0

## 🔒 Frozen Contract (No Breaking Changes)

All UI components depend on these exact shapes. Breaking changes require major version bump.

---

## 📝 Hook Signatures

### useList

```typescript
function useList<T>(
  resource: string,
  params?: ListParams
): UseListResult<T>

interface ListParams {
  // Pagination
  page?: number          // 1-indexed
  pageSize?: number      // Default: 20
  
  // Sorting (multi-column)
  sort?: Array<{
    field: string
    dir: 'asc' | 'desc'
  }>
  
  // Filtering (all filters are AND-ed)
  filters?: Array<{
    field: string
    op: 'eq' | 'ne' | 'in' | 'lt' | 'lte' | 'gt' | 'gte' | 
        'contains' | 'startsWith' | 'endsWith' | 'between'
    value: any
  }>
  
  // Search
  search?: {
    query: string
    fields?: string[]    // Explicit fields (required for clarity)
  }
  
  // Include relations (Prisma-style)
  include?: Record<string, boolean | NestedInclude>
}

interface UseListResult<T> {
  data: T[]              // Array of items
  total: number          // Total count (for pagination)
  isLoading: boolean     // Initial load
  isFetching: boolean    // Background refetch
  error: ErrorShape | null
  refetch: () => void
}
```

---

### useGet

```typescript
function useGet<T>(
  resource: string,
  params: GetParams
): UseGetResult<T>

interface GetParams {
  id: string | number
  
  // Include relations
  include?: Record<string, boolean | NestedInclude>
}

interface UseGetResult<T> {
  data: T | null
  isLoading: boolean
  error: ErrorShape | null
  refetch: () => void
}
```

---

### useCreate

```typescript
function useCreate<TData, TInput>(
  resource: string
): UseCreateResult<TData, TInput>

interface UseCreateResult<TData, TInput> {
  mutate: (data: TInput) => Promise<TData>
  mutateAsync: (data: TInput) => Promise<TData>
  isPending: boolean
  error: ErrorShape | null
  reset: () => void
}
```

---

### useUpdate

```typescript
function useUpdate<TData, TInput>(
  resource: string
): UseUpdateResult<TData, TInput>

interface UseUpdateResult<TData, TInput> {
  mutate: (params: { id: string | number; data: TInput }) => Promise<TData>
  mutateAsync: (params: { id: string | number; data: TInput }) => Promise<TData>
  isPending: boolean
  error: ErrorShape | null
  reset: () => void
}
```

---

### useDelete

```typescript
function useDelete<TData = void>(
  resource: string
): UseDeleteResult<TData>

interface UseDeleteResult<TData> {
  mutate: (id: string | number) => Promise<TData>
  mutateAsync: (id: string | number) => Promise<TData>
  isPending: boolean
  error: ErrorShape | null
  reset: () => void
}
```

---

## 📊 Canonical Wire Formats

### Pagination Request/Response

**Client sends**:
```json
{
  "page": 1,
  "pageSize": 20
}
```

**Server returns**:
```json
{
  "items": [...],
  "total": 1234,
  "page": 1,
  "pageSize": 20,
  "totalPages": 62
}
```

---

### Sort Request

**Client sends**:
```json
{
  "sort": [
    { "field": "createdAt", "dir": "desc" },
    { "field": "title", "dir": "asc" }
  ]
}
```

**Server applies**: ORDER BY createdAt DESC, title ASC

---

### Filter Request

**Client sends**:
```json
{
  "filters": [
    { "field": "published", "op": "eq", "value": true },
    { "field": "createdAt", "op": "gte", "value": "2025-01-01T00:00:00Z" },
    { "field": "category", "op": "in", "value": ["tech", "news"] }
  ]
}
```

**Server applies**: WHERE published = true AND createdAt >= '2025-01-01' AND category IN ('tech', 'news')

---

### Search Request

**Client sends**:
```json
{
  "search": {
    "query": "hello world",
    "fields": ["title", "content"]
  }
}
```

**Server applies**: WHERE title ILIKE '%hello world%' OR content ILIKE '%hello world%'

---

## 📅 Date/Time Handling

**Wire format**: Always ISO 8601 strings (UTC)
```json
{
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

**Client display**: User's timezone (browser default or explicit)
```typescript
new Date(item.createdAt).toLocaleDateString()  // User's locale
```

**Server storage**: Always UTC in database

**Rule**: Params are ISO strings; display uses local time

---

## ❌ Error Shape (Normalized)

```typescript
interface ErrorShape {
  code: string           // Machine-readable: 'VALIDATION_ERROR', 'NOT_FOUND'
  message: string        // Human-readable: 'Email is required'
  details?: unknown      // Additional context (field errors, etc.)
}

// Examples:
{
  code: 'VALIDATION_ERROR',
  message: 'Validation failed',
  details: {
    fields: {
      email: 'Invalid email format',
      password: 'Must be at least 8 characters'
    }
  }
}

{
  code: 'NOT_FOUND',
  message: 'Post not found',
  details: { id: 123 }
}

{
  code: 'UNAUTHORIZED',
  message: 'Authentication required'
}
```

---

## 🔌 Adapter Contract

Adapters translate SDK contract to backend implementations:

```typescript
interface SDKAdapter {
  // Must implement these for any backend
  list<T>(resource: string, params: ListParams): Promise<{ items: T[]; total: number }>
  get<T>(resource: string, id: string | number, params?: GetParams): Promise<T | null>
  create<T>(resource: string, data: any): Promise<T>
  update<T>(resource: string, id: string | number, data: any): Promise<T>
  delete<T>(resource: string, id: string | number): Promise<T | void>
}

// Example implementations:
class RESTAdapter implements SDKAdapter { ... }
class TRPCAdapter implements SDKAdapter { ... }
class GraphQLAdapter implements SDKAdapter { ... }
```

---

## ✅ Contract Tests Required

Every adapter must pass:
- List with pagination
- List with sorting (single and multi-column)
- List with filters (all operators)
- List with search
- List with includes
- Get with ID
- Get with includes
- Create with data
- Update with ID + data
- Delete with ID
- Error handling (404, 401, 400, 500)

Mock server tests ensure contract conformance.

---

## 🎯 Version: 1.0.0 (LOCKED)

Date: 2025-01-15
Status: FROZEN - No changes without major version

Breaking changes require:
- Major version bump (2.0.0)
- Migration guide
- Deprecation period (6 months)
- Adapters for old contract (compatibility layer)


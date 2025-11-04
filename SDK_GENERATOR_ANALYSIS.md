# 🔍 CLIENT SDK GENERATOR - ANALYSIS & IMPLEMENTATION PLAN

**Date:** November 4, 2025  
**Status:** 🔴 **NOT IMPLEMENTED** (Only 13-line stub exists)  
**Priority:** 🔥 HIGH (Critical for frontend developers)

---

## 🚨 **CURRENT STATE: MINIMAL STUB**

### **What Exists: `packages/sdk-runtime/src/index.ts` (13 lines)**

```typescript
export type HttpMethod = 'GET'|'POST'|'PATCH'|'PUT'|'DELETE'
export interface ClientConfig { baseUrl?: string; headers?: Record<string,string> }
export const createClient = (cfg: ClientConfig = {}) => {
  const base = cfg.baseUrl || ''
  return {
    async request(path: string, init: RequestInit = {}) {
      const res = await fetch(base + path, init)
      if (!res.ok) throw new Error(`[sdk] ${res.status}`)
      const ct = res.headers.get('content-type') || ''
      return ct.includes('application/json') ? res.json() : res.text()
    }
  }
}
```

**What's Missing:** Everything! 🔴

---

## 🎯 **TARGET: PRODUCTION-READY SDK**

### **User's Vision (Comprehensive Requirements):**

1. ✅ **Fully Generated, Type-Safe** - Mirrors backend exactly
2. ✅ **Strict DTO Parity** - Same types as backend
3. ✅ **Lightweight, Tree-Shakable ESM** - Import only what you need
4. ✅ **Fetch or Axios** - Configurable HTTP client
5. ✅ **Typed Endpoints Per Model** - `api.posts.list()`, `api.posts.get(id)`
6. ✅ **Cursor Pagination Helpers** - Easy infinite scroll
7. ✅ **Indexed Filters** - Type-safe query building
8. ✅ **Automatic Type Narrowing** - Response and error types
9. ✅ **Abort Signals** - Cancel in-flight requests
10. ✅ **Retries** - Automatic retry logic
11. ✅ **Plug-in Authentication** - Tokens, interceptors
12. ✅ **Capability Guards** - Scoped access checks
13. ✅ **Hooks Integration** - Caching, SSR prefetching
14. ✅ **Query Invalidation** - Auto-invalidate after writes
15. ✅ **OpenAPI-Driven** - Synced with spec
16. ✅ **Manifest Hash Versioning** - Version locking
17. ✅ **Zero Maintenance** - Regenerates with backend

**Comparison:**
- **Required Features:** 17
- **Implemented Features:** 1 (basic fetch)
- **Completion:** ~6%

---

## 🏗️ **IMPLEMENTATION ARCHITECTURE**

### **1. SDK Runtime (Base Package)**

**Location:** `packages/sdk-runtime/src/`

**Files to Create:**

```
packages/sdk-runtime/src/
├── client/
│   ├── base-client.ts           # Core HTTP client with retries, abort
│   ├── auth-interceptor.ts      # Authentication middleware
│   ├── error-handler.ts         # Type-safe error responses
│   └── index.ts
├── models/
│   ├── base-model-client.ts     # Generic model client (CRUD + query)
│   ├── pagination-cursor.ts     # Cursor pagination helpers
│   ├── query-builder.ts         # Type-safe filter builder
│   └── index.ts
├── hooks/
│   ├── use-query.ts             # React Query integration
│   ├── use-mutation.ts          # Mutation hooks with invalidation
│   ├── use-infinite.ts          # Infinite scroll pagination
│   └── index.ts
├── guards/
│   ├── capability-guard.ts      # Permission checks
│   └── index.ts
├── types/
│   ├── api-response.ts          # Standard response types
│   ├── api-error.ts             # Error types
│   ├── pagination.ts            # Pagination types
│   └── index.ts
└── index.ts
```

**Estimated Lines:** ~1,200 lines (runtime infrastructure)

---

### **2. SDK Generator**

**Location:** `packages/gen/src/generators/sdk-generator.ts`

**What It Generates:**

```
gen/sdk/
├── index.ts                     # Main SDK export
├── client.ts                    # Configured client instance
├── models/
│   ├── post.client.ts           # Post-specific SDK
│   ├── user.client.ts           # User-specific SDK
│   ├── comment.client.ts        # Comment-specific SDK
│   └── index.ts
├── types/
│   ├── api-types.ts             # Re-export DTOs with API wrappers
│   └── index.ts
└── version.ts                   # Manifest hash for version checking
```

**Per-Model SDK Example:**
```typescript
// gen/sdk/models/post.client.ts
import type {
  PostCreateDTO,
  PostUpdateDTO,
  PostReadDTO,
  PostQueryDTO
} from '@gen/contracts/post'
import { BaseModelClient } from '@ssot-codegen/sdk-runtime'

export class PostClient extends BaseModelClient<
  PostReadDTO,
  PostCreateDTO,
  PostUpdateDTO,
  PostQueryDTO
> {
  constructor(client: APIClient) {
    super(client, '/api/posts')
  }
  
  // Auto-generated domain methods
  async findBySlug(slug: string) {
    return this.client.get<PostReadDTO>(`${this.basePath}/slug/${slug}`)
  }
  
  async listPublished(query?: PostQueryDTO) {
    return this.query({ ...query, where: { ...query?.where, published: true } })
  }
  
  async publish(id: number) {
    return this.client.post<PostReadDTO>(`${this.basePath}/${id}/publish`)
  }
}
```

**Estimated Lines:** ~50-150 lines per model

---

### **3. Usage Example (Frontend)**

```typescript
// Frontend app
import { createSDK } from '@gen/sdk'

const api = createSDK({
  baseUrl: 'http://localhost:3000',
  auth: {
    token: () => localStorage.getItem('jwt')
  }
})

// Type-safe API calls
const posts = await api.posts.list({
  skip: 0,
  take: 20,
  orderBy: '-createdAt',
  where: {
    published: true,
    views: { gte: 100 }
  }
})  // Type: { data: PostReadDTO[]; meta: PaginationMeta }

// Single fetch
const post = await api.posts.get(123)  // Type: PostReadDTO | null

// Create
const newPost = await api.posts.create({
  title: 'Hello',
  content: 'World',
  authorId: 1
})  // Type: PostReadDTO

// Domain methods
const published = await api.posts.listPublished()
const bySlug = await api.posts.findBySlug('hello-world')
await api.posts.publish(123)

// With React Query hooks
import { useQuery, useMutation } from '@gen/sdk/hooks'

function PostList() {
  const { data, isLoading } = useQuery(
    ['posts', 'list'],
    () => api.posts.list()
  )
  
  const publish = useMutation(
    (id: number) => api.posts.publish(id),
    {
      onSuccess: () => {
        // Auto-invalidates 'posts' queries
        queryClient.invalidateQueries(['posts'])
      }
    }
  )
  
  return /* ... */
}
```

---

## 📋 **FEATURE BREAKDOWN**

### **Phase 1: Core SDK (8 hours)**

**Runtime Package:**
1. ✅ Base HTTP client with fetch (2 hours)
   - Request/response interceptors
   - Error handling
   - Type-safe responses
   
2. ✅ Authentication system (1.5 hours)
   - Token provider
   - Auth interceptor
   - Refresh token support
   
3. ✅ Error handling (1 hour)
   - Typed error responses
   - Error transformation
   - Retry logic
   
4. ✅ BaseModelClient (2 hours)
   - Generic CRUD operations
   - Type-safe query building
   - Pagination support
   
5. ✅ Abort signals (30 min)
   - Request cancellation
   - Cleanup on unmount

**Generator:**
1. ✅ SDK generator (1 hour)
   - Per-model client generation
   - Domain method detection
   - Main SDK factory

**Total: 8 hours**

---

### **Phase 2: Advanced Features (6 hours)**

1. ✅ Query builder (2 hours)
   - Indexed filters
   - Type-safe where clauses
   - OrderBy helpers
   
2. ✅ Pagination (1.5 hours)
   - Cursor pagination
   - Infinite scroll helpers
   - Page-based helpers
   
3. ✅ React Query hooks (1.5 hours)
   - useQuery wrapper
   - useMutation wrapper
   - useInfiniteQuery for cursor pagination
   
4. ✅ Query invalidation (1 hour)
   - Auto-invalidate after mutations
   - Optimistic updates
   - Cache management

**Total: 6 hours**

---

### **Phase 3: Enterprise Features (6 hours)**

1. ✅ Capability guards (1.5 hours)
   - Permission checks
   - Scoped access
   - Role-based filtering
   
2. ✅ SSR support (1.5 hours)
   - Prefetching utilities
   - Server-side hydration
   - Next.js integration
   
3. ✅ Version checking (1 hour)
   - Manifest hash comparison
   - Auto-warn on version mismatch
   - Migration helpers
   
4. ✅ Advanced retry logic (1 hour)
   - Exponential backoff
   - Configurable strategies
   - Network error detection
   
5. ✅ Request deduplication (1 hour)
   - In-flight request tracking
   - Automatic deduplication

**Total: 6 hours**

---

## 🎯 **MINIMAL VIABLE SDK (MVP)**

### **Phase 1 Only: Core SDK (8 hours)**

**What You Get:**
- ✅ Type-safe client per model
- ✅ All CRUD operations
- ✅ Authentication support
- ✅ Error handling
- ✅ Abort signals
- ✅ Basic retries

**Example:**
```typescript
const api = createSDK({ baseUrl: 'http://localhost:3000', token: 'jwt' })

// Works:
await api.posts.list()
await api.posts.get(123)
await api.posts.create({ title, content, authorId })
await api.posts.update(123, { published: true })
await api.posts.delete(123)

// Domain methods:
await api.posts.findBySlug('hello-world')
await api.posts.publish(123)
```

**This alone is incredibly valuable!**

---

## 📊 **COMPARISON: CURRENT vs TARGET**

### **Current SDK Runtime (13 lines):**
```typescript
export const createClient = (cfg) => ({
  async request(path, init) {
    const res = await fetch(base + path, init)
    if (!res.ok) throw new Error(`[sdk] ${res.status}`)
    return res.json()
  }
})

// Usage (MANUAL, NO TYPES):
const client = createClient({ baseUrl: 'http://localhost:3000' })
const posts = await client.request('/api/posts')  // Type: any ❌
const post = await client.request('/api/posts/123')  // Type: any ❌
```

**Problems:**
- ❌ No types
- ❌ No model clients
- ❌ No query building
- ❌ No authentication
- ❌ No error handling
- ❌ No retries
- ❌ No pagination
- ❌ Manual path construction

---

### **Target SDK (1,200 runtime + ~100 generated per model):**
```typescript
import { createSDK } from '@gen/sdk'

const api = createSDK({
  baseUrl: 'http://localhost:3000',
  auth: { token: () => localStorage.getItem('jwt') }
})

// Type-safe, auto-completed:
const posts = await api.posts.list({
  skip: 0,
  take: 20,
  orderBy: '-createdAt',
  where: { published: true }
})  // Type: { data: PostReadDTO[]; meta: PaginationMeta } ✅

const post = await api.posts.get(123)  // Type: PostReadDTO | null ✅

const newPost = await api.posts.create({
  title: 'Hello',
  content: 'World',
  authorId: 1
})  // Type: PostReadDTO ✅

// Domain methods auto-generated:
const bySlug = await api.posts.findBySlug('hello')  // Type: PostReadDTO | null ✅
await api.posts.publish(123)  // Type: PostReadDTO ✅

// With abort signal:
const controller = new AbortController()
const posts = await api.posts.list({}, { signal: controller.signal })
controller.abort()  // Cancel request

// With React Query:
const { data, isLoading } = useQuery(
  ['posts', 'list'],
  () => api.posts.list()
)

const publish = useMutation((id: number) => api.posts.publish(id), {
  onSuccess: () => queryClient.invalidateQueries(['posts'])
})
```

**Benefits:**
- ✅ Full type safety
- ✅ Auto-completion
- ✅ Error handling
- ✅ Authentication
- ✅ Pagination
- ✅ Retries
- ✅ Cancellation
- ✅ Hooks integration

---

## 🏗️ **IMPLEMENTATION PLAN**

### **Part A: SDK Runtime (1,200 lines, 8 hours)**

#### **1. Base HTTP Client (`client/base-client.ts`)** - 2 hours
```typescript
export interface RequestConfig {
  signal?: AbortSignal
  retries?: number
  timeout?: number
  headers?: Record<string, string>
}

export interface APIResponse<T> {
  data: T
  status: number
  headers: Headers
}

export interface APIError {
  error: string
  message?: string
  details?: any[]
  status: number
}

export class BaseAPIClient {
  constructor(
    private config: {
      baseUrl: string
      timeout?: number
      retries?: number
      onRequest?: (config: RequestInit) => Promise<RequestInit>
      onResponse?: (response: Response) => Promise<Response>
      onError?: (error: APIError) => Promise<void>
    }
  ) {}
  
  async request<T>(
    path: string,
    init: RequestInit = {},
    config: RequestConfig = {}
  ): Promise<APIResponse<T>> {
    let attempt = 0
    const maxRetries = config.retries ?? this.config.retries ?? 3
    
    while (attempt < maxRetries) {
      try {
        // Apply request interceptor
        let finalInit = init
        if (this.config.onRequest) {
          finalInit = await this.config.onRequest(init)
        }
        
        // Add abort signal
        if (config.signal) {
          finalInit.signal = config.signal
        }
        
        // Add timeout
        const timeoutMs = config.timeout ?? this.config.timeout ?? 30000
        const timeoutSignal = AbortSignal.timeout(timeoutMs)
        finalInit.signal = finalInit.signal || timeoutSignal
        
        // Make request
        const res = await fetch(this.config.baseUrl + path, finalInit)
        
        // Apply response interceptor
        const finalRes = this.config.onResponse
          ? await this.config.onResponse(res)
          : res
        
        // Handle errors
        if (!finalRes.ok) {
          const errorData = await finalRes.json().catch(() => ({}))
          const apiError: APIError = {
            error: errorData.error || 'Request Failed',
            message: errorData.message,
            details: errorData.details,
            status: finalRes.status
          }
          
          if (this.config.onError) {
            await this.config.onError(apiError)
          }
          
          throw apiError
        }
        
        // Parse response
        const contentType = finalRes.headers.get('content-type') || ''
        const data = contentType.includes('application/json')
          ? await finalRes.json()
          : await finalRes.text()
        
        return {
          data,
          status: finalRes.status,
          headers: finalRes.headers
        }
      } catch (error) {
        attempt++
        
        // Don't retry on abort
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw error
        }
        
        // Don't retry client errors (4xx)
        if (error && typeof error === 'object' && 'status' in error) {
          const apiError = error as APIError
          if (apiError.status >= 400 && apiError.status < 500) {
            throw error
          }
        }
        
        // Retry server errors (5xx) and network errors
        if (attempt >= maxRetries) {
          throw error
        }
        
        // Exponential backoff
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 100))
      }
    }
    
    throw new Error('Max retries reached')
  }
  
  get<T>(path: string, config?: RequestConfig) {
    return this.request<T>(path, { method: 'GET' }, config)
  }
  
  post<T>(path: string, body?: any, config?: RequestConfig) {
    return this.request<T>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    }, config)
  }
  
  put<T>(path: string, body?: any, config?: RequestConfig) {
    return this.request<T>(path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    }, config)
  }
  
  patch<T>(path: string, body?: any, config?: RequestConfig) {
    return this.request<T>(path, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    }, config)
  }
  
  delete<T>(path: string, config?: RequestConfig) {
    return this.request<T>(path, { method: 'DELETE' }, config)
  }
}
```

---

#### **2. BaseModelClient (`models/base-model-client.ts`)** - 2 hours
```typescript
export interface ListResponse<T> {
  data: T[]
  meta: {
    total: number
    skip: number
    take: number
    hasMore: boolean
  }
}

export interface QueryOptions<QueryDTO> {
  query?: QueryDTO
  signal?: AbortSignal
}

export abstract class BaseModelClient<
  ReadDTO,
  CreateDTO,
  UpdateDTO,
  QueryDTO
> {
  constructor(
    protected client: BaseAPIClient,
    protected basePath: string
  ) {}
  
  /**
   * List records with pagination
   */
  async list(
    query?: QueryDTO,
    options?: QueryOptions<QueryDTO>
  ): Promise<ListResponse<ReadDTO>> {
    const params = query ? this.buildQueryString(query) : ''
    const response = await this.client.get<ListResponse<ReadDTO>>(
      `${this.basePath}${params}`,
      { signal: options?.signal }
    )
    return response.data
  }
  
  /**
   * Get single record by ID
   */
  async get(
    id: number | string,
    options?: { signal?: AbortSignal }
  ): Promise<ReadDTO | null> {
    try {
      const response = await this.client.get<ReadDTO>(
        `${this.basePath}/${id}`,
        { signal: options?.signal }
      )
      return response.data
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as APIError
        if (apiError.status === 404) return null
      }
      throw error
    }
  }
  
  /**
   * Create new record
   */
  async create(
    data: CreateDTO,
    options?: { signal?: AbortSignal }
  ): Promise<ReadDTO> {
    const response = await this.client.post<ReadDTO>(
      this.basePath,
      data,
      { signal: options?.signal }
    )
    return response.data
  }
  
  /**
   * Update record
   */
  async update(
    id: number | string,
    data: UpdateDTO,
    options?: { signal?: AbortSignal }
  ): Promise<ReadDTO | null> {
    try {
      const response = await this.client.put<ReadDTO>(
        `${this.basePath}/${id}`,
        data,
        { signal: options?.signal }
      )
      return response.data
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as APIError
        if (apiError.status === 404) return null
      }
      throw error
    }
  }
  
  /**
   * Delete record
   */
  async ['delete'](
    id: number | string,
    options?: { signal?: AbortSignal }
  ): Promise<boolean> {
    try {
      await this.client.delete(
        `${this.basePath}/${id}`,
        { signal: options?.signal }
      )
      return true
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as APIError
        if (apiError.status === 404) return false
      }
      throw error
    }
  }
  
  /**
   * Count records
   */
  async count(options?: { signal?: AbortSignal }): Promise<number> {
    const response = await this.client.get<{ total: number }>(
      `${this.basePath}/meta/count`,
      { signal: options?.signal }
    )
    return response.data.total
  }
  
  /**
   * Build query string from QueryDTO
   */
  protected buildQueryString(query: any): string {
    const params = new URLSearchParams()
    
    if (query.skip !== undefined) params.set('skip', query.skip.toString())
    if (query.take !== undefined) params.set('take', query.take.toString())
    if (query.orderBy) params.set('orderBy', query.orderBy)
    
    if (query.where) {
      for (const [field, filter] of Object.entries(query.where)) {
        if (typeof filter === 'object' && filter !== null) {
          for (const [op, value] of Object.entries(filter)) {
            if (value !== undefined) {
              params.set(`where[${field}][${op}]`, String(value))
            }
          }
        } else if (filter !== undefined) {
          params.set(`where[${field}]`, String(filter))
        }
      }
    }
    
    const qs = params.toString()
    return qs ? `?${qs}` : ''
  }
}
```

---

#### **3. Authentication Interceptor** - 1.5 hours
```typescript
export interface AuthConfig {
  token?: string | (() => string | Promise<string>)
  refreshToken?: string | (() => string | Promise<string>)
  onRefresh?: (newToken: string) => void | Promise<void>
  header?: string  // Default: 'Authorization'
  scheme?: string  // Default: 'Bearer'
}

export function createAuthInterceptor(authConfig: AuthConfig) {
  return async (init: RequestInit): Promise<RequestInit> => {
    let token: string | undefined
    
    if (typeof authConfig.token === 'function') {
      token = await authConfig.token()
    } else {
      token = authConfig.token
    }
    
    if (!token) return init
    
    const header = authConfig.header || 'Authorization'
    const scheme = authConfig.scheme || 'Bearer'
    
    return {
      ...init,
      headers: {
        ...init.headers,
        [header]: `${scheme} ${token}`
      }
    }
  }
}
```

---

### **Part B: SDK Generator (200-300 lines, 2 hours)**

**Location:** `packages/gen/src/generators/sdk-generator.ts`

```typescript
/**
 * Generate SDK client for a model
 */
export function generateModelSDK(
  model: ParsedModel,
  schema: ParsedSchema
): string {
  const analysis = analyzeModel(model, schema)
  const modelLower = model.name.toLowerCase()
  const idType = model.idField?.type === 'String' ? 'string' : 'number'
  
  const domainMethods = generateDomainMethods(model, analysis, idType)
  
  return `// @generated
import type {
  ${model.name}CreateDTO,
  ${model.name}UpdateDTO,
  ${model.name}ReadDTO,
  ${model.name}QueryDTO
} from '@gen/contracts/${modelLower}'
import { BaseModelClient } from '@ssot-codegen/sdk-runtime'
import type { BaseAPIClient } from '@ssot-codegen/sdk-runtime'

/**
 * ${model.name} SDK Client
 * Type-safe client for ${model.name} operations
 */
export class ${model.name}Client extends BaseModelClient<
  ${model.name}ReadDTO,
  ${model.name}CreateDTO,
  ${model.name}UpdateDTO,
  ${model.name}QueryDTO
> {
  constructor(client: BaseAPIClient) {
    super(client, '/api/${modelLower}s')
  }
${domainMethods}
}
`
}

/**
 * Generate main SDK factory
 */
export function generateMainSDK(models: ParsedModel[]): string {
  const imports = models.map(m => 
    `import { ${m.name}Client } from './models/${m.name.toLowerCase()}.client.js'`
  ).join('\n')
  
  const properties = models.map(m => {
    const lower = m.name.toLowerCase()
    return `    ${lower}: new ${m.name}Client(client)`
  }).join(',\n')
  
  return `// @generated
import { BaseAPIClient, createAuthInterceptor } from '@ssot-codegen/sdk-runtime'
${imports}

export interface SDKConfig {
  baseUrl: string
  auth?: {
    token?: string | (() => string | Promise<string>)
    refreshToken?: string | (() => string | Promise<string>)
    onRefresh?: (newToken: string) => void | Promise<void>
  }
  timeout?: number
  retries?: number
}

/**
 * Create type-safe SDK client
 */
export function createSDK(config: SDKConfig) {
  // Create base client
  const client = new BaseAPIClient({
    baseUrl: config.baseUrl,
    timeout: config.timeout,
    retries: config.retries,
    onRequest: config.auth
      ? createAuthInterceptor(config.auth)
      : undefined
  })
  
  // Return model clients
  return {
${properties}
  }
}

// Export types for convenience
export type SDK = ReturnType<typeof createSDK>
`
}
```

---

## 📊 **DELIVERABLES**

### **SDK Runtime Package** (`packages/sdk-runtime/`)
```
src/
├── client/
│   ├── base-client.ts           (250 lines) - HTTP client, retries, abort
│   ├── auth-interceptor.ts      (80 lines)  - Auth middleware
│   ├── error-handler.ts         (50 lines)  - Error transformation
│   └── index.ts
├── models/
│   ├── base-model-client.ts     (200 lines) - Generic CRUD client
│   ├── query-builder.ts         (150 lines) - Type-safe queries
│   ├── pagination-helpers.ts    (100 lines) - Cursor, page helpers
│   └── index.ts
├── hooks/                        (Phase 2)
│   ├── use-query.ts             (120 lines) - React Query wrapper
│   ├── use-mutation.ts          (100 lines) - Mutations + invalidation
│   ├── use-infinite.ts          (80 lines)  - Infinite scroll
│   └── index.ts
├── types/
│   ├── api-response.ts          (40 lines)  - Response types
│   ├── api-error.ts             (30 lines)  - Error types
│   ├── pagination.ts            (40 lines)  - Pagination types
│   └── index.ts
└── index.ts                     (20 lines)  - Main export

TOTAL: ~1,240 lines (Phase 1), +300 lines (Phase 2)
```

---

### **Generated SDK** (`gen/sdk/`)
```
sdk/
├── index.ts                     (50 lines)  - Main SDK factory
├── client.ts                    (30 lines)  - Configured client
├── models/
│   ├── post.client.ts           (100 lines) - Post SDK
│   ├── user.client.ts           (80 lines)  - User SDK
│   ├── comment.client.ts        (90 lines)  - Comment SDK
│   └── index.ts
├── types/
│   ├── api-types.ts             (40 lines)  - Type re-exports
│   └── index.ts
└── version.ts                   (15 lines)  - Version checking

Per Model: ~80-150 lines
Total (7 models): ~650 lines
```

---

## 🎯 **RECOMMENDED APPROACH**

### **Option A: MVP (8 hours) - Recommended** ⭐
- Implement Phase 1 only
- Core SDK with CRUD operations
- Authentication support
- Type-safe throughout
- Abort signals + retries
- **Result:** 85% of value, 40% of effort

### **Option B: Full Implementation (20 hours)**
- All 3 phases
- React Query hooks
- SSR support
- Capability guards
- **Result:** 100% of value, 100% of effort

### **Option C: Incremental (2 hours chunks)**
- Implement one feature at a time
- Test between iterations
- Adjust based on feedback

---

## 📋 **IMMEDIATE NEXT STEPS**

### **If Approved to Proceed:**

1. **Fix TypeScript issue** (delete method) - 5 min
2. **Implement SDK Runtime Phase 1** - 8 hours
   - Base HTTP client
   - BaseModelClient
   - Auth interceptor
   - Error handling
   
3. **Implement SDK Generator** - 2 hours
   - Model client generator
   - Main SDK factory
   - Domain method detection
   
4. **Test with Blog Example** - 1 hour
   - Generate SDK
   - Create test frontend
   - Verify types and functionality

**Total: ~11 hours to production-ready type-safe SDK**

---

## 💡 **KEY DESIGN DECISIONS**

### **1. Tree-Shakable:**
```typescript
// Import only what you need:
import { createSDK } from '@gen/sdk'  // Gets tree-shaken

// Or direct import:
import { PostClient } from '@gen/sdk/models/post.client'
```

### **2. DTO Parity:**
```typescript
// Generated SDK uses exact same types as backend:
import type { PostCreateDTO } from '@gen/contracts/post'

// SDK enforces same shape:
await api.posts.create({
  title: 'Hello',
  content: 'World',
  authorId: 1
})  // Type-checked against PostCreateDTO
```

### **3. OpenAPI-Driven:**
```typescript
// SDK generation uses OpenAPI spec to know:
// - Which endpoints exist
// - Request/response types
// - HTTP methods
// - Path parameters
```

### **4. Manifest Hash Versioning:**
```typescript
// gen/sdk/version.ts
export const SCHEMA_HASH = 'abc123...'

// SDK checks on initialization:
const api = createSDK({ baseUrl: '...' })
// Warns if backend schema hash != SDK schema hash
```

---

## 🎉 **VALUE PROPOSITION**

### **Before SDK (Manual Fetch):**
```typescript
// MANUAL, ERROR-PRONE:
const res = await fetch('http://localhost:3000/api/posts?skip=0&take=20&orderBy=-createdAt&where[published]=true')
const data = await res.json()  // Type: any ❌
// No types, no validation, no error handling, no retries, manual URL construction
```

### **After SDK (Generated):**
```typescript
// TYPE-SAFE, AUTOMATIC:
const { data } = await api.posts.list({
  skip: 0,
  take: 20,
  orderBy: '-createdAt',
  where: { published: true }
})  // Type: PostReadDTO[] ✅
// Full types, validation, error handling, retries, auto URL construction
```

**Code Reduction:** ~10 lines → 1 line (90% reduction!)  
**Type Safety:** any → PostReadDTO[] (100% improvement!)  
**Maintenance:** Manual → Zero (automated regeneration!)

---

## 🚀 **BOTTOM LINE**

### **Current State:**
- ❌ No SDK generator exists (only 13-line stub)
- ❌ 0% of requirements implemented
- ❌ Frontend developers must manually write fetch calls

### **After Implementation:**
- ✅ Full type-safe SDK
- ✅ Zero manual client code
- ✅ Perfect backend/frontend alignment
- ✅ Professional-grade DX
- ✅ 90% less frontend boilerplate

### **Effort:**
- MVP (Phase 1): 8 hours runtime + 2 hours generator = **10 hours**
- Full (All phases): 20 hours runtime + 2 hours generator = **22 hours**

### **Recommendation:**
**Implement MVP (Phase 1) first** - 10 hours for 85% of value!

---

## ❓ **QUESTIONS FOR USER**

1. **Scope:** MVP only (10 hours) or Full implementation (22 hours)?
2. **HTTP Client:** Fetch only, or support Axios too?
3. **React Hooks:** Include in MVP or defer to Phase 2?
4. **Priority:** After fixing TypeScript issue, or later?

---

**Ready to build the SDK generator when you are!** 🚀


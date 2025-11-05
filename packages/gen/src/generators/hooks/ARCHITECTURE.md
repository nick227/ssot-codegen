# Framework-Agnostic Hooks Architecture

## 🎯 Core Principle: Separation of Concerns

```
┌─────────────────────────────────────────┐
│   Framework Layer (React/Vue/Angular)   │
│   - State management                    │
│   - Lifecycle hooks                     │
│   - Framework-specific patterns         │
└──────────────┬──────────────────────────┘
               │ Implements interface
               ▼
┌─────────────────────────────────────────┐
│   Core Abstraction (Framework Agnostic) │
│   - Data fetching logic                 │
│   - Query definitions                   │
│   - Mutation definitions                │
│   - Cache keys                          │
└──────────────┬──────────────────────────┘
               │ Uses
               ▼
┌─────────────────────────────────────────┐
│   SDK Client (Already Built!)           │
│   - api.post.list()                     │
│   - api.post.get()                      │
│   - api.post.create()                   │
└─────────────────────────────────────────┘
```

---

## 🎨 The Key Insight

### **What's the Same Across Frameworks?**
1. ✅ API calls (`api.post.get(123)`)
2. ✅ Query logic (filter, paginate, etc.)
3. ✅ Cache keys (`['post', 123]`)
4. ✅ Data transformations

### **What's Different Per Framework?**
1. ❌ State management (useState vs ref vs signal)
2. ❌ Lifecycle (useEffect vs onMounted vs ngOnInit)
3. ❌ Reactivity (React vs Vue vs Angular)
4. ❌ Naming (useX vs useX vs inject)

---

## 🏗️ Architecture Layers

### Layer 1: Core Queries (Framework Agnostic)

```typescript
// gen/sdk/core/queries/post-queries.ts

/**
 * Post query definitions (pure data)
 * No framework-specific code!
 */
export const postQueries = {
  /**
   * Get single post
   */
  get: (id: number) => ({
    queryKey: ['post', id] as const,
    queryFn: () => api.post.get(id)
  }),
  
  /**
   * List posts
   */
  list: (query?: PostQuery) => ({
    queryKey: ['posts', query] as const,
    queryFn: () => api.post.list(query)
  }),
  
  /**
   * Find post by slug
   */
  bySlug: (slug: string) => ({
    queryKey: ['post', 'slug', slug] as const,
    queryFn: () => api.post.helpers.findBySlug(slug)
  }),
  
  /**
   * Infinite posts
   */
  infinite: (query?: Omit<PostQuery, 'skip'>) => ({
    queryKey: ['posts', 'infinite', query] as const,
    queryFn: (page: number) => api.post.list({
      ...query,
      skip: page * (query?.take || 20),
      take: query?.take || 20
    }),
    getNextPage: (lastPage: ListResponse<Post>, allPages: any[]) =>
      lastPage.meta.hasMore ? allPages.length : undefined
  })
}

export const postMutations = {
  /**
   * Create post
   */
  create: () => ({
    mutationKey: ['post', 'create'] as const,
    mutationFn: (data: PostCreate) => api.post.create(data)
  }),
  
  /**
   * Update post
   */
  update: () => ({
    mutationKey: ['post', 'update'] as const,
    mutationFn: ({ id, data }: { id: number; data: PostUpdate }) => 
      api.post.update(id, data)
  }),
  
  /**
   * Delete post
   */
  delete: () => ({
    mutationKey: ['post', 'delete'] as const,
    mutationFn: (id: number) => api.post.delete(id)
  }),
  
  /**
   * Publish post
   */
  publish: () => ({
    mutationKey: ['post', 'publish'] as const,
    mutationFn: (id: number) => api.post.helpers.publish(id)
  })
}
```

**This is PURE JavaScript - no framework!**

---

### Layer 2: Framework Adapters (Implement Interface)

#### **React Adapter (React Query)**

```typescript
// gen/sdk/react/use-post.ts
import { useQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query'
import { postQueries, postMutations } from '../core/queries/post-queries'

/**
 * React implementation using React Query
 */
export function usePost(id: number, options?: UseQueryOptions) {
  return useQuery({
    ...postQueries.get(id),
    ...options
  })
}

export function usePosts(query?: PostQuery, options?: UseQueryOptions) {
  return useQuery({
    ...postQueries.list(query),
    ...options
  })
}

export function useCreatePost(callbacks?: UseMutationOptions) {
  return useMutation({
    ...postMutations.create(),
    ...callbacks
  })
}
```

---

#### **Vue Adapter (VueQuery or Custom)**

```typescript
// gen/sdk/vue/use-post.ts
import { useQuery, useMutation } from '@tanstack/vue-query'
import { postQueries, postMutations } from '../core/queries/post-queries'

/**
 * Vue implementation using VueQuery
 */
export function usePost(id: Ref<number> | number, options?: UseQueryOptions) {
  return useQuery({
    ...postQueries.get(unref(id)),
    ...options
  })
}

export function usePosts(query?: PostQuery, options?: UseQueryOptions) {
  return useQuery({
    ...postQueries.list(query),
    ...options
  })
}

export function useCreatePost(callbacks?: UseMutationOptions) {
  return useMutation({
    ...postMutations.create(),
    ...callbacks
  })
}
```

---

#### **Vanilla Adapter (Custom)**

```typescript
// gen/sdk/vanilla/post-store.ts
import { postQueries, postMutations } from '../core/queries/post-queries'

/**
 * Vanilla JavaScript implementation (no framework)
 */
export class PostStore {
  private cache = new Map()
  private listeners = new Set<Function>()
  
  /**
   * Get post (with caching)
   */
  async getPost(id: number): Promise<Post | null> {
    const cacheKey = JSON.stringify(postQueries.get(id).queryKey)
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }
    
    const query = postQueries.get(id)
    const result = await query.queryFn()
    
    this.cache.set(cacheKey, result)
    this.notify()
    
    return result
  }
  
  /**
   * List posts
   */
  async listPosts(query?: PostQuery): Promise<ListResponse<Post>> {
    const q = postQueries.list(query)
    return q.queryFn()
  }
  
  /**
   * Create post
   */
  async createPost(data: PostCreate): Promise<Post> {
    const mutation = postMutations.create()
    const result = await mutation.mutationFn(data)
    this.invalidate('posts')
    return result
  }
  
  /**
   * Subscribe to changes
   */
  subscribe(listener: Function) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  
  private notify() {
    this.listeners.forEach(fn => fn())
  }
  
  private invalidate(key: string) {
    // Clear cache entries matching key
    for (const [k] of this.cache) {
      if (k.includes(key)) {
        this.cache.delete(k)
      }
    }
    this.notify()
  }
}

// Usage (vanilla JS)
const postStore = new PostStore()

const posts = await postStore.listPosts({ take: 20 })
console.log(posts.data)

postStore.subscribe(() => {
  console.log('Data changed!')
})
```

---

#### **Zustand Adapter**

```typescript
// gen/sdk/zustand/use-post-store.ts
import { create } from 'zustand'
import { postQueries, postMutations } from '../core/queries/post-queries'

/**
 * Zustand store for posts
 */
export const usePostStore = create<PostStore>((set, get) => ({
  posts: [],
  loading: false,
  error: null,
  
  /**
   * Fetch posts
   */
  fetchPosts: async (query?: PostQuery) => {
    set({ loading: true, error: null })
    try {
      const result = await postQueries.list(query).queryFn()
      set({ posts: result.data, loading: false })
    } catch (error) {
      set({ error: error as Error, loading: false })
    }
  },
  
  /**
   * Create post
   */
  createPost: async (data: PostCreate) => {
    const mutation = postMutations.create()
    const result = await mutation.mutationFn(data)
    set({ posts: [...get().posts, result] })
    return result
  },
  
  /**
   * Update post
   */
  updatePost: async (id: number, data: PostUpdate) => {
    const mutation = postMutations.update()
    const result = await mutation.mutationFn({ id, data })
    set({ 
      posts: get().posts.map(p => p.id === id ? result! : p) 
    })
    return result
  }
}))

// Usage
function PostList() {
  const { posts, loading, fetchPosts } = usePostStore()
  
  useEffect(() => {
    fetchPosts({ take: 20 })
  }, [])
  
  return posts.map(p => <PostCard post={p} />)
}
```

---

#### **Angular Adapter**

```typescript
// gen/sdk/angular/post.service.ts
import { Injectable } from '@angular/core'
import { BehaviorSubject, Observable } from 'rxjs'
import { postQueries, postMutations } from '../core/queries/post-queries'

@Injectable({ providedIn: 'root' })
export class PostService {
  private postsSubject = new BehaviorSubject<Post[]>([])
  private loadingSubject = new BehaviorSubject<boolean>(false)
  
  posts$ = this.postsSubject.asObservable()
  loading$ = this.loadingSubject.asObservable()
  
  /**
   * Get post by ID
   */
  async getPost(id: number): Promise<Post | null> {
    const query = postQueries.get(id)
    return query.queryFn()
  }
  
  /**
   * List posts
   */
  async listPosts(query?: PostQuery): Promise<void> {
    this.loadingSubject.next(true)
    try {
      const result = await postQueries.list(query).queryFn()
      this.postsSubject.next(result.data)
    } finally {
      this.loadingSubject.next(false)
    }
  }
  
  /**
   * Create post
   */
  async createPost(data: PostCreate): Promise<Post> {
    const mutation = postMutations.create()
    const result = await mutation.mutationFn(data)
    this.postsSubject.next([...this.postsSubject.value, result])
    return result
  }
}

// Usage (Angular component)
export class PostListComponent {
  posts$ = this.postService.posts$
  loading$ = this.postService.loading$
  
  constructor(private postService: PostService) {
    this.postService.listPosts({ take: 20 })
  }
}
```

---

## 📦 File Structure

```
gen/sdk/
├── core/                          ← Framework agnostic
│   ├── queries/
│   │   ├── post-queries.ts       ← Query definitions (pure)
│   │   ├── comment-queries.ts
│   │   └── author-queries.ts
│   └── types.ts                   ← Shared types
│
├── react/                         ← React adapter (React Query)
│   ├── index.ts
│   ├── provider.tsx
│   └── models/
│       ├── use-post.ts
│       ├── use-comment.ts
│       └── use-author.ts
│
├── vue/                           ← Vue adapter (VueQuery)
│   ├── index.ts
│   └── composables/
│       ├── use-post.ts
│       └── use-comment.ts
│
├── angular/                       ← Angular adapter (Services)
│   ├── index.ts
│   └── services/
│       ├── post.service.ts
│       └── comment.service.ts
│
├── zustand/                       ← Zustand adapter (Stores)
│   ├── index.ts
│   └── stores/
│       ├── use-post-store.ts
│       └── use-comment-store.ts
│
└── vanilla/                       ← Vanilla JS (Simple stores)
    ├── index.ts
    └── stores/
        ├── post-store.ts
        └── comment-store.ts
```

---

## 🎯 Layer 1: Core Queries (Generated Once)

**This is framework-agnostic!**

```typescript
// gen/sdk/core/queries/post-queries.ts

import type { Post, PostCreate, PostUpdate, PostQuery, ListResponse } from '../../types'
import { api } from '../../index'

/**
 * Post query definitions
 * Framework-agnostic - just defines WHAT to fetch
 */
export const postQueries = {
  all: {
    /**
     * Get single post by ID
     */
    get: (id: number) => ({
      queryKey: ['post', id] as const,
      queryFn: async (): Promise<Post | null> => api.post.get(id)
    }),
    
    /**
     * List posts
     */
    list: (query?: PostQuery) => ({
      queryKey: ['posts', query] as const,
      queryFn: async (): Promise<ListResponse<Post>> => api.post.list(query)
    }),
    
    /**
     * Find by any field
     */
    findOne: (where: Partial<Post>) => ({
      queryKey: ['post', 'query', where] as const,
      queryFn: async (): Promise<Post | null> => api.post.findOne(where)
    }),
    
    /**
     * Count posts
     */
    count: (query?: Pick<PostQuery, 'where'>) => ({
      queryKey: ['posts', 'count', query] as const,
      queryFn: async (): Promise<number> => api.post.count(query)
    })
  },
  
  helpers: {
    /**
     * Get by slug
     */
    bySlug: (slug: string) => ({
      queryKey: ['post', 'slug', slug] as const,
      queryFn: async (): Promise<Post | null> => api.post.helpers.findBySlug(slug)
    }),
    
    /**
     * List published
     */
    published: (query?: Omit<PostQuery, 'where'>) => ({
      queryKey: ['posts', 'published', query] as const,
      queryFn: async (): Promise<ListResponse<Post>> => 
        api.post.helpers.listPublished(query)
    })
  }
}

/**
 * Post mutation definitions
 */
export const postMutations = {
  /**
   * Create post
   */
  create: () => ({
    mutationKey: ['post', 'create'] as const,
    mutationFn: async (data: PostCreate): Promise<Post> => api.post.create(data)
  }),
  
  /**
   * Update post
   */
  update: () => ({
    mutationKey: ['post', 'update'] as const,
    mutationFn: async ({ id, data }: { id: number; data: PostUpdate }): Promise<Post | null> => 
      api.post.update(id, data)
  }),
  
  /**
   * Delete post
   */
  delete: () => ({
    mutationKey: ['post', 'delete'] as const,
    mutationFn: async (id: number): Promise<boolean> => api.post.delete(id)
  }),
  
  /**
   * Publish post
   */
  publish: () => ({
    mutationKey: ['post', 'publish'] as const,
    mutationFn: async (id: number): Promise<Post | null> => 
      api.post.helpers.publish(id)
  })
}

/**
 * Infinite query definition
 */
export const postInfinite = {
  list: (query?: Omit<PostQuery, 'skip'>) => {
    const pageSize = query?.take || 20
    
    return {
      queryKey: ['posts', 'infinite', query] as const,
      queryFn: async ({ pageParam = 0 }: { pageParam?: number }) => {
        return api.post.list({
          ...query,
          skip: pageParam * pageSize,
          take: pageSize
        })
      },
      getNextPageParam: (lastPage: ListResponse<Post>, allPages: any[]) =>
        lastPage.meta.hasMore ? allPages.length : undefined,
      initialPageParam: 0
    }
  }
}
```

---

## 🎯 Layer 2: React Adapter (POC)

```typescript
// gen/sdk/react/models/use-post.ts
import { useQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query'
import type { UseQueryOptions, UseMutationOptions, UseInfiniteQueryOptions } from '@tanstack/react-query'
import { postQueries, postMutations, postInfinite } from '../../core/queries/post-queries'

/**
 * Get single post
 */
export function usePost(
  id: number,
  options?: UseQueryOptions<Post | null, Error>
) {
  return useQuery({
    ...postQueries.all.get(id),
    ...options
  })
}

/**
 * List posts
 */
export function usePosts(
  query?: PostQuery,
  options?: UseQueryOptions<ListResponse<Post>, Error>
) {
  return useQuery({
    ...postQueries.all.list(query),
    ...options
  })
}

/**
 * Create post
 */
export function useCreatePost(
  options?: UseMutationOptions<Post, Error, PostCreate>
) {
  return useMutation({
    ...postMutations.create(),
    ...options
  })
}

/**
 * Infinite posts
 */
export function useInfinitePosts(
  query?: Omit<PostQuery, 'skip'>,
  options?: UseInfiniteQueryOptions<ListResponse<Post>, Error>
) {
  return useInfiniteQuery({
    ...postInfinite.list(query),
    ...options
  })
}

/**
 * Get by slug (helper)
 */
export function usePostBySlug(
  slug: string,
  options?: UseQueryOptions<Post | null, Error>
) {
  return useQuery({
    ...postQueries.helpers.bySlug(slug),
    ...options
  })
}
```

---

## 🎯 Layer 3: Other Adapters (Future)

### Vue Adapter
```typescript
// gen/sdk/vue/composables/use-post.ts
import { useQuery } from '@tanstack/vue-query'
import { postQueries } from '../../core/queries/post-queries'

export function usePost(id: Ref<number> | number) {
  return useQuery({
    ...postQueries.all.get(unref(id))
  })
}
```

### Zustand Adapter
```typescript
// gen/sdk/zustand/stores/post-store.ts
import { create } from 'zustand'
import { postQueries, postMutations } from '../../core/queries/post-queries'

export const usePostStore = create((set) => ({
  posts: [],
  loading: false,
  
  fetch: async (query?: PostQuery) => {
    set({ loading: true })
    const result = await postQueries.all.list(query).queryFn()
    set({ posts: result.data, loading: false })
  }
}))
```

### Vanilla Adapter
```typescript
// gen/sdk/vanilla/stores/post-store.ts
import { postQueries } from '../../core/queries/post-queries'

export async function getPosts(query?: PostQuery) {
  return postQueries.all.list(query).queryFn()
}

export async function createPost(data: PostCreate) {
  return postMutations.create().mutationFn(data)
}
```

---

## 🎁 Benefits of This Architecture

### 1. **Single Source of Truth**
```
Core queries defined ONCE
↓
Used by ALL frameworks
↓
Change once, updates everywhere
```

### 2. **Framework-Specific Optimization**
```typescript
// React uses React Query's caching
// Vue uses VueQuery's reactive refs
// Zustand uses its own store
// Each framework uses its strengths!
```

### 3. **Easy to Add Frameworks**
```
Want Svelte support?
↓
1. Create gen/sdk/svelte/
2. Import core queries
3. Wrap with Svelte stores
↓
Done! ~1 hour of work
```

### 4. **Consistency Across Frameworks**
```typescript
// React
const { data } = usePost(123)

// Vue  
const { data } = usePost(ref(123))

// Zustand
const { fetch } = usePostStore()
await fetch()

// All use same core queries!
```

---

## 🚀 Implementation Strategy

### Phase 1: Core (Framework Agnostic)
```
✅ Generate query definitions per model
✅ Generate mutation definitions per model
✅ Generate infinite query definitions
✅ Pure TypeScript, no framework code
```

### Phase 2: React Adapter (POC)
```
✅ Generate React hooks using React Query
✅ Import core queries
✅ Thin wrappers only
✅ Test with blog-example
```

### Phase 3: Documentation
```
✅ Generate README per framework
✅ Show how to extend
✅ Include examples
```

### Phase 4: Other Frameworks (Later)
```
⏳ Vue adapter (VueQuery)
⏳ Zustand adapter (stores)
⏳ Vanilla adapter (simple)
⏳ Angular adapter (services)
```

---

## 📝 Generator Pseudocode

```typescript
// packages/gen/src/generators/hooks-generator.ts

export function generateHooks(schema: ParsedSchema) {
  const files = new Map()
  
  for (const model of schema.models) {
    // 1. Generate core queries (framework-agnostic)
    const coreQueries = generateCoreQueries(model, schema)
    files.set(`core/queries/${model.name.toLowerCase()}-queries.ts`, coreQueries)
    
    // 2. Generate React adapter (if enabled)
    if (config.frameworks.includes('react')) {
      const reactHooks = generateReactHooks(model, schema)
      files.set(`react/models/use-${model.name.toLowerCase()}.ts`, reactHooks)
    }
    
    // 3. Generate Vue adapter (if enabled)
    if (config.frameworks.includes('vue')) {
      const vueComposables = generateVueComposables(model, schema)
      files.set(`vue/composables/use-${model.name.toLowerCase()}.ts`, vueComposables)
    }
    
    // 4. Generate Zustand adapter (if enabled)
    if (config.frameworks.includes('zustand')) {
      const zustandStore = generateZustandStore(model, schema)
      files.set(`zustand/stores/${model.name.toLowerCase()}-store.ts`, zustandStore)
    }
  }
  
  return files
}
```

---

## ✅ Validation: Does This Meet Requirements?

### ✓ **Framework Agnostic?**
YES - Core queries are pure TypeScript

### ✓ **Idiomatic per Framework?**
YES - Each adapter uses framework's patterns

### ✓ **Low Cognitive Load?**
YES - Same query definitions, different wrappers

### ✓ **Trivial to Extend?**
YES - Developers compose queries (standard patterns)

### ✓ **Convenient?**
YES - Each framework gets optimized implementation

---

## 🎯 POC: Start with React Query

### What to Build First:
1. ✅ Core query generator (framework-agnostic)
2. ✅ React adapter generator (uses core)
3. ✅ Test with blog-example
4. ✅ Document extension patterns

### Then Expand:
5. ⏳ Add Vue adapter (same core, different wrapper)
6. ⏳ Add Zustand adapter (same core, different wrapper)
7. ⏳ Add vanilla adapter (same core, no wrapper)

---

## 💎 The Magic

### **Write Core Queries Once:**
```typescript
export const postQueries = {
  get: (id) => ({
    queryKey: ['post', id],
    queryFn: () => api.post.get(id)
  })
}
```

### **Use in ANY Framework:**

**React:**
```typescript
const { data } = useQuery(postQueries.get(123))
```

**Vue:**
```typescript
const { data } = useQuery(postQueries.get(123))
```

**Vanilla:**
```typescript
const post = await postQueries.get(123).queryFn()
```

**Same definition, different usage!** ✨

---

## 🚀 Ready to Start?

**I'll implement:**
1. Core queries generator (framework-agnostic)
2. React adapter generator (POC)
3. Documentation
4. Test with blog-example

**Then we can add Vue, Zustand, etc. easily!**

**Shall I proceed?** 🎯


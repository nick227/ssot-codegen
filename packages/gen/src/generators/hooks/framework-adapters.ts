/**
 * Framework Adapter Templates
 * 
 * Shows how to implement adapters for different frameworks
 * All use the same core queries!
 */

import type { ParsedModel, ParsedSchema } from '../../dmmf-parser.js'
import { analyzeModel } from '../../utils/relationship-analyzer.js'

/**
 * Generate Vue composables (VueQuery)
 */
export function generateVueComposables(
  model: ParsedModel,
  schema: ParsedSchema
): string {
  const modelName = model.name
  const modelLower = model.name.toLowerCase()
  const idType = model.idField?.type === 'String' ? 'string' : 'number'
  
  return `// @generated
// Vue composables using VueQuery

import { useQuery, useMutation, useInfiniteQuery } from '@tanstack/vue-query'
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/vue-query'
import { ${modelLower}Queries, ${modelLower}Mutations, ${modelLower}Infinite } from '../../core/queries/${modelLower}-queries'
import type { ${modelName}, ${modelName}Create, ${modelName}Update, ${modelName}Query, ListResponse } from '../../types'
import type { Ref } from 'vue'
import { unref } from 'vue'

/**
 * Get single ${modelName}
 */
export function use${modelName}(
  id: Ref<${idType}> | ${idType},
  options?: UseQueryOptions<${modelName} | null, Error>
) {
  return useQuery({
    queryKey: () => ${modelLower}Queries.all.get(unref(id)).queryKey,
    queryFn: () => ${modelLower}Queries.all.get(unref(id)).queryFn(),
    ...options
  })
}

/**
 * List ${modelName}s
 */
export function use${modelName}s(
  query?: Ref<${modelName}Query> | ${modelName}Query,
  options?: UseQueryOptions<ListResponse<${modelName}>, Error>
) {
  return useQuery({
    queryKey: () => ${modelLower}Queries.all.list(unref(query)).queryKey,
    queryFn: () => ${modelLower}Queries.all.list(unref(query)).queryFn(),
    ...options
  })
}

/**
 * Create ${modelName}
 */
export function useCreate${modelName}(
  options?: UseMutationOptions<${modelName}, Error, ${modelName}Create>
) {
  return useMutation({
    ...${modelLower}Mutations.create(),
    ...options
  })
}

// Usage example:
// const { data: post } = usePost(ref(123))
// const { data: posts } = usePosts(ref({ take: 20 }))
`
}

/**
 * Generate Zustand store
 */
export function generateZustandStore(
  model: ParsedModel,
  schema: ParsedSchema
): string {
  const modelName = model.name
  const modelLower = model.name.toLowerCase()
  const modelPlural = modelLower + 's'
  const idType = model.idField?.type === 'String' ? 'string' : 'number'
  
  return `// @generated
// Zustand store for ${modelName}

import { create } from 'zustand'
import { ${modelLower}Queries, ${modelLower}Mutations } from '../../core/queries/${modelLower}-queries'
import type { ${modelName}, ${modelName}Create, ${modelName}Update, ${modelName}Query, ListResponse } from '../../types'

interface ${modelName}Store {
  // State
  ${modelPlural}: ${modelName}[]
  current: ${modelName} | null
  loading: boolean
  error: Error | null
  
  // Query actions
  fetchOne: (id: ${idType}) => Promise<void>
  fetchMany: (query?: ${modelName}Query) => Promise<void>
  
  // Mutation actions
  create: (data: ${modelName}Create) => Promise<${modelName}>
  update: (id: ${idType}, data: ${modelName}Update) => Promise<${modelName} | null>
  delete: (id: ${idType}) => Promise<void>
  
  // Helpers
  reset: () => void
}

/**
 * ${modelName} Zustand Store
 * 
 * @example
 * const { ${modelPlural}, loading, fetchMany } = use${modelName}Store()
 * 
 * useEffect(() => {
 *   fetchMany({ take: 20 })
 * }, [])
 */
export const use${modelName}Store = create<${modelName}Store>((set, get) => ({
  ${modelPlural}: [],
  current: null,
  loading: false,
  error: null,
  
  fetchOne: async (id) => {
    set({ loading: true, error: null })
    try {
      const result = await ${modelLower}Queries.all.get(id).queryFn()
      set({ current: result, loading: false })
    } catch (error) {
      set({ error: error as Error, loading: false })
    }
  },
  
  fetchMany: async (query?) => {
    set({ loading: true, error: null })
    try {
      const result = await ${modelLower}Queries.all.list(query).queryFn()
      set({ ${modelPlural}: result.data, loading: false })
    } catch (error) {
      set({ error: error as Error, loading: false })
    }
  },
  
  create: async (data) => {
    const mutation = ${modelLower}Mutations.create()
    const result = await mutation.mutationFn(data)
    set({ ${modelPlural}: [...get().${modelPlural}, result] })
    return result
  },
  
  update: async (id, data) => {
    const mutation = ${modelLower}Mutations.update()
    const result = await mutation.mutationFn({ id, data })
    if (result) {
      set({ 
        ${modelPlural}: get().${modelPlural}.map(item => item.id === id ? result : item) 
      })
    }
    return result
  },
  
  delete: async (id) => {
    const mutation = ${modelLower}Mutations.delete()
    await mutation.mutationFn(id)
    set({ 
      ${modelPlural}: get().${modelPlural}.filter(item => item.id !== id) 
    })
  },
  
  reset: () => {
    set({ ${modelPlural}: [], current: null, loading: false, error: null })
  }
}))
`
}

/**
 * Generate vanilla JavaScript store
 */
export function generateVanillaStore(
  model: ParsedModel,
  schema: ParsedSchema
): string {
  const modelName = model.name
  const modelLower = model.name.toLowerCase()
  const modelPlural = modelLower + 's'
  const idType = model.idField?.type === 'String' ? 'string' : 'number'
  
  return `// @generated
// Vanilla JavaScript store for ${modelName}

import { ${modelLower}Queries, ${modelLower}Mutations } from '../../core/queries/${modelLower}-queries'
import type { ${modelName}, ${modelName}Create, ${modelName}Update, ${modelName}Query, ListResponse } from '../../types'

/**
 * ${modelName} Store (Vanilla JS)
 * Simple event-based store with caching
 */
export class ${modelName}Store {
  private cache = new Map<string, any>()
  private listeners = new Set<(event: StoreEvent) => void>()
  
  /**
   * Get ${modelName} by ID (with caching)
   */
  async get(id: ${idType}): Promise<${modelName} | null> {
    const query = ${modelLower}Queries.all.get(id)
    const cacheKey = JSON.stringify(query.queryKey)
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }
    
    const result = await query.queryFn()
    this.cache.set(cacheKey, result)
    this.notify({ type: 'query', key: query.queryKey })
    
    return result
  }
  
  /**
   * List ${modelName}s
   */
  async list(query?: ${modelName}Query): Promise<ListResponse<${modelName}>> {
    const q = ${modelLower}Queries.all.list(query)
    const result = await q.queryFn()
    this.notify({ type: 'query', key: q.queryKey })
    return result
  }
  
  /**
   * Create ${modelName}
   */
  async create(data: ${modelName}Create): Promise<${modelName}> {
    const mutation = ${modelLower}Mutations.create()
    const result = await mutation.mutationFn(data)
    this.invalidate('${modelPlural}')
    this.notify({ type: 'mutation', key: mutation.mutationKey })
    return result
  }
  
  /**
   * Update ${modelName}
   */
  async update(id: ${idType}, data: ${modelName}Update): Promise<${modelName} | null> {
    const mutation = ${modelLower}Mutations.update()
    const result = await mutation.mutationFn({ id, data })
    this.invalidate('${modelLower}')
    this.notify({ type: 'mutation', key: mutation.mutationKey })
    return result
  }
  
  /**
   * Delete ${modelName}
   */
  async delete(id: ${idType}): Promise<boolean> {
    const mutation = ${modelLower}Mutations.delete()
    const result = await mutation.mutationFn(id)
    this.invalidate('${modelLower}')
    this.notify({ type: 'mutation', key: mutation.mutationKey })
    return result
  }
  
  /**
   * Subscribe to store changes
   */
  subscribe(listener: (event: StoreEvent) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  
  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
    this.notify({ type: 'cache-clear' })
  }
  
  /**
   * Invalidate cache entries matching pattern
   */
  private invalidate(pattern: string): void {
    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }
  
  /**
   * Notify listeners
   */
  private notify(event: StoreEvent): void {
    this.listeners.forEach(fn => fn(event))
  }
}

type StoreEvent = 
  | { type: 'query'; key: readonly any[] }
  | { type: 'mutation'; key: readonly any[] }
  | { type: 'cache-clear' }

// Usage:
// const ${modelLower}Store = new ${modelName}Store()
// const posts = await ${modelLower}Store.list({ take: 20 })
// ${modelLower}Store.subscribe((event) => console.log('Store updated', event))
`
}

/**
 * Generate Angular service
 */
export function generateAngularService(
  model: ParsedModel,
  schema: ParsedSchema
): string {
  const modelName = model.name
  const modelLower = model.name.toLowerCase()
  const modelPlural = modelLower + 's'
  const idType = model.idField?.type === 'String' ? 'string' : 'number'
  
  return `// @generated
// Angular service for ${modelName}

import { Injectable } from '@angular/core'
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs'
import { ${modelLower}Queries, ${modelLower}Mutations } from '../../core/queries/${modelLower}-queries'
import type { ${modelName}, ${modelName}Create, ${modelName}Update, ${modelName}Query, ListResponse } from '../../types'

@Injectable({ providedIn: 'root' })
export class ${modelName}Service {
  private ${modelPlural}Subject = new BehaviorSubject<${modelName}[]>([])
  private currentSubject = new BehaviorSubject<${modelName} | null>(null)
  private loadingSubject = new BehaviorSubject<boolean>(false)
  private errorSubject = new BehaviorSubject<Error | null>(null)
  
  ${modelPlural}$: Observable<${modelName}[]> = this.${modelPlural}Subject.asObservable()
  current$: Observable<${modelName} | null> = this.currentSubject.asObservable()
  loading$: Observable<boolean> = this.loadingSubject.asObservable()
  error$: Observable<Error | null> = this.errorSubject.asObservable()
  
  /**
   * Get single ${modelName}
   */
  async getOne(id: ${idType}): Promise<${modelName} | null> {
    this.loadingSubject.next(true)
    this.errorSubject.next(null)
    
    try {
      const result = await ${modelLower}Queries.all.get(id).queryFn()
      this.currentSubject.next(result)
      return result
    } catch (error) {
      this.errorSubject.next(error as Error)
      return null
    } finally {
      this.loadingSubject.next(false)
    }
  }
  
  /**
   * List ${modelName}s
   */
  async getMany(query?: ${modelName}Query): Promise<ListResponse<${modelName}>> {
    this.loadingSubject.next(true)
    this.errorSubject.next(null)
    
    try {
      const result = await ${modelLower}Queries.all.list(query).queryFn()
      this.${modelPlural}Subject.next(result.data)
      return result
    } catch (error) {
      this.errorSubject.next(error as Error)
      throw error
    } finally {
      this.loadingSubject.next(false)
    }
  }
  
  /**
   * Create ${modelName}
   */
  async create(data: ${modelName}Create): Promise<${modelName}> {
    this.loadingSubject.next(true)
    
    try {
      const mutation = ${modelLower}Mutations.create()
      const result = await mutation.mutationFn(data)
      this.${modelPlural}Subject.next([...this.${modelPlural}Subject.value, result])
      return result
    } finally {
      this.loadingSubject.next(false)
    }
  }
  
  /**
   * Update ${modelName}
   */
  async update(id: ${idType}, data: ${modelName}Update): Promise<${modelName} | null> {
    this.loadingSubject.next(true)
    
    try {
      const mutation = ${modelLower}Mutations.update()
      const result = await mutation.mutationFn({ id, data })
      
      if (result) {
        const updated = this.${modelPlural}Subject.value.map(item => 
          item.id === id ? result : item
        )
        this.${modelPlural}Subject.next(updated)
      }
      
      return result
    } finally {
      this.loadingSubject.next(false)
    }
  }
  
  /**
   * Delete ${modelName}
   */
  async delete(id: ${idType}): Promise<boolean> {
    this.loadingSubject.next(true)
    
    try {
      const mutation = ${modelLower}Mutations.delete()
      const result = await mutation.mutationFn(id)
      
      const filtered = this.${modelPlural}Subject.value.filter(item => item.id !== id)
      this.${modelPlural}Subject.next(filtered)
      
      return result
    } finally {
      this.loadingSubject.next(false)
    }
  }
}

// Usage in component:
// constructor(private ${modelLower}Service: ${modelName}Service) {}
// this.${modelLower}Service.${modelPlural}$.subscribe(${modelPlural} => console.log(${modelPlural}))
// await this.${modelLower}Service.getMany({ take: 20 })
`
}

/**
 * Generate framework adapter index
 */
export function generateFrameworkAdapterIndex(
  models: ParsedModel[],
  schema: ParsedSchema,
  framework: 'vue' | 'zustand' | 'vanilla' | 'angular'
): string {
  const nonJunctionModels = models.filter(m => {
    const analysis = analyzeModel(m, schema)
    return !analysis.isJunctionTable
  })
  
  const exports = nonJunctionModels.map(m => {
    const modelLower = m.name.toLowerCase()
    
    switch (framework) {
      case 'vue':
        return `export * from './composables/use-${modelLower}'`
      case 'zustand':
        return `export * from './stores/${modelLower}-store'`
      case 'vanilla':
        return `export * from './stores/${modelLower}-store'`
      case 'angular':
        return `export * from './services/${modelLower}.service'`
    }
  }).join('\n')
  
  const frameworkSpecific = framework === 'vue'
    ? `\n// Re-export VueQuery for convenience\nexport { VueQueryPlugin, useQueryClient } from '@tanstack/vue-query'`
    : framework === 'zustand'
    ? `\n// Re-export Zustand\nexport { create } from 'zustand'`
    : ''
  
  return `// @generated
// ${framework.charAt(0).toUpperCase() + framework.slice(1)} adapter barrel export

${exports}${frameworkSpecific}
`
}


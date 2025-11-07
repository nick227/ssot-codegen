/**
 * Base Model Client - Generic CRUD operations for models
 */

import type { BaseAPIClient } from '../client/base-client.js'
import type { ListResponse } from '../types/api-response.js'
import { APIException } from '../types/api-error.js'

export interface QueryOptions {
  signal?: AbortSignal
}

/**
 * Base client for model CRUD operations
 * All generated model clients extend this class
 */
export abstract class BaseModelClient<ReadDTO, CreateDTO, UpdateDTO, QueryDTO> {
  constructor(
    protected client: BaseAPIClient,
    protected basePath: string
  ) {}

  /**
   * List records with pagination and filtering
   */
  async list(
    query?: QueryDTO,
    options?: QueryOptions
  ): Promise<ListResponse<ReadDTO>> {
    const queryString = query ? this.buildQueryString(query) : ''
    const path = `${this.basePath}${queryString}`
    
    const response = await this.client.get<ListResponse<ReadDTO>>(path, {
      signal: options?.signal
    })
    
    return response.data
  }

  /**
   * Get single record by ID
   */
  async get(
    id: number | string,
    options?: QueryOptions
  ): Promise<ReadDTO | null> {
    try {
      const response = await this.client.get<ReadDTO>(
        `${this.basePath}/${id}`,
        { signal: options?.signal }
      )
      return response.data
    } catch (error) {
      if (error instanceof APIException && error.status === 404) {
        return null
      }
      throw error
    }
  }

  /**
   * Create new record
   */
  async create(
    data: CreateDTO,
    options?: QueryOptions
  ): Promise<ReadDTO> {
    const response = await this.client.post<ReadDTO>(
      this.basePath,
      data,
      { signal: options?.signal }
    )
    return response.data
  }

  /**
   * Update existing record
   */
  async update(
    id: number | string,
    data: UpdateDTO,
    options?: QueryOptions
  ): Promise<ReadDTO | null> {
    try {
      const response = await this.client.put<ReadDTO>(
        `${this.basePath}/${id}`,
        data,
        { signal: options?.signal }
      )
      return response.data
    } catch (error) {
      if (error instanceof APIException && error.status === 404) {
        return null
      }
      throw error
    }
  }

  /**
   * Delete record
   */
  async ['delete'](
    id: number | string,
    options?: QueryOptions
  ): Promise<boolean> {
    try {
      await this.client['delete']<void>(
        `${this.basePath}/${id}`,
        { signal: options?.signal }
      )
      return true
    } catch (error) {
      if (error instanceof APIException && error.status === 404) {
        return false
      }
      throw error
    }
  }

  /**
   * Find single record by any field
   * 
   * @example
   * ```typescript
   * const post = await client.findOne({ slug: 'hello-world' })
   * const user = await client.findOne({ email: 'john@example.com' })
   * ```
   */
  async findOne(
    where: Partial<ReadDTO>,
    options?: QueryOptions
  ): Promise<ReadDTO | null> {
    const result = await this.list(
      { where, take: 1 } as QueryDTO,
      options
    )
    return result.data[0] || null
  }

  /**
   * Count records with optional filtering
   * 
   * @example
   * ```typescript
   * const total = await client.count()
   * const published = await client.count({ where: { published: true } })
   * ```
   */
  async count(
    query?: Partial<QueryDTO>,
    options?: QueryOptions
  ): Promise<number> {
    const queryString = query ? this.buildQueryString(query) : ''
    const path = `${this.basePath}/count${queryString}`
    
    const response = await this.client.get<{ count: number }>(path, {
      signal: options?.signal
    })
    
    return response.data.count
  }

  /**
   * Create multiple records in a single request
   * 
   * @example
   * ```typescript
   * const posts = await client.createMany([
   *   { title: 'Post 1', content: '...' },
   *   { title: 'Post 2', content: '...' }
   * ])
   * ```
   */
  async createMany(
    data: CreateDTO[],
    options?: QueryOptions
  ): Promise<ReadDTO[]> {
    const response = await this.client.post<ReadDTO[]>(
      `${this.basePath}/batch`,
      data,
      { signal: options?.signal }
    )
    return response.data
  }

  /**
   * Update multiple records matching criteria
   * 
   * @example
   * ```typescript
   * const result = await client.updateMany(
   *   { status: 'DRAFT' },
   *   { status: 'PUBLISHED' }
   * )
   * console.log(`Updated ${result.count} records`)
   * ```
   */
  async updateMany(
    where: Partial<ReadDTO>,
    data: Partial<UpdateDTO>,
    options?: QueryOptions
  ): Promise<{ count: number }> {
    const response = await this.client.put<{ count: number }>(
      `${this.basePath}/batch`,
      { where, data },
      { signal: options?.signal }
    )
    return response.data
  }

  /**
   * Delete multiple records matching criteria
   * 
   * @example
   * ```typescript
   * const result = await client.deleteMany({ status: 'DRAFT' })
   * console.log(`Deleted ${result.count} records`)
   * ```
   */
  async deleteMany(
    where: Partial<ReadDTO>,
    options?: QueryOptions
  ): Promise<{ count: number }> {
    const response = await this.client['delete']<{ count: number }>(
      `${this.basePath}/batch?${this.serializeWhere(where)}`,
      { signal: options?.signal }
    )
    return response.data
  }

  /**
   * Upload file(s) with optional metadata
   * 
   * @example
   * ```typescript
   * // Single file with metadata
   * const formData = new FormData()
   * formData.append('file', fileBlob, 'image.jpg')
   * formData.append('title', 'My Image')
   * formData.append('tags', JSON.stringify(['photo', 'landscape']))
   * 
   * const uploaded = await client.upload(formData)
   * ```
   */
  async upload(
    formData: FormData,
    options?: QueryOptions
  ): Promise<ReadDTO> {
    const response = await this.client.request<ReadDTO>(
      `${this.basePath}/upload`,
      {
        method: 'POST',
        body: formData
        // Don't set Content-Type - browser will set it with boundary
      },
      { signal: options?.signal }
    )
    return response.data
  }

  /**
   * Upload multiple files with optional metadata
   * 
   * @example
   * ```typescript
   * const formData = new FormData()
   * formData.append('files', file1)
   * formData.append('files', file2)
   * formData.append('album', 'Vacation 2024')
   * 
   * const uploaded = await client.uploadMany(formData)
   * ```
   */
  async uploadMany(
    formData: FormData,
    options?: QueryOptions
  ): Promise<ReadDTO[]> {
    const response = await this.client.request<ReadDTO[]>(
      `${this.basePath}/upload/batch`,
      {
        method: 'POST',
        body: formData
      },
      { signal: options?.signal }
    )
    return response.data
  }

  /**
   * Build query string from QueryDTO
   * Supports complex queries, arrays, nested objects, and orderBy objects
   */
  protected buildQueryString(query: any): string {
    if (!query) return ''
    
    const params = new URLSearchParams()

    // Pagination
    if (query.skip !== undefined && query.skip !== null) {
      params.set('skip', query.skip.toString())
    }
    if (query.take !== undefined && query.take !== null) {
      params.set('take', query.take.toString())
    }

    // Sorting - support both string and object formats
    if (query.orderBy) {
      if (typeof query.orderBy === 'string') {
        params.set('orderBy', query.orderBy)
      } else if (typeof query.orderBy === 'object') {
        // Object format: { createdAt: 'desc', title: 'asc' }
        params.set('orderBy', JSON.stringify(query.orderBy))
      }
    }

    // Filtering - use JSON serialization for complex queries
    if (query.where) {
      // Check if query is complex (has arrays, nested objects, or operators)
      if (this.isComplexQuery(query.where)) {
        // Serialize entire where clause as JSON for complex queries
        params.set('where', JSON.stringify(query.where))
      } else {
        // Simple queries can use flat params for better readability
        this.addWhereParams(params, query.where)
      }
    }

    const qs = params.toString()
    return qs ? `?${qs}` : ''
  }

  /**
   * Check if a where clause is complex and needs JSON serialization
   */
  private isComplexQuery(where: any): boolean {
    if (!where || typeof where !== 'object') return false
    
    // Check for Prisma operators (AND, OR, NOT)
    if (where.AND || where.OR || where.NOT) return true
    
    // Check for arrays or nested objects in filters
    for (const value of Object.values(where)) {
      if (Array.isArray(value)) return true
      if (value && typeof value === 'object' && !(value instanceof Date)) {
        // Check for operators with array values (in, notIn, etc.)
        const subValues = Object.values(value)
        if (subValues.some(v => Array.isArray(v))) return true
      }
    }
    
    return false
  }

  /**
   * Add simple where clause parameters to URLSearchParams
   * For flat, simple queries only
   */
  private addWhereParams(params: URLSearchParams, where: any, prefix: string = 'where'): void {
    for (const [field, filter] of Object.entries(where)) {
      if (filter === undefined || filter === null) continue
      
      if (typeof filter === 'object' && !Array.isArray(filter) && !(filter instanceof Date)) {
        // Nested filter object (e.g., { contains: 'hello', mode: 'insensitive' })
        for (const [op, value] of Object.entries(filter)) {
          if (value !== undefined && value !== null) {
            const key = `${prefix}[${field}][${op}]`
            params.set(key, String(value))
          }
        }
      } else {
        // Direct value (e.g., published: true)
        const key = `${prefix}[${field}]`
        params.set(key, String(filter))
      }
    }
  }

  /**
   * Serialize where clause for query string (used by deleteMany)
   */
  private serializeWhere(where: Partial<ReadDTO>): string {
    const params = new URLSearchParams()
    
    if (this.isComplexQuery(where)) {
      params.set('where', JSON.stringify(where))
    } else {
      this.addWhereParams(params, where)
    }
    
    return params.toString()
  }
}


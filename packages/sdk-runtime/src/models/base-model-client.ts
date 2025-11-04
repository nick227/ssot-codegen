/**
 * Base Model Client - Generic CRUD operations for models
 */

import type { BaseAPIClient, RequestConfig } from '../client/base-client.js'
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
   * Count records
   */
  async count(options?: QueryOptions): Promise<number> {
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
    if (!query) return ''
    
    const params = new URLSearchParams()

    // Pagination
    if (query.skip !== undefined && query.skip !== null) {
      params.set('skip', query.skip.toString())
    }
    if (query.take !== undefined && query.take !== null) {
      params.set('take', query.take.toString())
    }

    // Sorting
    if (query.orderBy) {
      params.set('orderBy', query.orderBy)
    }

    // Filtering
    if (query.where) {
      this.addWhereParams(params, query.where)
    }

    const qs = params.toString()
    return qs ? `?${qs}` : ''
  }

  /**
   * Add where clause parameters to URLSearchParams
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
}


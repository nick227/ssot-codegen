/**
 * HTTP Transport - Wrapper around BaseAPIClient
 * No real-time capabilities, purely request/response
 */

import { BaseAPIClient } from '../client/base-client.js'
import { APIException } from '../types/api-error.js'
import type { DataClient, ListResponse, QueryParams } from './data-client.js'

/**
 * HTTP-based transport using existing BaseAPIClient
 * Implements DataClient interface for consistency
 */
export class HTTPTransport<T> implements DataClient<T> {
  constructor(
    private client: BaseAPIClient,
    private basePath: string
  ) {}

  async list(params?: QueryParams): Promise<ListResponse<T>> {
    const queryString = this.buildQueryString(params)
    const response = await this.client.get<ListResponse<T>>(
      `${this.basePath}${queryString}`
    )
    return response.data
  }

  async get(id: string | number): Promise<T | null> {
    try {
      const response = await this.client.get<T>(`${this.basePath}/${id}`)
      return response.data
    } catch (error) {
      if (error instanceof APIException && error.status === 404) {
        return null
      }
      throw error
    }
  }

  async create(data: unknown): Promise<T> {
    const response = await this.client.post<T>(this.basePath, data)
    return response.data
  }

  async update(id: string | number, data: unknown): Promise<T> {
    const response = await this.client.put<T>(`${this.basePath}/${id}`, data)
    return response.data
  }

  async delete(id: string | number): Promise<boolean> {
    try {
      await this.client.delete(`${this.basePath}/${id}`)
      return true
    } catch (error) {
      if (error instanceof APIException && error.status === 404) {
        return false
      }
      throw error
    }
  }

  // No subscribe methods - HTTP doesn't support real-time

  private buildQueryString(params?: QueryParams): string {
    if (!params) return ''
    
    const searchParams = new URLSearchParams()
    
    if (params.where) {
      searchParams.set('where', JSON.stringify(params.where))
    }
    if (params.orderBy) {
      searchParams.set('orderBy', JSON.stringify(params.orderBy))
    }
    if (params.skip !== undefined) {
      searchParams.set('skip', params.skip.toString())
    }
    if (params.take !== undefined) {
      searchParams.set('take', params.take.toString())
    }
    
    const qs = searchParams.toString()
    return qs ? `?${qs}` : ''
  }
}


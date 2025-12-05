// @generated
// Service Integration SDK Client for discovery-service

import type { BaseAPIClient, QueryOptions } from '@ssot-codegen/sdk-runtime'

/**
 * DiscoveryServiceClient
 * Type-safe client for discovery-service service operations
 * 
 * @example Provide your own types for better type safety
 * ```typescript
 * interface SendMessageRequest { prompt: string }
 * interface SendMessageResponse { reply: string }
 * 
 * const response = await api.discoveryService.sendMessage<SendMessageRequest, SendMessageResponse>(
 *   { prompt: 'Hello' }
 * )
 * console.log(response.reply)  // Fully typed!
 * ```
 */
export class DiscoveryServiceClient {
  constructor(private client: BaseAPIClient) {}

  /**
   * getDiscoveryQueue
   * GET /api/discovery-service/discovery-queue
   * 
   * @template TResponse - Response body type
   * @example
   * ```typescript
   * const result = await client.getDiscoveryQueue<MyResponse>()
   * ```
   */
  async getDiscoveryQueue<TResponse = unknown>(options?: QueryOptions): Promise<TResponse> {
    const response = await this.client.get<TResponse>(
      `/api/discovery-service/discovery-queue`,
      { signal: options?.signal }
    )
    return response.data
  }

  /**
   * getCandidates
   * GET /api/discovery-service/candidates
   * 
   * @template TResponse - Response body type
   * @example
   * ```typescript
   * const result = await client.getCandidates<MyResponse>()
   * ```
   */
  async getCandidates<TResponse = unknown>(options?: QueryOptions): Promise<TResponse> {
    const response = await this.client.get<TResponse>(
      `/api/discovery-service/candidates`,
      { signal: options?.signal }
    )
    return response.data
  }

  /**
   * refreshQueue @description Discovery queue with compatibility-based matching
   * POST /api/discovery-service/refresh-queue @description -discovery queue with compatibility-based matching
   * 
   * @template TRequest - Request body type
   * @template TResponse - Response body type
   * @example
   * ```typescript
   * const result = await client.refreshQueue @description Discovery queue with compatibility-based matching<MyRequest, MyResponse>({ field: 'value' })
   * ```
   */
  async refreshQueue @description Discovery queue with compatibility-based matching<TRequest = Record<string, unknown>, TResponse = unknown>(data?: TRequest, options?: QueryOptions): Promise<TResponse> {
    const response = await this.client.post<TResponse>(
      `/api/discovery-service/refresh-queue @description -discovery queue with compatibility-based matching`,
      data,
      { signal: options?.signal }
    )
    return response.data
  }

  /**
   * filters
   * POST /api/discovery-service/filters
   * 
   * @template TRequest - Request body type
   * @template TResponse - Response body type
   * @example
   * ```typescript
   * const result = await client.filters<MyRequest, MyResponse>({ field: 'value' })
   * ```
   */
  async filters<TRequest = Record<string, unknown>, TResponse = unknown>(data?: TRequest, options?: QueryOptions): Promise<TResponse> {
    const response = await this.client.post<TResponse>(
      `/api/discovery-service/filters`,
      data,
      { signal: options?.signal }
    )
    return response.data
  }

  /**
   * and pagination
   * POST /api/discovery-service/and pagination
   * 
   * @template TRequest - Request body type
   * @template TResponse - Response body type
   * @example
   * ```typescript
   * const result = await client.and pagination<MyRequest, MyResponse>({ field: 'value' })
   * ```
   */
  async and pagination<TRequest = Record<string, unknown>, TResponse = unknown>(data?: TRequest, options?: QueryOptions): Promise<TResponse> {
    const response = await this.client.post<TResponse>(
      `/api/discovery-service/and pagination`,
      data,
      { signal: options?.signal }
    )
    return response.data
  }
}

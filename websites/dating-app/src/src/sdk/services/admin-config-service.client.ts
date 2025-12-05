// @generated
// Service Integration SDK Client for admin-config-service

import type { BaseAPIClient, QueryOptions } from '@ssot-codegen/sdk-runtime'

/**
 * AdminConfigServiceClient
 * Type-safe client for admin-config-service service operations
 * 
 * @example Provide your own types for better type safety
 * ```typescript
 * interface SendMessageRequest { prompt: string }
 * interface SendMessageResponse { reply: string }
 * 
 * const response = await api.adminConfigService.sendMessage<SendMessageRequest, SendMessageResponse>(
 *   { prompt: 'Hello' }
 * )
 * console.log(response.reply)  // Fully typed!
 * ```
 */
export class AdminConfigServiceClient {
  constructor(private client: BaseAPIClient) {}

  /**
   * createRule
   * POST /api/admin-config-service/rule
   * 
   * @template TRequest - Request body type
   * @template TResponse - Response body type
   * @example
   * ```typescript
   * const result = await client.createRule<MyRequest, MyResponse>({ field: 'value' })
   * ```
   */
  async createRule<TRequest = Record<string, unknown>, TResponse = unknown>(data?: TRequest, options?: QueryOptions): Promise<TResponse> {
    const response = await this.client.post<TResponse>(
      `/api/admin-config-service/rule`,
      data,
      { signal: options?.signal }
    )
    return response.data
  }

  /**
   * updateRule
   * PUT /api/admin-config-service/rule
   * 
   * @template TRequest - Request body type
   * @template TResponse - Response body type
   * @example
   * ```typescript
   * const result = await client.updateRule<MyRequest, MyResponse>({ field: 'value' })
   * ```
   */
  async updateRule<TRequest = Record<string, unknown>, TResponse = unknown>(data?: TRequest, options?: QueryOptions): Promise<TResponse> {
    const response = await this.client.put<TResponse>(
      `/api/admin-config-service/rule`,
      data,
      { signal: options?.signal }
    )
    return response.data
  }

  /**
   * deleteRule
   * DELETE /api/admin-config-service/rule
   * 
   * @template TResponse - Response body type
   * @example
   * ```typescript
   * const result = await client.deleteRule<MyResponse>()
   * ```
   */
  async deleteRule<TResponse = unknown>(options?: QueryOptions): Promise<TResponse> {
    const response = await this.client.delete<TResponse>(
      `/api/admin-config-service/rule`,
      { signal: options?.signal }
    )
    return response.data
  }

  /**
   * bulkUpdateRules
   * POST /api/admin-config-service/bulk-update-rules
   * 
   * @template TRequest - Request body type
   * @template TResponse - Response body type
   * @example
   * ```typescript
   * const result = await client.bulkUpdateRules<MyRequest, MyResponse>({ field: 'value' })
   * ```
   */
  async bulkUpdateRules<TRequest = Record<string, unknown>, TResponse = unknown>(data?: TRequest, options?: QueryOptions): Promise<TResponse> {
    const response = await this.client.post<TResponse>(
      `/api/admin-config-service/bulk-update-rules`,
      data,
      { signal: options?.signal }
    )
    return response.data
  }

  /**
   * getRuleHistory
   * GET /api/admin-config-service/rule-history
   * 
   * @template TResponse - Response body type
   * @example
   * ```typescript
   * const result = await client.getRuleHistory<MyResponse>()
   * ```
   */
  async getRuleHistory<TResponse = unknown>(options?: QueryOptions): Promise<TResponse> {
    const response = await this.client.get<TResponse>(
      `/api/admin-config-service/rule-history`,
      { signal: options?.signal }
    )
    return response.data
  }

  /**
   * createEventWeight
   * POST /api/admin-config-service/event-weight
   * 
   * @template TRequest - Request body type
   * @template TResponse - Response body type
   * @example
   * ```typescript
   * const result = await client.createEventWeight<MyRequest, MyResponse>({ field: 'value' })
   * ```
   */
  async createEventWeight<TRequest = Record<string, unknown>, TResponse = unknown>(data?: TRequest, options?: QueryOptions): Promise<TResponse> {
    const response = await this.client.post<TResponse>(
      `/api/admin-config-service/event-weight`,
      data,
      { signal: options?.signal }
    )
    return response.data
  }

  /**
   * updateEventWeight
   * PUT /api/admin-config-service/event-weight
   * 
   * @template TRequest - Request body type
   * @template TResponse - Response body type
   * @example
   * ```typescript
   * const result = await client.updateEventWeight<MyRequest, MyResponse>({ field: 'value' })
   * ```
   */
  async updateEventWeight<TRequest = Record<string, unknown>, TResponse = unknown>(data?: TRequest, options?: QueryOptions): Promise<TResponse> {
    const response = await this.client.put<TResponse>(
      `/api/admin-config-service/event-weight`,
      data,
      { signal: options?.signal }
    )
    return response.data
  }

  /**
   * getConfigStatus @description Admin service for managing dimension mapping rules and event weight configurations
   * GET /api/admin-config-service/config-status @description -admin service for managing dimension mapping rules and event weight configurations
   * 
   * @template TResponse - Response body type
   * @example
   * ```typescript
   * const result = await client.getConfigStatus @description Admin service for managing dimension mapping rules and event weight configurations<MyResponse>()
   * ```
   */
  async getConfigStatus @description Admin service for managing dimension mapping rules and event weight configurations<TResponse = unknown>(options?: QueryOptions): Promise<TResponse> {
    const response = await this.client.get<TResponse>(
      `/api/admin-config-service/config-status @description -admin service for managing dimension mapping rules and event weight configurations`,
      { signal: options?.signal }
    )
    return response.data
  }
}

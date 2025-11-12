/**
 * Data Client Interface - Transport-agnostic data access
 * Supports HTTP, WebSocket, or hybrid implementations
 */

export type Unsubscribe = () => void

// Internal ListResponse for data client (different from API response)
interface ListResponse<T> {
  items: T[]
  total: number
  page?: number
  pageSize?: number
}

export interface QueryParams {
  where?: Record<string, unknown>
  orderBy?: Record<string, 'asc' | 'desc'>
  skip?: number
  take?: number
}

export interface UpdateMessage<T> {
  type: 'created' | 'updated' | 'deleted'
  data?: T
  id?: string | number
  timestamp: number
}

// Export the ListResponse for use in this module only
export type { ListResponse }

/**
 * Transport-agnostic client interface
 * Implemented by HTTPTransport, WebSocketTransport, HybridDataClient
 */
export interface DataClient<T> {
  // Query operations
  list(params?: QueryParams): Promise<ListResponse<T>>
  get(id: string | number): Promise<T | null>
  
  // Mutation operations
  create(data: unknown): Promise<T>
  update(id: string | number, data: unknown): Promise<T>
  delete(id: string | number): Promise<boolean>
  
  // Real-time operations (optional - only WebSocket supports)
  subscribe?(channel: string, callback: (update: UpdateMessage<T>) => void): Unsubscribe
  onUpdate?(id: string | number, callback: (data: T) => void): Unsubscribe
  onDelete?(id: string | number, callback: () => void): Unsubscribe
}


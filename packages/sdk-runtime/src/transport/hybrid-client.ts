/**
 * Hybrid Data Client - Smart router between HTTP and WebSocket
 * Automatically selects best transport based on operation and state
 */

import type { 
  DataClient, 
  ListResponse, 
  QueryParams,
  UpdateMessage,
  Unsubscribe 
} from './data-client.js'
import { HTTPTransport } from './http-transport.js'
import { WebSocketTransport } from './websocket-transport.js'

/**
 * Hybrid client that intelligently routes between HTTP and WebSocket
 * 
 * Strategy:
 * - Queries: Use WS if subscribed (cached), else HTTP
 * - Mutations: Always HTTP (reliability)
 * - Subscriptions: WS only
 */
export class HybridDataClient<T> implements DataClient<T> {
  constructor(
    private http: HTTPTransport<T>,
    private ws?: WebSocketTransport<T>
  ) {}

  async list(params?: QueryParams): Promise<ListResponse<T>> {
    if (this.ws?.hasSubscription('list')) {
      try {
        return await this.ws.list(params)
      } catch (error) {
        // Fall back to HTTP on error
      }
    }
    
    return this.http.list(params)
  }

  async get(id: string | number): Promise<T | null> {
    if (this.ws?.hasSubscription(`item:${id}`)) {
      try {
        return await this.ws.get(id)
      } catch (error) {
        // Fall back to HTTP on error
      }
    }
    
    return this.http.get(id)
  }

  async create(data: unknown): Promise<T> {
    return this.http.create(data)
  }

  async update(id: string | number, data: unknown): Promise<T> {
    return this.http.update(id, data)
  }

  async delete(id: string | number): Promise<boolean> {
    return this.http.delete(id)
  }

  subscribe(channel: string, callback: (update: UpdateMessage<T>) => void): Unsubscribe {
    if (!this.ws) {
      return () => {} // No-op if WS not available
    }
    
    return this.ws.subscribe(channel, callback)
  }

  onUpdate(id: string | number, callback: (data: T) => void): Unsubscribe {
    if (!this.ws) {
      return () => {}
    }
    
    return this.ws.onUpdate(id, callback)
  }

  onDelete(id: string | number, callback: () => void): Unsubscribe {
    if (!this.ws) {
      return () => {}
    }
    
    return this.ws.onDelete(id, callback)
  }
}


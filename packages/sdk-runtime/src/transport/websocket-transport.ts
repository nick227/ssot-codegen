/**
 * WebSocket Transport - Real-time data client with caching
 * Supports subscriptions, automatic reconnection, and smart caching
 */

import type { 
  DataClient, 
  ListResponse, 
  QueryParams, 
  UpdateMessage,
  Unsubscribe 
} from './data-client.js'

interface PendingRequest {
  resolve: (data: unknown) => void
  reject: (error: Error) => void
  timeout: NodeJS.Timeout
}

/**
 * WebSocket-based transport with caching and subscriptions
 * Ideal for real-time data that updates frequently
 */
export class WebSocketTransport<T> implements DataClient<T> {
  private ws: WebSocket | null = null
  private url: string
  private cache = new Map<string, ListResponse<T>>()
  private subscriptions = new Map<string, Set<(update: UpdateMessage<T>) => void>>()
  private pendingRequests = new Map<string, PendingRequest>()
  private requestId = 0
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  constructor(
    wsUrl: string,
    private model: string,
    private authToken?: string
  ) {
    this.url = authToken ? `${wsUrl}?token=${authToken}` : wsUrl
    this.connect()
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  private connect(): void {
    try {
      this.ws = new WebSocket(this.url)
      
      this.ws.onopen = () => {
        this.reconnectAttempts = 0
        this.resubscribeAll()
      }
      
      this.ws.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data))
      }
      
      this.ws.onclose = () => {
        this.handleDisconnect()
      }
    } catch (error) {
      this.handleDisconnect()
    }
  }

  private handleDisconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.pow(2, this.reconnectAttempts) * 1000
      
      setTimeout(() => {
        this.reconnectAttempts++
        this.connect()
      }, delay)
    }
  }

  private resubscribeAll(): void {
    for (const channel of this.subscriptions.keys()) {
      this.send({
        type: 'subscribe',
        channel
      })
    }
  }

  private handleMessage(message: { type: string; requestId?: string; channel?: string; data?: unknown; error?: string }): void {
    const { type, requestId, channel, data, error } = message
    
    if (type === 'response' && requestId) {
      const pending = this.pendingRequests.get(requestId)
      if (pending) {
        clearTimeout(pending.timeout)
        this.pendingRequests.delete(requestId)
        
        if (error) {
          pending.reject(new Error(error))
        } else {
          pending.resolve(data)
        }
      }
    } else if (type === 'update' && channel && data) {
      this.handleUpdate(channel, data as UpdateMessage<T>)
    }
  }

  private handleUpdate(channel: string, update: UpdateMessage<T>): void {
    this.updateCache(channel, update)
    
    const subscribers = this.subscriptions.get(channel)
    if (subscribers) {
      subscribers.forEach(callback => callback(update))
    }
  }

  private updateCache(channel: string, update: UpdateMessage<T>): void {
    const cached = this.cache.get(channel)
    if (!cached) return
    
    switch (update.type) {
      case 'created':
        if (update.data) {
          cached.items.push(update.data)
          cached.total++
        }
        break
      case 'updated':
        if (update.data && update.id) {
          const index = cached.items.findIndex((item: T & { id?: unknown }) => item.id === update.id)
          if (index !== -1) {
            cached.items[index] = update.data
          }
        }
        break
      case 'deleted':
        if (update.id) {
          cached.items = cached.items.filter((item: T & { id?: unknown }) => item.id !== update.id)
          cached.total--
        }
        break
    }
    
    this.cache.set(channel, cached)
  }

  private send(data: unknown): void {
    if (!this.isConnected) return
    this.ws!.send(JSON.stringify(data))
  }

  private request<R>(action: string, params?: unknown): Promise<R> {
    return new Promise((resolve, reject) => {
      const id = `${++this.requestId}`
      
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id)
        reject(new Error('Request timeout'))
      }, 30000)
      
      this.pendingRequests.set(id, { resolve, reject, timeout })
      
      this.send({
        type: 'request',
        requestId: id,
        model: this.model,
        action,
        params
      })
    })
  }

  async list(params?: QueryParams): Promise<ListResponse<T>> {
    const cacheKey = this.getCacheKey('list', params)
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }
    
    const result = await this.request<ListResponse<T>>('list', params)
    this.cache.set(cacheKey, result)
    return result
  }

  async get(id: string | number): Promise<T | null> {
    return this.request<T | null>('get', { id })
  }

  async create(data: unknown): Promise<T> {
    throw new Error('Use HTTP transport for mutations')
  }

  async update(id: string | number, data: unknown): Promise<T> {
    throw new Error('Use HTTP transport for mutations')
  }

  async delete(id: string | number): Promise<boolean> {
    throw new Error('Use HTTP transport for mutations')
  }

  subscribe(channel: string, callback: (update: UpdateMessage<T>) => void): Unsubscribe {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set())
      
      if (this.isConnected) {
        this.send({
          type: 'subscribe',
          channel: `${this.model}:${channel}`
        })
      }
    }
    
    this.subscriptions.get(channel)!.add(callback)
    
    return () => {
      const subs = this.subscriptions.get(channel)
      if (subs) {
        subs.delete(callback)
        
        if (subs.size === 0) {
          this.subscriptions.delete(channel)
          
          if (this.isConnected) {
            this.send({
              type: 'unsubscribe',
              channel: `${this.model}:${channel}`
            })
          }
          
          this.cache.delete(this.getCacheKey(channel))
        }
      }
    }
  }

  onUpdate(id: string | number, callback: (data: T) => void): Unsubscribe {
    return this.subscribe(`item:${id}`, (update) => {
      if (update.type === 'updated' && update.data) {
        callback(update.data)
      }
    })
  }

  onDelete(id: string | number, callback: () => void): Unsubscribe {
    return this.subscribe(`item:${id}`, (update) => {
      if (update.type === 'deleted') {
        callback()
      }
    })
  }

  hasSubscription(channel: string): boolean {
    return this.subscriptions.has(channel)
  }

  private getCacheKey(operation: string, params?: unknown): string {
    return `${operation}:${JSON.stringify(params ?? {})}`
  }

  disconnect(): void {
    this.subscriptions.clear()
    this.cache.clear()
    this.ws?.close()
  }
}


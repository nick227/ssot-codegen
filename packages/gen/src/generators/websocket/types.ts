/**
 * WebSocket Generator Types
 */

export interface WebSocketConfig {
  enabled: boolean
  url?: string
  port?: number
  path?: string
  pubsub: PubSubConfig
  reconnect?: ReconnectConfig
  batching?: BatchingConfig
}

export interface PubSubConfig {
  models: Record<string, ModelRealtimeConfig>
  channels?: Record<string, ChannelConfig>
}

export interface ModelRealtimeConfig {
  subscribe: Array<'list' | 'item'>
  broadcast: Array<'created' | 'updated' | 'deleted'>
  permissions: {
    list?: PermissionRule
    item?: PermissionRule
  }
}

export type PermissionRule = 
  | 'true'
  | 'authenticated'
  | 'isOwner'
  | 'isAdmin'
  | string

export interface ChannelConfig {
  events: string[]
  permission: PermissionRule
}

export interface ReconnectConfig {
  maxAttempts: number
  backoff: 'linear' | 'exponential'
  baseDelay?: number
}

export interface BatchingConfig {
  enabled: boolean
  flushInterval: number
  maxBatchSize?: number
}

export interface WebSocketGeneratorResult {
  gateway: Map<string, string>
  clientFiles: Map<string, string>
  filesGenerated: number
}


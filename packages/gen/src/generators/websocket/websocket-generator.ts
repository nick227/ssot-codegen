/**
 * WebSocket Generator - Main Entry
 * Orchestrates WebSocket code generation
 */

import type { ParsedModel } from '../../types/schema.js'
import type { WebSocketConfig, WebSocketGeneratorResult } from './types.js'
import { generateWebSocketGateway } from './gateway-generator.js'
import { generateWebSocketClient } from './client-generator.js'

/**
 * Generate all WebSocket files (gateway + clients)
 */
export function generateWebSocket(
  models: ParsedModel[],
  config: WebSocketConfig
): WebSocketGeneratorResult {
  const gateway = generateWebSocketGateway(models, config)
  const clientFiles = generateWebSocketClient(models, config)
  
  return {
    gateway,
    clientFiles,
    filesGenerated: gateway.size + clientFiles.size
  }
}

/**
 * Auto-detect if WebSocket should be enabled based on schema
 */
export function shouldEnableWebSocket(models: ParsedModel[]): boolean {
  const realtimeModels = ['Message', 'Chat', 'Notification', 'Event', 'Activity']
  
  return models.some(m => realtimeModels.includes(m.name))
}

/**
 * Create default WebSocket config for common patterns
 */
export function createDefaultWebSocketConfig(models: ParsedModel[]): WebSocketConfig {
  const pubsubModels: Record<string, any> = {}
  
  for (const model of models) {
    if (model.name === 'Message' || model.name === 'Chat') {
      pubsubModels[model.name] = {
        subscribe: ['list', 'item'],
        broadcast: ['created', 'updated', 'deleted'],
        permissions: {
          list: 'authenticated',
          item: 'authenticated'
        }
      }
    } else if (model.name === 'Notification') {
      pubsubModels[model.name] = {
        subscribe: ['list'],
        broadcast: ['created'],
        permissions: {
          list: 'isOwner'
        }
      }
    }
  }
  
  return {
    enabled: true,
    port: 3001,
    path: '/ws',
    pubsub: {
      models: pubsubModels
    },
    reconnect: {
      maxAttempts: 5,
      backoff: 'exponential',
      baseDelay: 1000
    },
    batching: {
      enabled: true,
      flushInterval: 100,
      maxBatchSize: 50
    }
  }
}


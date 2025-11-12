/**
 * WebSocket Generator - Main Entry
 * Orchestrates WebSocket code generation
 */

import type { ParsedModel } from '../../dmmf-parser/types.js'
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
 * Auto-detect if WebSocket should be enabled based on @@realtime annotations
 * 
 * Checks for @@realtime annotation in parsed model annotations
 */
export function shouldEnableWebSocket(models: ParsedModel[]): boolean {
  return models.some(m => hasRealtimeAnnotation(m))
}

/**
 * Check if model has @@realtime annotation
 */
function hasRealtimeAnnotation(model: ParsedModel): boolean {
  if (!model.annotations) return false
  
  return model.annotations.some((a: any) => a.type === 'realtime')
}

/**
 * Create WebSocket config from @@realtime annotations
 * 
 * Uses parsed annotations from ParsedModel (no manual parsing)
 */
export function createDefaultWebSocketConfig(models: ParsedModel[]): WebSocketConfig {
  const pubsubModels: Record<string, any> = {}
  
  for (const model of models) {
    const realtimeConfig = getRealtimeConfig(model)
    if (realtimeConfig) {
      pubsubModels[model.name] = realtimeConfig
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

/**
 * Extract @@realtime configuration from parsed annotations
 */
function getRealtimeConfig(model: ParsedModel): any | null {
  if (!model.annotations) return null
  
  const realtimeAnnotation = model.annotations.find((a: any) => a.type === 'realtime')
  if (!realtimeAnnotation) return null
  
  const annotation = realtimeAnnotation as any
  
  return {
    subscribe: annotation.subscribe || ['list'],
    broadcast: annotation.broadcast || ['created', 'updated', 'deleted'],
    permissions: annotation.permissions || {
      list: 'authenticated',
      item: 'authenticated'
    }
  }
}


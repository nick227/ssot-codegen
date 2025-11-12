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
 * Auto-detect if WebSocket should be enabled based on @@realtime annotations
 * 
 * Checks for @@realtime annotation in model documentation
 */
export function shouldEnableWebSocket(models: ParsedModel[]): boolean {
  return models.some(m => hasRealtimeAnnotation(m))
}

/**
 * Check if model has @@realtime annotation
 */
function hasRealtimeAnnotation(model: ParsedModel): boolean {
  if (!model.documentation) return false
  
  // Look for @@realtime annotation in documentation
  return model.documentation.includes('@@realtime')
}

/**
 * Create WebSocket config from @@realtime annotations
 */
export function createDefaultWebSocketConfig(models: ParsedModel[]): WebSocketConfig {
  const pubsubModels: Record<string, any> = {}
  
  for (const model of models) {
    const realtimeConfig = parseRealtimeAnnotation(model)
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
 * Parse @@realtime annotation from model documentation
 * 
 * Format: @@realtime(subscribe: ["list", "item"], broadcast: ["created", "updated"])
 */
function parseRealtimeAnnotation(model: ParsedModel): any | null {
  if (!model.documentation) return null
  
  const lines = model.documentation.split('\n')
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    // Match @@realtime(...) pattern
    const match = trimmed.match(/@@realtime\((.*)\)/)
    if (!match) continue
    
    try {
      const argsString = match[1]
      const config = parseRealtimeArgs(argsString)
      
      return {
        subscribe: config.subscribe || ['list'],
        broadcast: config.broadcast || ['created', 'updated', 'deleted'],
        permissions: config.permissions || {
          list: 'authenticated',
          item: 'authenticated'
        }
      }
    } catch (error) {
      console.warn(`[SSOT] Failed to parse @@realtime for ${model.name}:`, error)
      return null
    }
  }
  
  return null
}

/**
 * Simple parser for realtime annotation arguments
 */
function parseRealtimeArgs(argsString: string): any {
  const config: any = {}
  
  // Extract subscribe array: subscribe: ["list", "item"]
  const subscribeMatch = argsString.match(/subscribe:\s*\[(.*?)\]/)
  if (subscribeMatch) {
    config.subscribe = subscribeMatch[1]
      .split(',')
      .map(s => s.trim().replace(/['"]/g, ''))
      .filter(Boolean)
  }
  
  // Extract broadcast array: broadcast: ["created", "updated"]
  const broadcastMatch = argsString.match(/broadcast:\s*\[(.*?)\]/)
  if (broadcastMatch) {
    config.broadcast = broadcastMatch[1]
      .split(',')
      .map(s => s.trim().replace(/['"]/g, ''))
      .filter(Boolean)
  }
  
  // Extract permissions object: permissions: { list: "authenticated", item: "isOwner" }
  const permissionsMatch = argsString.match(/permissions:\s*\{(.*?)\}/)
  if (permissionsMatch) {
    const permStr = permissionsMatch[1]
    const permissions: any = {}
    
    // Parse key: "value" pairs
    const pairs = permStr.split(',')
    for (const pair of pairs) {
      const [key, value] = pair.split(':').map(s => s.trim().replace(/['"]/g, ''))
      if (key && value) {
        permissions[key] = value
      }
    }
    
    config.permissions = permissions
  }
  
  return config
}


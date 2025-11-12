/**
 * WebSocket Generation Phase
 * Generates WebSocket gateway and client code when enabled
 */

import { GenerationPhase, type PhaseContext, type PhaseResult } from '../phase-runner.js'
import { generateWebSocket, shouldEnableWebSocket } from '../../generators/websocket/websocket-generator.js'
import type { WebSocketConfig } from '../../generators/websocket/types.js'

export class WebSocketGenerationPhase extends GenerationPhase {
  readonly name = 'websocket-generation'
  readonly order = 9  // After OpenAPI (08), before Tests (10)
  
  getDescription(): string {
    return 'Generating WebSocket gateway and real-time clients'
  }
  
  shouldRun(context: PhaseContext): boolean {
    // Check if WebSocket is explicitly enabled in config
    const wsConfig = (context.config as unknown as Record<string, unknown>).websockets as WebSocketConfig | undefined
    
    if (wsConfig?.enabled === true) {
      return true
    }
    
    // Auto-detect if schema suggests need for WebSocket
    if (context.schema) {
      const mutableModels = Array.from(context.schema.models)
      if (shouldEnableWebSocket(mutableModels)) {
        console.log('[ssot-codegen] 💡 Real-time models detected (Message, Chat, Notification)')
        console.log('[ssot-codegen] 💡 Consider enabling WebSocket in config for real-time updates')
      }
    }
    
    return false
  }

  async execute(context: PhaseContext): Promise<PhaseResult> {
    try {
      console.log('[ssot-codegen] Generating WebSocket gateway and clients...')
      
      const wsConfig = (context.config as unknown as Record<string, unknown>).websockets as WebSocketConfig
      
      if (!wsConfig || !context.schema) {
        return { success: true, filesGenerated: 0 }
      }
      
      // Convert readonly array to mutable for generator
      const mutableModels = Array.from(context.schema.models)
      
      // Generate WebSocket files
      const result = generateWebSocket(mutableModels, wsConfig)
      
      console.log(`[ssot-codegen] ✓ Generated ${result.filesGenerated} WebSocket files`)
      
      // Store result in context for file writing phase
      context.pluginState = context.pluginState || {}
      context.pluginState['websocket'] = result
      
      return {
        success: true,
        filesGenerated: result.filesGenerated
      }
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('WebSocket generation failed')
      }
    }
  }
}


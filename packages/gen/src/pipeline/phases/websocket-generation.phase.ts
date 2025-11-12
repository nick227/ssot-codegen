/**
 * WebSocket Generation Phase
 * Generates WebSocket gateway and client code when enabled
 */

import type { GenerationPhase, IGenerationContext, PhaseResult, GenerationError } from '../generation-types.js'
import { PhaseStatus, ErrorSeverity } from '../generation-types.js'
import { generateWebSocket, shouldEnableWebSocket } from '../../generators/websocket/websocket-generator.js'
import type { WebSocketConfig } from '../../generators/websocket/types.js'

export class WebSocketGenerationPhase implements GenerationPhase {
  readonly name = 'websocket-generation'
  readonly order = 9  // After OpenAPI (08), before Tests (10)

  shouldExecute(context: IGenerationContext): boolean {
    // Check if WebSocket is explicitly enabled in config
    const wsConfig = (context.config as any).websockets as WebSocketConfig | undefined
    
    if (wsConfig?.enabled === true) {
      return true
    }
    
    // Auto-detect if schema suggests need for WebSocket
    if (shouldEnableWebSocket(context.schema.models)) {
      console.log('[ssot-codegen] 💡 Real-time models detected (Message, Chat, Notification)')
      console.log('[ssot-codegen] 💡 Consider enabling WebSocket in config for real-time updates')
    }
    
    return false
  }

  async execute(context: IGenerationContext): Promise<PhaseResult> {
    const errors: GenerationError[] = []
    
    try {
      console.log('[ssot-codegen] Generating WebSocket gateway and clients...')
      
      const wsConfig = (context.config as any).websockets as WebSocketConfig
      
      if (!wsConfig) {
        return {
          status: PhaseStatus.SKIPPED,
          message: 'WebSocket not configured'
        }
      }
      
      // Generate WebSocket files
      const result = generateWebSocket(context.schema.models, wsConfig)
      
      // Add gateway files to output
      const wsBuilder = context.filesBuilder.getCustomBuilder('websockets')
      for (const [filename, content] of result.gateway) {
        wsBuilder.addFile(filename, content)
      }
      
      // Add client files to SDK
      const sdkBuilder = context.filesBuilder.getSDKBuilder()
      for (const [filename, content] of result.clientFiles) {
        sdkBuilder.addFile(filename, content)
      }
      
      console.log(`[ssot-codegen] ✓ Generated ${result.filesGenerated} WebSocket files`)
      
      return {
        status: PhaseStatus.SUCCESS,
        message: `Generated ${result.filesGenerated} WebSocket files`
      }
      
    } catch (error) {
      errors.push({
        phase: this.name,
        severity: ErrorSeverity.ERROR,
        message: error instanceof Error ? error.message : 'WebSocket generation failed',
        details: error
      })
      
      return {
        status: PhaseStatus.FAILED,
        errors
      }
    }
  }
}


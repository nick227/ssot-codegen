/**
 * UI Generation Phase
 * 
 * Pipeline phase for generating UI components and pages
 * Single responsibility: Wire UI generator into pipeline
 */

import { GenerationPhase, type PhaseContext, type PhaseResult } from '../phase-runner.js'

export class UiGenerationPhase extends GenerationPhase {
  readonly name = 'ui-generation'
  readonly order = 11  // After API generation (10)
  
  getDescription(): string {
    return 'Generating UI components and pages'
  }
  
  shouldRun(context: PhaseContext): boolean {
    // Skip if no models
    if (!context.schema || context.schema.models.length === 0) return false
    
    // Check if UI generation is enabled
    const uiConfig = (context.config as unknown as Record<string, unknown>).ui as { enabled?: boolean } | undefined
    return uiConfig?.enabled === true
  }
  
  async execute(context: PhaseContext): Promise<PhaseResult> {
    try {
      console.log('[ssot-codegen] UI generation not yet implemented in pipeline')
      
      return { success: true, filesGenerated: 0 }
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('UI generation failed')
      }
    }
  }
}


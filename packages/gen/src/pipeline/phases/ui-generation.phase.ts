/**
 * UI Generation Phase
 * 
 * Pipeline phase for generating UI components and pages
 * Single responsibility: Wire UI generator into pipeline
 */

import { GenerationPhase, type PhaseContext, type PhaseResult } from '../phase-runner.js'
import { generateUI, type UiGeneratorConfig } from '../../generators/ui/ui-generator.js'
import path from 'path'

export class UiGenerationPhase extends GenerationPhase {
  readonly name = 'ui-generation'
  readonly order = 11  // After API generation (10)
  
  getDescription(): string {
    return 'Generating UI components and pages'
  }
  
  /**
   * Execute phase
   * Pure: all effects isolated to return value
   */
  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { schema, config, logger } = context
    
    // Early return if UI generation disabled
    if (!config.generateUI) {
      logger.debug('UI generation disabled, skipping')
      return { success: true, skipped: true }
    }
    
    try {
      // Build config (single allocation)
      const uiConfig: UiGeneratorConfig = {
        outputDir: config.outputDir,
        generateComponents: config.generateComponents !== false,
        generatePages: config.generatePages !== false,
        models: config.uiModels  // Optional filter
      }
      
      // Generate (single pass)
      const result = generateUI(schema, uiConfig)
      
      // Log results
      logger.info(
        `Generated ${result.componentsGenerated} components, ${result.pagesGenerated} pages`
      )
      
      // Return files for writing
      return {
        success: true,
        files: result.files
      }
      
    } catch (error) {
      // Fail fast with context
      logger.error('UI generation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      }
    }
  }
  
  /**
   * Skip conditions (guard clauses, early return)
   */
  shouldSkip(context: PhaseContext): boolean {
    // Skip if no models
    if (context.schema.models.length === 0) return true
    
    // Skip if explicitly disabled
    if (context.config.generateUI === false) return true
    
    return false
  }
}


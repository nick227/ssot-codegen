/**
 * DTO Generation Phase - Generates Data Transfer Objects
 * Runs in legacy mode only (registry mode handles DTOs differently)
 */

import { DTOValidatorGenerator } from '../../builders/dto-validator-generator.js'
import {
  ErrorSeverity,
  PhaseStatus,
  type GenerationPhase,
  type PhaseResult,
  type IGenerationContext,
  type GenerationError
} from '../generation-types.js'

/**
 * Generates DTOs for all models
 * 
 * Responsibilities:
 * - Generate Create, Update, Read, Query DTOs
 * - Validate generated code
 * - Handle junction tables appropriately
 * 
 * Uses shared DTOValidatorGenerator to eliminate code duplication
 */
export class DTOGenerationPhase implements GenerationPhase {
  readonly name = 'dto-generation'
  readonly order = 3
  
  shouldExecute(context: IGenerationContext): boolean {
    // Skip in registry mode (DTOs handled by RegistryGenerationPhase)
    return !context.config.useRegistry
  }
  
  async execute(context: IGenerationContext): Promise<PhaseResult> {
    const errors: GenerationError[] = []
    let successCount = 0
    let skippedCount = 0
    
    for (const model of context.schema.models) {
      // Check if model should be skipped
      if (this.shouldSkipModel(model, context)) {
        skippedCount++
        continue
      }
      
      try {
        // Use shared generator (eliminates duplicate code)
        const success = DTOValidatorGenerator.generateForModel(
          model,
          context.filesBuilder
        )
        
        if (success) {
          successCount++
        } else {
          errors.push({
            severity: ErrorSeverity.ERROR,
            message: `Failed to generate DTOs for ${model.name}`,
            model: model.name,
            phase: this.name
          })
        }
      } catch (error) {
        errors.push({
          severity: ErrorSeverity.ERROR,
          message: `Error generating DTOs for ${model.name}`,
          model: model.name,
          phase: this.name,
          error: error as Error
        })
      }
    }
    
    console.log(`[ssot-codegen] Generated DTOs for ${successCount} models (${skippedCount} skipped)`)
    
    const success = errors.filter(e => 
      e.severity === ErrorSeverity.ERROR || e.severity === ErrorSeverity.FATAL
    ).length === 0
    
    return {
      success,
      status: success ? PhaseStatus.COMPLETED : PhaseStatus.FAILED,
      errors,
      data: { successCount, skippedCount }
    }
  }
  
  /**
   * Determine if model should be skipped
   * Skips models with validation errors or that failed analysis
   */
  private shouldSkipModel(model: any, context: IGenerationContext): boolean {
    // Skip if model has validation errors
    const hasValidationError = context.getErrors().some(e =>
      e.model === model.name &&
      (e.severity === ErrorSeverity.ERROR || e.severity === ErrorSeverity.FATAL)
    )
    
    if (hasValidationError) {
      return true
    }
    
    // Junction tables still get DTOs (useful for type system)
    // They just won't get controllers/routes/services
    return false
  }
  
  async rollback(context: IGenerationContext): Promise<void> {
    // Clear all DTO builders
    for (const model of context.schema.models) {
      const builder = context.filesBuilder.getDTOBuilder(model.name)
      builder.clear()
    }
  }
}


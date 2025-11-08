/**
 * Validation Phase - Validates models before processing
 * First phase in generation pipeline
 */

import type { ParsedModel } from '../../dmmf-parser.js'
import {
  ErrorSeverity,
  PhaseStatus,
  type GenerationPhase,
  type PhaseResult,
  type IGenerationContext,
  type GenerationError
} from '../generation-types.js'

/**
 * Validates model structure and required properties
 * 
 * Responsibilities:
 * - Validate model.name and model.nameLower exist
 * - Detect invalid model structures
 * - Filter out invalid models early
 * 
 * Benefits:
 * - Fail-fast on invalid models
 * - Prevents cryptic errors later in pipeline
 * - Clear error messages for schema issues
 */
export class ValidationPhase implements GenerationPhase {
  readonly name = 'validation'
  readonly order = 0
  
  shouldExecute(context: IGenerationContext): boolean {
    // Always validate
    return true
  }
  
  async execute(context: IGenerationContext): Promise<PhaseResult> {
    const errors: GenerationError[] = []
    
    for (const model of context.schema.models) {
      this.validateModel(model, errors)
    }
    
    const success = errors.length === 0
    
    return {
      success,
      status: success ? PhaseStatus.COMPLETED : PhaseStatus.FAILED,
      errors
    }
  }
  
  /**
   * Validate a single model
   */
  private validateModel(model: ParsedModel, errors: GenerationError[]): void {
    // Check required properties
    if (!model.name) {
      errors.push({
        severity: ErrorSeverity.ERROR,
        message: `Model missing required 'name' property`,
        model: 'unknown',
        phase: this.name,
        blocksGeneration: true
      })
      return
    }
    
    if (!model.nameLower) {
      errors.push({
        severity: ErrorSeverity.ERROR,
        message: `Model ${model.name} missing 'nameLower' property`,
        model: model.name,
        phase: this.name,
        blocksGeneration: true
      })
    }
    
    // Validate model has fields
    if (!model.fields || model.fields.length === 0) {
      errors.push({
        severity: ErrorSeverity.WARNING,
        message: `Model ${model.name} has no fields`,
        model: model.name,
        phase: this.name
      })
    }
    
    // Validate model has at least one scalar field
    const scalarFields = model.fields?.filter(f => f.kind === 'scalar') || []
    if (scalarFields.length === 0) {
      errors.push({
        severity: ErrorSeverity.WARNING,
        message: `Model ${model.name} has no scalar fields (relation-only model)`,
        model: model.name,
        phase: this.name
      })
    }
  }
}


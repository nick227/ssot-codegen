/**
 * Controller Generation Phase - Generates request handlers
 * Runs in legacy mode only
 */

import { toKebabCase } from '../../utils/naming.js'
import { generateController } from '../../generators/controller-generator.js'
import { generateBaseClassController } from '../../generators/controller-generator-base-class.js'
import { generateServiceController } from '../../generators/service-integration.generator.js'
import {
  ErrorSeverity,
  PhaseStatus,
  type GenerationPhase,
  type PhaseResult,
  type IGenerationContext,
  type GenerationError
} from '../generation-types.js'

/**
 * Generates controllers for all models
 * 
 * Responsibilities:
 * - Generate standard CRUD controllers
 * - Generate base class controllers (enhanced mode)
 * - Generate service integration controllers
 * - Skip junction tables
 */
export class ControllerGenerationPhase implements GenerationPhase {
  readonly name = 'controller-generation'
  readonly order = 6
  
  shouldExecute(context: IGenerationContext): boolean {
    // Skip in registry mode
    return !context.config.useRegistry
  }
  
  async execute(context: IGenerationContext): Promise<PhaseResult> {
    const errors: GenerationError[] = []
    let successCount = 0
    let skippedCount = 0
    
    for (const model of context.schema.models) {
      // Skip junction tables
      if (this.isJunctionTable(model, context)) {
        skippedCount++
        continue
      }
      
      // Skip models with validation errors
      if (this.hasValidationErrors(model, context)) {
        skippedCount++
        continue
      }
      
      try {
        // Check for service annotation
        if (context.cache.hasServiceAnnotation(model.name)) {
          this.generateServiceController(model, context, errors)
        } else {
          this.generateStandardController(model, context, errors)
        }
        
        successCount++
      } catch (error) {
        errors.push({
          severity: ErrorSeverity.ERROR,
          message: `Error generating controller for ${model.name}`,
          model: model.name,
          phase: this.name,
          error: error as Error
        })
      }
    }
    
    console.log(`[ssot-codegen] Generated controllers for ${successCount} models (${skippedCount} skipped)`)
    
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
   * Check if model is a junction table
   */
  private isJunctionTable(model: any, context: IGenerationContext): boolean {
    if (!context.config.useEnhanced) return false
    const analysis = context.cache.tryGetAnalysis(model.name)
    return analysis?.isJunctionTable ?? false
  }
  
  /**
   * Check if model has validation errors
   */
  private hasValidationErrors(model: any, context: IGenerationContext): boolean {
    return context.getErrors().some(e =>
      e.model === model.name &&
      (e.severity === ErrorSeverity.ERROR || e.severity === ErrorSeverity.FATAL)
    )
  }
  
  /**
   * Generate standard CRUD controller
   */
  private generateStandardController(
    model: any,
    context: IGenerationContext,
    errors: GenerationError[]
  ): void {
    const modelKebab = toKebabCase(model.name)
    const controllerPath = `${modelKebab}.controller.ts`
    
    let controller: string
    
    if (context.config.useEnhanced) {
      const analysis = context.cache.getAnalysis(model.name)
      controller = generateBaseClassController(
        model,
        context.schema,
        context.config.framework,
        analysis
      )
    } else {
      controller = generateController(model, context.config.framework)
    }
    
    const success = context.filesBuilder.getControllersBuilder().addFile(
      controllerPath,
      controller,
      model.name
    )
    
    if (!success) {
      errors.push({
        severity: ErrorSeverity.ERROR,
        message: `Failed to add controller file for ${model.name}`,
        model: model.name,
        phase: this.name
      })
    }
  }
  
  /**
   * Generate service integration controller
   */
  private generateServiceController(
    model: any,
    context: IGenerationContext,
    errors: GenerationError[]
  ): void {
    const annotation = context.cache.getServiceAnnotation(model.name)
    const controllerPath = `${annotation.name}.controller.ts`
    
    const controller = generateServiceController(annotation)
    
    const success = context.filesBuilder.getControllersBuilder().addFile(
      controllerPath,
      controller,
      annotation.name
    )
    
    if (!success) {
      errors.push({
        severity: ErrorSeverity.ERROR,
        message: `Failed to add service controller for ${annotation.name}`,
        model: model.name,
        phase: this.name
      })
    }
  }
  
  async rollback(context: IGenerationContext): Promise<void> {
    context.filesBuilder.getControllersBuilder().clear()
  }
}


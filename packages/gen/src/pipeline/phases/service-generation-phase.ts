/**
 * Service Generation Phase - Generates Prisma service layer
 * Runs in legacy mode only
 */

import { toKebabCase } from '../../utils/naming.js'
import { generateService } from '../../generators/service-generator.js'
import { generateEnhancedService } from '../../generators/service-generator-enhanced.js'
import { generateServiceController, generateServiceRoutes, generateServiceScaffold } from '../../generators/service-integration.generator.js'
import {
  ErrorSeverity,
  PhaseStatus,
  type GenerationPhase,
  type PhaseResult,
  type IGenerationContext,
  type GenerationError
} from '../generation-types.js'

/**
 * Generates service layer for all models
 * 
 * Responsibilities:
 * - Generate standard Prisma services
 * - Generate enhanced services with relationships
 * - Generate service integration scaffolds
 * - Skip junction tables
 * 
 * Handles both standard CRUD and @service annotated models
 */
export class ServiceGenerationPhase implements GenerationPhase {
  readonly name = 'service-generation'
  readonly order = 5
  
  shouldExecute(context: IGenerationContext): boolean {
    // Skip in registry mode
    return !context.config.useRegistry
  }
  
  async execute(context: IGenerationContext): Promise<PhaseResult> {
    const errors: GenerationError[] = []
    let successCount = 0
    let skippedCount = 0
    
    for (const model of context.schema.models) {
      // Skip junction tables (no services needed)
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
          this.generateServiceIntegration(model, context, errors)
        } else {
          this.generateStandardService(model, context, errors)
        }
        
        successCount++
      } catch (error) {
        errors.push({
          severity: ErrorSeverity.ERROR,
          message: `Error generating service for ${model.name}`,
          model: model.name,
          phase: this.name,
          error: error as Error
        })
      }
    }
    
    console.log(`[ssot-codegen] Generated services for ${successCount} models (${skippedCount} skipped)`)
    
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
   * Generate standard Prisma service
   */
  private generateStandardService(
    model: any,
    context: IGenerationContext,
    errors: GenerationError[]
  ): void {
    const modelKebab = toKebabCase(model.name)
    const servicePath = `${modelKebab}.service.ts`
    
    const service = context.config.useEnhanced
      ? generateEnhancedService(model, context.schema)
      : generateService(model, context.schema)
    
    const success = context.filesBuilder.getServicesBuilder().addFile(
      servicePath,
      service,
      model.name
    )
    
    if (!success) {
      errors.push({
        severity: ErrorSeverity.ERROR,
        message: `Failed to add service file for ${model.name}`,
        model: model.name,
        phase: this.name
      })
    }
  }
  
  /**
   * Generate service integration (for @service annotated models)
   */
  private generateServiceIntegration(
    model: any,
    context: IGenerationContext,
    errors: GenerationError[]
  ): void {
    const annotation = context.cache.getServiceAnnotation(model.name)
    
    console.log(`[ssot-codegen] Generating service integration: ${annotation.name} (methods: ${annotation.methods.length})`)
    
    const servicesBuilder = context.filesBuilder.getServicesBuilder()
    const scaffoldPath = `${annotation.name}.service.scaffold.ts`
    const scaffold = generateServiceScaffold(annotation)
    
    if (!servicesBuilder.addFile(scaffoldPath, scaffold, annotation.name)) {
      errors.push({
        severity: ErrorSeverity.ERROR,
        message: `Failed to add service scaffold for ${annotation.name}`,
        model: model.name,
        phase: this.name
      })
    }
    
    // Note: Controller and routes generated in separate phases
  }
  
  async rollback(context: IGenerationContext): Promise<void> {
    context.filesBuilder.getServicesBuilder().clear()
  }
}


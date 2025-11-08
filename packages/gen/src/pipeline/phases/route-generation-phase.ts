/**
 * Route Generation Phase - Generates Express/Fastify routes
 * Runs in legacy mode only
 */

import { toKebabCase } from '../../utils/naming.js'
import { generateRoutes } from '../../generators/route-generator.js'
import { generateEnhancedRoutes } from '../../generators/route-generator-enhanced.js'
import { generateServiceRoutes } from '../../generators/service-integration.generator.js'
import {
  ErrorSeverity,
  PhaseStatus,
  type GenerationPhase,
  type PhaseResult,
  type IGenerationContext,
  type GenerationError
} from '../generation-types.js'

/**
 * Generates routes for all models
 * 
 * Responsibilities:
 * - Generate standard CRUD routes
 * - Generate enhanced routes with relationships
 * - Generate service integration routes
 * - Skip junction tables
 * - Handle models without routes
 */
export class RouteGenerationPhase implements GenerationPhase {
  readonly name = 'route-generation'
  readonly order = 7
  
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
          this.generateServiceRoutes(model, context, errors)
        } else {
          this.generateStandardRoutes(model, context, errors)
        }
        
        successCount++
      } catch (error) {
        errors.push({
          severity: ErrorSeverity.ERROR,
          message: `Error generating routes for ${model.name}`,
          model: model.name,
          phase: this.name,
          error: error as Error
        })
      }
    }
    
    console.log(`[ssot-codegen] Generated routes for ${successCount} models (${skippedCount} skipped)`)
    
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
   * Generate standard CRUD routes
   */
  private generateStandardRoutes(
    model: any,
    context: IGenerationContext,
    errors: GenerationError[]
  ): void {
    const modelKebab = toKebabCase(model.name)
    const routesPath = `${modelKebab}.routes.ts`
    
    let routes: string | null
    
    if (context.config.useEnhanced) {
      const analysis = context.cache.getAnalysis(model.name)
      routes = generateEnhancedRoutes(
        model,
        context.schema,
        context.config.framework,
        analysis
      )
    } else {
      routes = generateRoutes(model, context.config.framework)
    }
    
    // Some models might not generate routes
    if (!routes) {
      return
    }
    
    const success = context.filesBuilder.getRoutesBuilder().addFile(
      routesPath,
      routes,
      model.name
    )
    
    if (!success) {
      errors.push({
        severity: ErrorSeverity.ERROR,
        message: `Failed to add routes file for ${model.name}`,
        model: model.name,
        phase: this.name
      })
    }
  }
  
  /**
   * Generate service integration routes
   */
  private generateServiceRoutes(
    model: any,
    context: IGenerationContext,
    errors: GenerationError[]
  ): void {
    const annotation = context.cache.getServiceAnnotation(model.name)
    const routesPath = `${annotation.name}.routes.ts`
    
    const routes = generateServiceRoutes(annotation)
    
    const success = context.filesBuilder.getRoutesBuilder().addFile(
      routesPath,
      routes,
      annotation.name
    )
    
    if (!success) {
      errors.push({
        severity: ErrorSeverity.ERROR,
        message: `Failed to add service routes for ${annotation.name}`,
        model: model.name,
        phase: this.name
      })
    }
  }
  
  async rollback(context: IGenerationContext): Promise<void> {
    context.filesBuilder.getRoutesBuilder().clear()
  }
}


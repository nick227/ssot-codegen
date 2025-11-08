/**
 * Registry Generation Phase - Generates unified registry architecture
 * Centralizes all CRUD operations in a single registry (78% less code)
 * 
 * v2.0: Uses shared RegistryModeGenerator for consistency with legacy mode
 */

import { generateRegistryMode, RegistryModeGenerator } from '../../generators/registry-mode-generator.js'
import {
  ErrorSeverity,
  PhaseStatus,
  type GenerationPhase,
  type PhaseResult,
  type IGenerationContext,
  type GenerationError
} from '../generation-types.js'

/**
 * Generates unified registry instead of individual controllers/routes/services
 * 
 * Responsibilities:
 * - Generate unified registry system (single file for all CRUD)
 * - Generate DTOs and validators (still needed for types)
 * - Generate service integrations (for @service annotated models)
 * - Centralize logic (78% code reduction vs individual files)
 * 
 * Benefits:
 * - Single source of truth for all CRUD operations
 * - Easier to maintain (one file vs dozens)
 * - Consistent error handling across all endpoints
 * - Better performance (shared middleware, caching)
 * - Type-safe throughout
 * 
 * Note: This phase REPLACES:
 * - ServiceGenerationPhase
 * - ControllerGenerationPhase
 * - RouteGenerationPhase
 */
export class RegistryGenerationPhase implements GenerationPhase {
  readonly name = 'registry-generation'
  readonly order = 4  // Runs instead of separate DTO/Service/Controller/Route phases
  
  shouldExecute(context: IGenerationContext): boolean {
    // Only run in registry mode
    return context.config.useRegistry
  }
  
  async execute(context: IGenerationContext): Promise<PhaseResult> {
    const errors: GenerationError[] = []
    
    try {
      // v2.0: Use shared RegistryModeGenerator (eliminates ~200 lines of duplicate code)
      console.log('[ssot-codegen] Generating unified registry system...')
      
      const result = generateRegistryMode(
        context.schema,
        context.cache,
        context.cache.serviceAnnotations,
        {
          validateCode: false,  // Builder handles validation
          skipJunctionTables: true,
          includeServiceIntegrations: true
        }
      )
      
      // Add registry files to builder
      const registryBuilder = context.filesBuilder.getRegistryBuilder()
      for (const [filename, content] of result.registry) {
        registryBuilder.addFile(filename, content)
      }
      
      // Add DTOs to builder
      const dtoBuilder = context.filesBuilder.getDTOBuilder()
      for (const [modelName, dtoMap] of result.contracts) {
        for (const [filename, content] of dtoMap) {
          dtoBuilder.addFile(filename, content, modelName)
        }
      }
      
      // Add validators to builder
      const validatorBuilder = context.filesBuilder.getValidatorBuilder()
      for (const [modelName, validatorMap] of result.validators) {
        for (const [filename, content] of validatorMap) {
          validatorBuilder.addFile(filename, content, modelName)
        }
      }
      
      // Add service integrations to builders
      const controllerBuilder = context.filesBuilder.getControllerBuilder()
      for (const [filename, content] of result.serviceControllers) {
        controllerBuilder.addFile(filename, content)
      }
      
      const routeBuilder = context.filesBuilder.getRouteBuilder()
      for (const [filename, content] of result.serviceRoutes) {
        routeBuilder.addFile(filename, content)
      }
      
      const serviceBuilder = context.filesBuilder.getServiceBuilder()
      for (const [filename, content] of result.serviceScaffolds) {
        serviceBuilder.addFile(filename, content)
      }
      
      // Convert generation errors to phase errors
      for (const err of result.errors) {
        errors.push({
          severity: ErrorSeverity.ERROR,
          message: err.message,
          model: err.model,
          phase: this.name,
          error: err.error
        })
      }
      
      console.log(`[ssot-codegen] Registry mode: ${result.modelsProcessed} models, ${result.serviceIntegrations} service integration(s)`)
      
      // Summary
      console.log('[ssot-codegen] Registry generation summary:')
      console.log(`  - Registry files: ${result.registry.size}`)
      console.log(`  - DTOs/Validators: ${result.modelsProcessed} models`)
      console.log(`  - Service integrations: ${result.serviceIntegrations}`)
      
      const success = errors.filter(e => 
        e.severity === ErrorSeverity.ERROR || e.severity === ErrorSeverity.FATAL
      ).length === 0
      
      return {
        success,
        status: success ? PhaseStatus.COMPLETED : PhaseStatus.FAILED,
        errors,
        data: {
          registryFiles: result.registry.size,
          dtoCount: result.modelsProcessed,
          serviceIntegrationCount: result.serviceIntegrations
        }
      }
    } catch (error) {
      errors.push({
        severity: ErrorSeverity.FATAL,
        message: 'Fatal error during registry generation',
        phase: this.name,
        error: error as Error
      })
      
      return {
        success: false,
        status: PhaseStatus.FAILED,
        errors
      }
    }
  }
  
  async rollback(context: IGenerationContext): Promise<void> {
    // Clear registry and service integration files
    context.filesBuilder.getRegistryBuilder().clear()
    context.filesBuilder.getControllersBuilder().clear()
    context.filesBuilder.getRoutesBuilder().clear()
    context.filesBuilder.getServicesBuilder().clear()
    
    // Clear DTOs and validators
    for (const model of context.schema.models) {
      const dtoBuilder = context.filesBuilder.getDTOBuilder(model.name)
      const validatorBuilder = context.filesBuilder.getValidatorBuilder(model.name)
      dtoBuilder.clear()
      validatorBuilder.clear()
    }
  }
}


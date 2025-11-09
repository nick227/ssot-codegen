/**
 * Registry Mode Generator - Shared logic for registry mode generation
 * 
 * CONSOLIDATION: Eliminates duplicate logic between legacy and pipeline modes.
 * Both code paths now use the same implementation for consistency.
 * 
 * Registry Mode Features:
 * - Single unified registry file (vs individual controllers/routes)
 * - 78% less code than individual file mode
 * - Centralized error handling
 * - Shared middleware and caching
 */

import { generateRegistrySystem } from './registry-generator.js'
import { generateAllDTOs } from './dto-generator.js'
import { generateAllValidators } from './validator-generator.js'
import { generateServiceController, generateServiceRoutes, generateServiceScaffold } from './service-integration.generator.js'
import { toKebabCase } from '@/utils/naming.js'
import type { ParsedSchema, ParsedModel } from '../dmmf-parser.js'
import type { UnifiedModelAnalysis } from '../analyzers/unified-analyzer/index.js'
import type { ServiceAnnotation } from '../service-linker.js'
import type { GeneratedFiles } from '../pipeline/types.js'

/**
 * Registry mode generation result
 */
export interface RegistryGenerationResult {
  registry: Map<string, string>
  contracts: Map<string, Map<string, string>>
  validators: Map<string, Map<string, string>>
  serviceControllers: Map<string, string>
  serviceRoutes: Map<string, string>
  serviceScaffolds: Map<string, string>
  modelsProcessed: number
  serviceIntegrations: number
  errors: Array<{ model?: string; message: string; error?: Error }>
}

/**
 * Options for registry generation
 */
export interface RegistryGenerationOptions {
  validateCode?: boolean  // Validate generated code (default: true)
  skipJunctionTables?: boolean  // Skip junction tables (default: true)
  includeServiceIntegrations?: boolean  // Generate service integrations (default: true)
}

/**
 * Code validation function type
 */
export type CodeValidator = (code: string, filename: string) => boolean

/**
 * Shared registry mode generator
 * 
 * Used by both legacy mode and pipeline mode for consistency.
 * Eliminates ~200 lines of duplicate code.
 */
export class RegistryModeGenerator {
  constructor(
    private readonly schema: ParsedSchema,
    private readonly modelAnalysis: Map<string, UnifiedModelAnalysis>,
    private readonly serviceAnnotations: Map<string, ServiceAnnotation>,
    private readonly options: RegistryGenerationOptions = {},
    private readonly codeValidator?: CodeValidator
  ) {
    // Set defaults
    this.options.validateCode = this.options.validateCode ?? true
    this.options.skipJunctionTables = this.options.skipJunctionTables ?? true
    this.options.includeServiceIntegrations = this.options.includeServiceIntegrations ?? true
  }
  
  /**
   * Generate all registry mode files
   */
  generate(): RegistryGenerationResult {
    const result: RegistryGenerationResult = {
      registry: new Map(),
      contracts: new Map(),
      validators: new Map(),
      serviceControllers: new Map(),
      serviceRoutes: new Map(),
      serviceScaffolds: new Map(),
      modelsProcessed: 0,
      serviceIntegrations: 0,
      errors: []
    }
    
    try {
      // Step 1: Generate unified registry system
      result.registry = generateRegistrySystem(this.schema, this.modelAnalysis)
      console.log(`[ssot-codegen] Generated unified registry with ${result.registry.size} file(s)`)
      
      // Step 2: Generate DTOs and validators for each model
      for (const model of this.schema.models) {
        // Skip junction tables if configured
        if (this.options.skipJunctionTables && this.isJunctionTable(model)) {
          console.log(`[ssot-codegen] Skipping junction table: ${model.name}`)
          continue
        }
        
        try {
          this.generateModelFiles(model, result)
          result.modelsProcessed++
        } catch (error) {
          result.errors.push({
            model: model.name,
            message: `Error generating files for ${model.name}`,
            error: error as Error
          })
        }
      }
      
      console.log(`[ssot-codegen] Generated DTOs/validators for ${result.modelsProcessed} models`)
      
      // Step 3: Generate service integrations if enabled
      if (this.options.includeServiceIntegrations) {
        for (const [modelName, annotation] of this.serviceAnnotations) {
          try {
            this.generateServiceIntegration(annotation, result)
            result.serviceIntegrations++
          } catch (error) {
            result.errors.push({
              model: modelName,
              message: `Error generating service integration for ${annotation.name}`,
              error: error as Error
            })
          }
        }
        
        if (result.serviceIntegrations > 0) {
          console.log(`[ssot-codegen] Generated ${result.serviceIntegrations} service integration(s)`)
        }
      }
      
    } catch (error) {
      result.errors.push({
        message: 'Fatal error in registry generation',
        error: error as Error
      })
    }
    
    return result
  }
  
  /**
   * Generate DTO and validator files for a single model
   */
  private generateModelFiles(
    model: ParsedModel,
    result: RegistryGenerationResult
  ): void {
    const modelKebab = toKebabCase(model.name)
    
    // Generate DTOs
    const dtos = generateAllDTOs(model)
    const dtoMap = new Map<string, string>()
    
    // Add DTOs with optional validation
    this.addFileIfValid(dtoMap, `${modelKebab}.create.dto.ts`, dtos.create)
    this.addFileIfValid(dtoMap, `${modelKebab}.update.dto.ts`, dtos.update)
    this.addFileIfValid(dtoMap, `${modelKebab}.read.dto.ts`, dtos.read)
    this.addFileIfValid(dtoMap, `${modelKebab}.query.dto.ts`, dtos.query)
    
    if (dtoMap.size > 0) {
      result.contracts.set(model.name, dtoMap)
    }
    
    // Generate Validators
    const validators = generateAllValidators(model)
    const validatorMap = new Map<string, string>()
    
    // Add validators with optional validation
    this.addFileIfValid(validatorMap, `${modelKebab}.create.zod.ts`, validators.create)
    this.addFileIfValid(validatorMap, `${modelKebab}.update.zod.ts`, validators.update)
    this.addFileIfValid(validatorMap, `${modelKebab}.query.zod.ts`, validators.query)
    
    if (validatorMap.size > 0) {
      result.validators.set(model.name, validatorMap)
    }
  }
  
  /**
   * Generate service integration files for @service annotated models
   */
  private generateServiceIntegration(
    annotation: ServiceAnnotation,
    result: RegistryGenerationResult
  ): void {
    const controllerPath = `${annotation.name}.controller.ts`
    const routesPath = `${annotation.name}.routes.ts`
    const scaffoldPath = `${annotation.name}.service.scaffold.ts`
    
    // Generate controller
    const controller = generateServiceController(annotation)
    if (this.isCodeValid(controller, controllerPath)) {
      result.serviceControllers.set(controllerPath, controller)
    }
    
    // Generate routes
    const routes = generateServiceRoutes(annotation)
    if (this.isCodeValid(routes, routesPath)) {
      result.serviceRoutes.set(routesPath, routes)
    }
    
    // Generate scaffold
    const scaffold = generateServiceScaffold(annotation)
    if (this.isCodeValid(scaffold, scaffoldPath)) {
      result.serviceScaffolds.set(scaffoldPath, scaffold)
    }
    
    console.log(`[ssot-codegen] [Registry] Generated service integration: ${annotation.name}`)
  }
  
  /**
   * Add file to map if code is valid
   */
  private addFileIfValid(
    map: Map<string, string>,
    filename: string,
    code: string
  ): void {
    if (this.isCodeValid(code, filename)) {
      map.set(filename, code)
    }
  }
  
  /**
   * Check if code is valid
   */
  private isCodeValid(code: string, filename: string): boolean {
    if (!this.options.validateCode) {
      return true
    }
    
    if (this.codeValidator) {
      const result = this.codeValidator(code, filename)
      return typeof result === 'boolean' ? result : Boolean(result)
    }
    
    // Basic validation: non-empty
    return Boolean(code && code.trim().length > 0)
  }
  
  /**
   * Check if model is a junction table
   */
  private isJunctionTable(model: ParsedModel): boolean {
    const analysis = this.modelAnalysis.get(model.name)
    return analysis?.isJunctionTable ?? false
  }
  
  /**
   * Merge result into GeneratedFiles structure
   */
  static mergeIntoGeneratedFiles(
    result: RegistryGenerationResult,
    files: GeneratedFiles
  ): void {
    // Merge registry
    if (result.registry.size > 0) {
      files.registry = result.registry
    }
    
    // Merge contracts
    for (const [modelName, dtoMap] of result.contracts) {
      files.contracts.set(modelName, dtoMap)
    }
    
    // Merge validators
    for (const [modelName, validatorMap] of result.validators) {
      files.validators.set(modelName, validatorMap)
    }
    
    // Merge service integrations
    for (const [path, content] of result.serviceControllers) {
      files.controllers.set(path, content)
    }
    for (const [path, content] of result.serviceRoutes) {
      files.routes.set(path, content)
    }
    for (const [path, content] of result.serviceScaffolds) {
      files.services.set(path, content)
    }
  }
}

/**
 * Convenience function to generate registry mode files
 */
export function generateRegistryMode(
  schema: ParsedSchema,
  modelAnalysis: Map<string, UnifiedModelAnalysis>,
  serviceAnnotations: Map<string, ServiceAnnotation>,
  options?: RegistryGenerationOptions,
  codeValidator?: CodeValidator
): RegistryGenerationResult {
  const generator = new RegistryModeGenerator(
    schema,
    modelAnalysis,
    serviceAnnotations,
    options,
    codeValidator
  )
  return generator.generate()
}


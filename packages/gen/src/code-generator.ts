/**
 * Code Generator - Main orchestrator for generating all code files
 * 
 * Uses the parsed DMMF to generate:
 * - DTOs (contracts)
 * - Validators (Zod schemas)
 * - Services (Prisma queries)
 * - Controllers (request handlers)
 * - Routes (Express/Fastify routers)
 */

import type { ParsedSchema, ParsedModel } from './dmmf-parser.js'
import { toKebabCase } from '@/utils/naming.js'
import { generateAllDTOs } from '@/generators/dto-generator.js'
import { generateAllValidators } from '@/generators/validator-generator.js'
import { generateService } from '@/generators/service-generator.js'
import { generateController } from '@/generators/controller-generator.js'
import { generateRoutes } from '@/generators/route-generator.js'
// Enhanced generators with relationships, domain logic, and better logging
import { generateEnhancedService } from '@/generators/service-generator-enhanced.js'
import { generateEnhancedController } from '@/generators/controller-generator-enhanced.js'
import { generateBaseClassController } from '@/generators/controller-generator-base-class.js'
import { generateEnhancedRoutes, shouldGenerateRoutes } from '@/generators/route-generator-enhanced.js'
// Service integration for complex workflows (AI agents, file uploads, etc.)
import { parseServiceAnnotation, getServiceExportName, type ServiceAnnotation } from './service-linker.js'
import { generateServiceController, generateServiceRoutes, generateServiceScaffold } from '@/generators/service-integration.generator.js'
// SDK generation for frontend clients
import { generateModelSDK, generateMainSDK, generateSDKVersion } from '@/generators/sdk-generator.js'
import { generateServiceSDK, generateMainSDKWithServices } from '@/generators/sdk-service-generator.js'
import { generateSDKReadme, generateAPIReference, generateSDKArchitecture, generateQuickStart, generateSDKTypes } from '@/generators/sdk-docs-generator.js'
// Framework hooks generation (React, Vue, etc.)
import { generateAllHooks } from '@/generators/hooks/index.js'
// OPTIMIZATION: Pre-analysis utilities (UNIFIED - combines relationship + capability analysis)
import { analyzeModelUnified, type UnifiedModelAnalysis } from '@/analyzers/unified-analyzer.js'
// Legacy import for backwards compatibility (will be removed)
import { type ModelAnalysis } from '@/utils/relationship-analyzer.js'
// Registry-based architecture (78% less code)
import { generateRegistrySystem } from '@/generators/registry-generator.js'
// System health check dashboard
import { generateChecklistSystem } from '@/generators/checklist-generator.js'
// Feature plugins system
import { PluginManager } from '@/plugins/plugin-manager.js'

export interface CodeGeneratorConfig {
  framework: 'express' | 'fastify'
  useEnhancedGenerators?: boolean  // Use enhanced generators with relationships and domain logic
  useRegistry?: boolean  // Use registry-based architecture (78% less code)
  projectName?: string  // Project name for display
  generateChecklist?: boolean  // Generate system health check dashboard (default: true)
  autoOpenChecklist?: boolean  // Auto-open checklist in browser (default: false)
  schemaHash?: string  // Schema hash for version checking
  toolVersion?: string  // Tool version
  hookFrameworks?: Array<'react' | 'vue' | 'angular' | 'zustand' | 'vanilla'>  // Framework hooks to generate
  strictPluginValidation?: boolean  // Fail on plugin validation errors (default: false)
  
  // NEW: Feature plugins
  features?: {
    googleAuth?: {
      enabled: boolean
      clientId?: string
      clientSecret?: string
      callbackURL?: string
      strategy?: 'jwt' | 'session'
      userModel?: string
    }
  }
}

// GeneratedFiles type moved to pipeline/types.ts to break circular dependency
import type { GeneratedFiles } from '@/pipeline/types.js'
export type { GeneratedFiles } from '@/pipeline/types.js'

/**
 * Analysis cache for optimization
 * OPTIMIZATION: Pre-analyze all models once instead of analyzing per-generator
 */
interface AnalysisCache {
  modelAnalysis: Map<string, UnifiedModelAnalysis>  // UPDATED: Now uses UnifiedModelAnalysis
  serviceAnnotations: Map<string, ServiceAnnotation>
}

/**
 * Generate all code files from parsed schema
 * OPTIMIZED: Pre-analyze all models once for 60% performance improvement
 */
export function generateCode(
  schema: ParsedSchema,
  config: CodeGeneratorConfig
): GeneratedFiles {
  const framework = config.framework || 'express'
  const useEnhanced = config.useEnhancedGenerators ?? true
  
  const files: GeneratedFiles = {
    contracts: new Map(),
    validators: new Map(),
    services: new Map(),
    controllers: new Map(),
    routes: new Map(),
    sdk: new Map(),
    registry: undefined,
    plugins: new Map(),
    pluginOutputs: new Map(),
    hooks: {
      core: new Map()
    }
  }
  
  const generatedPaths = new Set<string>()  // Track generated file paths to detect duplicates
  let hasErrors = false
  
  // PHASE 1: Pre-analyze all models ONCE (O(n) instead of O(n×5))
  const cache: AnalysisCache = {
    modelAnalysis: new Map(),
    serviceAnnotations: new Map()
  }
  
  try {
    for (const model of schema.models) {
      // UNIFIED ANALYSIS: Analyze relationships, special fields, and capabilities ONCE
      if (useEnhanced) {
        cache.modelAnalysis.set(model.name, analyzeModelUnified(model, schema))
      }
      
      // Parse service annotations once
      const serviceAnnotation = parseServiceAnnotation(model)
      if (serviceAnnotation) {
        cache.serviceAnnotations.set(model.name, serviceAnnotation)
      }
    }
  } catch (error) {
    console.error('[ssot-codegen] Error during model analysis:', error)
    hasErrors = true
    throw error
  }
  
  // REGISTRY MODE: Generate unified registry instead of individual files
  if (config.useRegistry) {
    try {
      files.registry = generateRegistrySystem(schema, cache.modelAnalysis)
      
      // Generate DTOs and validators in registry mode
      for (const model of schema.models) {
        const modelKebab = toKebabCase(model.name)
        
        try {
          // Generate DTOs
          const dtos = generateAllDTOs(model)
          const dtoMap = new Map<string, string>()
          dtoMap.set(`${modelKebab}.create.dto.ts`, dtos.create)
          dtoMap.set(`${modelKebab}.update.dto.ts`, dtos.update)
          dtoMap.set(`${modelKebab}.read.dto.ts`, dtos.read)
          dtoMap.set(`${modelKebab}.query.dto.ts`, dtos.query)
          files.contracts.set(model.name, dtoMap)
          
          // Generate validators (needed for request validation)
          const validators = generateAllValidators(model)
          const validatorMap = new Map<string, string>()
          validatorMap.set(`${modelKebab}.create.zod.ts`, validators.create)
          validatorMap.set(`${modelKebab}.update.zod.ts`, validators.update)
          validatorMap.set(`${modelKebab}.query.zod.ts`, validators.query)
          files.validators.set(model.name, validatorMap)
        } catch (error) {
          console.error(`[ssot-codegen] Error generating DTOs/validators for ${model.name}:`, error)
          hasErrors = true
        }
      }
      
      // Generate SDK and hooks
      try {
        generateSDKClients(schema, files, cache, generatedPaths)
        const hookFrameworks = config.hookFrameworks || ['react']
        const hooks = generateAllHooks(schema, { frameworks: hookFrameworks }, cache.modelAnalysis)
        files.hooks = hooks
      } catch (error) {
        console.error('[ssot-codegen] Error generating SDK/hooks:', error)
        hasErrors = true
      }
      
      // Generate System Checklist (only if no errors)
      if (!hasErrors && config.generateChecklist !== false) {
        try {
          const checklist = generateChecklistSystem(schema, files, {
            projectName: config.projectName || 'Generated Project',
            useRegistry: true,
            framework,
            autoOpen: config.autoOpenChecklist || false,
            includeEnvironmentChecks: true,
            includeCodeValidation: true,
            includeAPITesting: true,
            includePerformanceMetrics: true
          })
          files.checklist = checklist
        } catch (error) {
          console.error('[ssot-codegen] Error generating checklist:', error)
        }
      }
      
      return files
    } catch (error) {
      console.error('[ssot-codegen] Error in registry mode generation:', error)
      throw error
    }
  }
  
  // LEGACY MODE: Generate individual files for each model
  // PHASE 2: Generate code using cached analysis (O(n) with no repeated work)
  try {
    for (const model of schema.models) {
      try {
        generateModelCode(model, config, files, schema, cache, generatedPaths)
      } catch (error) {
        console.error(`[ssot-codegen] Error generating code for model ${model.name}:`, error)
        hasErrors = true
      }
    }
  } catch (error) {
    console.error('[ssot-codegen] Error in model code generation phase:', error)
    hasErrors = true
  }
  
  // PHASE 3: Generate SDK clients (after all models are processed)
  try {
    generateSDKClients(schema, files, cache, generatedPaths)
  } catch (error) {
    console.error('[ssot-codegen] Error generating SDK clients:', error)
    hasErrors = true
  }
  
  // PHASE 4: Generate framework hooks
  try {
    const hookFrameworks = config.hookFrameworks || ['react']
    const hooks = generateAllHooks(schema, { frameworks: hookFrameworks }, cache.modelAnalysis)
    files.hooks = hooks
  } catch (error) {
    console.error('[ssot-codegen] Error generating hooks:', error)
    hasErrors = true
  }
  
  // PHASE 5: Generate Feature Plugins
  let pluginManager: PluginManager | undefined
  if (config.features) {
    try {
      pluginManager = new PluginManager({
        schema,
        projectName: config.projectName || 'Generated Project',
        framework,
        outputDir: '',
        features: config.features
      })
      
      // Validate all plugins
      const validations = pluginManager.validateAll()
      const pluginErrors = Array.from(validations.values()).some(v => !v.valid)
      
      if (pluginErrors) {
        const message = '⚠️  Some plugins have validation errors. Check warnings above.'
        if (config.strictPluginValidation) {
          throw new Error(message)
        }
        console.warn(`\n${message}`)
        hasErrors = true
      }
      
      // Generate plugin code
      const pluginOutputs = pluginManager.generateAll()
      
      // Add plugin files to generated files
      for (const [pluginName, output] of pluginOutputs) {
        files.plugins!.set(pluginName, output.files)
      }
      
      // Store plugin outputs for env vars and package.json merging
      files.pluginOutputs = pluginOutputs
    } catch (error) {
      console.error('[ssot-codegen] Error generating plugins:', error)
      hasErrors = true
      if (config.strictPluginValidation) {
        throw error
      }
    }
  }
  
  // PHASE 6: Generate System Checklist (only if no critical errors)
  if (!hasErrors && config.generateChecklist !== false) {
    try {
      // Collect plugin health checks
      const pluginHealthChecks = new Map<string, any>()
      if (pluginManager) {
        for (const [pluginName, plugin] of pluginManager.getPlugins()) {
          if (plugin.healthCheck) {
            try {
              const healthCheck = plugin.healthCheck({
                schema,
                projectName: config.projectName || 'Generated Project',
                framework,
                outputDir: '',
                config: config.features || {}
              })
              pluginHealthChecks.set(pluginName, healthCheck)
            } catch (error) {
              console.error(`[ssot-codegen] Error getting health check for plugin ${pluginName}:`, error)
            }
          }
        }
      }
      
      const checklist = generateChecklistSystem(schema, files, {
        projectName: config.projectName || 'Generated Project',
        useRegistry: config.useRegistry || false,
        framework,
        autoOpen: config.autoOpenChecklist || false,
        includeEnvironmentChecks: true,
        includeCodeValidation: true,
        includeAPITesting: true,
        includePerformanceMetrics: true,
        pluginHealthChecks
      })
      files.checklist = checklist
    } catch (error) {
      console.error('[ssot-codegen] Error generating checklist:', error)
    }
  }
  
  return files
}

/**
 * Generate code for a single model
 * OPTIMIZED: Uses cached analysis instead of re-analyzing
 */
function generateModelCode(
  model: ParsedModel,
  config: CodeGeneratorConfig,
  files: GeneratedFiles,
  schema: ParsedSchema,
  cache: AnalysisCache,
  generatedPaths: Set<string>
): void {
  const modelKebab = toKebabCase(model.name)
  const useEnhanced = config.useEnhancedGenerators ?? true
  const framework = config.framework || 'express'
  
  // Get cached service annotation and analysis
  const serviceAnnotation = cache.serviceAnnotations.get(model.name)
  const analysis = useEnhanced ? cache.modelAnalysis.get(model.name) : undefined
  
  // Validate that analysis exists when enhanced mode is enabled
  if (useEnhanced && !analysis) {
    console.warn(`[ssot-codegen] Missing analysis for model ${model.name}, skipping enhanced generation`)
    return
  }
  
  // Check if this is a junction table (skip generating full CRUD for many-to-many join tables)
  const isJunction = useEnhanced && analysis?.isJunctionTable
  
  if (isJunction) {
    // Junction tables only get DTOs and validators (no controllers/routes/services)
    // This prevents creating redundant endpoints for tables that should be managed through their parent models
    const dtos = generateAllDTOs(model)
    const dtoMap = new Map<string, string>()
    dtoMap.set(`${modelKebab}.create.dto.ts`, dtos.create)
    dtoMap.set(`${modelKebab}.update.dto.ts`, dtos.update)
    dtoMap.set(`${modelKebab}.read.dto.ts`, dtos.read)
    dtoMap.set(`${modelKebab}.query.dto.ts`, dtos.query)
    files.contracts.set(model.name, dtoMap)
    
    const validators = generateAllValidators(model)
    const validatorMap = new Map<string, string>()
    validatorMap.set(`${modelKebab}.create.zod.ts`, validators.create)
    validatorMap.set(`${modelKebab}.update.zod.ts`, validators.update)
    validatorMap.set(`${modelKebab}.query.zod.ts`, validators.query)
    files.validators.set(model.name, validatorMap)
    
    return
  }
  
  // Generate DTOs
  const dtos = generateAllDTOs(model)
  const dtoMap = new Map<string, string>()
  dtoMap.set(`${modelKebab}.create.dto.ts`, dtos.create)
  dtoMap.set(`${modelKebab}.update.dto.ts`, dtos.update)
  dtoMap.set(`${modelKebab}.read.dto.ts`, dtos.read)
  dtoMap.set(`${modelKebab}.query.dto.ts`, dtos.query)
  files.contracts.set(model.name, dtoMap)
  
  // Generate Validators
  const validators = generateAllValidators(model)
  const validatorMap = new Map<string, string>()
  validatorMap.set(`${modelKebab}.create.zod.ts`, validators.create)
  validatorMap.set(`${modelKebab}.update.zod.ts`, validators.update)
  validatorMap.set(`${modelKebab}.query.zod.ts`, validators.query)
  files.validators.set(model.name, validatorMap)
  
  // Generate Service
  const servicePath = `${modelKebab}.service.ts`
  checkPathDuplication(servicePath, generatedPaths, model.name)
  const service = useEnhanced && analysis
    ? generateEnhancedService(model, schema)
    : generateService(model, schema)
  files.services.set(servicePath, service)
  
  // If this model has @service annotation, generate service integration
  if (serviceAnnotation) {
    console.log(`[ssot-codegen] Generating service integration for: ${serviceAnnotation.name} (methods: ${serviceAnnotation.methods.join(', ')})`)
    
    // Generate service integration files
    const serviceControllerPath = `${serviceAnnotation.name}.controller.ts`
    const serviceRoutesPath = `${serviceAnnotation.name}.routes.ts`
    const scaffoldPath = `${serviceAnnotation.name}.service.scaffold.ts`
    
    checkPathDuplication(serviceControllerPath, generatedPaths, serviceAnnotation.name)
    checkPathDuplication(serviceRoutesPath, generatedPaths, serviceAnnotation.name)
    checkPathDuplication(scaffoldPath, generatedPaths, serviceAnnotation.name)
    
    const serviceController = generateServiceController(serviceAnnotation)
    files.controllers.set(serviceControllerPath, serviceController)
    
    const serviceRoutes = generateServiceRoutes(serviceAnnotation)
    files.routes.set(serviceRoutesPath, serviceRoutes)
    
    const scaffold = generateServiceScaffold(serviceAnnotation)
    files.services.set(scaffoldPath, scaffold)
    
    // NOTE: Still generate SDK for service-annotated models (needed for frontend integration)
    // SDK generation happens in generateSDKClients phase
    return
  }
  
  // Generate Controller
  const controllerPath = `${modelKebab}.controller.ts`
  checkPathDuplication(controllerPath, generatedPaths, model.name)
  const controller = useEnhanced && analysis
    ? generateBaseClassController(model, schema, framework, analysis)
    : generateController(model, framework)
  files.controllers.set(controllerPath, controller)
  
  // Generate Routes
  const routesPath = `${modelKebab}.routes.ts`
  const routes = useEnhanced && analysis
    ? generateEnhancedRoutes(model, schema, framework, analysis)
    : generateRoutes(model, framework)
    
  if (routes) {
    checkPathDuplication(routesPath, generatedPaths, model.name)
    files.routes.set(routesPath, routes)
  }
}

/**
 * Check for duplicate file paths and warn if found
 */
function checkPathDuplication(path: string, generatedPaths: Set<string>, modelName: string): void {
  if (generatedPaths.has(path)) {
    console.warn(`[ssot-codegen] Duplicate file path detected: ${path} (model: ${modelName})`)
  }
  generatedPaths.add(path)
}

/**
 * Generate SDK clients for all models and services
 */
function generateSDKClients(
  schema: ParsedSchema,
  files: GeneratedFiles,
  cache: AnalysisCache,
  generatedPaths: Set<string>
): void {
  const modelClients: Array<{ name: string; className: string }> = []
  const serviceClients: Array<{ name: string; className: string; annotation: ServiceAnnotation }> = []
  
  // Generate model clients (skip junction tables, include service-annotated models for SDK)
  for (const model of schema.models) {
    const analysis = cache.modelAnalysis.get(model.name)
    const serviceAnnotation = cache.serviceAnnotations.get(model.name)
    
    // Skip junction tables (they shouldn't have direct SDK access)
    if (analysis?.isJunctionTable) continue
    
    try {
      const modelClient = generateModelSDK(model, schema)
      const sdkPath = `models/${model.name.toLowerCase()}.client.ts`
      checkPathDuplication(sdkPath, generatedPaths, model.name)
      files.sdk.set(sdkPath, modelClient)
      
      modelClients.push({
        name: model.name.toLowerCase(),
        className: `${model.name}Client`
      })
    } catch (error) {
      console.error(`[ssot-codegen] Error generating SDK for model ${model.name}:`, error)
    }
  }
  
  // Generate service integration clients
  for (const [modelName, serviceAnnotation] of cache.serviceAnnotations) {
    try {
      const serviceClient = generateServiceSDK(serviceAnnotation)
      const sdkPath = `services/${serviceAnnotation.name}.client.ts`
      checkPathDuplication(sdkPath, generatedPaths, serviceAnnotation.name)
      files.sdk.set(sdkPath, serviceClient)
      
      // Transform service name to proper class name
      const className = toServiceClassName(serviceAnnotation.name)
      
      serviceClients.push({
        name: serviceAnnotation.name,
        className,
        annotation: serviceAnnotation
      })
    } catch (error) {
      console.error(`[ssot-codegen] Error generating SDK for service ${serviceAnnotation.name}:`, error)
    }
  }
  
  // Generate main SDK factory with both model and service clients
  try {
    const mainSDK = serviceClients.length > 0
      ? generateMainSDKWithServices(modelClients, serviceClients)
      : generateMainSDK(schema.models, schema)
    files.sdk.set('index.ts', mainSDK)
  } catch (error) {
    console.error('[ssot-codegen] Error generating main SDK:', error)
  }
  
  // Generate version file
  // NOTE: Placeholder values will be replaced by manifest phase during file writing
  // If manifest phase doesn't run, these placeholders indicate missing version info
  try {
    const versionFile = generateSDKVersion('__SCHEMA_HASH_PLACEHOLDER__', '__VERSION_PLACEHOLDER__')
    files.sdk.set('version.ts', versionFile)
  } catch (error) {
    console.error('[ssot-codegen] Error generating SDK version file:', error)
  }
  
  // Generate SDK documentation files
  try {
    files.sdk.set('README.md', generateSDKReadme(schema.models, schema))
    files.sdk.set('API-REFERENCE.md', generateAPIReference(schema.models, schema))
    files.sdk.set('ARCHITECTURE.md', generateSDKArchitecture())
    files.sdk.set('quick-start.ts', generateQuickStart())
    files.sdk.set('types.ts', generateSDKTypes(schema.models, schema))
  } catch (error) {
    console.error('[ssot-codegen] Error generating SDK documentation:', error)
  }
}

/**
 * Convert service name to proper class name
 * Handles kebab-case, snake_case, and validates format
 */
function toServiceClassName(serviceName: string): string {
  // Validate service name format
  if (!serviceName || typeof serviceName !== 'string') {
    throw new Error(`Invalid service name: ${serviceName}`)
  }
  
  // Handle kebab-case (e.g., 'image-optimizer' -> 'ImageOptimizerClient')
  if (serviceName.includes('-')) {
    return serviceName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('') + 'Client'
  }
  
  // Handle snake_case (e.g., 'image_optimizer' -> 'ImageOptimizerClient')
  if (serviceName.includes('_')) {
    return serviceName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('') + 'Client'
  }
  
  // Handle PascalCase or camelCase (e.g., 'ImageOptimizer' or 'imageOptimizer')
  return serviceName.charAt(0).toUpperCase() + serviceName.slice(1) + 'Client'
}

/**
 * Get file count
 */
export function countGeneratedFiles(files: GeneratedFiles): number {
  let count = 0
  
  files.contracts.forEach(map => count += map.size)
  files.validators.forEach(map => count += map.size)
  count += files.services.size
  count += files.controllers.size
  count += files.routes.size
  count += files.sdk.size
  count += files.hooks.core.size
  if (files.hooks.react) count += files.hooks.react.size
  if (files.hooks.vue) count += files.hooks.vue.size
  if (files.hooks.zustand) count += files.hooks.zustand.size
  if (files.hooks.vanilla) count += files.hooks.vanilla.size
  if (files.hooks.angular) count += files.hooks.angular.size
  
  return count
}


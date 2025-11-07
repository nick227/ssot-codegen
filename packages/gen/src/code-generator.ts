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
import { generateAllDTOs } from './generators/dto-generator.js'
import { generateAllValidators } from './generators/validator-generator.js'
import { generateService } from './generators/service-generator.js'
import { generateController } from './generators/controller-generator.js'
import { generateRoutes } from './generators/route-generator.js'
// Enhanced generators with relationships, domain logic, and better logging
import { generateEnhancedService } from './generators/service-generator-enhanced.js'
import { generateEnhancedController } from './generators/controller-generator-enhanced.js'
import { generateBaseClassController } from './generators/controller-generator-base-class.js'
import { generateEnhancedRoutes, shouldGenerateRoutes } from './generators/route-generator-enhanced.js'
// Service integration for complex workflows (AI agents, file uploads, etc.)
import { parseServiceAnnotation, getServiceExportName, type ServiceAnnotation } from './service-linker.js'
import { generateServiceController, generateServiceRoutes, generateServiceScaffold } from './generators/service-integration.generator.js'
// SDK generation for frontend clients
import { generateModelSDK, generateMainSDK, generateSDKVersion } from './generators/sdk-generator.js'
import { generateServiceSDK, generateMainSDKWithServices } from './generators/sdk-service-generator.js'
import { generateSDKReadme, generateAPIReference, generateSDKArchitecture, generateQuickStart, generateSDKTypes } from './generators/sdk-docs-generator.js'
// Framework hooks generation (React, Vue, etc.)
import { generateAllHooks } from './generators/hooks/index.js'
// OPTIMIZATION: Pre-analysis utilities
import { analyzeModel, type ModelAnalysis } from './utils/relationship-analyzer.js'
// Registry-based architecture (78% less code)
import { generateRegistrySystem } from './generators/registry-generator.js'
// System health check dashboard
import { generateChecklistSystem } from './generators/checklist-generator.js'
// Feature plugins system
import { PluginManager } from './plugins/plugin-manager.js'

export interface CodeGeneratorConfig {
  framework: 'express' | 'fastify'
  useEnhancedGenerators?: boolean  // Use enhanced generators with relationships and domain logic
  useRegistry?: boolean  // Use registry-based architecture (78% less code)
  projectName?: string  // Project name for display
  generateChecklist?: boolean  // Generate system health check dashboard (default: true)
  autoOpenChecklist?: boolean  // Auto-open checklist in browser (default: false)
  
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

export interface GeneratedFiles {
  contracts: Map<string, Map<string, string>>  // model -> filename -> content
  validators: Map<string, Map<string, string>>
  services: Map<string, string>
  controllers: Map<string, string>
  routes: Map<string, string>
  sdk: Map<string, string>  // filename -> content
  registry?: Map<string, string>  // Registry-based architecture files
  checklist?: Map<string, string>  // System health check dashboard
  plugins?: Map<string, Map<string, string>>  // NEW: Plugin-generated files (plugin -> files)
  hooks: {
    core: Map<string, string>        // Framework-agnostic queries
    react?: Map<string, string>      // React hooks
    vue?: Map<string, string>        // Vue composables
    zustand?: Map<string, string>    // Zustand stores
    vanilla?: Map<string, string>    // Vanilla JS stores
    angular?: Map<string, string>    // Angular services
  }
}

/**
 * Analysis cache for optimization
 * OPTIMIZATION: Pre-analyze all models once instead of analyzing per-generator
 */
interface AnalysisCache {
  modelAnalysis: Map<string, ModelAnalysis>
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
  const files: GeneratedFiles = {
    contracts: new Map(),
    validators: new Map(),
    services: new Map(),
    controllers: new Map(),
    routes: new Map(),
    sdk: new Map(),
    registry: undefined,
    plugins: new Map(),  // NEW: Plugin files
    hooks: {
      core: new Map()
    }
  }
  
  // PHASE 1: Pre-analyze all models ONCE (O(n) instead of O(n×5))
  const cache: AnalysisCache = {
    modelAnalysis: new Map(),
    serviceAnnotations: new Map()
  }
  
  for (const model of schema.models) {
    // Analyze relationships and special fields once
    if (config.useEnhancedGenerators ?? true) {
      cache.modelAnalysis.set(model.name, analyzeModel(model, schema))
    }
    
    // Parse service annotations once
    const serviceAnnotation = parseServiceAnnotation(model)
    if (serviceAnnotation) {
      cache.serviceAnnotations.set(model.name, serviceAnnotation)
    }
  }
  
  // REGISTRY MODE: Generate unified registry instead of individual files
  if (config.useRegistry) {
    files.registry = generateRegistrySystem(schema, cache.modelAnalysis)
    
    // Still generate DTOs and SDK in registry mode
    for (const model of schema.models) {
      const modelLower = model.nameLower  // Use cached lowercase name
      const dtos = generateAllDTOs(model)
      const dtoMap = new Map<string, string>()
      dtoMap.set(`${modelLower}.create.dto.ts`, dtos.create)
      dtoMap.set(`${modelLower}.update.dto.ts`, dtos.update)
      dtoMap.set(`${modelLower}.read.dto.ts`, dtos.read)
      dtoMap.set(`${modelLower}.query.dto.ts`, dtos.query)
      files.contracts.set(model.name, dtoMap)
    }
    
    // Generate SDK and hooks
    generateSDKClients(schema, files, cache)
    const hooks = generateAllHooks(schema, { frameworks: ['react'] }, cache.modelAnalysis)  // Pass cached analysis
    files.hooks = hooks
    
    // Generate System Checklist (REGISTRY MODE)
    if (config.generateChecklist !== false) {
      const checklist = generateChecklistSystem(schema, files, {
        projectName: config.projectName || 'Generated Project',
        useRegistry: true,
        framework: config.framework || 'express',
        autoOpen: config.autoOpenChecklist || false,
        includeEnvironmentChecks: true,
        includeCodeValidation: true,
        includeAPITesting: true,
        includePerformanceMetrics: true
      })
      files.checklist = checklist
    }
    
    return files
  }
  
  // LEGACY MODE: Generate individual files for each model
  // PHASE 2: Generate code using cached analysis (O(n) with no repeated work)
  for (const model of schema.models) {
    generateModelCode(model, config, files, schema, cache)
  }
  
  // PHASE 3: Generate SDK clients (after all models are processed)
  generateSDKClients(schema, files, cache)
  
  // PHASE 4: Generate framework hooks (React by default)
  const hooks = generateAllHooks(schema, { frameworks: ['react'] }, cache.modelAnalysis)  // Pass cached analysis
  files.hooks = hooks
  
  // PHASE 5: Generate Feature Plugins (NEW!)
  let pluginManager: PluginManager | undefined
  if (config.features) {
    pluginManager = new PluginManager({
      schema,
      projectName: config.projectName || 'Generated Project',
      framework: config.framework || 'express',
      outputDir: '',
      features: config.features
    })
    
    // Validate all plugins (synchronous)
    const validations = pluginManager.validateAll()
    const hasErrors = Array.from(validations.values()).some(v => !v.valid)
    
    if (hasErrors) {
      console.warn('\n⚠️  Some plugins have validation errors. Check warnings above.')
    }
    
    // Generate plugin code (synchronous for now)
    const pluginOutputs = pluginManager.generateAll()
    
    // Add plugin files to generated files
    for (const [pluginName, output] of pluginOutputs) {
      files.plugins!.set(pluginName, output.files)
    }
    
    // Store plugin outputs for env vars and package.json merging
    ;(files as any).pluginOutputs = pluginOutputs
  }
  
  // PHASE 6: Generate System Checklist
  if (config.generateChecklist !== false) {  // Default: true
    // Collect plugin health checks from the same plugin manager instance
    const pluginHealthChecks = new Map<string, any>()
    if (pluginManager) {
      // Get health checks from all enabled plugins
      for (const [pluginName, plugin] of pluginManager.getPlugins()) {
        if (plugin.healthCheck) {
          const healthCheck = plugin.healthCheck({
            schema,
            projectName: config.projectName || 'Generated Project',
            framework: config.framework || 'express',
            outputDir: '',
            config: config.features || {}
          })
          pluginHealthChecks.set(pluginName, healthCheck)
        }
      }
    }
    
    const checklist = generateChecklistSystem(schema, files, {
      projectName: config.projectName || 'Generated Project',
      useRegistry: config.useRegistry || false,
      framework: config.framework || 'express',
      autoOpen: config.autoOpenChecklist || false,
      includeEnvironmentChecks: true,
      includeCodeValidation: true,
      includeAPITesting: true,
      includePerformanceMetrics: true,
      pluginHealthChecks
    })
    files.checklist = checklist
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
  cache: AnalysisCache
): void {
  const modelLower = model.nameLower  // Use cached lowercase name
  const useEnhanced = config.useEnhancedGenerators ?? true
  
  // Get cached service annotation (already parsed in phase 1)
  const serviceAnnotation = cache.serviceAnnotations.get(model.name)
  
  // Get cached analysis (already computed in phase 1)
  const analysis = cache.modelAnalysis.get(model.name)
  
  // Check if this is a junction table FIRST (before generating anything beyond DTOs/validators)
  const isJunction = useEnhanced && analysis?.isJunctionTable
  
  if (isJunction) {
    // Note: Junction table warning is logged by the caller (index-new.ts) via logger
    
    // Generate DTOs (useful for type system even for junction tables)
    const dtos = generateAllDTOs(model)
    const dtoMap = new Map<string, string>()
    dtoMap.set(`${modelLower}.create.dto.ts`, dtos.create)
    dtoMap.set(`${modelLower}.update.dto.ts`, dtos.update)
    dtoMap.set(`${modelLower}.read.dto.ts`, dtos.read)
    dtoMap.set(`${modelLower}.query.dto.ts`, dtos.query)
    files.contracts.set(model.name, dtoMap)
    
    // Generate Validators (useful for type system)
    const validators = generateAllValidators(model)
    const validatorMap = new Map<string, string>()
    validatorMap.set(`${modelLower}.create.zod.ts`, validators.create)
    validatorMap.set(`${modelLower}.update.zod.ts`, validators.update)
    validatorMap.set(`${modelLower}.query.zod.ts`, validators.query)
    files.validators.set(model.name, validatorMap)
    
    // Skip services, controllers, and routes for junction tables
    return
  }
  
  // Generate DTOs (always needed for non-junction models)
  const dtos = generateAllDTOs(model)
  const dtoMap = new Map<string, string>()
  dtoMap.set(`${modelLower}.create.dto.ts`, dtos.create)
  dtoMap.set(`${modelLower}.update.dto.ts`, dtos.update)
  dtoMap.set(`${modelLower}.read.dto.ts`, dtos.read)
  dtoMap.set(`${modelLower}.query.dto.ts`, dtos.query)
  files.contracts.set(model.name, dtoMap)
  
  // Generate Validators (always needed)
  const validators = generateAllValidators(model)
  const validatorMap = new Map<string, string>()
  validatorMap.set(`${modelLower}.create.zod.ts`, validators.create)
  validatorMap.set(`${modelLower}.update.zod.ts`, validators.update)
  validatorMap.set(`${modelLower}.query.zod.ts`, validators.query)
  files.validators.set(model.name, validatorMap)
  
  // Generate Service (enhanced or basic)
  const service = useEnhanced 
    ? generateEnhancedService(model, schema)
    : generateService(model)
  files.services.set(`${modelLower}.service.ts`, service)
  
  // If this model has @service annotation, generate service integration
  if (serviceAnnotation) {
    console.log(`[ssot-codegen] Generating service integration for: ${serviceAnnotation.name} (methods: ${serviceAnnotation.methods.join(', ')})`)
    
    // Generate service integration controller
    const serviceController = generateServiceController(serviceAnnotation)
    files.controllers.set(`${serviceAnnotation.name}.controller.ts`, serviceController)
    
    // Generate service integration routes
    const serviceRoutes = generateServiceRoutes(serviceAnnotation)
    files.routes.set(`${serviceAnnotation.name}.routes.ts`, serviceRoutes)
    
    // Generate service scaffold
    const scaffold = generateServiceScaffold(serviceAnnotation)
    files.services.set(`${serviceAnnotation.name}.service.scaffold.ts`, scaffold)
    
    return  // Service integration replaces standard CRUD controller/routes
  }
  
  // Generate Controller (base class for minimal boilerplate, enhanced for legacy, or basic)
  const controller = useEnhanced
    ? generateBaseClassController(model, schema, config.framework, analysis!)  // Pass cached analysis
    : generateController(model, config.framework)
  files.controllers.set(`${model.nameLower}.controller.ts`, controller)
  
  // Generate Routes (enhanced or basic)
  const routes = useEnhanced
    ? generateEnhancedRoutes(model, schema, config.framework, analysis!)  // Pass cached analysis
    : generateRoutes(model, config.framework)
    
  if (routes) {
    files.routes.set(`${modelLower}.routes.ts`, routes)
  }
}

/**
 * Generate SDK clients for all models and services
 */
function generateSDKClients(
  schema: ParsedSchema,
  files: GeneratedFiles,
  cache: AnalysisCache
): void {
  const modelClients: Array<{ name: string; className: string }> = []
  const serviceClients: Array<{ name: string; className: string; annotation: ServiceAnnotation }> = []
  
  // Generate model clients (skip junction tables and service-annotated models)
  for (const model of schema.models) {
    const analysis = cache.modelAnalysis.get(model.name)
    const serviceAnnotation = cache.serviceAnnotations.get(model.name)
    
    if (analysis?.isJunctionTable) continue  // Skip junction tables
    if (serviceAnnotation) continue  // Skip service-annotated models (handled separately)
    
    const modelClient = generateModelSDK(model, schema)
    files.sdk.set(`models/${model.name.toLowerCase()}.client.ts`, modelClient)
    
    modelClients.push({
      name: model.name.toLowerCase(),
      className: `${model.name}Client`
    })
  }
  
  // Generate service integration clients
  for (const [modelName, serviceAnnotation] of cache.serviceAnnotations) {
    const serviceClient = generateServiceSDK(serviceAnnotation)
    files.sdk.set(`services/${serviceAnnotation.name}.client.ts`, serviceClient)
    
    const serviceName = serviceAnnotation.name.split('-').map((word, idx) => 
      idx === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join('')
    const className = serviceName.charAt(0).toUpperCase() + serviceName.slice(1) + 'Client'
    
    serviceClients.push({
      name: serviceAnnotation.name,
      className,
      annotation: serviceAnnotation
    })
  }
  
  // Generate main SDK factory with both model and service clients
  const mainSDK = serviceClients.length > 0
    ? generateMainSDKWithServices(modelClients, serviceClients)
    : generateMainSDK(schema.models, schema)
  files.sdk.set('index.ts', mainSDK)
  
  // Generate version file (will be populated with hash later)
  const versionFile = generateSDKVersion('', '0.5.0')
  files.sdk.set('version.ts', versionFile)
  
  // Generate SDK documentation files
  files.sdk.set('README.md', generateSDKReadme(schema.models, schema))
  files.sdk.set('API-REFERENCE.md', generateAPIReference(schema.models, schema))
  files.sdk.set('ARCHITECTURE.md', generateSDKArchitecture())
  files.sdk.set('quick-start.ts', generateQuickStart())
  files.sdk.set('types.ts', generateSDKTypes(schema.models, schema))
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


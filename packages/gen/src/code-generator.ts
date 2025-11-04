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
import { generateEnhancedRoutes, shouldGenerateRoutes } from './generators/route-generator-enhanced.js'
// Service integration for complex workflows (AI agents, file uploads, etc.)
import { parseServiceAnnotation, getServiceExportName } from './service-linker.js'
import { generateServiceController, generateServiceRoutes, generateServiceScaffold } from './generators/service-integration.generator.js'

export interface CodeGeneratorConfig {
  framework: 'express' | 'fastify'
  useEnhancedGenerators?: boolean  // Use enhanced generators with relationships and domain logic
}

export interface GeneratedFiles {
  contracts: Map<string, Map<string, string>>  // model -> filename -> content
  validators: Map<string, Map<string, string>>
  services: Map<string, string>
  controllers: Map<string, string>
  routes: Map<string, string>
}

/**
 * Generate all code files from parsed schema
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
    routes: new Map()
  }
  
  for (const model of schema.models) {
    generateModelCode(model, config, files, schema)
  }
  
  return files
}

/**
 * Generate code for a single model
 */
function generateModelCode(
  model: ParsedModel,
  config: CodeGeneratorConfig,
  files: GeneratedFiles,
  schema: ParsedSchema
): void {
  const modelLower = model.name.toLowerCase()
  const useEnhanced = config.useEnhancedGenerators ?? true  // Default to enhanced
  
  // Check for @service annotation (service integration pattern)
  const serviceAnnotation = parseServiceAnnotation(model)
  
  // Generate DTOs (always needed)
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
    
    // Generate service scaffold if file doesn't exist
    // Note: This will be written to src/services/ by index-new.ts
    const scaffold = generateServiceScaffold(serviceAnnotation)
    files.services.set(`${serviceAnnotation.name}.service.scaffold.ts`, scaffold)
    
    return  // Service integration replaces standard CRUD controller/routes
  }
  
  // Check if this is a junction table (for skipping routes/controllers)
  const isJunction = useEnhanced && !shouldGenerateRoutes(model, schema)
  
  if (isJunction) {
    console.log(`[ssot-codegen] Skipping controller and routes for junction table: ${model.name}`)
    return  // Skip controller and routes entirely for junction tables
  }
  
  // Generate Controller (enhanced or basic)
  const controller = useEnhanced
    ? generateEnhancedController(model, schema, config.framework)
    : generateController(model, config.framework)
  files.controllers.set(`${modelLower}.controller.ts`, controller)
  
  // Generate Routes (enhanced or basic)
  const routes = useEnhanced
    ? generateEnhancedRoutes(model, schema, config.framework)
    : generateRoutes(model, config.framework)
    
  if (routes) {
    files.routes.set(`${modelLower}.routes.ts`, routes)
  }
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
  
  return count
}


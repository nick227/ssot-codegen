/**
 * Registry Generator - Generates unified TypeScript registry for all models
 * 
 * Instead of generating individual controller/service/route files,
 * this generator creates a single registry that powers factory-based generation.
 * 
 * Benefits:
 * - 78% less code (8,000 → 1,800 lines for 24 models)
 * - Single source of truth
 * - Type-safe configuration
 * - Easy to maintain and extend
 */

import type { ParsedSchema, ParsedModel, ParsedField } from '../dmmf-parser.js'
import type { ModelAnalysis } from '../utils/relationship-analyzer.js'

/**
 * Generate the complete registry system
 */
export function generateRegistrySystem(
  schema: ParsedSchema,
  analysisMap: Map<string, ModelAnalysis>
): Map<string, string> {
  const files = new Map<string, string>()
  
  // 1. Generate models registry (single source of truth)
  files.set('models.registry.ts', generateModelsRegistry(schema, analysisMap))
  
  // 2. Generate factory files (copy from proven implementation)
  files.set('service.factory.ts', generateServiceFactory())
  files.set('controller.factory.ts', generateControllerFactory())
  files.set('validator.factory.ts', generateValidatorFactory())
  files.set('router.factory.ts', generateRouterFactory())
  files.set('index.ts', generateRegistryIndex())
  
  return files
}

/**
 * Generate models.registry.ts - Single source of truth for all models
 */
function generateModelsRegistry(
  schema: ParsedSchema,
  analysisMap: Map<string, ModelAnalysis>
): string {
  // Collect all enums used
  const enums = new Set<string>()
  for (const model of schema.models) {
    for (const field of model.fields) {
      if (field.kind === 'enum') {
        enums.add(field.type)
      }
    }
  }
  
  const enumImports = Array.from(enums).join(',\n  ')
  
  return `// @generated
// Unified Model Registry - Single Source of Truth
// All model metadata, configuration, and relationships in one place

import prisma from '@/db'
${enumImports ? `import {\n  ${enumImports}\n} from '@prisma/client'` : ''}
import { z } from 'zod'
import type { Prisma } from '@prisma/client'

/**
 * Field type definitions for building validators
 */
type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'relation' | 'decimal'

interface FieldConfig {
  type: FieldType
  required?: boolean
  nullable?: boolean
  default?: any
  min?: number
  max?: number
  enum?: string
  relationModel?: string
  isDecimal?: boolean
}

/**
 * Custom route definition
 */
interface CustomRoute {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete'
  path: string
  handler: string
}

/**
 * Model registry configuration
 */
interface ModelConfig {
  modelName: string
  tableName: string
  idType: 'number' | 'string'
  idField?: string
  prismaModel: any
  
  // Field definitions (for validators)
  fields: Record<string, FieldConfig>
  queryableFields?: string[]
  
  // Relationships (for service includes)
  includes?: {
    default?: any
    detailed?: any
  }
  
  // Route configuration
  routes: {
    path: string
    customRoutes?: CustomRoute[]
  }
  
  // Custom service methods
  customMethods?: Record<string, Function>
}

/**
 * Unified Models Registry
 * All model metadata in one place
 */
export const modelsRegistry = {
${schema.models.map(model => generateModelEntry(model, analysisMap.get(model.name))).join(',\n  \n')}
} as const

// Type helpers
export type ModelName = keyof typeof modelsRegistry

// Export for use in builders
export { type FieldConfig, type CustomRoute, type ModelConfig }
`
}

/**
 * Generate a single model entry in the registry
 */
function generateModelEntry(model: ParsedModel, analysis?: ModelAnalysis): string {
  const modelLower = model.name.toLowerCase()
  const idField = model.fields.find(f => f.isId)
  const idType = idField?.type === 'String' ? 'string' : 'number'
  
  // Generate field definitions
  const fields = model.fields
    .filter(f => !f.relationName) // Exclude relation fields
    .map(field => generateFieldConfig(field))
    .join(',\n      ')
  
  // Find queryable fields (string/number fields that aren't IDs)
  const queryableFields = model.fields
    .filter(f => 
      !f.relationName && 
      !f.isId && 
      (f.type === 'String' || f.type === 'Int' || f.type === 'BigInt')
    )
    .map(f => `'${f.name}'`)
    .join(', ')
  
  // Generate includes for relationships
  const includes = generateIncludes(model, analysis)
  
  // Find unique fields for custom methods
  const uniqueFields = model.fields.filter(f => 
    f.isUnique && 
    !f.isId && 
    f.type === 'String'
  )
  
  const customRoutes = uniqueFields.length > 0
    ? uniqueFields.map(f => `{ method: 'get', path: '/${f.name}/:${f.name}', handler: 'findBy${capitalize(f.name)}' }`).join(', ')
    : ''
  
  const customMethods = uniqueFields.length > 0
    ? `\n    \n    customMethods: {\n${uniqueFields.map(f => generateCustomMethod(model, f)).join(',\n')}\n    }`
    : ''
  
  return `  ${modelLower}: {
    modelName: '${model.name}',
    tableName: '${modelLower}',
    idType: '${idType}' as const,
    prismaModel: prisma.${modelLower},
    
    fields: {
      ${fields}
    },
    
    queryableFields: [${queryableFields}],
    
    includes: ${includes},
    
    routes: {
      path: '/${modelLower}s',
      customRoutes: [${customRoutes}]
    }${customMethods}
  }`
}

/**
 * Generate field configuration
 */
function generateFieldConfig(field: ParsedField): string {
  const config: string[] = []
  
  // Type
  let fieldType = 'string'
  if (field.kind === 'enum') {
    fieldType = 'enum'
    config.push(`type: 'enum'`)
    config.push(`enum: '${field.type}'`)
  } else if (field.type === 'Int' || field.type === 'BigInt') {
    fieldType = 'number'
    config.push(`type: 'number'`)
  } else if (field.type === 'Boolean') {
    fieldType = 'boolean'
    config.push(`type: 'boolean'`)
  } else if (field.type === 'DateTime') {
    fieldType = 'date'
    config.push(`type: 'date'`)
  } else if (field.type === 'Decimal') {
    fieldType = 'number'
    config.push(`type: 'number'`)
    config.push(`isDecimal: true`)
  } else {
    config.push(`type: 'string'`)
  }
  
  // Required
  if (field.isRequired && !field.hasDefaultValue) {
    config.push(`required: true`)
  }
  
  // Nullable
  if (!field.isRequired && !field.isId) {
    config.push(`nullable: true`)
  }
  
  // Default value
  if (field.hasDefaultValue && field.default !== undefined) {
    if (typeof field.default === 'string') {
      config.push(`default: '${field.default}'`)
    } else if (typeof field.default === 'number' || typeof field.default === 'boolean') {
      config.push(`default: ${field.default}`)
    }
  }
  
  // Min/max for numbers
  if (fieldType === 'string' && field.isRequired) {
    config.push(`min: 1`)
  }
  if (fieldType === 'number' && field.isRequired) {
    config.push(`min: 0`)
  }
  
  return `${field.name}: { ${config.join(', ')} }`
}

/**
 * Generate includes configuration for relationships
 */
function generateIncludes(model: ParsedModel, analysis?: ModelAnalysis): string {
  const relations = model.fields.filter(f => f.relationName)
  
  if (relations.length === 0) {
    return '{\n      default: {}\n    }'
  }
  
  // Generate default includes (select key fields for relations)
  const defaultIncludes = relations
    .filter(f => !f.isList) // Only include singular relations in default
    .map(field => {
      if (field.type === 'Customer' || field.type === 'User') {
        return `${field.name}: {\n          select: { id: true, email: true, firstName: true, lastName: true }\n        }`
      }
      return `${field.name}: true`
    })
    .join(',\n        ')
  
  return `{\n      default: {\n        ${defaultIncludes}\n      }\n    }`
}

/**
 * Generate custom method for unique field
 */
function generateCustomMethod(model: ParsedModel, field: ParsedField): string {
  const modelLower = model.name.toLowerCase()
  const methodName = `findBy${capitalize(field.name)}`
  
  return `      async ${methodName}(${field.name}: string) {
        return prisma.${modelLower}.findUnique({
          where: { ${field.name} },
          include: this.includes?.default || {}
        })
      }`
}

/**
 * Generate service.factory.ts - CRUD service builder
 */
function generateServiceFactory(): string {
  return `// @generated
// Service Factory - Builds CRUD services from model registry

import type { Prisma } from '@prisma/client'
import { logger } from '@/logger'
import type { ModelConfig } from './models.registry'

/**
 * Generic query DTO structure
 */
interface QueryDTO {
  skip?: number
  take?: number
  where?: any
  orderBy?: any
  include?: any
}

/**
 * Creates a full CRUD service from model configuration
 */
export function createCRUDService<T, CreateDTO, UpdateDTO>(config: ModelConfig) {
  const { modelName, prismaModel, includes, customMethods } = config
  const defaultInclude = includes?.default || {}
  
  const service = {
    async list(query: QueryDTO) {
      const { skip = 0, take = 20, orderBy, where } = query
      
      const [items, total] = await Promise.all([
        prismaModel.findMany({
          skip,
          take,
          orderBy,
          where,
          include: defaultInclude
        }),
        prismaModel.count({ where })
      ])
      
      return {
        data: items,
        meta: { total, skip, take, hasMore: skip + take < total }
      }
    },
    
    async findById(id: number | string) {
      return prismaModel.findUnique({
        where: { id },
        include: defaultInclude
      })
    },
    
    async create(data: CreateDTO) {
      try {
        const item = await prismaModel.create({
          data,
          include: defaultInclude
        })
        logger.info({ [\`\${modelName}Id\`]: item.id }, \`\${modelName} created\`)
        return item
      } catch (error) {
        logger.error({ error, data }, \`Failed to create \${modelName}\`)
        throw error
      }
    },
    
    async update(id: number | string, data: UpdateDTO) {
      try {
        const item = await prismaModel.update({
          where: { id },
          data,
          include: defaultInclude
        })
        logger.info({ [\`\${modelName}Id\`]: id }, \`\${modelName} updated\`)
        return item
      } catch (error: any) {
        if (error.code === 'P2025') {
          logger.warn({ [\`\${modelName}Id\`]: id }, \`\${modelName} not found for update\`)
          return null
        }
        logger.error({ error, [\`\${modelName}Id\`]: id, data }, \`Failed to update \${modelName}\`)
        throw error
      }
    },
    
    async delete(id: number | string) {
      try {
        await prismaModel.delete({ where: { id } })
        logger.info({ [\`\${modelName}Id\`]: id }, \`\${modelName} deleted\`)
        return true
      } catch (error: any) {
        if (error.code === 'P2025') {
          logger.warn({ [\`\${modelName}Id\`]: id }, \`\${modelName} not found for delete\`)
          return false
        }
        logger.error({ error, [\`\${modelName}Id\`]: id }, \`Failed to delete \${modelName}\`)
        throw error
      }
    },
    
    async count(where?: any) {
      return prismaModel.count({ where })
    },
    
    async exists(id: number | string) {
      const count = await prismaModel.count({ where: { id } })
      return count > 0
    },
    
    async createMany(data: CreateDTO[]) {
      const result = await prismaModel.createMany({
        data,
        skipDuplicates: true
      })
      logger.info({ count: result.count }, \`\${modelName} bulk created\`)
      return result
    },
    
    async updateMany(where: any, data: Partial<UpdateDTO>) {
      const result = await prismaModel.updateMany({ where, data })
      logger.info({ count: result.count }, \`\${modelName} bulk updated\`)
      return result
    },
    
    async deleteMany(where: any) {
      const result = await prismaModel.deleteMany({ where })
      logger.info({ count: result.count }, \`\${modelName} bulk deleted\`)
      return result
    }
  }
  
  // Merge custom methods if provided
  if (customMethods && typeof customMethods === 'object') {
    Object.assign(service, customMethods)
  }
  
  return service
}

/**
 * Build all services from registry
 */
export function buildServices(registry: Record<string, ModelConfig>) {
  const services: Record<string, any> = {}
  
  for (const [name, config] of Object.entries(registry)) {
    services[name] = createCRUDService(config)
  }
  
  return services
}
`
}

/**
 * Generate controller.factory.ts - Request handler builder
 */
function generateControllerFactory(): string {
  return `// @generated
// Controller Factory - Builds controllers from model registry

import type { Request, Response } from 'express'
import { ZodError } from 'zod'
import { logger } from '@/logger'
import type { ModelConfig } from './models.registry'

function parseId(
  req: Request,
  res: Response,
  config: { modelName: string; idType: 'number' | 'string'; idField?: string }
): number | string | null {
  const idField = config.idField || 'id'
  const rawId = req.params[idField]
  
  if (!rawId) {
    logger.warn(\`Missing \${config.modelName} ID\`)
    res.status(400).json({ error: 'ID is required' })
    return null
  }
  
  if (config.idType === 'number') {
    const id = parseInt(rawId, 10)
    if (isNaN(id)) {
      logger.warn({ id: rawId }, \`Invalid \${config.modelName} ID format\`)
      res.status(400).json({ error: 'Invalid ID format' })
      return null
    }
    return id
  }
  
  if (rawId.trim() === '') {
    logger.warn(\`Missing \${config.modelName} ID\`)
    res.status(400).json({ error: 'ID is required' })
    return null
  }
  
  return rawId
}

function handleValidationError(error: ZodError, operation: string, res: Response): void {
  logger.warn({ error: error.errors, operation }, \`Validation error in \${operation}\`)
  res.status(400).json({ error: 'Validation Error', details: error.errors })
}

function handleError(error: unknown, operation: string, context: Record<string, any>, res: Response): void {
  logger.error({ error, ...context, operation }, \`Error in \${operation}\`)
  res.status(500).json({ error: 'Internal Server Error' })
}

export function createCRUDController(
  config: ModelConfig,
  service: any,
  schemas: any
) {
  const { modelName, idType, idField } = config
  
  const controller: Record<string, any> = {
    list: async (req: Request, res: Response): Promise<Response> => {
      try {
        const query = schemas.query.parse(req.query)
        const result = await service.list(query)
        return res.json(result)
      } catch (error) {
        if (error instanceof ZodError) {
          handleValidationError(error, \`list\${modelName}s\`, res)
          return res
        }
        handleError(error, \`list\${modelName}s\`, {}, res)
        return res
      }
    },
    
    getById: async (req: Request, res: Response): Promise<Response> => {
      const id = parseId(req, res, { modelName, idType, idField })
      if (id === null) return res
      
      try {
        const item = await service.findById(id)
        if (!item) {
          return res.status(404).json({ error: \`\${modelName} not found\` })
        }
        return res.json(item)
      } catch (error) {
        handleError(error, \`get\${modelName}\`, { id }, res)
        return res
      }
    },
    
    create: async (req: Request, res: Response): Promise<Response> => {
      try {
        const data = schemas.create.parse(req.body)
        const item = await service.create(data)
        return res.status(201).json(item)
      } catch (error) {
        if (error instanceof ZodError) {
          handleValidationError(error, \`create\${modelName}\`, res)
          return res
        }
        handleError(error, \`create\${modelName}\`, {}, res)
        return res
      }
    },
    
    update: async (req: Request, res: Response): Promise<Response> => {
      const id = parseId(req, res, { modelName, idType, idField })
      if (id === null) return res
      
      try {
        const data = schemas.update.parse(req.body)
        const item = await service.update(id, data)
        if (!item) {
          return res.status(404).json({ error: \`\${modelName} not found\` })
        }
        return res.json(item)
      } catch (error) {
        if (error instanceof ZodError) {
          handleValidationError(error, \`update\${modelName}\`, res)
          return res
        }
        handleError(error, \`update\${modelName}\`, { id }, res)
        return res
      }
    },
    
    deleteRecord: async (req: Request, res: Response): Promise<Response> => {
      const id = parseId(req, res, { modelName, idType, idField })
      if (id === null) return res
      
      try {
        const deleted = await service.delete(id)
        if (!deleted) {
          return res.status(404).json({ error: \`\${modelName} not found\` })
        }
        return res.status(204).send()
      } catch (error) {
        handleError(error, \`delete\${modelName}\`, { id }, res)
        return res
      }
    },
    
    count: async (req: Request, res: Response): Promise<Response> => {
      try {
        const query = schemas.query.parse(req.query)
        const total = await service.count(query.where)
        return res.json({ total })
      } catch (error) {
        if (error instanceof ZodError) {
          handleValidationError(error, \`count\${modelName}s\`, res)
          return res
        }
        handleError(error, \`count\${modelName}s\`, {}, res)
        return res
      }
    }
  }
  
  return controller
}

export function buildControllers(
  registry: Record<string, ModelConfig>,
  services: Record<string, any>,
  validators: Record<string, any>
) {
  const controllers: Record<string, any> = {}
  
  for (const [name, config] of Object.entries(registry)) {
    const controller = createCRUDController(config, services[name], validators[name])
    
    if ('customMethods' in config && config.customMethods) {
      for (const [methodName, method] of Object.entries(config.customMethods)) {
        controller[methodName] = async (req: Request, res: Response): Promise<Response> => {
          try {
            const paramName = req.route?.path.split(':')[1] || 'slug'
            const paramValue = req.params[paramName]
            const result = await (method as Function).call(services[name], paramValue)
            
            if (!result) {
              return res.status(404).json({ error: \`\${config.modelName} not found\` })
            }
            return res.json(result)
          } catch (error) {
            handleError(error, methodName, {}, res)
            return res
          }
        }
      }
    }
    
    controllers[name] = controller
  }
  
  return controllers
}
`
}

/**
 * Generate validator.factory.ts
 */
function generateValidatorFactory(): string {
  return `// @generated
// Validator Factory - Builds Zod schemas from model registry

import { z, type ZodSchema } from 'zod'
import type { ModelConfig, FieldConfig } from './models.registry'

export function buildSchemas(config: ModelConfig) {
  const createShape: Record<string, z.ZodTypeAny> = {}
  const updateShape: Record<string, z.ZodTypeAny> = {}
  
  for (const [fieldName, fieldConfig] of Object.entries(config.fields)) {
    createShape[fieldName] = fieldToZod(fieldName, fieldConfig)
    
    if (fieldName !== 'createdAt' && fieldName !== 'updatedAt') {
      updateShape[fieldName] = fieldToZod(fieldName, { ...fieldConfig, required: false })
    }
  }
  
  return {
    create: z.object(createShape),
    update: z.object(updateShape).partial(),
    query: z.object({
      skip: z.coerce.number().min(0).optional().default(0),
      take: z.coerce.number().min(1).max(100).optional().default(20),
      where: z.any().optional(),
      orderBy: z.any().optional(),
      include: z.any().optional()
    })
  }
}

function fieldToZod(fieldName: string, config: FieldConfig): z.ZodTypeAny {
  let schema: z.ZodTypeAny
  
  switch (config.type) {
    case 'string':
      schema = z.string()
      if (config.min) schema = (schema as z.ZodString).min(config.min)
      if (config.max) schema = (schema as z.ZodString).max(config.max)
      break
    case 'number':
    case 'decimal':
      schema = z.number()
      if (config.min !== undefined) schema = (schema as z.ZodNumber).min(config.min)
      if (config.max !== undefined) schema = (schema as z.ZodNumber).max(config.max)
      break
    case 'boolean':
      schema = z.boolean()
      break
    case 'date':
      schema = z.coerce.date()
      break
    case 'enum':
      // Enums are handled by importing them in models.registry
      schema = z.any()
      break
    default:
      schema = z.any()
  }
  
  if (config.nullable) schema = schema.nullable()
  if (!config.required) schema = schema.optional()
  if (config.default !== undefined) schema = schema.optional().default(config.default)
  
  return schema
}

export function buildValidators(registry: Record<string, ModelConfig>) {
  const validators: Record<string, any> = {}
  
  for (const [name, config] of Object.entries(registry)) {
    validators[name] = buildSchemas(config)
  }
  
  return validators
}
`
}

/**
 * Generate router.factory.ts
 */
function generateRouterFactory(): string {
  return `// @generated
// Router Factory - Builds Express routers from model registry

import { Router, type Router as RouterType } from 'express'
import type { ModelConfig } from './models.registry'

export function createRouter(config: ModelConfig, controller: any): RouterType {
  const router = Router()
  const idParam = ('idField' in config && config.idField) ? config.idField : 'id'
  
  router.get('/', controller.list)
  router.get(\`/:\${idParam}\`, controller.getById)
  router.post('/', controller.create)
  router.put(\`/:\${idParam}\`, controller.update)
  router.patch(\`/:\${idParam}\`, controller.update)
  router.delete(\`/:\${idParam}\`, controller.deleteRecord)
  router.get('/meta/count', controller.count)
  
  if (config.routes.customRoutes) {
    for (const customRoute of config.routes.customRoutes) {
      const handler = controller[customRoute.handler]
      if (handler) {
        router[customRoute.method](customRoute.path, handler)
      }
    }
  }
  
  return router
}

export function buildRouters(
  registry: Record<string, ModelConfig>,
  controllers: Record<string, any>
): Record<string, RouterType> {
  const routers: Record<string, RouterType> = {}
  
  for (const [name, config] of Object.entries(registry)) {
    routers[name] = createRouter(config, controllers[name])
  }
  
  return routers
}
`
}

/**
 * Generate registry/index.ts
 */
function generateRegistryIndex(): string {
  return `// @generated
// Registry System - Single Source of Truth for all models

import { modelsRegistry } from './models.registry'
import { buildServices } from './service.factory'
import { buildValidators } from './validator.factory'
import { buildControllers } from './controller.factory'
import { buildRouters } from './router.factory'

export const services = buildServices(modelsRegistry)
export const validators = buildValidators(modelsRegistry)
export const controllers = buildControllers(modelsRegistry, services, validators)
export const routers = buildRouters(modelsRegistry, controllers)

export { modelsRegistry } from './models.registry'
export type ModelName = keyof typeof modelsRegistry

export function getModelConfig(modelName: ModelName) {
  return modelsRegistry[modelName]
}

export function getService(modelName: ModelName) {
  return services[modelName]
}

export function getController(modelName: ModelName) {
  return controllers[modelName]
}

export function getRouter(modelName: ModelName) {
  return routers[modelName]
}

export function getModelNames(): ModelName[] {
  return Object.keys(modelsRegistry) as ModelName[]
}
`
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}


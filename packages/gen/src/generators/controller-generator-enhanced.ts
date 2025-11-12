/**
 * Enhanced Controller Generator - Generates controllers with proper logging
 */

import type { ParsedModel, ParsedSchema } from '../dmmf-parser.js'
import type { UnifiedModelAnalysis } from '@/analyzers/unified-analyzer/index.js'
import { toKebabCase, toCamelCase } from '@/utils/naming.js'
import {
  type ControllerConfig,
  DEFAULT_CONTROLLER_CONFIG,
  generateUnifiedHelpers,
  generateBulkValidators,
  generateTypeInterfaces,
  generateWhereValidator
} from './controller-helpers.js'

export type { ControllerConfig } from './controller-helpers.js'

/**
 * Validation errors for controller generation
 */
class ControllerGenerationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ControllerGenerationError'
  }
}

/**
 * Generate enhanced controller with proper logging
 * OPTIMIZED: Accepts pre-computed analysis from cache
 * 
 * @throws {ControllerGenerationError} If analysis is missing or model has composite keys
 */
export function generateEnhancedController(
  model: ParsedModel,
  schema: ParsedSchema,
  framework: 'express' | 'fastify' = 'express',
  analysis: UnifiedModelAnalysis | null | undefined,
  config: ControllerConfig = DEFAULT_CONTROLLER_CONFIG
): string {
  // VALIDATION: Ensure analysis is provided
  if (!analysis) {
    throw new ControllerGenerationError(
      `Analysis required for model '${model.name}'. Ensure analyzeModelUnified() is called before controller generation.`
    )
  }
  
  // LIMITATION: Detect composite primary keys (@@id([field1, field2]))
  if (model.primaryKey && model.primaryKey.fields.length > 1) {
    throw new ControllerGenerationError(
      `Model '${model.name}' has composite primary key @@id([${model.primaryKey.fields.join(', ')}]). ` +
      `Composite keys require custom controller implementation. Consider using separate endpoints ` +
      `or a compound key string format like "field1-field2".`
    )
  }
  
  // Check for single @id field
  if (!model.idField) {
    throw new ControllerGenerationError(
      `Model '${model.name}' has no primary key field. Add @id to a field or @@id([...]) to your Prisma schema.`
    )
  }
  
  const modelKebab = toKebabCase(model.name)
  const modelCamel = toCamelCase(model.name)
  
  // Determine ID type with proper handling for all Prisma types
  const idFieldType = model.idField.type
  let idType: 'string' | 'number' | 'bigint'
  let parseStrategy: 'string' | 'parseInt' | 'BigInt' | 'validate-uuid' | 'validate-cuid'
  
  // Determine parsing strategy based on field type and default
  const defaultValue = model.idField.default
  const defaultName = typeof defaultValue === 'object' && defaultValue !== null && 'name' in defaultValue 
    ? defaultValue.name 
    : null
  
  if (idFieldType === 'String') {
    idType = 'string'
    // Check if it's a UUID or CUID
    if (defaultName === 'uuid') {
      parseStrategy = 'validate-uuid'
    } else if (defaultName === 'cuid') {
      parseStrategy = 'validate-cuid'
    } else {
      parseStrategy = 'string'
    }
  } else if (idFieldType === 'BigInt') {
    idType = 'bigint'
    parseStrategy = 'BigInt'
  } else {
    // Int, Float, Decimal - treat as number
    idType = 'number'
    parseStrategy = 'parseInt'
  }
  
  if (framework === 'express') {
    return generateExpressController(model, analysis, modelKebab, modelCamel, idType, parseStrategy, config)
  } else {
    return generateFastifyController(model, analysis, modelKebab, modelCamel, idType, parseStrategy, config)
  }
}

/**
 * Generate bulk operation controllers for Express
 */
function generateBulkControllers(model: ParsedModel, modelCamel: string): string {
  return `
/**
 * Bulk create ${model.name} records
 */
export const bulkCreate${model.name}s = async (req: Request, res: Response) => {
  try {
    const validated = BulkCreate${model.name}Schema.parse(req.body)
    const result = await ${modelCamel}Service.createMany(validated.data)
    
    logger.info({ count: result.count }, 'Bulk created ${model.name} records')
    return res.status(201).json({ 
      count: result.count, 
      message: \`Created \${result.count} ${model.name} records\`
    })
  } catch (error) {
    return handleError(error, res, 'bulk creating ${model.name}s', { operation: 'bulkCreate' })
  }
}

/**
 * Bulk update ${model.name} records
 */
export const bulkUpdate${model.name}s = async (req: Request, res: Response) => {
  try {
    const validated = BulkUpdate${model.name}Schema.parse(req.body)
    const result = await ${modelCamel}Service.updateMany(validated.where, validated.data)
    
    logger.info({ count: result.count }, 'Bulk updated ${model.name} records')
    return res.json({ 
      count: result.count, 
      message: \`Updated \${result.count} ${model.name} records\`
    })
  } catch (error) {
    return handleError(error, res, 'bulk updating ${model.name}s', { operation: 'bulkUpdate' })
  }
}

/**
 * Bulk delete ${model.name} records
 */
export const bulkDelete${model.name}s = async (req: Request, res: Response) => {
  try {
    const validated = BulkDelete${model.name}Schema.parse(req.body)
    const result = await ${modelCamel}Service.deleteMany(validated.where)
    
    logger.info({ count: result.count }, 'Bulk deleted ${model.name} records')
    return res.json({ 
      count: result.count, 
      message: \`Deleted \${result.count} ${model.name} records\`
    })
  } catch (error) {
    return handleError(error, res, 'bulk deleting ${model.name}s', { operation: 'bulkDelete' })
  }
}
`
}

/**
 * Generate Express controller with enhanced features
 */
function generateExpressController(
  model: ParsedModel,
  analysis: UnifiedModelAnalysis,
  modelKebab: string,
  modelCamel: string,
  idType: 'string' | 'number' | 'bigint',
  parseStrategy: 'string' | 'parseInt' | 'BigInt' | 'validate-uuid' | 'validate-cuid',
  config: ControllerConfig
): string {
  const helpers = generateUnifiedHelpers(idType, parseStrategy, config, 'express')
  const bulkMethods = config.enableBulkOperations ? generateBulkControllers(model, modelCamel) : ''
  const baseMethods = generateExpressBaseMethods(model, modelCamel, config)
  const domainMethods = config.enableDomainMethods 
    ? generateExpressDomainMethods(model, analysis, modelCamel)
    : ''
  
  const bulkImport = config.enableBulkOperations ? `, z` : ''
  const maxBatchSize = config.bulkOperationLimits?.maxBatchSize || 100
  const bulkValidators = config.enableBulkOperations 
    ? `\n${generateBulkValidators(model.name, maxBatchSize)}` 
    : ''
  
  return `// @generated
// This file is automatically generated. Do not edit manually.

/**
 * SECURITY RECOMMENDATIONS:
 * 
 * 1. Rate Limiting: Add rate limiting middleware to prevent abuse
 *    - Bulk operations should have stricter limits
 *    - View increment endpoints vulnerable to automated abuse
 * 
 * 2. CSRF Protection: POST/PUT/DELETE endpoints should use CSRF tokens
 *    - Use helmet or csurf middleware
 *    - Verify tokens in production
 * 
 * 3. Request Size Limits: Configure body parser limits
 *    - Express: app.use(express.json({ limit: '1mb' }))
 *    - Prevents memory exhaustion attacks
 * 
 * 4. Authentication: These controllers assume authentication middleware
 *    - Add auth checks before these handlers
 *    - Validate user permissions for operations
 */

import type { Request, Response } from 'express'
import { ${modelCamel}Service } from '@/services/${modelKebab}/index.js'
import { ${model.name}CreateSchema, ${model.name}UpdateSchema, ${model.name}QuerySchema } from '@/validators/${modelKebab}/index.js'
import { ZodError${bulkImport} } from 'zod'
import { logger } from '@/logger.js'
${bulkValidators}
${helpers}
${baseMethods}${bulkMethods}${domainMethods}
`
}

/**
 * Generate base CRUD controller methods
 */
function generateExpressBaseMethods(
  model: ParsedModel,
  modelCamel: string,
  config: ControllerConfig
): string {
  const typeInterfaces = generateTypeInterfaces(model.name)
  const whereValidator = generateWhereValidator(model.name)
  
  return `${typeInterfaces}
${whereValidator}

/**
 * List all ${model.name} records (simple pagination from query string)
 */
export const list${model.name}s = async (
  req: Request<Record<string, never>, unknown, unknown, PaginationQuery>,
  res: Response
) => {
  try {
    const pagination = parsePagination(req.query)
    const result = await ${modelCamel}Service.list(pagination)
    
    return res.json(result)
  } catch (error) {
    return handleError(error, res, 'listing ${model.name}s', { operation: 'list' })
  }
}

/**
 * Search ${model.name} records (complex filtering via POST body)
 */
export const search${model.name}s = async (
  req: Request<Record<string, never>, unknown, unknown>,
  res: Response
) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Request body required' })
    }
    
    const query = ${model.name}QuerySchema.parse(req.body)
    const result = await ${modelCamel}Service.list(query)
    
    return res.json(result)
  } catch (error) {
    return handleError(error, res, 'searching ${model.name}s', { operation: 'search' })
  }
}

/**
 * Get ${model.name} by ID
 */
export const get${model.name} = async (
  req: Request<${model.name}Params>,
  res: Response
) => {
  try {
    const idResult = parseIdParam(req.params.id)
    
    if (!idResult.valid || idResult.id === undefined) {
      logger.warn({ idParam: req.params.id }, idResult.error || 'Invalid ID')
      return res.status(400).json({ error: idResult.error || 'Invalid ID' })
    }
    
    const parsedId = idResult.id
    const item = await ${modelCamel}Service.findById(parsedId)
    
    if (!item) {
      logger.info({ ${modelCamel}Id: parsedId }, 'Resource not found')
      return res.status(404).json({ error: 'Resource not found' })
    }
    
    return res.json(item)
  } catch (error) {
    return handleError(error, res, 'getting resource', { operation: 'get', id: req.params.id })
  }
}

/**
 * Create ${model.name}
 */
export const create${model.name} = async (
  req: Request<Record<string, never>, unknown, unknown>,
  res: Response
) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Request body required' })
    }
    
    const data = ${model.name}CreateSchema.parse(req.body)
    const item = await ${modelCamel}Service.create(data)
    
    return res.status(201).json(item)
  } catch (error) {
    return handleError(error, res, 'creating resource', { operation: 'create' })
  }
}

/**
 * Update ${model.name}
 */
export const update${model.name} = async (
  req: Request<${model.name}Params>,
  res: Response
) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Request body required' })
    }
    
    const idResult = parseIdParam(req.params.id)
    
    if (!idResult.valid || idResult.id === undefined) {
      logger.warn({ idParam: req.params.id }, idResult.error || 'Invalid ID')
      return res.status(400).json({ error: idResult.error || 'Invalid ID' })
    }
    
    const parsedId = idResult.id
    const data = ${model.name}UpdateSchema.parse(req.body)
    const item = await ${modelCamel}Service.update(parsedId, data)
    
    return res.json(item)
  } catch (error) {
    return handleError(error, res, 'updating resource', { operation: 'update', id: req.params.id })
  }
}

/**
 * Delete ${model.name}
 */
export const delete${model.name} = async (
  req: Request<${model.name}Params>,
  res: Response
) => {
  try {
    const idResult = parseIdParam(req.params.id)
    
    if (!idResult.valid || idResult.id === undefined) {
      logger.warn({ idParam: req.params.id }, idResult.error || 'Invalid ID')
      return res.status(400).json({ error: idResult.error || 'Invalid ID' })
    }
    
    const parsedId = idResult.id
    await ${modelCamel}Service.delete(parsedId)
    
    return res.status(204).send()
  } catch (error) {
    return handleError(error, res, 'deleting resource', { operation: 'delete', id: req.params.id })
  }
}

/**
 * Count ${model.name} records with optional filtering
 */
export const count${model.name}s = async (
  req: Request<Record<string, never>, unknown, CountBody>,
  res: Response
) => {
  try {
    // Validate where clause to prevent injection
    const validated = req.body ? Count${model.name}Schema.parse(req.body) : { where: undefined }
    const total = await ${modelCamel}Service.count(validated.where)
    
    return res.json({ total })
  } catch (error) {
    return handleError(error, res, 'counting resources', { operation: 'count' })
  }
}
`
}

/**
 * Generate domain-specific controller methods
 */
function generateExpressDomainMethods(
  model: ParsedModel,
  analysis: UnifiedModelAnalysis,
  modelCamel: string
): string {
  const methods: string[] = []
  
  // Slug lookup
  if (analysis.hasSlugField) {
    methods.push(`
/**
 * Get ${model.name} by slug
 */
export const get${model.name}BySlug = async (
  req: Request<${model.name}SlugParams>,
  res: Response
) => {
  const { slug } = req.params  // Declare outside try for catch scope access
  
  try {
    if (!slug || typeof slug !== 'string' || slug.trim() === '') {
      logger.warn({ slug }, 'Invalid or missing slug parameter')
      return res.status(400).json({ error: 'Slug parameter is required' })
    }
    
    const cleanSlug = slug.trim()
    const item = await ${modelCamel}Service.findBySlug(cleanSlug)
    
    if (!item) {
      logger.info({ slug: cleanSlug }, 'Resource not found by slug')
      return res.status(404).json({ error: 'Resource not found' })
    }
    
    return res.json(item)
  } catch (error) {
    // slug is accessible here (declared outside try)
    return handleError(error, res, 'getting resource by slug', { operation: 'getBySlug', slug: slug?.trim() || slug })
  }
}`)
  }
  
  // Published filtering  
  if (analysis.hasPublishedField) {
    methods.push(`
/**
 * List published ${model.name} records (GET with query params)
 */
export const listPublished${model.name}s = async (
  req: Request<Record<string, never>, unknown, unknown, PaginationQuery>,
  res: Response
) => {
  try {
    const pagination = parsePagination(req.query)
    const result = await ${modelCamel}Service.listPublished(pagination)
    
    return res.json(result)
  } catch (error) {
    return handleError(error, res, 'listing published resources', { operation: 'listPublished' })
  }
}

/**
 * Publish ${model.name}
 */
export const publish${model.name} = async (
  req: Request<${model.name}Params>,
  res: Response
) => {
  try {
    const idResult = parseIdParam(req.params.id)
    
    if (!idResult.valid || idResult.id === undefined) {
      logger.warn({ idParam: req.params.id }, idResult.error || 'Invalid ID')
      return res.status(400).json({ error: idResult.error || 'Invalid ID' })
    }
    
    const parsedId = idResult.id
    const item = await ${modelCamel}Service.publish(parsedId)
    
    if (!item) {
      logger.info({ ${modelCamel}Id: parsedId }, 'Resource not found for publish')
      return res.status(404).json({ error: 'Resource not found' })
    }
    
    return res.json(item)
  } catch (error) {
    return handleError(error, res, 'publishing resource', { operation: 'publish', id: req.params.id })
  }
}

/**
 * Unpublish ${model.name}
 */
export const unpublish${model.name} = async (
  req: Request<${model.name}Params>,
  res: Response
) => {
  try {
    const idResult = parseIdParam(req.params.id)
    
    if (!idResult.valid || idResult.id === undefined) {
      logger.warn({ idParam: req.params.id }, idResult.error || 'Invalid ID')
      return res.status(400).json({ error: idResult.error || 'Invalid ID' })
    }
    
    const parsedId = idResult.id
    const item = await ${modelCamel}Service.unpublish(parsedId)
    
    if (!item) {
      logger.info({ ${modelCamel}Id: parsedId }, 'Resource not found for unpublish')
      return res.status(404).json({ error: 'Resource not found' })
    }
    
    return res.json(item)
  } catch (error) {
    return handleError(error, res, 'unpublishing resource', { operation: 'unpublish', id: req.params.id })
  }
}`)
  }
  
  // View counter (with null check for specialFields)
  if (analysis.specialFields?.views) {
    methods.push(`
/**
 * Increment ${model.name} views
 */
export const increment${model.name}Views = async (
  req: Request<${model.name}Params>,
  res: Response
) => {
  try {
    const idResult = parseIdParam(req.params.id)
    
    if (!idResult.valid || idResult.id === undefined) {
      logger.warn({ idParam: req.params.id }, idResult.error || 'Invalid ID')
      return res.status(400).json({ error: idResult.error || 'Invalid ID' })
    }
    
    const parsedId = idResult.id
    await ${modelCamel}Service.incrementViews(parsedId)
    
    return res.status(204).send()
  } catch (error) {
    return handleError(error, res, 'incrementing views', { operation: 'incrementViews', id: req.params.id })
  }
}`)
  }
  
  // Approval workflow (with null check for specialFields)
  if (analysis.specialFields?.approved) {
    methods.push(`
/**
 * List pending ${model.name} records (GET with query params)
 */
export const listPending${model.name}s = async (
  req: Request<Record<string, never>, unknown, unknown, PaginationQuery>,
  res: Response
) => {
  try {
    const pagination = parsePagination(req.query)
    const result = await ${modelCamel}Service.listPending(pagination)
    
    return res.json(result)
  } catch (error) {
    return handleError(error, res, 'listing pending resources', { operation: 'listPending' })
  }
}

/**
 * Approve ${model.name}
 */
export const approve${model.name} = async (
  req: Request<${model.name}Params>,
  res: Response
) => {
  try {
    const idResult = parseIdParam(req.params.id)
    
    if (!idResult.valid || idResult.id === undefined) {
      logger.warn({ idParam: req.params.id }, idResult.error || 'Invalid ID')
      return res.status(400).json({ error: idResult.error || 'Invalid ID' })
    }
    
    const parsedId = idResult.id
    const item = await ${modelCamel}Service.approve(parsedId)
    
    if (!item) {
      logger.info({ ${modelCamel}Id: parsedId }, 'Resource not found for approval')
      return res.status(404).json({ error: 'Resource not found' })
    }
    
    return res.json(item)
  } catch (error) {
    return handleError(error, res, 'approving resource', { operation: 'approve', id: req.params.id })
  }
}`)
  }
  
  return methods.length > 0 ? '\n' + methods.join('') : ''
}

/**
 * Generate Fastify controller with proper implementation
 */
function generateFastifyController(
  model: ParsedModel,
  analysis: UnifiedModelAnalysis,
  modelKebab: string,
  modelCamel: string,
  idType: 'string' | 'number' | 'bigint',
  parseStrategy: 'string' | 'parseInt' | 'BigInt' | 'validate-uuid' | 'validate-cuid',
  config: ControllerConfig
): string {
  const helpers = generateUnifiedHelpers(idType, parseStrategy, config, 'fastify')
  const bulkMethods = config.enableBulkOperations ? generateFastifyBulkControllers(model, modelCamel) : ''
  const baseMethods = generateFastifyBaseMethods(model, modelCamel, config)
  const domainMethods = config.enableDomainMethods 
    ? generateFastifyDomainMethods(model, analysis, modelCamel)
    : ''
  
  const bulkImport = config.enableBulkOperations ? `, z` : ''
  const maxBatchSize = config.bulkOperationLimits?.maxBatchSize || 100
  const bulkValidators = config.enableBulkOperations 
    ? `\n${generateBulkValidators(model.name, maxBatchSize)}` 
    : ''
  
  return `// @generated
// This file is automatically generated. Do not edit manually.

/**
 * SECURITY RECOMMENDATIONS:
 * 
 * 1. Rate Limiting: Add rate limiting middleware to prevent abuse
 *    - Bulk operations should have stricter limits
 *    - View increment endpoints vulnerable to automated abuse
 * 
 * 2. CSRF Protection: POST/PUT/DELETE endpoints should use CSRF tokens
 *    - Use @fastify/csrf-protection plugin
 *    - Verify tokens in production
 * 
 * 3. Request Size Limits: Configure body parser limits
 *    - Fastify: fastify.register(require('@fastify/formbody'), { bodyLimit: 1048576 })
 *    - Prevents memory exhaustion attacks
 * 
 * 4. Authentication: These controllers assume authentication middleware
 *    - Add auth hooks before these handlers
 *    - Validate user permissions for operations
 */

import type { FastifyRequest, FastifyReply } from 'fastify'
import { ${modelCamel}Service } from '@/services/${modelKebab}/index.js'
import { ${model.name}CreateSchema, ${model.name}UpdateSchema, ${model.name}QuerySchema } from '@/validators/${modelKebab}/index.js'
import { ZodError${bulkImport} } from 'zod'
import { logger } from '@/logger.js'
${bulkValidators}
${helpers}
${baseMethods}${bulkMethods}${domainMethods}
`
}

/**
 * Generate Fastify base CRUD methods
 */
function generateFastifyBaseMethods(
  model: ParsedModel,
  modelCamel: string,
  config: ControllerConfig
): string {
  const typeInterfaces = generateTypeInterfaces(model.name)
  const whereValidator = generateWhereValidator(model.name)
  
  return `${typeInterfaces}
${whereValidator}

/**
 * List all ${model.name} records
 */
export const list${model.name}s = async (
  req: FastifyRequest<{ Querystring: PaginationQuery }>,
  reply: FastifyReply
) => {
  try {
    const pagination = parsePagination(req.query as Record<string, unknown>)
    const result = await ${modelCamel}Service.list(pagination)
    
    return reply.send(result)
  } catch (error) {
    return handleError(error, reply, 'listing ${model.name}s', {})
  }
}

/**
 * Search ${model.name} records
 */
export const search${model.name}s = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return reply.code(400).send({ error: 'Request body required' })
    }
    
    const query = ${model.name}QuerySchema.parse(req.body)
    const result = await ${modelCamel}Service.list(query)
    
    return reply.send(result)
  } catch (error) {
    return handleError(error, reply, 'searching resources', { operation: 'search' })
  }
}

/**
 * Get ${model.name} by ID
 */
export const get${model.name} = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const idResult = parseIdParam(req.params.id)
    
    if (!idResult.valid || idResult.id === undefined) {
      logger.warn({ idParam: req.params.id }, idResult.error || 'Invalid ID')
      return reply.code(400).send({ error: idResult.error || 'Invalid ID' })
    }
    
    const parsedId = idResult.id
    const item = await ${modelCamel}Service.findById(parsedId)
    
    if (!item) {
      logger.info({ ${modelCamel}Id: parsedId }, 'Resource not found')
      return reply.code(404).send({ error: 'Resource not found' })
    }
    
    return reply.send(item)
  } catch (error) {
    return handleError(error, reply, 'getting resource', { operation: 'get', id: req.params.id })
  }
}

/**
 * Create ${model.name}
 */
export const create${model.name} = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return reply.code(400).send({ error: 'Request body required' })
    }
    
    const data = ${model.name}CreateSchema.parse(req.body)
    const item = await ${modelCamel}Service.create(data)
    
    return reply.code(201).send(item)
  } catch (error) {
    return handleError(error, reply, 'creating resource', { operation: 'create' })
  }
}

/**
 * Update ${model.name}
 */
export const update${model.name} = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return reply.code(400).send({ error: 'Request body required' })
    }
    
    const idResult = parseIdParam(req.params.id)
    
    if (!idResult.valid || idResult.id === undefined) {
      logger.warn({ idParam: req.params.id }, idResult.error || 'Invalid ID')
      return reply.code(400).send({ error: idResult.error || 'Invalid ID' })
    }
    
    const parsedId = idResult.id
    const data = ${model.name}UpdateSchema.parse(req.body)
    const item = await ${modelCamel}Service.update(parsedId, data)
    
    return reply.send(item)
  } catch (error) {
    return handleError(error, reply, 'updating resource', { operation: 'update', id: req.params.id })
  }
}

/**
 * Delete ${model.name}
 */
export const delete${model.name} = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const idResult = parseIdParam(req.params.id)
    
    if (!idResult.valid || idResult.id === undefined) {
      logger.warn({ idParam: req.params.id }, idResult.error || 'Invalid ID')
      return reply.code(400).send({ error: idResult.error || 'Invalid ID' })
    }
    
    const parsedId = idResult.id
    await ${modelCamel}Service.delete(parsedId)
    
    return reply.code(204).send()
  } catch (error) {
    return handleError(error, reply, 'deleting resource', { operation: 'delete', id: req.params.id })
  }
}

/**
 * Count ${model.name} records with optional filtering
 */
export const count${model.name}s = async (
  req: FastifyRequest<{ Body: CountBody }>,
  reply: FastifyReply
) => {
  try {
    // Validate where clause to prevent injection
    const validated = req.body ? Count${model.name}Schema.parse(req.body) : { where: undefined }
    const total = await ${modelCamel}Service.count(validated.where)
    
    return reply.send({ total })
  } catch (error) {
    return handleError(error, reply, 'counting resources', { operation: 'count' })
  }
}
`
}

/**
 * Generate Fastify bulk controllers
 */
function generateFastifyBulkControllers(model: ParsedModel, modelCamel: string): string {
  return `
/**
 * Bulk create ${model.name} records
 */
export const bulkCreate${model.name}s = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return reply.code(400).send({ error: 'Request body required' })
    }
    
    const validated = BulkCreate${model.name}Schema.parse(req.body)
    const result = await ${modelCamel}Service.createMany(validated.data)
    
    logger.info({ count: result.count }, 'Bulk created records')
    return reply.code(201).send({ 
      count: result.count, 
      message: \`Created \${result.count} records\`
    })
  } catch (error) {
    return handleError(error, reply, 'bulk creating resources', { operation: 'bulkCreate' })
  }
}

/**
 * Bulk update ${model.name} records
 */
export const bulkUpdate${model.name}s = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return reply.code(400).send({ error: 'Request body required' })
    }
    
    const validated = BulkUpdate${model.name}Schema.parse(req.body)
    const result = await ${modelCamel}Service.updateMany(validated.where, validated.data)
    
    logger.info({ count: result.count }, 'Bulk updated records')
    return reply.send({ 
      count: result.count, 
      message: \`Updated \${result.count} records\`
    })
  } catch (error) {
    return handleError(error, reply, 'bulk updating resources', { operation: 'bulkUpdate' })
  }
}

/**
 * Bulk delete ${model.name} records
 */
export const bulkDelete${model.name}s = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return reply.code(400).send({ error: 'Request body required' })
    }
    
    const validated = BulkDelete${model.name}Schema.parse(req.body)
    const result = await ${modelCamel}Service.deleteMany(validated.where)
    
    logger.info({ count: result.count }, 'Bulk deleted records')
    return reply.send({ 
      count: result.count, 
      message: \`Deleted \${result.count} records\`
    })
  } catch (error) {
    return handleError(error, reply, 'bulk deleting resources', { operation: 'bulkDelete' })
  }
}
`
}

/**
 * Generate Fastify domain methods
 */
function generateFastifyDomainMethods(
  model: ParsedModel,
  analysis: UnifiedModelAnalysis,
  modelCamel: string
): string {
  const methods: string[] = []
  
  if (analysis.hasSlugField) {
    methods.push(`
/**
 * Get ${model.name} by slug
 */
export const get${model.name}BySlug = async (req: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) => {
  try {
    const { slug } = req.params
    
    if (!slug || typeof slug !== 'string' || slug.trim() === '') {
      logger.warn({ slug }, 'Invalid or missing slug parameter')
      return reply.code(400).send({ error: 'Slug parameter is required' })
    }
    
    const item = await ${modelCamel}Service.findBySlug(slug.trim())
    
    if (!item) {
      logger.info({ slug }, '${model.name} not found by slug')
      return reply.code(404).send({ error: '${model.name} not found' })
    }
    
    return reply.send(item)
  } catch (error) {
    return handleError(error, reply, 'getting ${model.name} by slug', { slug: req.params.slug })
  }
}`)
  }
  
  if (analysis.hasPublishedField) {
    methods.push(`
/**
 * List published ${model.name} records
 */
export const listPublished${model.name}s = async (
  req: FastifyRequest<{ Querystring: PaginationQuery }>,
  reply: FastifyReply
) => {
  try {
    const pagination = parsePagination(req.query as Record<string, unknown>)
    const result = await ${modelCamel}Service.listPublished(pagination)
    
    return reply.send(result)
  } catch (error) {
    return handleError(error, reply, 'listing published resources', { operation: 'listPublished' })
  }
}

/**
 * Publish ${model.name}
 */
export const publish${model.name} = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const idResult = parseIdParam(req.params.id)
    
    if (!idResult.valid || idResult.id === undefined) {
      logger.warn({ idParam: req.params.id }, idResult.error || 'Invalid ID')
      return reply.code(400).send({ error: idResult.error || 'Invalid ID' })
    }
    
    const parsedId = idResult.id
    const item = await ${modelCamel}Service.publish(parsedId)
    
    if (!item) {
      logger.info({ ${modelCamel}Id: parsedId }, 'Resource not found for publish')
      return reply.code(404).send({ error: 'Resource not found' })
    }
    
    return reply.send(item)
  } catch (error) {
    return handleError(error, reply, 'publishing resource', { operation: 'publish', id: req.params.id })
  }
}

/**
 * Unpublish ${model.name}
 */
export const unpublish${model.name} = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const idResult = parseIdParam(req.params.id)
    
    if (!idResult.valid || idResult.id === undefined) {
      logger.warn({ idParam: req.params.id }, idResult.error || 'Invalid ID')
      return reply.code(400).send({ error: idResult.error || 'Invalid ID' })
    }
    
    const parsedId = idResult.id
    const item = await ${modelCamel}Service.unpublish(parsedId)
    
    if (!item) {
      logger.info({ ${modelCamel}Id: parsedId }, 'Resource not found for unpublish')
      return reply.code(404).send({ error: 'Resource not found' })
    }
    
    return reply.send(item)
  } catch (error) {
    return handleError(error, reply, 'unpublishing resource', { operation: 'unpublish', id: req.params.id })
  }
}`)
  }
  
  if (analysis.specialFields?.views) {
    methods.push(`
/**
 * Increment ${model.name} views
 */
export const increment${model.name}Views = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const idResult = parseIdParam(req.params.id)
    
    if (!idResult.valid || idResult.id === undefined) {
      logger.warn({ idParam: req.params.id }, idResult.error || 'Invalid ID')
      return reply.code(400).send({ error: idResult.error || 'Invalid ID' })
    }
    
    const parsedId = idResult.id
    await ${modelCamel}Service.incrementViews(parsedId)
    
    return reply.code(204).send()
  } catch (error) {
    return handleError(error, reply, 'incrementing views', { operation: 'incrementViews', id: req.params.id })
  }
}`)
  }
  
  if (analysis.specialFields?.approved) {
    methods.push(`
/**
 * List pending ${model.name} records
 */
export const listPending${model.name}s = async (
  req: FastifyRequest<{ Querystring: PaginationQuery }>,
  reply: FastifyReply
) => {
  try {
    const pagination = parsePagination(req.query as Record<string, unknown>)
    const result = await ${modelCamel}Service.listPending(pagination)
    
    return reply.send(result)
  } catch (error) {
    return handleError(error, reply, 'listing pending resources', { operation: 'listPending' })
  }
}

/**
 * Approve ${model.name}
 */
export const approve${model.name} = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const idResult = parseIdParam(req.params.id)
    
    if (!idResult.valid || idResult.id === undefined) {
      logger.warn({ idParam: req.params.id }, idResult.error || 'Invalid ID')
      return reply.code(400).send({ error: idResult.error || 'Invalid ID' })
    }
    
    const parsedId = idResult.id
    const item = await ${modelCamel}Service.approve(parsedId)
    
    if (!item) {
      logger.info({ ${modelCamel}Id: parsedId }, 'Resource not found for approval')
      return reply.code(404).send({ error: 'Resource not found' })
    }
    
    return reply.send(item)
  } catch (error) {
    return handleError(error, reply, 'approving resource', { operation: 'approve', id: req.params.id })
  }
}`)
  }
  
  return methods.length > 0 ? '\n' + methods.join('') : ''
}





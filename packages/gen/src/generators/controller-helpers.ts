/**
 * Controller generation utilities - DRY helpers for controller code generation
 */

import type { ParsedModel } from '../dmmf-parser.js'

/**
 * Configuration for controller generation
 */
export interface ControllerConfig {
  paginationDefaults?: {
    skip: number
    take: number
    maxLimit?: number  // Maximum allowed page size
  }
  enableBulkOperations?: boolean
  enableDomainMethods?: boolean
  enableTransactions?: boolean  // Wrap bulk operations in transactions
  sanitizeErrorMessages?: boolean  // Use generic error messages (default: true for production)
}

export const DEFAULT_CONTROLLER_CONFIG: ControllerConfig = {
  paginationDefaults: { skip: 0, take: 20, maxLimit: 100 },
  enableBulkOperations: true,
  enableDomainMethods: true,
  enableTransactions: false,  // Service layer responsibility
  sanitizeErrorMessages: true
}

/**
 * Generate centralized ID validation helper
 */
export function generateIdValidator(idType: string, sanitizeErrors: boolean = true): string {
  const errorMessage = sanitizeErrors ? 'Invalid identifier' : 
    (idType === 'number' ? 'Invalid ID format: expected a valid number' : 'Invalid ID format: expected a non-empty string')
  
  if (idType === 'number') {
    return `
/**
 * Parse and validate ID parameter
 */
function parseIdParam(idParam: string): { valid: boolean; id?: number; error?: string } {
  if (!idParam) {
    return { valid: false, error: '${errorMessage}' }
  }
  const parsed = parseInt(idParam, 10)
  if (isNaN(parsed) || !Number.isFinite(parsed) || parsed < 0) {
    return { valid: false, error: '${errorMessage}' }
  }
  return { valid: true, id: parsed }
}`
  }
  
  return `
/**
 * Parse and validate ID parameter
 */
function parseIdParam(idParam: string): { valid: boolean; id?: string; error?: string } {
  if (!idParam || typeof idParam !== 'string' || idParam.trim() === '') {
    return { valid: false, error: '${errorMessage}' }
  }
  return { valid: true, id: idParam.trim() }
}`
}

/**
 * Generate error response utility (sanitizes sensitive log data)
 */
export function generateErrorHandler(sanitizeErrors: boolean = true): string {
  const notFoundMessage = sanitizeErrors ? 'Resource not found' : '${model.name} not found'
  
  return `
/**
 * Sanitize log context to remove sensitive data
 */
function sanitizeLogContext(context: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(context)) {
    // Only log field counts, not actual field names
    if (key === 'bodyKeys' && Array.isArray(value)) {
      sanitized.bodyFieldCount = value.length
    } else if (key !== 'body' && key !== 'password' && key !== 'token') {
      sanitized[key] = value
    }
  }
  return sanitized
}

/**
 * Standard error response handler
 */
function handleError(
  error: unknown,
  res: Response,
  context: string,
  logContext?: Record<string, unknown>
): Response {
  const sanitized = logContext ? sanitizeLogContext(logContext) : {}
  
  if (error instanceof ZodError) {
    logger.warn({ ...sanitized, validationErrors: error.errors }, \`Validation error: \${context}\`)
    return res.status(400).json({ error: 'Validation Error', details: error.errors })
  }
  
  logger.error({ ...sanitized, error }, \`Error: \${context}\`)
  return res.status(500).json({ error: 'Internal Server Error' })
}`
}

/**
 * Generate bulk operation validators
 */
export function generateBulkValidators(modelName: string): string {
  return `
/**
 * Bulk create input schema
 */
const BulkCreate${modelName}Schema = z.object({
  data: z.array(${modelName}CreateSchema)
})

/**
 * Bulk update input schema
 */
const BulkUpdate${modelName}Schema = z.object({
  where: z.record(z.unknown()),
  data: z.record(z.unknown())
})

/**
 * Bulk delete input schema
 */
const BulkDelete${modelName}Schema = z.object({
  where: z.record(z.unknown())
})`
}

/**
 * Generate pagination config access
 */
export function generatePaginationHelper(config: ControllerConfig): string {
  const defaults = config.paginationDefaults || DEFAULT_CONTROLLER_CONFIG.paginationDefaults!
  const { skip, take, maxLimit } = defaults
  const max = maxLimit || 100
  
  return `
/**
 * Parse pagination from query params with defaults and limits
 */
function parsePagination(query: Record<string, unknown>): { skip: number; take: number } {
  const skipParam = query.skip ? parseInt(query.skip as string, 10) : ${skip}
  const takeParam = query.take ? parseInt(query.take as string, 10) : ${take}
  
  return {
    skip: isNaN(skipParam) || skipParam < 0 ? ${skip} : skipParam,
    take: isNaN(takeParam) || takeParam < 1 ? ${take} : Math.min(takeParam, ${max})
  }
}`
}

/**
 * Format template literal content to avoid escaping issues
 */
export function escapeTemplateLiteral(str: string): string {
  return str.replace(/\$/g, '\\$').replace(/`/g, '\\`')
}

/**
 * Generate method comment header
 */
export function generateMethodComment(description: string): string {
  return `/**
 * ${description}
 */`
}

/**
 * Generate unified helpers for both Express and Fastify
 * Eliminates duplication between framework-specific generators
 */
export function generateUnifiedHelpers(
  idType: string,
  config: ControllerConfig,
  framework: 'express' | 'fastify'
): string {
  const sanitize = config.sanitizeErrorMessages ?? true
  const idValidator = generateIdValidator(idType, sanitize)
  const pagination = generatePaginationHelper(config)
  
  if (framework === 'fastify') {
    return `${idValidator}
${generateFastifyErrorHandler(sanitize)}
${pagination}
`
  }
  
  return `${idValidator}
${generateErrorHandler(sanitize)}
${pagination}
`
}

/**
 * Generate Fastify-specific error handler
 */
function generateFastifyErrorHandler(sanitizeErrors: boolean = true): string {
  return `
/**
 * Sanitize log context to remove sensitive data
 */
function sanitizeLogContext(context: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(context)) {
    if (key === 'bodyKeys' && Array.isArray(value)) {
      sanitized.bodyFieldCount = value.length
    } else if (key !== 'body' && key !== 'password' && key !== 'token') {
      sanitized[key] = value
    }
  }
  return sanitized
}

/**
 * Standard error response handler for Fastify
 */
function handleError(
  error: unknown,
  reply: FastifyReply,
  context: string,
  logContext?: Record<string, unknown>
): FastifyReply {
  const sanitized = logContext ? sanitizeLogContext(logContext) : {}
  
  if (error instanceof ZodError) {
    logger.warn({ ...sanitized, validationErrors: error.errors }, \`Validation error: \${context}\`)
    return reply.code(400).send({ error: 'Validation Error', details: error.errors })
  }
  
  logger.error({ ...sanitized, error }, \`Error: \${context}\`)
  return reply.code(500).send({ error: 'Internal Server Error' })
}`
}

/**
 * Check if model has soft delete field
 */
export function hasSoftDelete(specialFields: Record<string, unknown> | undefined): boolean {
  return !!specialFields?.deletedAt
}

/**
 * Generate count with filter support
 */
export function generateCountMethodSignature(modelName: string): string {
  return `
/**
 * Count ${modelName} records with optional filtering
 */
export interface CountQuery {
  where?: Record<string, unknown>
}`
}


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
  bulkOperationLimits?: {
    maxBatchSize?: number  // Maximum records in bulk operations (default: 100)
  }
  enableBulkOperations?: boolean
  enableDomainMethods?: boolean
  enableTransactions?: boolean  // Wrap bulk operations in transactions
  sanitizeErrorMessages?: boolean  // Use generic error messages (default: true for production)
  sanitizeValidationErrors?: boolean  // Sanitize Zod error details (default: false)
}

export const DEFAULT_CONTROLLER_CONFIG: ControllerConfig = {
  paginationDefaults: { skip: 0, take: 20, maxLimit: 100 },
  bulkOperationLimits: { maxBatchSize: 100 },
  enableBulkOperations: true,
  enableDomainMethods: true,
  enableTransactions: false,  // Service layer responsibility
  sanitizeErrorMessages: true,
  sanitizeValidationErrors: false  // Show full errors in development
}

/**
 * Generate centralized ID validation helper with proper type handling
 */
export function generateIdValidator(
  idType: 'string' | 'number' | 'bigint',
  parseStrategy: 'string' | 'parseInt' | 'BigInt' | 'validate-uuid' | 'validate-cuid',
  sanitizeErrors: boolean = true
): string {
  const errorMessage = sanitizeErrors ? 'Invalid identifier' : 'Invalid ID format'
  
  // BigInt IDs
  if (idType === 'bigint') {
    return `
/**
 * Parse and validate BigInt ID parameter
 */
function parseIdParam(idParam: string): { valid: boolean; id?: bigint; error?: string } {
  if (!idParam) {
    return { valid: false, error: '${errorMessage}' }
  }
  try {
    const parsed = BigInt(idParam)
    if (parsed < 0n) {
      return { valid: false, error: '${errorMessage}' }
    }
    return { valid: true, id: parsed }
  } catch {
    return { valid: false, error: '${errorMessage}' }
  }
}`
  }
  
  // Number IDs (Int, Float, Decimal)
  if (idType === 'number') {
    return `
/**
 * Parse and validate numeric ID parameter
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
  
  // UUID validation
  if (parseStrategy === 'validate-uuid') {
    return `
/**
 * Parse and validate UUID ID parameter
 */
function parseIdParam(idParam: string): { valid: boolean; id?: string; error?: string } {
  if (!idParam || typeof idParam !== 'string') {
    return { valid: false, error: '${errorMessage}' }
  }
  
  const trimmed = idParam.trim()
  // UUID v4 format: 8-4-4-4-12 hex characters
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  
  if (!uuidRegex.test(trimmed)) {
    return { valid: false, error: '${errorMessage}' }
  }
  
  return { valid: true, id: trimmed }
}`
  }
  
  // CUID validation
  if (parseStrategy === 'validate-cuid') {
    return `
/**
 * Parse and validate CUID ID parameter
 */
function parseIdParam(idParam: string): { valid: boolean; id?: string; error?: string } {
  if (!idParam || typeof idParam !== 'string') {
    return { valid: false, error: '${errorMessage}' }
  }
  
  const trimmed = idParam.trim()
  // CUID format: starts with 'c', 25 characters total, alphanumeric
  const cuidRegex = /^c[a-z0-9]{24}$/i
  
  if (!cuidRegex.test(trimmed)) {
    return { valid: false, error: '${errorMessage}' }
  }
  
  return { valid: true, id: trimmed }
}`
  }
  
  // Generic string IDs
  return `
/**
 * Parse and validate string ID parameter
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
 * Standard error response handler with enhanced logging
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
  
  // Include error type and stack trace for debugging
  const errorInfo = error instanceof Error ? {
    message: error.message,
    type: error.constructor.name,
    stack: error.stack
  } : { error }
  
  logger.error({ ...sanitized, ...errorInfo }, \`Error: \${context}\`)
  return res.status(500).json({ error: 'Internal Server Error' })
}`
}

/**
 * Generate bulk operation validators with size limits
 */
export function generateBulkValidators(modelName: string, maxBatchSize: number = 100): string {
  return `
/**
 * Bulk create input schema with size limit
 * Prevents resource exhaustion attacks by limiting batch size
 */
const BulkCreate${modelName}Schema = z.object({
  data: z.array(${modelName}CreateSchema).min(1).max(${maxBatchSize})
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
 * Generate pagination config access with proper type handling
 */
export function generatePaginationHelper(config: ControllerConfig): string {
  const defaults = config.paginationDefaults || DEFAULT_CONTROLLER_CONFIG.paginationDefaults!
  const { skip, take, maxLimit } = defaults
  const max = maxLimit || 100
  
  return `
/**
 * Parse pagination from query params with defaults and limits
 * Handles both string and string[] query param types
 */
function parsePagination(query: Record<string, unknown>): { skip: number; take: number } {
  // Query params can be string or string[], take first value if array
  const skipValue = Array.isArray(query.skip) ? query.skip[0] : query.skip
  const takeValue = Array.isArray(query.take) ? query.take[0] : query.take
  
  const skipParam = skipValue ? parseInt(skipValue as string, 10) : ${skip}
  const takeParam = takeValue ? parseInt(takeValue as string, 10) : ${take}
  
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
  idType: 'string' | 'number' | 'bigint',
  parseStrategy: 'string' | 'parseInt' | 'BigInt' | 'validate-uuid' | 'validate-cuid',
  config: ControllerConfig,
  framework: 'express' | 'fastify'
): string {
  const sanitize = config.sanitizeErrorMessages ?? true
  const idValidator = generateIdValidator(idType, parseStrategy, sanitize)
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
 * Standard error response handler for Fastify with enhanced logging
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
  
  // Include error type and stack trace for debugging
  const errorInfo = error instanceof Error ? {
    message: error.message,
    type: error.constructor.name,
    stack: error.stack
  } : { error }
  
  logger.error({ ...sanitized, ...errorInfo }, \`Error: \${context}\`)
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
 * Generate type interfaces for controllers
 */
export function generateTypeInterfaces(modelName: string): string {
  return `/**
 * Request type definitions for type safety
 * NOTE: These are TypeScript compile-time types only. Runtime validation
 * is performed by parseIdParam(), Zod schemas, and explicit checks.
 */
interface ${modelName}Params {
  id: string
}

interface ${modelName}SlugParams {
  slug: string
}

interface PaginationQuery {
  skip?: string | string[]  // Query params can be string or array
  take?: string | string[]
}

interface CountBody {
  where?: Record<string, unknown>
}`
}

/**
 * Generate where clause validator for count operations
 */
export function generateWhereValidator(modelName: string): string {
  return `
/**
 * Count query schema with where clause validation
 * Prevents arbitrary object injection by validating structure
 */
const Count${modelName}Schema = z.object({
  where: z.record(z.unknown()).optional()
})`
}


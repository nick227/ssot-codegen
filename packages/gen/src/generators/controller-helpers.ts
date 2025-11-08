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
  }
  enableBulkOperations?: boolean
  enableDomainMethods?: boolean
}

export const DEFAULT_CONTROLLER_CONFIG: ControllerConfig = {
  paginationDefaults: { skip: 0, take: 20 },
  enableBulkOperations: true,
  enableDomainMethods: true
}

/**
 * Generate centralized ID validation helper
 */
export function generateIdValidator(idType: string): string {
  if (idType === 'number') {
    return `
/**
 * Parse and validate ID parameter
 */
function parseIdParam(idParam: string): { valid: boolean; id?: number; error?: string } {
  const parsed = parseInt(idParam, 10)
  if (isNaN(parsed) || !Number.isFinite(parsed)) {
    return { valid: false, error: 'Invalid ID format: expected a valid number' }
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
    return { valid: false, error: 'Invalid ID format: expected a non-empty string' }
  }
  return { valid: true, id: idParam.trim() }
}`
}

/**
 * Generate error response utility
 */
export function generateErrorHandler(): string {
  return `
/**
 * Standard error response handler
 */
function handleError(
  error: unknown,
  res: Response,
  context: string,
  logContext?: Record<string, unknown>
): Response {
  if (error instanceof ZodError) {
    logger.warn({ ...logContext, validationErrors: error.errors }, \`Validation error: \${context}\`)
    return res.status(400).json({ error: 'Validation Error', details: error.errors })
  }
  
  logger.error({ ...logContext, error }, \`Error: \${context}\`)
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
  const { skip, take } = config.paginationDefaults || DEFAULT_CONTROLLER_CONFIG.paginationDefaults!
  
  return `
/**
 * Parse pagination from query params with defaults
 */
function parsePagination(query: Record<string, unknown>): { skip: number; take: number } {
  const skip = query.skip ? parseInt(query.skip as string, 10) : ${skip}
  const take = query.take ? parseInt(query.take as string, 10) : ${take}
  
  return {
    skip: isNaN(skip) || skip < 0 ? ${skip} : skip,
    take: isNaN(take) || take < 1 ? ${take} : Math.min(take, 100) // cap at 100
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


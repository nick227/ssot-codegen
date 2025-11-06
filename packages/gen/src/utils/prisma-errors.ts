/**
 * Prisma Error Handling Utilities
 * 
 * Centralized handling for Prisma-specific error codes
 * Used across service generators to handle common database errors
 * 
 * @see https://www.prisma.io/docs/reference/api-reference/error-reference
 */

import { safeErrorMessage } from './errors.js'

/**
 * Common Prisma error codes
 */
export enum PrismaErrorCode {
  /** Record not found */
  NOT_FOUND = 'P2025',
  
  /** Unique constraint violation */
  UNIQUE_CONSTRAINT = 'P2002',
  
  /** Foreign key constraint violation */
  FOREIGN_KEY_CONSTRAINT = 'P2003',
  
  /** Required field missing */
  REQUIRED_FIELD_MISSING = 'P2011',
  
  /** Invalid input data */
  INVALID_INPUT = 'P2012',
  
  /** Database connection error */
  CONNECTION_ERROR = 'P1001',
  
  /** Query timeout */
  TIMEOUT = 'P2024',
}

/**
 * Type guard to check if error is a Prisma error
 */
export function isPrismaError(error: unknown): error is Error & { code: string } {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof (error as any).code === 'string' &&
    ((error as any).code as string).startsWith('P')
  )
}

/**
 * Type guard to check if error is a specific Prisma error code
 * 
 * @example
 * if (isPrismaErrorCode(error, PrismaErrorCode.NOT_FOUND)) {
 *   return null // Handle not found
 * }
 */
export function isPrismaErrorCode(
  error: unknown,
  code: PrismaErrorCode | string
): error is Error & { code: string } {
  return isPrismaError(error) && (error as any).code === code
}

/**
 * Handle Prisma P2025 (Not Found) error
 * 
 * Returns null for not found, rethrows other errors
 * 
 * @example
 * try {
 *   return await prisma.user.update({ where: { id }, data })
 * } catch (error) {
 *   return handleNotFound(error)
 * }
 */
export function handleNotFound<T>(error: unknown): T | null {
  if (isPrismaErrorCode(error, PrismaErrorCode.NOT_FOUND)) {
    return null
  }
  throw error
}

/**
 * Handle Prisma P2025 (Not Found) error with boolean return
 * 
 * Returns false for not found, rethrows other errors
 * 
 * @example
 * try {
 *   await prisma.user.delete({ where: { id } })
 *   return true
 * } catch (error) {
 *   return handleNotFoundBoolean(error)
 * }
 */
export function handleNotFoundBoolean(error: unknown): boolean {
  if (isPrismaErrorCode(error, PrismaErrorCode.NOT_FOUND)) {
    return false
  }
  throw error
}

/**
 * Extract field name from Prisma unique constraint error
 * 
 * @example
 * // Error: Unique constraint failed on the fields: (`email`)
 * getUniqueConstraintField(error) // "email"
 */
export function getUniqueConstraintField(error: unknown): string | null {
  if (!isPrismaErrorCode(error, PrismaErrorCode.UNIQUE_CONSTRAINT)) {
    return null
  }
  
  const message = safeErrorMessage(error)
  const match = message.match(/fields: \(`([^`]+)`\)/)
  return match ? match[1] : null
}

/**
 * Get user-friendly error message for Prisma errors
 * 
 * @example
 * catch (error) {
 *   const message = getPrismaErrorMessage(error)
 *   return res.status(400).json({ error: message })
 * }
 */
export function getPrismaErrorMessage(error: unknown, modelName?: string): string {
  if (!isPrismaError(error)) {
    return safeErrorMessage(error)
  }
  
  const code = (error as any).code
  const model = modelName || 'Record'
  
  switch (code) {
    case PrismaErrorCode.NOT_FOUND:
      return `${model} not found`
      
    case PrismaErrorCode.UNIQUE_CONSTRAINT: {
      const field = getUniqueConstraintField(error)
      return field
        ? `${model} with this ${field} already exists`
        : `${model} already exists`
    }
      
    case PrismaErrorCode.FOREIGN_KEY_CONSTRAINT:
      return `Cannot perform operation due to related records`
      
    case PrismaErrorCode.REQUIRED_FIELD_MISSING:
      return `Required field is missing`
      
    case PrismaErrorCode.INVALID_INPUT:
      return `Invalid input data`
      
    case PrismaErrorCode.CONNECTION_ERROR:
      return `Database connection error`
      
    case PrismaErrorCode.TIMEOUT:
      return `Database query timeout`
      
    default:
      return `Database error: ${safeErrorMessage(error)}`
  }
}

/**
 * Get HTTP status code for Prisma error
 * 
 * @example
 * catch (error) {
 *   const statusCode = getPrismaErrorStatusCode(error)
 *   const message = getPrismaErrorMessage(error)
 *   return res.status(statusCode).json({ error: message })
 * }
 */
export function getPrismaErrorStatusCode(error: unknown): number {
  if (!isPrismaError(error)) {
    return 500
  }
  
  const code = (error as any).code
  
  switch (code) {
    case PrismaErrorCode.NOT_FOUND:
      return 404
      
    case PrismaErrorCode.UNIQUE_CONSTRAINT:
    case PrismaErrorCode.FOREIGN_KEY_CONSTRAINT:
    case PrismaErrorCode.REQUIRED_FIELD_MISSING:
    case PrismaErrorCode.INVALID_INPUT:
      return 400
      
    case PrismaErrorCode.TIMEOUT:
      return 504
      
    case PrismaErrorCode.CONNECTION_ERROR:
    default:
      return 500
  }
}

/**
 * Wrap Prisma operation with standardized error handling
 * 
 * @example
 * const user = await wrapPrismaOperation(
 *   () => prisma.user.update({ where: { id }, data }),
 *   'User'
 * )
 * 
 * if (user.error) {
 *   return res.status(user.statusCode).json({ error: user.error })
 * }
 * 
 * return res.json(user.data)
 */
export async function wrapPrismaOperation<T>(
  operation: () => Promise<T>,
  modelName?: string
): Promise<
  | { data: T; error: null; statusCode: 200 }
  | { data: null; error: string; statusCode: number }
> {
  try {
    const data = await operation()
    return { data, error: null, statusCode: 200 }
  } catch (error) {
    return {
      data: null,
      error: getPrismaErrorMessage(error, modelName),
      statusCode: getPrismaErrorStatusCode(error)
    }
  }
}

/**
 * Generate Prisma error handling code template
 * Used by generators to create consistent error handling
 */
export function generatePrismaErrorHandlingTemplate(modelName: string, idType: 'string' | 'number'): string {
  return `
  /**
   * Update ${modelName}
   */
  async update(id: ${idType}, data: ${modelName}UpdateDTO) {
    try {
      return await prisma.${modelName.toLowerCase()}.update({
        where: { id },
        data
      })
    } catch (error) {
      return handleNotFound(error)
    }
  },
  
  /**
   * Delete ${modelName}
   */
  async delete(id: ${idType}) {
    try {
      await prisma.${modelName.toLowerCase()}.delete({
        where: { id }
      })
      return true
    } catch (error) {
      return handleNotFoundBoolean(error)
    }
  }`
}


/**
 * Error Handling Utilities
 * 
 * Centralized error handling patterns to eliminate duplication
 * Used across 105+ locations in generators and generated code
 */

/**
 * Safely extract error message from unknown error type
 * 
 * Handles:
 * - Error objects
 * - String errors
 * - Objects with message property
 * - Unknown types
 * 
 * @example
 * try {
 *   throw new Error("Something broke")
 * } catch (error) {
 *   console.error(safeErrorMessage(error)) // "Something broke"
 * }
 * 
 * @example
 * try {
 *   throw "String error"
 * } catch (error) {
 *   console.error(safeErrorMessage(error)) // "String error"
 * }
 */
export function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }
  
  return 'Unknown error'
}

/**
 * Safely extract error stack trace
 * 
 * @example
 * try {
 *   throw new Error("Oops")
 * } catch (error) {
 *   console.error(safeErrorStack(error))
 * }
 */
export function safeErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack
  }
  
  if (error && typeof error === 'object' && 'stack' in error) {
    return String(error.stack)
  }
  
  return undefined
}

/**
 * Create a standardized error response object
 * 
 * @example
 * catch (error) {
 *   return res.status(500).json(toErrorResponse(error))
 * }
 */
export function toErrorResponse(error: unknown, defaultMessage = 'An error occurred'): {
  error: string
  message: string
  stack?: string
} {
  const message = safeErrorMessage(error) || defaultMessage
  const stack = process.env.NODE_ENV === 'development' ? safeErrorStack(error) : undefined
  
  return {
    error: 'Error',
    message,
    ...(stack && { stack })
  }
}

/**
 * Type guard to check if error is an Error instance
 * 
 * @example
 * if (isErrorInstance(error)) {
 *   console.log(error.message) // TypeScript knows this is safe
 * }
 */
export function isErrorInstance(error: unknown): error is Error {
  return error instanceof Error
}

/**
 * Type guard to check if error has a specific code property
 * 
 * @example
 * if (hasErrorCode(error, 'ENOENT')) {
 *   console.log('File not found')
 * }
 */
export function hasErrorCode<T extends string>(
  error: unknown,
  code: T
): error is Error & { code: T } {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as any).code === code
  )
}

/**
 * Wrap async function with error handling
 * 
 * @example
 * const safeGetUser = wrapAsync(getUserFromDB)
 * const user = await safeGetUser(id) // Returns null on error instead of throwing
 */
export function wrapAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  onError?: (error: unknown) => void
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      if (onError) {
        onError(error)
      }
      return null
    }
  }) as T
}

/**
 * Generate error handler middleware template for Express
 * Used by generators to create consistent error handling
 */
export function generateErrorHandlerTemplate(): string {
  return `// @generated
// Error handling middleware

import { safeErrorMessage } from '@/utils/errors'
import type { Request, Response, NextFunction } from 'express'

/**
 * Global error handler
 */
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const message = safeErrorMessage(error)
  const statusCode = (error as any).statusCode || 500
  
  console.error('[Error]', {
    method: req.method,
    path: req.path,
    error: message,
    stack: error instanceof Error ? error.stack : undefined
  })
  
  res.status(statusCode).json({
    error: 'Error',
    message: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error instanceof Error ? error.stack : undefined
    })
  })
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: 'Not Found',
    message: \`Route \${req.method} \${req.path} not found\`
  })
}

/**
 * Async route wrapper to catch errors
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
`
}


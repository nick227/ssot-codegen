/**
 * Type Declarations Template
 * 
 * Generates TypeScript type declarations for Express/Fastify extensions
 */

/**
 * Generate Express type declarations
 */
export function generateExpressTypes(): string {
  return `// @generated
// TypeScript type declarations for Express extensions

declare global {
  namespace Express {
    interface Request {
      /** Request ID for correlation tracking */
      id: string
    }
  }
}

export {}
`
}

/**
 * Generate Fastify type declarations
 */
export function generateFastifyTypes(): string {
  return `// @generated
// TypeScript type declarations for Fastify extensions

import 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    /** Request ID for correlation tracking */
    id: string
  }
}
`
}


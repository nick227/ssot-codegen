/**
 * Public Generator API
 * 
 * Clean, minimal entry point for embedding SSOT Codegen in other tools.
 * 
 * Key Features:
 * - No CLI dependencies (no chalk, no console.log)
 * - No side effects (no execSync, no auto-open browser)
 * - Fully typed configuration
 * - Promise-based async API
 * - Embeddable in any Node.js application
 * 
 * @example
 * ```ts
 * import { generate, type GenerateOptions } from '@ssot-codegen/gen/api'
 * 
 * const result = await generate({
 *   schema: './prisma/schema.prisma',
 *   output: './generated',
 *   framework: 'express',
 *   onProgress: (event) => console.log(event.message)
 * })
 * 
 * console.log(`Generated ${result.filesCreated} files`)
 * ```
 */

// Re-export all public API types from centralized types module
export type {
  Framework,
  LogLevel,
  DatabaseProvider,
  ProgressEventType,
  ProgressEvent,
  GenerateOptions,
  GenerateResult
} from './types.js'

export { GeneratorError } from './types.js'

import type { PathsConfig } from '../path-resolver.js'
import type { GeneratorResult } from '@/pipeline/types.js'
import type { GenerateOptions, GenerateResult, ProgressEvent } from '@/api/types.js'

// ============================================================================
// PUBLIC API FUNCTIONS
// ============================================================================

/**
 * Generate code from a Prisma schema
 * 
 * This is the main entry point for programmatic use of SSOT Codegen.
 * 
 * @param options - Generation configuration
 * @returns Promise resolving to generation result
 * @throws {GeneratorError} If generation fails
 * 
 * @example
 * ```ts
 * // Generate from file
 * const result = await generate({
 *   schema: './prisma/schema.prisma',
 *   framework: 'express',
 *   standalone: true
 * })
 * 
 * console.log(`Created ${result.filesCreated} files for ${result.models.length} models`)
 * ```
 * 
 * @example
 * ```ts
 * // Generate from inline schema
 * const result = await generate({
 *   schema: `
 *     model User {
 *       id Int @id @default(autoincrement())
 *       email String @unique
 *       posts Post[]
 *     }
 *     model Post {
 *       id Int @id @default(autoincrement())
 *       title String
 *       author User @relation(fields: [authorId], references: [id])
 *       authorId Int
 *     }
 *   `,
 *   output: './my-api',
 *   framework: 'fastify'
 * })
 * ```
 * 
 * @example
 * ```ts
 * // With progress monitoring
 * const result = await generate({
 *   schema: './schema.prisma',
 *   onProgress: (event) => {
 *     console.log(`[${event.phase}] ${event.message}`)
 *   }
 * })
 * ```
 */
export async function generate(options: GenerateOptions): Promise<GenerateResult> {
  const { generateFromSchemaAPI } = await import('./implementation.js')
  return generateFromSchemaAPI(options)
}

/**
 * Validate a Prisma schema without generating code
 * 
 * @param schemaPathOrText - Path to schema file or inline schema text
 * @returns Promise resolving to validation result
 * 
 * @example
 * ```ts
 * const result = await validateSchema('./prisma/schema.prisma')
 * if (!result.valid) {
 *   console.error('Schema errors:', result.errors)
 * }
 * ```
 */
export async function validateSchema(schemaPathOrText: string): Promise<{
  valid: boolean
  errors: string[]
  warnings: string[]
}> {
  const { validateSchemaAPI } = await import('./implementation.js')
  return validateSchemaAPI(schemaPathOrText)
}

/**
 * Get information about a Prisma schema (models, relationships, etc.)
 * 
 * @param schemaPathOrText - Path to schema file or inline schema text
 * @returns Promise resolving to schema information
 * 
 * @example
 * ```ts
 * const info = await analyzeSchema('./prisma/schema.prisma')
 * console.log(`Models: ${info.models.length}`)
 * console.log(`Relationships: ${info.relationships}`)
 * ```
 */
export async function analyzeSchema(schemaPathOrText: string): Promise<{
  models: string[]
  enums: string[]
  relationships: number
  junctionTables: string[]
}> {
  const { analyzeSchemaAPI } = await import('./implementation.js')
  return analyzeSchemaAPI(schemaPathOrText)
}

/**
 * Get generator version
 * 
 * @returns Generator version string
 */
export async function getVersion(): Promise<string> {
  const { getGeneratorVersion } = await import('../utils/version.js')
  return getGeneratorVersion()
}

// ============================================================================
// RE-EXPORTS (For convenience)
// ============================================================================

export type { PathsConfig } from '../path-resolver.js'
export type { GeneratorConfig } from '@/pipeline/types.js'


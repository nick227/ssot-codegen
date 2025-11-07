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

import type { PathsConfig } from '../path-resolver.js'
import type { GeneratorResult } from '../generator/types.js'

// ============================================================================
// PUBLIC API TYPES
// ============================================================================

/**
 * Framework options for generated code
 */
export type Framework = 'express' | 'fastify'

/**
 * Log level for progress callbacks
 */
export type LogLevel = 'silent' | 'minimal' | 'normal' | 'verbose' | 'debug'

/**
 * Database provider (detected from schema or specified)
 */
export type DatabaseProvider = 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'sqlserver'

/**
 * Progress event types
 */
export type ProgressEventType = 
  | 'phase:start'
  | 'phase:end'
  | 'model:start'
  | 'model:complete'
  | 'file:created'
  | 'warning'
  | 'error'

/**
 * Progress event data
 */
export interface ProgressEvent {
  type: ProgressEventType
  phase?: string
  model?: string
  message: string
  filesGenerated?: number
  timestamp: Date
}

/**
 * Configuration for code generation
 */
export interface GenerateOptions {
  /**
   * Path to Prisma schema file OR inline schema text
   * 
   * @example
   * schema: './prisma/schema.prisma'
   * schema: 'model User { id Int @id }'
   */
  schema: string
  
  /**
   * Output directory path
   * 
   * - If standalone is true (default): creates incrementally numbered folder (e.g., generated/my-project-1)
   * - If standalone is false: uses exact path specified
   * 
   * @default Auto-generated in workspace/generated/
   */
  output?: string
  
  /**
   * Project name (used for package.json, README, etc.)
   * 
   * @default Derived from schema path
   */
  projectName?: string
  
  /**
   * Web framework to generate for
   * 
   * @default 'express'
   */
  framework?: Framework
  
  /**
   * Generate complete standalone project (package.json, tsconfig, etc.)
   * 
   * - true: Creates full runnable project
   * - false: Generates only code files
   * 
   * @default true
   */
  standalone?: boolean
  
  /**
   * Custom path configuration (advanced)
   * 
   * Override default directory structure, aliases, or layer names
   */
  paths?: Partial<PathsConfig>
  
  /**
   * Progress callback for monitoring generation
   * 
   * @example
   * onProgress: (event) => {
   *   if (event.type === 'phase:start') {
   *     console.log(`Starting: ${event.phase}`)
   *   }
   * }
   */
  onProgress?: (event: ProgressEvent) => void
  
  /**
   * Log level (used internally for progress events)
   * 
   * @default 'normal'
   */
  verbosity?: LogLevel
  
  /**
   * Format generated code with Prettier
   * 
   * @default false
   */
  format?: boolean
  
  /**
   * Maximum concurrent file writes (performance tuning)
   * 
   * @default 100
   */
  concurrency?: number
  
  /**
   * Feature flags for plugin activation
   */
  features?: {
    /**
     * Enable Google OAuth authentication
     */
    googleAuth?: {
      enabled: boolean
      clientId?: string
      clientSecret?: string
      callbackURL?: string
      strategy?: 'jwt' | 'session'
      userModel?: string
    }
    
    /**
     * Add your custom features here
     */
    [key: string]: any
  }
}

/**
 * Result from code generation
 */
export interface GenerateResult {
  /**
   * Whether generation completed successfully
   */
  success: boolean
  
  /**
   * Array of model names generated
   */
  models: string[]
  
  /**
   * Total number of files created
   */
  filesCreated: number
  
  /**
   * Number of relationships detected
   */
  relationships: number
  
  /**
   * Breakdown of files by layer
   */
  breakdown: Array<{ layer: string; count: number }>
  
  /**
   * Output directory path (for standalone projects)
   */
  outputDir?: string
  
  /**
   * Generation duration in milliseconds
   */
  duration?: number
  
  /**
   * Any errors encountered (if partial generation occurred)
   */
  errors?: Error[]
  
  /**
   * Warnings encountered during generation
   */
  warnings?: string[]
}

/**
 * Error thrown by generator
 */
export class GeneratorError extends Error {
  constructor(
    message: string,
    public readonly phase?: string,
    public readonly cause?: Error
  ) {
    super(message)
    this.name = 'GeneratorError'
  }
}

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
export type { GeneratorConfig } from '../generator/types.js'


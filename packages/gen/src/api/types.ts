/**
 * Public API Types
 * 
 * Shared types used by both public-api.ts and implementation.ts
 * Extracted to break circular dependency.
 */

import type { PathsConfig } from '../path-resolver.js'

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


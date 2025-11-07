/**
 * Phase Runner - Orchestrates generation phases
 * 
 * Manages the 12 discrete phases of code generation with:
 * - Progress tracking
 * - Error handling
 * - Performance metrics
 * - Dependency injection
 */

import type { ParsedSchema } from '../dmmf-parser.js'
import type { GeneratorConfig, GeneratorResult } from './types.js'
import type { CLILogger } from '../utils/cli-logger.js'
import type { PathsConfig } from '../path-resolver.js'
import type { GeneratedFiles } from '../code-generator.js'

/**
 * Phase Context - Shared state across all generation phases
 * 
 * Each phase can read from and write to this context. The context accumulates
 * data as phases execute in sequence.
 * 
 * @remarks
 * The string-index signature allows phases to add custom data, but prefer using
 * the typed fields when possible for better IDE support and compile-time safety.
 */
export interface PhaseContext {
  // Required fields (always present)
  config: GeneratorConfig
  logger: CLILogger
  
  // Phase 0: Setup Output Directory
  outputDir?: string
  
  // Phase 1: Parse Schema
  schema?: ParsedSchema
  schemaContent?: string
  modelNames?: string[]
  
  // Phase 3: Analyze Relationships
  relationshipCount?: number
  
  // Phase 4: Generate Code
  pathsConfig?: PathsConfig
  generatedFiles?: GeneratedFiles
  totalFiles?: number
  breakdown?: Array<{ layer: string; count: number }>
  
  // Extensibility: Phases can add custom data
  // WARNING: Use typed fields above when possible for better type safety
  [key: string]: unknown
}

/**
 * Phase Result - Return value from phase execution
 * 
 * @property success - Whether the phase completed successfully
 * @property data - Optional data to store in context for subsequent phases
 * @property filesGenerated - Number of files created by this phase (for logging)
 * @property error - Error object if phase failed
 */
export interface PhaseResult<TData = unknown> {
  success: boolean
  data?: TData
  filesGenerated?: number
  error?: Error
}

/**
 * Strongly-typed phase result builders for common scenarios
 */
export const PhaseResults = {
  success<T = void>(data?: T, filesGenerated = 0): PhaseResult<T> {
    return { success: true, data, filesGenerated }
  },
  
  failure(error: Error | string): PhaseResult {
    return { 
      success: false, 
      error: typeof error === 'string' ? new Error(error) : error 
    }
  }
}

/**
 * Base class for all generation phases
 * 
 * Each phase represents a discrete step in the code generation pipeline.
 * Phases execute in order and can read/modify the shared context.
 * 
 * @example
 * ```ts
 * export class MyPhase extends GenerationPhase {
 *   readonly name = 'myPhase'
 *   readonly order = 100
 *   
 *   async execute(context: PhaseContext): Promise<PhaseResult> {
 *     // Read from context
 *     const { schema, outputDir } = context
 *     
 *     // Do work
 *     const result = await doWork()
 *     
 *     // Write to context for next phases
 *     context.myData = result
 *     
 *     return PhaseResults.success(result, filesGenerated)
 *   }
 * }
 * ```
 */
export abstract class GenerationPhase<TData = unknown> {
  abstract readonly name: string
  abstract readonly order: number
  
  /**
   * Check if this phase should run given the current context
   * 
   * Override to conditionally skip phases based on configuration or context state.
   * 
   * @example
   * ```ts
   * shouldRun(context: PhaseContext): boolean {
   *   return context.config.standalone ?? true
   * }
   * ```
   */
  shouldRun(context: PhaseContext): boolean {
    return true
  }
  
  /**
   * Execute the phase
   * 
   * @param context - Shared context with data from previous phases
   * @returns Result with success status, optional data, and file count
   */
  abstract execute(context: PhaseContext): Promise<PhaseResult<TData>>
  
  /**
   * Get human-readable phase description for logging
   * 
   * Override to provide better progress messages.
   */
  getDescription(): string {
    return this.name
  }
}

export class PhaseRunner {
  private phases: GenerationPhase[] = []
  private context: PhaseContext
  
  constructor(config: GeneratorConfig, logger: CLILogger) {
    this.context = { config, logger }
  }
  
  /**
   * Register a phase
   */
  registerPhase(phase: GenerationPhase): void {
    this.phases.push(phase)
  }
  
  /**
   * Register multiple phases
   */
  registerPhases(phases: GenerationPhase[]): void {
    this.phases.push(...phases)
  }
  
  /**
   * Execute all registered phases in order
   */
  async run(): Promise<GeneratorResult> {
    const { logger } = this.context
    
    logger.startGeneration()
    
    try {
      // Sort phases by order
      const sortedPhases = [...this.phases].sort((a, b) => a.order - b.order)
      
      // Execute each phase
      for (const phase of sortedPhases) {
        if (!phase.shouldRun(this.context)) {
          logger.debug(`Skipping phase: ${phase.name}`)
          continue
        }
        
        logger.startPhase(phase.getDescription())
        
        try {
          const result = await phase.execute(this.context)
          
          if (!result.success) {
            throw result.error || new Error(`Phase ${phase.name} failed`)
          }
          
          // Store result in context for subsequent phases
          this.context[phase.name] = result.data
          
          logger.endPhase(phase.getDescription(), result.filesGenerated)
        } catch (error) {
          logger.error(`Phase ${phase.name} failed`, error as Error)
          throw error
        }
      }
      
      // Build final result from context
      const result: GeneratorResult = {
        models: this.context.modelNames || [],
        files: (this.context.totalFiles as number) || 0,
        relationships: (this.context.relationshipCount as number) || 0,
        breakdown: (this.context.breakdown as Array<{ layer: string; count: number }>) || [],
        outputDir: this.context.config.standalone ? this.context.outputDir : undefined
      }
      
      logger.completeGeneration(result.files)
      
      return result
    } catch (error) {
      logger.error('Generation failed', error as Error)
      throw error
    }
  }
  
  /**
   * Get current context (for testing/debugging)
   */
  getContext(): PhaseContext {
    return this.context
  }
}


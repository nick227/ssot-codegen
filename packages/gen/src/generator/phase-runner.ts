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

export interface PhaseContext {
  config: GeneratorConfig
  logger: CLILogger
  schema?: ParsedSchema
  schemaContent?: string
  outputDir?: string
  modelNames?: string[]
  pathsConfig?: PathsConfig
  generatedFiles?: GeneratedFiles
  relationshipCount?: number
  totalFiles?: number
  breakdown?: Array<{ layer: string; count: number }>
  [key: string]: unknown
}

export interface PhaseResult {
  success: boolean
  data?: unknown
  filesGenerated?: number
  error?: Error
}

export abstract class GenerationPhase {
  abstract readonly name: string
  abstract readonly order: number
  
  /**
   * Check if this phase should run given the current context
   */
  shouldRun(context: PhaseContext): boolean {
    return true
  }
  
  /**
   * Execute the phase
   */
  abstract execute(context: PhaseContext): Promise<PhaseResult>
  
  /**
   * Get human-readable phase description for logging
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


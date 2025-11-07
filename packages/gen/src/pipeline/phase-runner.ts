/**
 * Phase Runner - Orchestrates generation phases
 * 
 * Manages the 13 discrete phases of code generation with:
 * - Progress tracking
 * - Error handling
 * - Performance metrics
 * - Dependency injection
 * - Plugin hook system (beforePhase, afterPhase, replacePhase)
 */

import { performance } from 'node:perf_hooks'
import type { ParsedSchema } from '../dmmf-parser.js'
import type { GeneratorConfig, GeneratorResult } from './types.js'
import type { CLILogger } from '@/utils/cli-logger.js'
import type { PathsConfig } from '../path-resolver.js'
import type { GeneratedFiles } from '../code-generator.js'
import { PhaseHookRegistry } from './hooks/phase-hooks.js'

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
  
  // Performance Metrics (collected by PhaseRunner)
  phaseMetrics?: Array<{ phase: string; duration: number; filesGenerated: number }>
  
  // Extensibility: Phases can add custom data
  // WARNING: Use typed fields above when possible for better type safety
  [key: string]: unknown
}

// PhaseResult moved to generator/types.ts to break circular dependency
import type { PhaseResult } from './types.js'
export type { PhaseResult } from './types.js'

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
  private hookRegistry: PhaseHookRegistry
  
  constructor(config: GeneratorConfig, logger: CLILogger, hookRegistry?: PhaseHookRegistry) {
    this.context = { config, logger }
    this.hookRegistry = hookRegistry || new PhaseHookRegistry()
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
    
    // Clear any tracked paths from previous runs
    const { clearTrackedPaths } = await import('./phase-utilities.js')
    clearTrackedPaths()
    
    try {
      // Sort phases by order
      const sortedPhases = [...this.phases].sort((a, b) => a.order - b.order)
      
      // Initialize phase metrics array in context
      this.context.phaseMetrics = []
      
      // Execute each phase (with hook support)
      for (const phase of sortedPhases) {
        if (!phase.shouldRun(this.context)) {
          logger.debug(`Skipping phase: ${phase.name}`)
          continue
        }
        
        logger.startPhase(phase.getDescription())
        
        const phaseStartTime = performance.now()
        
        try {
          // Execute before hooks
          await this.hookRegistry.executeBeforeHooks(phase.name, this.context)
          
          // Check if phase is replaced
          let result: PhaseResult
          if (this.hookRegistry.hasReplacement(phase.name)) {
            logger.debug(`Using replacement for phase: ${phase.name}`)
            const replacement = this.hookRegistry.getReplacement(phase.name)!
            result = await replacement(this.context)
          } else {
            // Execute original phase
            result = await phase.execute(this.context)
          }
          
          if (!result.success) {
            throw result.error || new Error(`Phase ${phase.name} failed`)
          }
          
          // Store result in context for subsequent phases
          this.context[phase.name] = result.data
          
          // Execute after hooks
          await this.hookRegistry.executeAfterHooks(phase.name, this.context, result)
          
          // Store phase metrics immediately (so manifest phase can access them)
          const phaseDuration = performance.now() - phaseStartTime
          this.context.phaseMetrics.push({
            phase: phase.name,
            duration: Math.round(phaseDuration),
            filesGenerated: result.filesGenerated || 0
          })
          
          logger.endPhase(phase.getDescription(), result.filesGenerated)
        } catch (error) {
          // Execute error hooks
          await this.hookRegistry.executeErrorHooks(phase.name, error as Error, this.context)
          
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
  
  /**
   * Get hook registry (for plugin registration)
   */
  getHookRegistry(): PhaseHookRegistry {
    return this.hookRegistry
  }
}


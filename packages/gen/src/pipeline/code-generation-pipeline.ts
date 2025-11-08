/**
 * Code Generation Pipeline - Orchestrates all generation phases
 * Central coordinator for phase-based code generation
 */

import { GenerationContext } from './generation-context.js'
import { ConfigNormalizer } from './config-normalizer.js'
import type { GeneratedFiles } from './types.js'
import type { CodeGeneratorConfig } from '../code-generator.js'
import {
  GenerationFailedError,
  PhaseStatus,
  ErrorSeverity,
  type GenerationPhase,
  type PhaseResult,
  type ParsedSchema
} from './generation-types.js'

// Import all phases
import { ValidationPhase } from './phases/validation-phase.js'
import { AnalysisPhase } from './phases/analysis-phase.js'
import { NamingConflictPhase } from './phases/naming-conflict-phase.js'
import { DTOGenerationPhase } from './phases/dto-generation-phase.js'
import { ServiceGenerationPhase } from './phases/service-generation-phase.js'
import { ControllerGenerationPhase } from './phases/controller-generation-phase.js'
import { RouteGenerationPhase } from './phases/route-generation-phase.ts'
import { SDKGenerationPhase } from './phases/sdk-generation-phase.js'
import { HooksGenerationPhase } from './phases/hooks-generation-phase.js'
import { PluginGenerationPhase } from './phases/plugin-generation-phase.js'
import { ChecklistGenerationPhase } from './phases/checklist-generation-phase.js'

/**
 * Orchestrates code generation through sequential phases
 * 
 * Responsibilities:
 * - Create and order phases based on configuration
 * - Execute phases sequentially
 * - Handle phase failures with rollback
 * - Log progress and summary
 * - Validate final output
 * 
 * Features:
 * - Automatic snapshot before each phase
 * - Rollback on phase failure
 * - Skip phases based on shouldExecute()
 * - Centralized error handling
 * - Progress tracking
 */
export class CodeGenerationPipeline {
  private readonly context: GenerationContext
  private readonly phases: GenerationPhase[]
  private readonly phaseResults = new Map<string, PhaseResult>()
  
  constructor(schema: ParsedSchema, config: CodeGeneratorConfig) {
    // Normalize and validate configuration
    const normalizer = new ConfigNormalizer()
    const normalizedConfig = normalizer.normalize(config)
    
    // Create context
    this.context = new GenerationContext(normalizedConfig, schema)
    
    // Initialize phases
    this.phases = this.createPhases()
  }
  
  /**
   * Create and order phases based on configuration
   */
  private createPhases(): GenerationPhase[] {
    const phases: GenerationPhase[] = []
    
    // Core phases (always run)
    phases.push(
      new ValidationPhase(),
      new AnalysisPhase(),
      new NamingConflictPhase()
    )
    
    // Generation phases (conditional on registry mode)
    if (!this.context.config.useRegistry) {
      // Legacy mode: individual file generation
      phases.push(
        new DTOGenerationPhase(),
        new ServiceGenerationPhase(),
        new ControllerGenerationPhase(),
        new RouteGenerationPhase()
      )
    }
    // Note: Registry mode phases would go here when implemented
    
    // SDK and hooks (always run)
    phases.push(
      new SDKGenerationPhase(),
      new HooksGenerationPhase()
    )
    
    // Plugin phase (if features configured)
    if (this.context.config.features) {
      phases.push(new PluginGenerationPhase())
    }
    
    // Checklist (if enabled)
    if (this.context.config.generation.checklist) {
      phases.push(new ChecklistGenerationPhase())
    }
    
    // Sort by order
    return phases.sort((a, b) => a.order - b.order)
  }
  
  /**
   * Execute the pipeline
   * @throws GenerationFailedError if blocking errors occur
   */
  async execute(): Promise<GeneratedFiles> {
    console.log('[ssot-codegen] Starting code generation pipeline...\n')
    
    // Execute each phase
    for (const phase of this.phases) {
      await this.executePhase(phase)
    }
    
    // Log summary
    console.log()  // Blank line before summary
    this.context.logErrorSummary()
    
    // Final validation
    if (this.context.hasBlockingErrors()) {
      const blockingErrors = this.context.getErrors().filter(e =>
        e.severity === ErrorSeverity.VALIDATION ||
        e.severity === ErrorSeverity.FATAL ||
        e.blocksGeneration === true
      )
      
      console.error('\n❌ [ssot-codegen] Generation FAILED due to blocking errors:')
      blockingErrors.forEach(e => {
        console.error(`   - ${e.message}${e.model ? ` (model: ${e.model})` : ''}`)
      })
      
      throw new GenerationFailedError(
        `Code generation failed with ${blockingErrors.length} blocking error(s)`
      )
    }
    
    // Build and return final files
    const files = this.context.filesBuilder.build()
    
    // Log success
    const summary = this.context.getErrorSummary()
    if (summary.total === 0) {
      console.log('✅ [ssot-codegen] All phases completed successfully\n')
    } else if (summary.warning > 0 && summary.error === 0 && summary.fatal === 0) {
      console.log(`✅ [ssot-codegen] Completed with ${summary.warning} warning(s)\n`)
    }
    
    return files
  }
  
  /**
   * Execute a single phase with error handling and rollback
   */
  private async executePhase(phase: GenerationPhase): Promise<void> {
    // Check if phase should run
    if (!phase.shouldExecute(this.context)) {
      this.phaseResults.set(phase.name, {
        success: true,
        status: PhaseStatus.SKIPPED,
        errors: []
      })
      console.log(`[ssot-codegen] ⊘ ${phase.name} - SKIPPED`)
      return
    }
    
    // Create snapshot before phase (for rollback)
    this.context.createSnapshot(phase.name)
    
    try {
      console.log(`[ssot-codegen] ▶ ${phase.name}`)
      
      // Execute phase
      const result = await phase.execute(this.context)
      this.phaseResults.set(phase.name, result)
      
      // Add phase errors to context
      for (const error of result.errors) {
        this.context.addError(error)
      }
      
      // Log result
      this.logPhaseResult(phase.name, result)
      
      // Handle phase failure
      if (!result.success && this.shouldRollback(result.errors)) {
        await this.rollbackPhase(phase)
        throw new GenerationFailedError(`Phase ${phase.name} failed with critical errors`)
      }
    } catch (error) {
      // Phase threw an error
      if (error instanceof GenerationFailedError) {
        // Expected failure
        throw error
      }
      
      // Unexpected error
      console.error(`[ssot-codegen] ❌ Phase ${phase.name} threw unexpected error:`, error)
      
      // Attempt rollback
      await this.rollbackPhase(phase)
      
      throw new GenerationFailedError(
        `Phase ${phase.name} failed unexpectedly`,
        undefined,
        error as Error
      )
    }
  }
  
  /**
   * Determine if phase should be rolled back
   * Rollback on FATAL errors or blocking errors
   */
  private shouldRollback(errors: GenerationError[]): boolean {
    return errors.some(e =>
      e.severity === ErrorSeverity.FATAL ||
      e.blocksGeneration === true
    )
  }
  
  /**
   * Rollback a phase
   */
  private async rollbackPhase(phase: GenerationPhase): Promise<void> {
    console.warn(`[ssot-codegen] ↩ Rolling back ${phase.name}`)
    
    try {
      if (phase.rollback) {
        // Phase has custom rollback logic
        await phase.rollback(this.context)
      } else {
        // Default rollback: restore snapshot
        this.context.rollbackToSnapshot(phase.name)
      }
    } catch (error) {
      console.error(`[ssot-codegen] Error during rollback of ${phase.name}:`, error)
    }
  }
  
  /**
   * Log phase result
   */
  private logPhaseResult(phaseName: string, result: PhaseResult): void {
    const icon = this.getStatusIcon(result.status)
    const errorCount = result.errors.length
    
    if (errorCount === 0) {
      console.log(`[ssot-codegen] ${icon} ${phaseName} - COMPLETED`)
    } else {
      const severity = this.getHighestSeverity(result.errors)
      console.log(`[ssot-codegen] ${icon} ${phaseName} - ${result.status} (${errorCount} ${severity})`)
    }
  }
  
  /**
   * Get status icon for logging
   */
  private getStatusIcon(status: PhaseStatus): string {
    switch (status) {
      case PhaseStatus.COMPLETED:
        return '✓'
      case PhaseStatus.FAILED:
        return '✗'
      case PhaseStatus.SKIPPED:
        return '⊘'
      default:
        return '•'
    }
  }
  
  /**
   * Get highest severity from errors
   */
  private getHighestSeverity(errors: GenerationError[]): string {
    if (errors.some(e => e.severity === ErrorSeverity.VALIDATION)) return 'VALIDATION'
    if (errors.some(e => e.severity === ErrorSeverity.FATAL)) return 'FATAL'
    if (errors.some(e => e.severity === ErrorSeverity.ERROR)) return 'ERROR'
    return 'WARNING'
  }
  
  /**
   * Get phase execution summary
   */
  getPhaseResults(): ReadonlyMap<string, PhaseResult> {
    return new Map(this.phaseResults)
  }
}


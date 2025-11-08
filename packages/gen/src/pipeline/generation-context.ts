/**
 * Generation Context - Central state management for code generation
 * Coordinates cache, errors, file builders, and snapshots
 * 
 * v2.0: Uses centralized ErrorEscalationPolicy for consistent error handling
 */

import { ErrorCollector } from './error-collector.js'
import { AnalysisCache } from '../cache/analysis-cache.js'
import { GeneratedFilesBuilder } from '../builders/generated-files-builder.js'
import { ErrorEscalationPolicy, ErrorPolicyFactory } from './error-escalation-policy.js'
import type { GeneratedFiles } from './types.js'
import {
  GenerationFailedError,
  type NormalizedConfig,
  type IGenerationContext,
  type GenerationError,
  type IAnalysisCache,
  type IFilesBuilder,
  ErrorSeverity
} from './generation-types.js'
import type { ParsedSchema } from '../dmmf-parser.js'

/**
 * Central context for code generation pipeline
 * 
 * Responsibilities:
 * - Manage configuration
 * - Manage analysis cache
 * - Manage error collection
 * - Manage file builders
 * - Manage snapshots for rollback
 * - Centralize error escalation logic
 * 
 * Features:
 * - Immutable config and schema
 * - Type-safe cache access
 * - Centralized error handling
 * - Snapshot/rollback support
 * - Clear state ownership
 */
export class GenerationContext implements IGenerationContext {
  private readonly errorCollector: ErrorCollector
  private readonly _cache: AnalysisCache
  private readonly _filesBuilder: GeneratedFilesBuilder
  private readonly snapshots = new Map<string, GeneratedFiles>()
  private readonly errorPolicy: ErrorEscalationPolicy
  
  constructor(
    readonly config: NormalizedConfig,
    readonly schema: ParsedSchema
  ) {
    this.errorCollector = new ErrorCollector()
    this._cache = new AnalysisCache()
    this._filesBuilder = new GeneratedFilesBuilder(this)
    this.errorPolicy = ErrorPolicyFactory.fromConfig(config)
  }
  
  // ============================================================================
  // Cache Access
  // ============================================================================
  
  get cache(): IAnalysisCache {
    return this._cache
  }
  
  // ============================================================================
  // Files Builder Access
  // ============================================================================
  
  get filesBuilder(): IFilesBuilder {
    return this._filesBuilder
  }
  
  // ============================================================================
  // Error Management
  // ============================================================================
  
  /**
   * Add error with centralized escalation logic
   * 
   * Uses ErrorEscalationPolicy for consistent handling across the codebase.
   * 
   * Escalation rules:
   * - VALIDATION errors: always throw (prevent invalid code)
   * - FATAL errors: always throw (system failure)
   * - ERROR with failFast: throw immediately
   * - ERROR with !continueOnError: throw
   * - WARNING: never throw
   */
  addError(error: GenerationError): void {
    this.errorCollector.addError(error)
    
    // Use centralized policy to determine escalation
    if (this.errorPolicy.shouldThrow(error)) {
      throw new GenerationFailedError(error.message, error, error.error)
    }
  }
  
  /**
   * Get all errors (immutable)
   */
  getErrors(): readonly GenerationError[] {
    return this.errorCollector.getErrors()
  }
  
  /**
   * Check if any blocking errors exist
   * Uses ErrorEscalationPolicy for consistent blocking detection
   */
  hasBlockingErrors(): boolean {
    return this.errorPolicy.hasBlockingErrors(this.getErrors() as GenerationError[])
  }
  
  /**
   * Check if any critical errors exist
   */
  hasCriticalErrors(): boolean {
    return this.errorCollector.hasCriticalErrors()
  }
  
  /**
   * Log error summary
   */
  logErrorSummary(): void {
    this.errorCollector.logSummary()
  }
  
  // ============================================================================
  // Snapshot & Rollback Support
  // ============================================================================
  
  /**
   * Create snapshot of current state
   * Call before each phase to enable rollback
   */
  createSnapshot(phaseName: string): void {
    const snapshot = this._filesBuilder.build()
    this.snapshots.set(phaseName, snapshot)
  }
  
  /**
   * Rollback to a previous snapshot
   * Used when a phase fails and needs to undo its changes
   */
  rollbackToSnapshot(phaseName: string): void {
    const snapshot = this.snapshots.get(phaseName)
    
    if (!snapshot) {
      console.warn(`[ssot-codegen] No snapshot found for phase: ${phaseName}`)
      return
    }
    
    this._filesBuilder.restore(snapshot)
    console.log(`[ssot-codegen] Rolled back to snapshot: ${phaseName}`)
  }
  
  /**
   * Clear all snapshots (free memory)
   */
  clearSnapshots(): void {
    this.snapshots.clear()
  }
  
  // ============================================================================
  // Helper Methods
  // ============================================================================
  
  /**
   * Get error summary statistics
   */
  getErrorSummary() {
    return this.errorCollector.getSummary()
  }
  
  /**
   * Create error helper (for phases)
   */
  createError(error: Omit<GenerationError, 'phase'> & { phase?: string }): GenerationError {
    return {
      ...error,
      phase: error.phase || 'unknown'
    }
  }
}


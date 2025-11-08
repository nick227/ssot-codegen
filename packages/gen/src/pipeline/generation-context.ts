/**
 * Generation Context - Central state management for code generation
 * Coordinates cache, errors, file builders, and snapshots
 */

import { ErrorCollector } from './error-collector.js'
import { AnalysisCache } from '../cache/analysis-cache.js'
import { GeneratedFilesBuilder } from '../builders/generated-files-builder.js'
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
  
  constructor(
    readonly config: NormalizedConfig,
    readonly schema: ParsedSchema
  ) {
    this.errorCollector = new ErrorCollector()
    this._cache = new AnalysisCache()
    this._filesBuilder = new GeneratedFilesBuilder(this)
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
   * Escalation rules:
   * - VALIDATION errors: always throw (prevent invalid code)
   * - FATAL errors: always throw (system failure)
   * - ERROR with failFast: throw immediately
   * - ERROR with !continueOnError: throw
   * - WARNING: never throw
   */
  addError(error: GenerationError): void {
    this.errorCollector.addError(error)
    
    // Centralized error escalation
    if (this.shouldThrow(error)) {
      throw new GenerationFailedError(error.message, error, error.error)
    }
  }
  
  /**
   * Determine if error should throw
   */
  private shouldThrow(error: GenerationError): boolean {
    // VALIDATION errors always throw (prevent invalid code)
    if (error.severity === ErrorSeverity.VALIDATION || error.blocksGeneration) {
      return true
    }
    
    // FATAL errors always throw (system failure)
    if (error.severity === ErrorSeverity.FATAL) {
      return true
    }
    
    // ERROR severity respects configuration
    if (error.severity === ErrorSeverity.ERROR) {
      // Fail-fast mode: throw immediately
      if (this.config.errorHandling.failFast) {
        return true
      }
      
      // Continue-on-error disabled: throw
      if (!this.config.errorHandling.continueOnError) {
        return true
      }
    }
    
    // WARNING never throws
    return false
  }
  
  /**
   * Get all errors (immutable)
   */
  getErrors(): readonly GenerationError[] {
    return this.errorCollector.getErrors()
  }
  
  /**
   * Check if any blocking errors exist
   */
  hasBlockingErrors(): boolean {
    return this.errorCollector.hasBlockingErrors()
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


/**
 * Core types for phase-based code generation pipeline
 * Extracted from code-generator.ts for better organization
 */

import type { ParsedSchema, ParsedModel } from '../dmmf-parser.js'
import type { ServiceAnnotation } from '../service-linker.js'
import type { UnifiedModelAnalysis } from '../analyzers/index.js'

/**
 * Error severity levels for generation issues
 */
export enum ErrorSeverity {
  WARNING = 'warning',      // Non-critical, generation can continue
  ERROR = 'error',          // Critical, affects functionality but other models might succeed
  FATAL = 'fatal',          // Critical, entire generation should fail
  VALIDATION = 'validation' // Code validation failure - always blocks generation
}

/**
 * Generation error with full context
 */
export interface GenerationError {
  severity: ErrorSeverity
  message: string
  model?: string
  phase?: string
  error?: Error
  blocksGeneration?: boolean
}

/**
 * Phase execution status
 */
export enum PhaseStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped'
}

/**
 * Result from phase execution
 */
export interface PhaseResult {
  success: boolean
  status: PhaseStatus
  errors: GenerationError[]
  data?: unknown
}

/**
 * Normalized configuration with validated, readonly properties
 */
export interface NormalizedConfig {
  readonly framework: 'express' | 'fastify'
  readonly useEnhanced: boolean
  readonly useRegistry: boolean
  readonly errorHandling: {
    readonly failFast: boolean
    readonly continueOnError: boolean
    readonly strictPluginValidation: boolean
  }
  readonly generation: {
    readonly checklist: boolean
    readonly autoOpen: boolean
    readonly hookFrameworks: ReadonlyArray<'react' | 'vue' | 'angular' | 'zustand' | 'vanilla'>
  }
  readonly metadata: {
    readonly projectName: string
    readonly schemaHash: string
    readonly toolVersion: string
  }
  readonly features?: {
    googleAuth?: {
      enabled: boolean
      clientId?: string
      clientSecret?: string
      callbackURL?: string
      strategy?: 'jwt' | 'session'
      userModel?: string
    }
  }
}

/**
 * Analysis cache interface
 */
export interface IAnalysisCache {
  setAnalysis(modelName: string, analysis: UnifiedModelAnalysis): void
  getAnalysis(modelName: string): UnifiedModelAnalysis
  tryGetAnalysis(modelName: string): UnifiedModelAnalysis | undefined
  hasAnalysis(modelName: string): boolean
  
  setServiceAnnotation(modelName: string, annotation: ServiceAnnotation): void
  getServiceAnnotation(modelName: string): ServiceAnnotation
  tryGetServiceAnnotation(modelName: string): ServiceAnnotation | undefined
  hasServiceAnnotation(modelName: string): boolean
  
  getAllAnalyzedModels(): ReadonlyArray<[string, UnifiedModelAnalysis]>
  getAllServiceAnnotations(): ReadonlyArray<[string, ServiceAnnotation]>
  
  getAnalysisCount(): number
  getExpectedCount(schema: ParsedSchema): number
}

/**
 * Generation phase interface
 */
export interface GenerationPhase {
  readonly name: string
  readonly order: number
  
  shouldExecute(context: IGenerationContext): boolean
  execute(context: IGenerationContext): Promise<PhaseResult>
  rollback?(context: IGenerationContext): Promise<void>
}

/**
 * Generation context interface
 */
export interface IGenerationContext {
  readonly config: NormalizedConfig
  readonly schema: ParsedSchema
  readonly cache: IAnalysisCache
  
  addError(error: GenerationError): void
  getErrors(): readonly GenerationError[]
  hasBlockingErrors(): boolean
  
  createSnapshot(phaseName: string): void
  rollbackToSnapshot(phaseName: string): void
}

/**
 * Custom error for generation failures
 */
export class GenerationFailedError extends Error {
  constructor(
    message: string,
    public readonly generationError?: GenerationError,
    public readonly cause?: Error
  ) {
    super(message)
    this.name = 'GenerationFailedError'
    
    // Preserve stack trace
    if (cause?.stack) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`
    }
  }
}


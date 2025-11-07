/**
 * Strongly-Typed Phase Context System
 * 
 * Provides compile-time safety for the phase pipeline by:
 * 1. Each phase declares what it requires (inputs)
 * 2. Each phase declares what it provides (outputs)
 * 3. Context type evolves as phases run
 * 4. TypeScript catches missing data at compile time
 * 
 * @example
 * ```ts
 * // Phase 0 output
 * type After0 = BaseContext & SetupOutputDirOutput
 * 
 * // Phase 1 requires Phase 0's output
 * type After1 = After0 & ParseSchemaOutput
 * 
 * // Phase 2 requires Phase 1's output
 * type After2 = After1 & ValidateSchemaOutput
 * ```
 */

import type { ParsedSchema } from '../dmmf-parser.js'
import type { GeneratorConfig } from './types.js'
import type { CLILogger } from '@/utils/cli-logger.js'
import type { PathsConfig } from '../path-resolver.js'
import type { GeneratedFiles } from '../code-generator.js'

// ============================================================================
// BASE CONTEXT (Always Available)
// ============================================================================

/**
 * Base context fields that are always available in all phases
 */
export interface BaseContext {
  readonly config: GeneratorConfig
  readonly logger: CLILogger
}

// ============================================================================
// PHASE OUTPUTS (What Each Phase Provides)
// ============================================================================

/**
 * Phase 0: Setup Output Directory
 * Provides: outputDir
 */
export interface SetupOutputDirOutput {
  readonly outputDir: string
}

/**
 * Phase 1: Parse Schema
 * Provides: schema, schemaContent, modelNames
 */
export interface ParseSchemaOutput {
  readonly schema: ParsedSchema
  readonly schemaContent: string
  readonly modelNames: string[]
}

/**
 * Phase 2: Validate Schema
 * Provides: validation results (currently none, just validates)
 */
export interface ValidateSchemaOutput {
  // Future: validation warnings, suggestions
}

/**
 * Phase 3: Analyze Relationships
 * Provides: relationshipCount
 */
export interface AnalyzeRelationshipsOutput {
  readonly relationshipCount: number
}

/**
 * Phase 4: Generate Code
 * Provides: pathsConfig, generatedFiles, totalFiles, breakdown
 */
export interface GenerateCodeOutput {
  readonly pathsConfig: PathsConfig
  readonly generatedFiles: GeneratedFiles
  readonly totalFiles: number
  readonly breakdown: Array<{ layer: string; count: number }>
}

/**
 * Phase 5: Write Files
 * Provides: (files written to disk, no additional context)
 */
export interface WriteFilesOutput {
  // Files are written to disk
}

/**
 * Phase 6: Write Base Infrastructure
 * Provides: (infrastructure written, no additional context)
 */
export interface WriteBaseInfrastructureOutput {
  // Base files written
}

/**
 * Phase 7: Generate Barrels
 * Provides: (barrel files generated, no additional context)
 */
export interface GenerateBarrelsOutput {
  // Barrel files written
}

/**
 * Phase 8: Generate OpenAPI
 * Provides: (OpenAPI spec written, no additional context)
 */
export interface GenerateOpenAPIOutput {
  // OpenAPI spec written
}

/**
 * Phase 9: Write Manifest
 * Provides: (manifest written, no additional context)
 */
export interface WriteManifestOutput {
  // Manifest written
}

/**
 * Phase 10: Generate TypeScript Config
 * Provides: (tsconfig paths written, no additional context)
 */
export interface GenerateTsConfigOutput {
  // TypeScript config written
}

/**
 * Phase 11: Write Standalone Project Files
 * Provides: (project files written if standalone mode)
 */
export interface WriteStandaloneProjectOutput {
  // Project files written
}

/**
 * Phase 12: Generate Test Suite
 * Provides: (test files written if enabled)
 */
export interface GenerateTestSuiteOutput {
  // Test files written
}

/**
 * Phase 13: Format Code
 * Provides: (code formatted if enabled)
 */
export interface FormatCodeOutput {
  // Code formatted
}

// ============================================================================
// PHASE METRICS (Collected by PhaseRunner)
// ============================================================================

export interface PhaseMetrics {
  readonly phaseMetrics: Array<{ 
    phase: string
    duration: number
    filesGenerated: number 
  }>
}

// ============================================================================
// EVOLVING CONTEXT TYPES (Type State Pattern)
// ============================================================================

/**
 * Context after Phase 0 (Setup Output Directory)
 */
export type ContextAfterPhase0 = BaseContext & SetupOutputDirOutput

/**
 * Context after Phase 1 (Parse Schema)
 * Requires: Phase 0
 */
export type ContextAfterPhase1 = ContextAfterPhase0 & ParseSchemaOutput

/**
 * Context after Phase 2 (Validate Schema)
 * Requires: Phase 1
 */
export type ContextAfterPhase2 = ContextAfterPhase1 & ValidateSchemaOutput

/**
 * Context after Phase 3 (Analyze Relationships)
 * Requires: Phase 2
 */
export type ContextAfterPhase3 = ContextAfterPhase2 & AnalyzeRelationshipsOutput

/**
 * Context after Phase 4 (Generate Code)
 * Requires: Phase 3
 */
export type ContextAfterPhase4 = ContextAfterPhase3 & GenerateCodeOutput

/**
 * Context after Phase 5 (Write Files)
 * Requires: Phase 4
 */
export type ContextAfterPhase5 = ContextAfterPhase4 & WriteFilesOutput

/**
 * Context after Phase 6 (Write Base Infrastructure)
 * Requires: Phase 5
 */
export type ContextAfterPhase6 = ContextAfterPhase5 & WriteBaseInfrastructureOutput

/**
 * Context after Phase 7 (Generate Barrels)
 * Requires: Phase 6
 */
export type ContextAfterPhase7 = ContextAfterPhase6 & GenerateBarrelsOutput

/**
 * Context after Phase 8 (Generate OpenAPI)
 * Requires: Phase 7
 */
export type ContextAfterPhase8 = ContextAfterPhase7 & GenerateOpenAPIOutput

/**
 * Context after Phase 9 (Write Manifest) + Metrics
 * Requires: Phase 8
 * NOTE: This is where phaseMetrics become available
 */
export type ContextAfterPhase9 = ContextAfterPhase8 & WriteManifestOutput & PhaseMetrics

/**
 * Context after Phase 10 (Generate TypeScript Config)
 * Requires: Phase 9
 */
export type ContextAfterPhase10 = ContextAfterPhase9 & GenerateTsConfigOutput

/**
 * Context after Phase 11 (Write Standalone Project)
 * Requires: Phase 10
 */
export type ContextAfterPhase11 = ContextAfterPhase10 & WriteStandaloneProjectOutput

/**
 * Context after Phase 12 (Generate Test Suite)
 * Requires: Phase 11
 */
export type ContextAfterPhase12 = ContextAfterPhase11 & GenerateTestSuiteOutput

/**
 * Context after Phase 13 (Format Code)
 * Requires: Phase 12
 * Final context type with all data
 */
export type ContextAfterPhase13 = ContextAfterPhase12 & FormatCodeOutput

/**
 * Final complete context type (after all phases)
 */
export type CompleteContext = ContextAfterPhase13

// ============================================================================
// TYPED PHASE BASE CLASS
// ============================================================================

/**
 * Generic phase interface with strongly-typed requirements and outputs
 * 
 * @template TRequires - Context type required as input
 * @template TProvides - Additional data provided as output
 * 
 * @example
 * ```ts
 * class MyPhase implements TypedPhase<ContextAfterPhase1, MyPhaseOutput> {
 *   execute(context: ContextAfterPhase1): Promise<MyPhaseOutput> {
 *     // TypeScript knows context.schema exists!
 *     const { schema, modelNames } = context
 *     return { myData: processModels(modelNames) }
 *   }
 * }
 * ```
 */
export interface TypedPhase<TRequires extends BaseContext, TProvides extends object> {
  /**
   * Execute phase with strongly-typed context
   * 
   * @param context - Context with all required fields (compile-time guaranteed)
   * @returns Data to merge into context for subsequent phases
   */
  execute(context: TRequires): Promise<TProvides>
  
  /**
   * Check if phase should run (optional)
   */
  shouldRun?(context: TRequires): boolean
  
  /**
   * Human-readable phase description
   */
  getDescription(): string
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Extract the required context type from a TypedPhase
 */
export type RequiredContext<T> = T extends TypedPhase<infer R, any> ? R : never

/**
 * Extract the provided output type from a TypedPhase
 */
export type ProvidedOutput<T> = T extends TypedPhase<any, infer P> ? P : never

/**
 * Merge required context with provided output to get the next context type
 */
export type NextContext<T> = T extends TypedPhase<infer R, infer P> 
  ? R & P 
  : never


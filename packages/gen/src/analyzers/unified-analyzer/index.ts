/**
 * Unified Model Analyzer
 * 
 * Combines relationship analysis and capability detection into an optimized
 * analyzer that minimizes field traversals.
 * 
 * PERFORMANCE: Single-pass field analysis
 * CORRECTNESS: Handles enums, composite keys, unidirectional relations
 * FLEXIBILITY: Configurable patterns, error collection, custom hooks
 */

import type { ParsedModel, ParsedSchema } from '../../dmmf-parser.js'
import type { UnifiedAnalyzerConfig, UnifiedModelAnalysis } from './types.js'
import { DEFAULT_CONFIG, validateConfig } from './config.js'
import { analyzeRelationships } from './relationship-classifier.js'
import { analyzeFieldsOnce } from './field-detector.js'
import { analyzeCapabilities } from './capabilities-builder.js'

// Re-export all types for convenience
export * from './types.js'

// Re-export utilities
export { generateIncludeObject, generateSummaryInclude } from './include-generator.js'
export { normalizeFieldName } from './utils.js'
export { isFieldUnique, areFieldsUnique } from './unique-validator.js'

/**
 * Analyze a model and return ALL analysis data
 * 
 * Performs optimized analysis with minimal field traversals:
 * - Single pass for field analysis (special fields, search, filters)
 * - Relationship analysis (with schema context)
 * - Capability detection
 * 
 * This replaces separate calls to:
 * - analyzeModel() from relationship-analyzer.ts
 * - analyzeModelCapabilities() from model-capabilities.ts
 * 
 * @param model - Model to analyze
 * @param schema - Full schema (for relationship resolution)
 * @param config - Analyzer configuration (optional)
 * @returns Complete analysis including relationships, capabilities, and special fields
 * 
 * @example
 * ```ts
 * // Strict mode (default) - throws immediately on errors
 * const analysis = analyzeModelUnified(model, schema)
 * 
 * // Lenient mode - collects all errors
 * const analysis = analyzeModelUnified(model, schema, { collectErrors: true })
 * if (analysis.errors) {
 *   analysis.errors.forEach(err => 
 *     console.error(`${err.model}.${err.field}: ${err.message}`)
 *   )
 * }
 * 
 * // Custom auto-include logic
 * const analysis = analyzeModelUnified(model, schema, {
 *   shouldAutoInclude: (rel, model) => {
 *     return rel.isManyToOne && rel.field.isRequired
 *   }
 * })
 * ```
 */
export function analyzeModelUnified(
  model: ParsedModel,
  schema: ParsedSchema,
  config: UnifiedAnalyzerConfig = {}
): UnifiedModelAnalysis {
  // Validate configuration
  validateConfig(config)
  
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const allErrors: Array<{ model: string; field: string; message: string }> = []
  
  // 1. Analyze relationships (requires schema for target models)
  const relationshipAnalysis = analyzeRelationships(model, schema, cfg)
  if (relationshipAnalysis.errors) {
    allErrors.push(...relationshipAnalysis.errors)
  }
  
  // 2. SINGLE-PASS field analysis: special fields, search, filters all at once
  const fieldAnalysis = analyzeFieldsOnce(model, cfg)
  
  // 3. Analyze capabilities using already-computed field analysis
  const capabilities = analyzeCapabilities(
    model,
    fieldAnalysis.specialFields,
    fieldAnalysis.searchFields,
    fieldAnalysis.filterFields,
    cfg
  )
  
  const result: UnifiedModelAnalysis = {
    model,
    // Relationships
    relationships: relationshipAnalysis.relationships,
    autoIncludeRelations: relationshipAnalysis.autoInclude,
    isJunctionTable: relationshipAnalysis.isJunctionTable,
    // Special Fields
    specialFields: fieldAnalysis.specialFields,
    hasPublishedField: !!fieldAnalysis.specialFields.published,
    hasSlugField: !!fieldAnalysis.specialFields.slug,
    // Capabilities
    capabilities
  }
  
  if (allErrors.length > 0 && cfg.collectErrors) {
    result.errors = allErrors
  }
  
  return result
}


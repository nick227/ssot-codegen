/**
 * Schema Analyzers
 * 
 * Unified analyzer for comprehensive model analysis with zero-config generation
 * Combines relationship analysis, capability detection, and special field recognition
 * in a single optimized pass.
 */

// Export everything from unified analyzer
export {
  analyzeModelUnified,
  generateIncludeObject,
  generateSummaryInclude,
  normalizeFieldName,
  isFieldUnique,
  areFieldsUnique,
  type UnifiedModelAnalysis,
  type RelationshipInfo,
  type SpecialFields,
  type ModelCapabilities,
  type ForeignKeyInfo,
  type FilterField,
  type FilterType,
  type UnifiedAnalyzerConfig
} from './unified-analyzer/index.js'

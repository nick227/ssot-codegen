/**
 * Schema Analyzers
 * Auto-detect capabilities from Prisma schema for zero-config generation
 */

export {
  analyzeField,
  getFilterableFields,
  getSearchableFields,
  getSortableFields,
  type FieldCapabilities,
  type FilterField,
  type FilterType
} from './field-analyzer.js'

export {
  analyzeModelCapabilities,
  getGenerationSummary,
  type ModelCapabilities,
  type ForeignKeyInfo
} from './model-capabilities.js'


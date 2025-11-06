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

// ParsedModel versions (for use with our internal ParsedModel type)
export {
  getFilterableFields as getFilterableFieldsParsed,
  getSearchableFields as getSearchableFieldsParsed,
  getSortableFields as getSortableFieldsParsed
} from './field-analyzer-parsed.js'

export {
  analyzeModelCapabilities,
  getGenerationSummary,
  type ModelCapabilities,
  type ForeignKeyInfo
} from './model-capabilities.js'


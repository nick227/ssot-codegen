/**
 * Unified Analyzer - Field Detection
 * 
 * Single-pass field analysis for search, filter, and special fields
 * PERFORMANCE: Pre-computes normalized names, single iteration
 */

import type { ParsedModel } from '../../dmmf-parser.js'
import type { FilterField } from '../field-analyzer.js'
import type { UnifiedAnalyzerConfig, FieldAnalysisResult, SpecialFields } from './types.js'
import { FIELD_KIND_SCALAR, FIELD_KIND_ENUM, FIELD_KIND_OBJECT, SENSITIVE_FIELD_PATTERN } from './config.js'
import { normalizeFieldName, isSensitiveField } from './utils.js'
import { detectSpecialFields } from './special-fields-detector.js'

type FilterType = 'exact' | 'range' | 'boolean' | 'enum' | 'array'

const FILTERABLE_SCALAR_TYPES = new Set([
  'String', 'Int', 'BigInt', 'Float', 'Decimal', 
  'Boolean', 'DateTime'
])

/**
 * Get filter type for a field
 */
function getFilterType(field: { kind: string; type: string; isList: boolean }): FilterType {
  // Lists (including enum lists like Role[]) are treated as 'array'
  if (field.isList) return 'array'
  // Single enums (like Role)
  if (field.kind === FIELD_KIND_ENUM) return 'enum'
  // Scalars
  if (field.type === 'Boolean') return 'boolean'
  if (field.type === 'DateTime') return 'range'
  if (['Int', 'BigInt', 'Float', 'Decimal'].includes(field.type)) return 'range'
  return 'exact'
}

/**
 * Analyze all fields in a single pass
 * 
 * PERFORMANCE OPTIMIZATION:
 * - Pre-computes normalized names once
 * - Single iteration through fields
 * - Detects search, filter, and special fields together
 * 
 * @param model - Model to analyze
 * @param config - Analyzer configuration
 * @returns Search fields, filter fields, special fields, and normalized names
 */
export function analyzeFieldsOnce(
  model: ParsedModel,
  config: UnifiedAnalyzerConfig
): FieldAnalysisResult {
  const searchFields: string[] = []
  const filterFields: FilterField[] = []
  
  // Config extraction
  const excludeSensitive = config.excludeSensitiveSearchFields ?? true
  const sensitivePatterns = config.sensitiveFieldPatterns ?? [SENSITIVE_FIELD_PATTERN]
  
  // PERFORMANCE OPTIMIZATION: Pre-compute normalized names once
  const normalizedNames = new Map<string, string>()
  for (const field of model.fields) {
    if (field.kind !== FIELD_KIND_OBJECT) {
      normalizedNames.set(field.name, normalizeFieldName(field.name))
    }
  }
  
  // Detect special fields using pre-computed normalized names
  const specialFields = detectSpecialFields(model, config, normalizedNames)
  
  // SINGLE PASS through ALL fields (not just scalarFields)
  for (const field of model.fields) {
    // Skip relation fields
    if (field.kind === FIELD_KIND_OBJECT) continue
    
    // Use cached normalized name (performance optimization)
    const normalized = normalizedNames.get(field.name)!
    const isScalar = field.kind === FIELD_KIND_SCALAR
    const isEnum = field.kind === FIELD_KIND_ENUM
    
    // Check for searchable fields (String scalars only, not enums)
    if (isScalar && field.type === 'String' && !field.isId && !field.isReadOnly) {
      // Reuse already-normalized name for performance
      if (!excludeSensitive || !isSensitiveField(field.name, sensitivePatterns)) {
        searchFields.push(field.name)
      }
    }
    
    // Check for filterable fields (scalars, enums, and their lists)
    const isFilterable = 
      (isEnum && !field.isReadOnly) ||  // Enum (includes lists)
      (isScalar && field.isList && FILTERABLE_SCALAR_TYPES.has(field.type) && !field.isReadOnly) ||  // Scalar lists
      (isScalar && FILTERABLE_SCALAR_TYPES.has(field.type) && !field.isId && !field.isReadOnly)  // Scalars
    
    if (isFilterable) {
      filterFields.push({
        name: field.name,
        type: getFilterType(field),
        fieldType: field.type,
        isRequired: field.isRequired
      })
    }
  }
  
  return { specialFields, searchFields, filterFields, normalizedNames }
}


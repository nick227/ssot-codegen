/**
 * Unified Analyzer - Capabilities Builder
 * 
 * Aggregates field analysis results into model capabilities
 */

import type { ParsedModel, ParsedField } from '../../dmmf-parser.js'
import type { UnifiedAnalyzerConfig, ModelCapabilities, SpecialFields, ForeignKeyInfo, FilterField } from './types.js'
import { FIELD_KIND_OBJECT, DEFAULT_PARENT_PATTERN } from './config.js'
import { normalizeFieldName } from './utils.js'

/**
 * Build model capabilities from analyzed field data
 * 
 * @param model - Model being analyzed
 * @param specialFields - Already-detected special fields
 * @param searchFields - Already-detected searchable fields
 * @param filterFields - Already-detected filterable fields
 * @param config - Analyzer configuration
 * @returns Aggregated capabilities
 */
export function analyzeCapabilities(
  model: ParsedModel,
  specialFields: SpecialFields,
  searchFields: string[],
  filterFields: FilterField[],
  config: UnifiedAnalyzerConfig
): ModelCapabilities {
  return {
    // Search capabilities (already computed)
    hasSearch: searchFields.length > 0,
    searchFields,
    
    // Filter capabilities (already computed)
    hasFilters: filterFields.length > 0,
    filterFields,
    
    // Special method detection (use already-detected special fields)
    hasFindBySlug: !!specialFields.slug,
    hasFeatured: hasFieldNormalized(model, 'isFeatured'),
    hasActive: hasFieldNormalized(model, 'isActive'),
    hasPublished: !!specialFields.published,
    hasSoftDelete: !!specialFields.deletedAt,
    
    // Relationship detection
    hasParentChild: hasParentChildRelation(model, specialFields, config),
    foreignKeys: getForeignKeys(model)
  }
}

/**
 * Check if field exists with normalized name matching
 * Handles variations: is_featured, isFeatured, is-featured
 */
function hasFieldNormalized(model: ParsedModel, targetName: string): boolean {
  const normalizedTarget = normalizeFieldName(targetName)
  return model.fields.some(f => normalizeFieldName(f.name) === normalizedTarget)
}

/**
 * Detect self-referential parent/child relations
 * Uses already-detected parentId field and configurable patterns
 */
function hasParentChildRelation(
  model: ParsedModel,
  specialFields: SpecialFields,
  config: UnifiedAnalyzerConfig
): boolean {
  // Use the already-detected parentId field if available
  const parentIdField = specialFields.parentId
  if (parentIdField) {
    return model.fields.some(field =>
      field.kind === FIELD_KIND_OBJECT &&
      field.type === model.name &&
      Array.isArray(field.relationFromFields) &&
      field.relationFromFields.includes(parentIdField.name)
    )
  }
  
  // Fallback: detect using configurable pattern (parent|ancestor|root)
  const providedPattern = config.parentFieldPatterns ?? DEFAULT_PARENT_PATTERN
  
  // Ensure pattern is case-insensitive (reconstruct if needed)
  const pattern = providedPattern.flags.includes('i')
    ? providedPattern
    : new RegExp(providedPattern.source, 'i')
  
  return model.fields.some(field => {
    if (field.kind !== FIELD_KIND_OBJECT || field.type !== model.name) return false
    if (!Array.isArray(field.relationFromFields) || field.relationFromFields.length === 0) {
      return false
    }
    
    return field.relationFromFields.some(fkField =>
      pattern.test(normalizeFieldName(fkField))
    )
  })
}

/**
 * Extract foreign key information, handling composite foreign keys
 * Returns all fields in composite FKs, includes self-references
 */
function getForeignKeys(model: ParsedModel): ForeignKeyInfo[] {
  const result: ForeignKeyInfo[] = []
  
  for (const field of model.fields) {
    if (field.kind !== FIELD_KIND_OBJECT) continue
    if (!Array.isArray(field.relationFromFields) || field.relationFromFields.length === 0) {
      continue
    }
    
    result.push({
      fieldNames: field.relationFromFields,
      relationAlias: field.name,
      relationName: field.relationName ?? null,
      relatedModel: field.type
    })
  }
  
  return result
}


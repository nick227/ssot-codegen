/**
 * Unified Analyzer - Relationship Classification
 * 
 * Classifies relationship types (1:1, 1:M, M:1, M:N) for both
 * bidirectional and unidirectional relations
 */

import type { ParsedModel, ParsedSchema, ParsedField } from '../../dmmf-parser.js'
import type { UnifiedAnalyzerConfig, RelationshipInfo, RelationshipAnalysisResult } from './types.js'
import { isJunctionTable } from '@/utils/junction-table.js'
import { findBackReference } from './back-reference-matcher.js'
import { areFieldsUnique } from './unique-validator.js'

/**
 * Analyze all relationships in a model
 * 
 * Handles:
 * - Bidirectional relations (with back-reference)
 * - Unidirectional relations (without back-reference)
 * - Junction table detection
 * - Auto-include determination
 * - Error collection
 * 
 * @param model - Model to analyze
 * @param schema - Full schema (for target model lookups)
 * @param config - Analyzer configuration
 * @returns Classified relationships with auto-include info
 */
export function analyzeRelationships(
  model: ParsedModel,
  schema: ParsedSchema,
  config: UnifiedAnalyzerConfig
): RelationshipAnalysisResult {
  // Detect if this model is a junction table
  const isJunction = isJunctionTable(model, {
    junctionTableMaxDataFields: config.junctionTableMaxDataFields,
    systemFieldNames: config.systemFieldNames
  })
  
  const errors: Array<{ model: string; field: string; message: string }> = []
  const skippedRelations: string[] = []
  
  const relationships = model.relationFields.flatMap(field => {
    // Validate target model exists
    const targetModel = schema.modelMap.get(field.type)
    if (!targetModel) {
      const error = {
        model: model.name,
        field: field.name,
        message: `Relation '${field.name}' points to undefined model '${field.type}'`
      }
      
      if (config.collectErrors) {
        errors.push(error)
        skippedRelations.push(field.name)
        return []  // Skip this relationship
      } else {
        throw new Error(
          `Model '${model.name}' has relation field '${field.name}' pointing to undefined model '${field.type}'. ` +
          `Check your schema for typos or missing models.`
        )
      }
    }
    
    // Classify relationship type
    const relationship = classifyRelationshipType(field, targetModel, model, config, isJunction)
    
    return relationship
  })
  
  return {
    relationships,
    autoInclude: relationships.filter(r => r.shouldAutoInclude),
    isJunctionTable: isJunction,
    skippedRelations: skippedRelations.length > 0 ? skippedRelations : undefined,
    errors: errors.length > 0 ? errors : undefined
  }
}

/**
 * Classify relationship type using bidirectional or unidirectional heuristics
 * 
 * BIDIRECTIONAL (has back-reference):
 * - 1:1 = scalar on both sides
 * - M:N = list on both sides
 * - 1:M = list on this side, scalar on other
 * - M:1 = scalar on this side, list on other
 * 
 * UNIDIRECTIONAL (no back-reference):
 * - Has FK + unique FK = 1:1
 * - Has FK + non-unique = M:1
 * - List + target is not junction = 1:M
 * - List + target is junction = unidirectional M:N (set isManyToMany)
 * - Scalar without FK = implicit 1:1 (rare)
 */
function classifyRelationshipType(
  field: ParsedField,
  targetModel: ParsedModel,
  sourceModel: ParsedModel,
  config: UnifiedAnalyzerConfig,
  isJunction: boolean
): RelationshipInfo {
  // Find back-reference field using relationName for proper pairing
  const backRef = findBackReference(field, targetModel, sourceModel)
  
  let isOneToOne = false
  let isManyToMany = false
  let isOneToMany = false
  let isManyToOne = false
  
  if (backRef !== null) {
    // Bidirectional - use both sides to classify
    isOneToOne = !field.isList && !backRef.isList
    isManyToMany = field.isList && backRef.isList
    isOneToMany = field.isList && !backRef.isList
    isManyToOne = !field.isList && backRef.isList
  } else {
    // Unidirectional - use heuristics
    const hasFKFields = Array.isArray(field.relationFromFields) && field.relationFromFields.length > 0
    
    if (hasFKFields) {
      // Has FK fields = this side owns the relation
      const fkFields = field.relationFromFields as string[]
      
      // Check if FK is unique to distinguish 1:1 from M:1
      const fkAreUnique = areFieldsUnique(sourceModel, fkFields)
      
      if (fkAreUnique) {
        isOneToOne = true  // Unique FK (single or composite) = 1:1
      } else {
        isManyToOne = true  // Non-unique FK = M:1
      }
    } else if (field.isList) {
      // List field without back-ref
      const targetIsJunction = isJunctionTable(targetModel, {
        junctionTableMaxDataFields: config.junctionTableMaxDataFields,
        systemFieldNames: config.systemFieldNames
      })
      
      if (targetIsJunction) {
        isManyToMany = true  // Target is junction table = unidirectional M:N
      } else {
        isOneToMany = true   // Target is regular model = 1:M
      }
    } else {
      // Scalar without FK = implicit 1:1 (rare case)
      isOneToOne = true
    }
  }
  
  // Build relationship object
  const relationship: RelationshipInfo = {
    field,
    targetModel,
    isOneToOne,
    isManyToMany,
    isOneToMany,
    isManyToOne,
    shouldAutoInclude: false  // Computed next
  }
  
  // Decide if we should auto-include
  if (config.shouldAutoInclude) {
    relationship.shouldAutoInclude = config.shouldAutoInclude(relationship, sourceModel)
  } else if (config.autoIncludeManyToOne !== false && isManyToOne && !isJunction) {
    if (config.autoIncludeRequiredOnly) {
      // Only include if all FK fields are required
      const fkFields = field.relationFromFields || []
      const allRequired = fkFields.every(fkName => {
        const fkField = sourceModel.scalarFields.find(f => f.name === fkName)
        return fkField?.isRequired === true
      })
      relationship.shouldAutoInclude = allRequired
    } else {
      relationship.shouldAutoInclude = true
    }
  }
  
  return relationship
}


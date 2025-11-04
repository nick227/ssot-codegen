/**
 * Relationship Analyzer - Analyzes model relationships
 * 
 * Determines:
 * - One-to-one relationships
 * - One-to-many relationships
 * - Many-to-many relationships
 * - Self-referencing relationships
 * - Circular dependencies
 */

import type { ParsedModel, ParsedField, ParsedSchema } from './dmmf-parser.js'

export type RelationType = 'one-to-one' | 'one-to-many' | 'many-to-many' | 'self-reference'

export interface Relationship {
  type: RelationType
  fromModel: string
  fromField: string
  toModel: string
  toField?: string
  relationName?: string
  isRequired: boolean
  isList: boolean
}

/**
 * Analyze all relationships in schema
 */
export function analyzeRelationships(schema: ParsedSchema): Relationship[] {
  const relationships: Relationship[] = []
  
  for (const model of schema.models) {
    for (const field of model.relationFields) {
      const relationship = analyzeRelationField(model, field, schema)
      if (relationship) {
        relationships.push(relationship)
      }
    }
  }
  
  return relationships
}

/**
 * Analyze a single relation field
 */
function analyzeRelationField(
  model: ParsedModel,
  field: ParsedField,
  schema: ParsedSchema
): Relationship | null {
  if (field.kind !== 'object') return null
  
  const targetModel = schema.modelMap.get(field.type)
  if (!targetModel) return null
  
  // Determine relationship type
  const relationType = determineRelationType(model, field, targetModel, field.relationName)
  
  // Find the reverse field
  const reverseField = findReverseField(targetModel, model.name, field.relationName)
  
  return {
    type: relationType,
    fromModel: model.name,
    fromField: field.name,
    toModel: targetModel.name,
    toField: reverseField?.name,
    relationName: field.relationName,
    isRequired: field.isRequired,
    isList: field.isList
  }
}

/**
 * Determine relationship type
 */
function determineRelationType(
  fromModel: ParsedModel,
  field: ParsedField,
  toModel: ParsedModel,
  relationName?: string
): RelationType {
  // Self-reference
  if (fromModel.name === toModel.name) {
    return 'self-reference'
  }
  
  // Find reverse field
  const reverseField = findReverseField(toModel, fromModel.name, relationName)
  
  if (!reverseField) {
    // No reverse - assume one-to-many
    return field.isList ? 'many-to-many' : 'one-to-many'
  }
  
  // Both sides are lists = many-to-many
  if (field.isList && reverseField.isList) {
    return 'many-to-many'
  }
  
  // One side is list = one-to-many
  if (field.isList || reverseField.isList) {
    return 'one-to-many'
  }
  
  // Neither is list = one-to-one
  return 'one-to-one'
}

/**
 * Find reverse field in related model
 */
function findReverseField(
  model: ParsedModel,
  targetModelName: string,
  relationName?: string
): ParsedField | undefined {
  if (!relationName) return undefined
  
  return model.relationFields.find(f => 
    f.relationName === relationName && f.type === targetModelName
  )
}

/**
 * Get foreign key fields
 */
export function getForeignKeyFields(field: ParsedField, model: ParsedModel): ParsedField[] {
  if (!field.relationFromFields || field.relationFromFields.length === 0) {
    return []
  }
  
  return field.relationFromFields
    .map(fieldName => model.fields.find(f => f.name === fieldName))
    .filter((f): f is ParsedField => f !== undefined)
}

/**
 * Get models in dependency order (no circular refs)
 */
export function topologicalSort(schema: ParsedSchema): ParsedModel[] {
  const sorted: ParsedModel[] = []
  const visited = new Set<string>()
  const visiting = new Set<string>()
  
  function visit(modelName: string): void {
    if (visited.has(modelName)) return
    if (visiting.has(modelName)) {
      // Circular dependency - just add it
      return
    }
    
    visiting.add(modelName)
    
    const model = schema.modelMap.get(modelName)
    if (!model) return
    
    // Visit dependencies first
    for (const field of model.relationFields) {
      if (field.relationFromFields && field.relationFromFields.length > 0) {
        // This model depends on the target
        visit(field.type)
      }
    }
    
    visiting.delete(modelName)
    visited.add(modelName)
    sorted.push(model)
  }
  
  for (const model of schema.models) {
    visit(model.name)
  }
  
  return sorted
}

/**
 * Check if model has relationships
 */
export function hasRelationships(model: ParsedModel): boolean {
  return model.relationFields.length > 0
}

/**
 * Get required relations for create
 */
export function getRequiredRelations(model: ParsedModel): ParsedField[] {
  return model.relationFields.filter(f => 
    f.isRequired && 
    f.relationFromFields && 
    f.relationFromFields.length > 0
  )
}

/**
 * Get optional relations for create
 */
export function getOptionalRelations(model: ParsedModel): ParsedField[] {
  return model.relationFields.filter(f => !f.isRequired)
}

/**
 * Check if model is a junction table (many-to-many)
 */
export function isJunctionTable(model: ParsedModel): boolean {
  // Junction tables typically have:
  // - Exactly 2 relation fields
  // - All fields are either relations or id/timestamps
  // - Compound unique constraint on the two relations
  
  const relationCount = model.relationFields.length
  const scalarCount = model.scalarFields.filter(f => 
    !f.isId && !f.isUpdatedAt && f.name !== 'createdAt'
  ).length
  
  return relationCount === 2 && scalarCount === 0
}


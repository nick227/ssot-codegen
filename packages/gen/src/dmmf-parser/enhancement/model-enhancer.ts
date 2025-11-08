/**
 * Model enhancement logic
 * 
 * Enhances parsed models with derived properties:
 * - ID field detection
 * - Field categorization (scalar, relation, create, update, read)
 * - Composite primary key marking
 * - Self-relation detection
 * - Reverse relation assignment
 */

import type { ParsedModel, ParsedField } from '../types.js'
import { SYSTEM_TIMESTAMP_FIELDS } from '../constants.js'
import { conditionalFreeze } from '../utils/freezing.js'

/**
 * Enhance model with derived properties
 * 
 * Optimized single-pass categorization of fields
 * 
 * Note: This function mutates the model in-place during initial parsing.
 * The readonly properties in ParsedModel interface are for consumers,
 * not for the initial construction phase.
 */
export function enhanceModel(
  model: ParsedModel, 
  modelMap: Map<string, ParsedModel>,
  reverseRelationMap: Map<string, readonly ParsedField[]>,
  shouldFreeze: boolean
): void {
  // Cast to mutable version for initialization
  // This is safe because we're in the construction phase
  const mutableModel = model as {
    -readonly [K in keyof ParsedModel]: ParsedModel[K]
  }
  
  // Mark fields that are part of composite primary key
  if (model.primaryKey?.fields) {
    const compositePkFields = new Set(model.primaryKey.fields)
    for (const field of model.fields) {
      if (compositePkFields.has(field.name)) {
        // We need to cast to mutable to set this property
        (field as { -readonly [K in keyof ParsedField]: ParsedField[K] }).isPartOfCompositePrimaryKey = true
      }
    }
  }
  
  // Single-pass field categorization (performance optimization)
  const scalarFields: ParsedField[] = []
  const relationFields: ParsedField[] = []
  const createFields: ParsedField[] = []
  const updateFields: ParsedField[] = []
  let idField: ParsedField | undefined
  let hasSelfRelation = false
  
  // Type-safe check for system timestamp fields
  const isSystemTimestamp = (name: string): boolean => 
    (SYSTEM_TIMESTAMP_FIELDS as readonly string[]).includes(name)
  
  for (const field of model.fields) {
    // Track ID field
    if (field.isId) idField = field
    
    // Track self-relations
    if (field.isSelfRelation) hasSelfRelation = true
    
    // Categorize by kind
    if (field.kind === 'object') {
      relationFields.push(field)
      continue
    }
    
    if (field.kind === 'unsupported') {
      continue // Skip unsupported fields entirely
    }
    
    // Scalar or enum field (unsupported already skipped)
    scalarFields.push(field)
    
    // Check if field should be in CreateDTO and UpdateDTO
    // Exclusions apply to both create and update:
    // - ID fields (generated or provided separately)
    // - Read-only fields (computed, @updatedAt, etc.)
    // - DB-managed timestamps (createdAt with DB default, updatedAt)
    // - Unsupported field types (already filtered above)
    // 
    // IMPORTANT ALIGNMENT: createdAt field behavior
    // - createdAt with now() (client-managed):
    //   * hasDbDefault = false (isDbManagedDefault returns false for now())
    //   * isReadOnly = false (determineReadOnly only marks read-only for DB-managed defaults)
    //   * isDbManagedTimestamp = false
    //   * Result: INCLUDED in CreateDTO ✅ (users can provide custom value)
    // 
    // - createdAt with dbgenerated() or DB function:
    //   * hasDbDefault = true
    //   * isReadOnly = true (determineReadOnly marks as read-only)
    //   * isDbManagedTimestamp = true
    //   * Result: EXCLUDED from CreateDTO ✅ (DB handles it)
    // 
    // This alignment is critical and must be maintained if determineReadOnly logic changes.
    const isDbManagedTimestamp = field.hasDbDefault && isSystemTimestamp(field.name)
    const isIncludedInDTO = !field.isId && !field.isReadOnly && !field.isUpdatedAt && !isDbManagedTimestamp
    
    if (isIncludedInDTO) {
      createFields.push(field)
      updateFields.push(field)
    }
  }
  
  // Set all derived properties
  // Note: Conditionally freeze all arrays based on options
  // Using mutableModel to assign to readonly properties during construction
  mutableModel.idField = idField
  mutableModel.fields = conditionalFreeze([...model.fields], shouldFreeze) as readonly ParsedField[]
  mutableModel.scalarFields = conditionalFreeze(scalarFields, shouldFreeze) as readonly ParsedField[]
  mutableModel.relationFields = conditionalFreeze(relationFields, shouldFreeze) as readonly ParsedField[]
  mutableModel.createFields = conditionalFreeze(createFields, shouldFreeze) as readonly ParsedField[]
  mutableModel.updateFields = conditionalFreeze(updateFields, shouldFreeze) as readonly ParsedField[]
  mutableModel.readFields = conditionalFreeze([...scalarFields], shouldFreeze) as readonly ParsedField[]
  mutableModel.hasSelfRelation = hasSelfRelation
  mutableModel.reverseRelations = conditionalFreeze([...(reverseRelationMap.get(model.name) || [])], shouldFreeze) as readonly ParsedField[]
}


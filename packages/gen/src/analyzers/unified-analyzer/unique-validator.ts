/**
 * Unified Analyzer - Unique Constraint Validation
 * 
 * Validates unique constraints for single and composite foreign keys
 */

import type { ParsedModel } from '../../dmmf-parser.js'

/**
 * Check if a field is part of a unique index (including composite)
 * 
 * @param model - The model to check
 * @param fieldName - Single field name to check
 * @param requireExactMatch - If true, unique index must contain ONLY this field
 * @returns true if field is unique (alone or as part of composite unique)
 * 
 * @example
 * ```prisma
 * model Post {
 *   slug String @unique
 *   userId Int
 *   tenantId Int
 *   @@unique([userId, tenantId])
 * }
 * 
 * isFieldUnique(model, 'slug', false)   // true (has @unique)
 * isFieldUnique(model, 'slug', true)    // true (unique alone)
 * isFieldUnique(model, 'userId', false) // true (part of composite)
 * isFieldUnique(model, 'userId', true)  // false (not unique alone)
 * ```
 */
export function isFieldUnique(model: ParsedModel, fieldName: string, requireExactMatch = false): boolean {
  // Check direct @unique attribute
  const field = model.fields.find(f => f.name === fieldName)
  if (field?.isUnique) return true
  
  // Check composite unique indexes (@@unique([field, ...]))
  if (Array.isArray(model.uniqueFields) && model.uniqueFields.length > 0) {
    if (requireExactMatch) {
      // For single-field queries: unique index must contain ONLY this field
      return model.uniqueFields.some(uniqueIndex => 
        uniqueIndex.length === 1 && uniqueIndex[0] === fieldName
      )
    }
    // Default: field is unique if it's part of ANY unique index
    return model.uniqueFields.some(uniqueIndex => uniqueIndex.includes(fieldName))
  }
  
  return false
}

/**
 * Check if a set of fields together form a unique constraint
 * 
 * Used for composite foreign key validation to distinguish 1:1 from M:1
 * 
 * @param model - The model to check
 * @param fieldNames - Array of field names that should form a unique constraint together
 * @returns true if ALL fields together form a unique constraint
 * 
 * @example
 * ```prisma
 * model Order {
 *   userId Int
 *   tenantId Int
 *   @@unique([userId, tenantId])
 * }
 * 
 * areFieldsUnique(model, ['userId', 'tenantId'])  // true ✅
 * areFieldsUnique(model, ['userId'])              // false (not unique alone)
 * ```
 */
export function areFieldsUnique(model: ParsedModel, fieldNames: string[]): boolean {
  // Single field case
  if (fieldNames.length === 1) {
    return isFieldUnique(model, fieldNames[0], true)
  }
  
  // Check if there's a unique index that exactly matches ALL these fields
  if (Array.isArray(model.uniqueFields) && model.uniqueFields.length > 0) {
    return model.uniqueFields.some(uniqueIndex => {
      if (uniqueIndex.length !== fieldNames.length) return false
      const indexSet = new Set(uniqueIndex)
      return fieldNames.every(fk => indexSet.has(fk))
    })
  }
  
  return false
}


/**
 * Field helper utilities
 * 
 * Utility functions for working with parsed fields and models.
 */

import type { ParsedModel, ParsedField } from '../types.js'

/**
 * Get field by name
 * @returns Field if found, undefined if not found
 * @throws Never - Use optional chaining when calling (field?.name)
 */
export function getField(model: ParsedModel, fieldName: string): ParsedField | undefined {
  return model.fields.find(f => f.name === fieldName)
}

/**
 * Get relation target model
 * @param field - Field to get target for
 * @param modelMap - Map of all models
 * @returns Target model if field is a relation and target exists, undefined otherwise
 * 
 * Returns undefined when:
 * - field.kind is not 'object' (not a relation)
 * - Target model doesn't exist in modelMap
 */
export function getRelationTarget(
  field: ParsedField,
  modelMap: Map<string, ParsedModel>
): ParsedModel | undefined {
  if (field.kind !== 'object') return undefined
  return modelMap.get(field.type)
}

/**
 * Check if field is optional for create
 */
export function isOptionalForCreate(field: ParsedField): boolean {
  return field.isOptional
}

/**
 * Check if field is nullable
 */
export function isNullable(field: ParsedField): boolean {
  return field.isNullable
}





/**
 * Type guards for DMMF validation
 * 
 * Deep validation of DMMF structures to ensure they match expected shapes.
 */

import type { DMMF } from '@prisma/generator-helper'

/**
 * Type guard for DMMF enum (deep validation)
 * 
 * Note: Allows empty enums (values.length === 0) to pass through parsing.
 * Empty enums are caught later in validateSchema() with better error reporting.
 */
export function isValidDMMFEnum(e: unknown): e is DMMF.DatamodelEnum {
  if (!e || typeof e !== 'object') return false
  const obj = e as Record<string, unknown>
  
  if (typeof obj.name !== 'string' || obj.name.length === 0) return false
  if (!Array.isArray(obj.values)) return false  // Allow empty arrays
  
  // Validate nested values structure
  for (const val of obj.values) {
    if (!val || typeof val !== 'object') return false
    const valObj = val as Record<string, unknown>
    if (typeof valObj.name !== 'string' || valObj.name.length === 0) return false
  }
  
  return true
}

/**
 * Type guard for DMMF model (deep validation)
 */
export function isValidDMMFModel(m: unknown): m is DMMF.Model {
  if (!m || typeof m !== 'object') return false
  const obj = m as Record<string, unknown>
  
  if (typeof obj.name !== 'string' || obj.name.length === 0) return false
  if (!Array.isArray(obj.fields)) return false
  
  // Validate uniqueFields if present
  if (obj.uniqueFields !== undefined) {
    if (!Array.isArray(obj.uniqueFields)) return false
    for (const uf of obj.uniqueFields) {
      if (!Array.isArray(uf)) return false
    }
  }
  
  return true
}

/**
 * Type guard for DMMF field (deep validation)
 */
export function isValidDMMFField(f: unknown): f is DMMF.Field {
  if (!f || typeof f !== 'object') return false
  const obj = f as Record<string, unknown>
  
  if (typeof obj.name !== 'string' || obj.name.length === 0) return false
  if (typeof obj.type !== 'string' || obj.type.length === 0) return false
  if (typeof obj.kind !== 'string') return false
  if (typeof obj.isList !== 'boolean') return false
  if (typeof obj.isRequired !== 'boolean') return false
  
  // Validate relationFromFields/relationToFields if present
  if (obj.relationFromFields !== undefined && !Array.isArray(obj.relationFromFields)) return false
  if (obj.relationToFields !== undefined && !Array.isArray(obj.relationToFields)) return false
  
  return true
}



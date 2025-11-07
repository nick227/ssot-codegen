/**
 * Junction Table Detection Utilities
 * 
 * Centralized logic for identifying junction (many-to-many) tables in Prisma schemas
 */

import type { ParsedModel } from '../dmmf-parser.js'

export interface JunctionTableConfig {
  /** Maximum number of non-relation data fields allowed (default: 2) */
  junctionTableMaxDataFields?: number
  /** System field names to exclude from data field count */
  systemFieldNames?: string[]
}

// Default system field names to exclude from junction table data field count
const DEFAULT_SYSTEM_FIELDS = [
  'createdAt', 'updatedAt', 'deletedAt',
  'createdBy', 'updatedBy', 'deletedBy',
  'createdById', 'updatedById', 'deletedById',
  'version', 'rowVersion'
]

/**
 * Unified junction table detection
 * 
 * Handles both patterns:
 * - Composite primary key: @@id([userId, postId])
 * - Surrogate ID with unique constraint: id @id, @@unique([userId, postId])
 * 
 * OPTIMIZED: Single-pass accumulator (no intermediate arrays)
 * IMPROVED: Excludes common system fields (deletedAt, createdBy, etc.)
 * 
 * @param model - Parsed Prisma model
 * @param config - Optional configuration
 * @returns true if model is a junction table
 */
export function isJunctionTable(
  model: ParsedModel, 
  config: JunctionTableConfig = {}
): boolean {
  // Must have 2 or more relation fields
  if (model.relationFields.length < 2) return false
  
  const systemFields = config.systemFieldNames ?? DEFAULT_SYSTEM_FIELDS
  const systemFieldSet = new Set(systemFields.map(name => name.toLowerCase()))
  
  // OPTIMIZATION: Single-pass counter instead of filter() + .length
  // Avoids creating intermediate array just to count
  let dataFieldCount = 0
  for (const f of model.scalarFields) {
    // Skip ID, read-only, and updated-at fields
    if (f.isId || f.isReadOnly || f.isUpdatedAt) continue
    
    // Skip system fields (case-insensitive)
    if (systemFieldSet.has(f.name.toLowerCase())) continue
    
    // This is a data field
    dataFieldCount++
  }
  
  const maxDataFields = config.junctionTableMaxDataFields ?? 2
  if (dataFieldCount > maxDataFields) return false
  
  // Check for composite primary key (classic junction pattern)
  const hasCompositePK = !!(model.primaryKey && model.primaryKey.fields.length > 1)
  if (hasCompositePK) return true
  
  // Check for composite unique index covering relation fields (surrogate-id pattern)
  // e.g., id Int @id @default(autoincrement()), userId Int, postId Int, @@unique([userId, postId])
  if (model.uniqueFields && model.uniqueFields.length > 0) {
    const relationFKFields = new Set(
      model.relationFields.flatMap(f => f.relationFromFields || [])
    )
    
    return model.uniqueFields.some(uniqueIndex => 
      uniqueIndex.length >= 2 && 
      uniqueIndex.every(fieldName => relationFKFields.has(fieldName))
    )
  }
  
  return false
}

/**
 * Simple junction table check (for backward compatibility)
 * 
 * OPTIMIZED: Single-pass counter instead of filter()
 * 
 * @param model - Parsed Prisma model
 * @returns true if model appears to be a junction table
 */
export function isJunctionTableSimple(model: ParsedModel): boolean {
  const relationCount = model.relationFields.length
  
  // OPTIMIZATION: Accumulator pattern instead of filter() + .length
  let scalarCount = 0
  for (const f of model.scalarFields) {
    if (f.isId || f.isReadOnly || f.isUpdatedAt || f.name === 'createdAt') continue
    scalarCount++
  }
  
  return relationCount >= 2 && scalarCount <= 2
}


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
  
  // Count non-id, non-relation, non-system scalar fields
  const dataFields = model.scalarFields.filter(f => {
    if (f.isId || f.isReadOnly || f.isUpdatedAt) return false
    // Check against system field list (case-insensitive)
    if (systemFieldSet.has(f.name.toLowerCase())) return false
    return true
  })
  
  const maxDataFields = config.junctionTableMaxDataFields ?? 2
  if (dataFields.length > maxDataFields) return false
  
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
 * @param model - Parsed Prisma model
 * @returns true if model appears to be a junction table
 */
export function isJunctionTableSimple(model: ParsedModel): boolean {
  const relationCount = model.relationFields.length
  const scalarCount = model.scalarFields.filter(f => 
    !f.isId && !f.isReadOnly && !f.isUpdatedAt && f.name !== 'createdAt'
  ).length
  
  return relationCount >= 2 && scalarCount <= 2
}


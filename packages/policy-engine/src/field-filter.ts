/**
 * Field Filter Utilities
 * 
 * Handles field-level permissions (which fields can be read/written).
 * 
 * SRP: Only handles field-level permission filtering
 */

import type { PolicyContext, AllowedFields } from './types.js'

/**
 * Filter fields based on policy permissions
 * 
 * @param fieldConfig - Field configuration from policy
 * @param context - Policy context
 * @returns Allowed read/write fields
 */
export function filterFields(
  fieldConfig: {
    read?: string[]
    write?: string[]
    deny?: string[]
  },
  context: PolicyContext
): AllowedFields {
  const { read = [], write = [], deny = [] } = fieldConfig
  
  // If no read/write specified, allow all (except denied)
  let readFields = read.length > 0 ? [...read] : ['*']
  let writeFields = write.length > 0 ? [...write] : ['*']
  
  // Remove denied fields (deny takes precedence)
  if (deny.length > 0) {
    if (readFields.includes('*')) {
      // Can't compute without model schema
      // In real implementation, we'd fetch schema and subtract denied fields
      readFields = []
    } else {
      readFields = readFields.filter(field => !deny.includes(field))
    }
    
    if (writeFields.includes('*')) {
      writeFields = []
    } else {
      writeFields = writeFields.filter(field => !deny.includes(field))
    }
  }
  
  return {
    read: readFields,
    write: writeFields
  }
}

/**
 * Filter data object to only include allowed fields
 * 
 * Used when creating/updating records to strip fields user can't modify.
 * 
 * @param data - Data object to filter
 * @param allowedFields - List of allowed field names (or ['*'] for all)
 * @returns Filtered data object
 */
export function filterDataFields(data: Record<string, any>, allowedFields: string[]): Record<string, any> {
  // If '*' is in allowedFields, return all data
  if (allowedFields.includes('*')) {
    return data
  }
  
  // If allowedFields is empty, return empty object
  if (allowedFields.length === 0) {
    return {}
  }
  
  // Filter to only allowed fields
  const filtered: Record<string, any> = {}
  for (const field of allowedFields) {
    if (field in data) {
      filtered[field] = data[field]
    }
  }
  
  return filtered
}


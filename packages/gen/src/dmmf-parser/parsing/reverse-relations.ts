/**
 * Reverse relation mapping
 * 
 * Builds map of models to fields from other models that reference them.
 */

import type { ParsedModel, ParsedField, PrismaDefaultValue } from '../types.js'
import { conditionalFreeze, conditionalDeepFreeze } from '../utils/freezing.js'

/**
 * Build reverse relation map
 * Maps model names to fields from other models that reference them
 * 
 * Creates frozen copies to prevent unintentional mutations and cross-contamination
 * between forward and reverse relation views.
 * 
 * Deduplication key includes:
 * - Source model name
 * - Field name  
 * - Relation name (or 'implicit' if undefined)
 * - Target model name
 * - FK field count and PK field count (for exotic schemas with same names but different cardinalities)
 * 
 * This ensures each unique relation is recorded once, even across multiple
 * parsing passes or schema manipulations, and prevents collisions.
 * 
 * Returns map with conditionally frozen arrays based on options.
 */
export function buildReverseRelationMap(models: ParsedModel[], shouldFreeze: boolean): Map<string, readonly ParsedField[]> {
  const map = new Map<string, ParsedField[]>()
  const modelNames = new Set(models.map(m => m.name))
  
  // Initialize map with empty arrays for all valid models
  for (const model of models) {
    map.set(model.name, [])
  }
  
  // Track global deduplication key to prevent duplicates across all passes
  const globalSeen = new Set<string>()
  
  // Populate reverse relations with deduplication
  for (const model of models) {
    for (const field of model.fields) {
      if (field.kind === 'object') {
        // Only add if target model exists (prevents dangling references)
        if (modelNames.has(field.type)) {
          // Comprehensive deduplication key including field counts for exotic schemas
          // Includes: source, field, relation name, target, FK count, PK count
          // Prevents collisions in schemas with same relation names but different cardinalities
          const fromCount = field.relationFromFields?.length || 0
          const toCount = field.relationToFields?.length || 0
          const key = `${model.name}.${field.name}.${field.relationName || 'implicit'}.${field.type}.${fromCount}:${toCount}`
          if (!globalSeen.has(key)) {
            globalSeen.add(key)
            const targetRelations = map.get(field.type)
            if (targetRelations) {  // Defensive check instead of !
              // Create a deep frozen copy to prevent mutations affecting both forward and reverse views
              // This is critical because ParsedField objects may be shared or referenced elsewhere
              const frozenField: ParsedField = conditionalFreeze({
                ...field,
                relationFromFields: field.relationFromFields ? conditionalFreeze([...field.relationFromFields], shouldFreeze) as readonly string[] : undefined,
                relationToFields: field.relationToFields ? conditionalFreeze([...field.relationToFields], shouldFreeze) as readonly string[] : undefined,
                // Deep-copy and conditionally deep-freeze default object to prevent external mutations
                default: field.default && typeof field.default === 'object' 
                  ? conditionalDeepFreeze({ ...field.default as object }, shouldFreeze) as PrismaDefaultValue
                  : field.default
              }, shouldFreeze)
              targetRelations.push(frozenField)
            }
          }
        }
      }
    }
  }
  
  // Conditionally freeze all arrays in the map before returning to prevent external mutations
  const frozenMap = new Map<string, readonly ParsedField[]>()
  for (const [key, value] of map.entries()) {
    frozenMap.set(key, conditionalFreeze(value, shouldFreeze) as readonly ParsedField[])
  }
  
  return frozenMap
}


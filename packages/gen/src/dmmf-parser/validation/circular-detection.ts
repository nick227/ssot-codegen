/**
 * Circular relationship detection
 * 
 * Detects circular dependencies in required relations that would prevent data insertion.
 */

import type { ParsedSchema } from '../types.js'

/**
 * Detect circular relationship dependencies
 * 
 * Only checks for required (non-nullable) relations that own the foreign key (relationFromFields),
 * as these create actual insertion order dependencies that block data creation.
 * 
 * Relations that don't block insertion:
 * - Optional/nullable relations (can insert with null, then update)
 * - List relations (can be empty array)
 * - Implicit relations (no relationFromFields - managed by other side)
 * 
 * This prevents false positives for valid circular patterns like:
 * - User <-> Profile where one side is nullable
 * - Parent -> Child <- Parent where lists are involved
 * 
 * Performance: Uses single global DFS instead of per-model restarts.
 * Deduplicates cycles by tracking visited nodes in current path.
 */
export function detectCircularRelations(schema: ParsedSchema): string[] {
  const errors: string[] = []
  const visited = new Set<string>()
  const recursionStack = new Set<string>()  // Track current path for cycle detection
  const seenCycles = new Set<string>()  // Deduplicate reported cycles
  
  function visit(modelName: string, path: string[]): void {
    if (recursionStack.has(modelName)) {
      // Found a cycle - extract the cycle from the path
      const cycleStartIndex = path.findIndex(p => p.startsWith(modelName + '.'))
      const cyclePath = cycleStartIndex >= 0 
        ? [...path.slice(cycleStartIndex), modelName]
        : [...path, modelName]
      
      // Create a normalized cycle key for deduplication
      // Don't sort - preserve edge order for accurate cycle representation
      const cycleKey = cyclePath.join(' -> ')
      
      // Also check reverse direction to avoid reporting A->B->A and B->A->B separately
      const reversedCycle = [...cyclePath].reverse().join(' -> ')
      
      if (!seenCycles.has(cycleKey) && !seenCycles.has(reversedCycle)) {
        seenCycles.add(cycleKey)
        errors.push(
          `Circular relationship detected: ${cyclePath.join(' -> ')}. ` +
          `Make at least one relation nullable or remove relationFromFields to break the cycle.`
        )
      }
      return
    }
    
    if (visited.has(modelName)) return
    
    const model = schema.modelMap.get(modelName)
    if (!model) return
    
    recursionStack.add(modelName)
    
    // Only check required relations that own the FK and create insertion dependencies
    // Skip if:
    // - No relationFields (parsing incomplete)
    // - No relationFromFields (implicit relation, managed by other side)
    // - isList (can be empty array, doesn't block insertion)
    // - isOptional (can insert with null/undefined, then update later)
    for (const field of model.relationFields || []) {
      const ownsFK = field.relationFromFields && field.relationFromFields.length > 0
      const cannotBeNull = field.isRequired && !field.isNullable
      const blocksInsertion = cannotBeNull && !field.isList && ownsFK
      
      if (blocksInsertion) {
        // Build path with "ModelName.fieldName" format
        visit(field.type, [...path, `${modelName}.${field.name}`])
      }
    }
    
    recursionStack.delete(modelName)
    visited.add(modelName)
  }
  
  // Single global DFS pass - more efficient than per-model restarts
  for (const model of schema.models) {
    if (!visited.has(model.name)) {
      visit(model.name, [])
    }
  }
  
  return errors
}


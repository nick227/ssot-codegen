/**
 * Freezing utilities for immutability
 * 
 * Deep freeze and conditional freeze functions.
 */

/**
 * Deep freeze an object and all nested objects/arrays
 * 
 * Recursively freezes all properties to ensure complete immutability.
 * Handles circular references by tracking visited objects.
 * 
 * @param obj - Object to freeze
 * @param visited - Set of already-frozen objects (for circular reference handling)
 * @returns The frozen object
 */
export function deepFreeze<T>(obj: T, visited = new WeakSet()): T {
  // Skip primitives and null
  if (obj === null || typeof obj !== 'object') return obj
  
  // Avoid freezing the same object twice (handles circular refs)
  if (visited.has(obj as any)) return obj
  visited.add(obj as any)
  
  // Freeze the object itself
  Object.freeze(obj)
  
  // Recursively freeze all properties
  if (obj && typeof obj === 'object') {
    Object.getOwnPropertyNames(obj).forEach(prop => {
      const value = (obj as any)[prop]
      if (value && typeof value === 'object') {
        deepFreeze(value, visited)
      }
    })
  }
  
  return obj
}

/**
 * Conditionally freeze an object based on options
 * 
 * @param obj - Object to freeze
 * @param shouldFreeze - Whether to actually freeze
 * @returns The object (frozen if shouldFreeze is true)
 */
export function conditionalFreeze<T>(obj: T, shouldFreeze: boolean): T {
  return shouldFreeze ? Object.freeze(obj) : obj
}

/**
 * Conditionally deep-freeze an object based on options
 * 
 * @param obj - Object to deep-freeze
 * @param shouldFreeze - Whether to actually freeze
 * @returns The object (deep-frozen if shouldFreeze is true)
 */
export function conditionalDeepFreeze<T>(obj: T, shouldFreeze: boolean): T {
  return shouldFreeze ? deepFreeze(obj) : obj
}



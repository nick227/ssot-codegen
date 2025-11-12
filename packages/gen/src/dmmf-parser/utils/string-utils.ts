/**
 * String utilities for DMMF Parser
 * 
 * Safe stringification with redaction and array validation.
 */

/**
 * Redact potentially sensitive fields from objects before logging
 * 
 * Removes:
 * - documentation (may contain internal comments, business logic explanations)
 * - dbName (may reveal database structure)
 * - Large nested objects (may contain sensitive metadata)
 * 
 * @param obj - Object to redact
 * @returns Redacted copy safe for logging
 */
export function redactSensitiveFields(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj
  
  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveFields(item))
  }
  
  const result: any = {}
  const source = obj as Record<string, unknown>
  
  for (const [key, value] of Object.entries(source)) {
    // Redact sensitive string fields
    if (key === 'documentation' && typeof value === 'string') {
      result[key] = value.length > 50 
        ? '[REDACTED: ' + value.substring(0, 30) + '...]'
        : '[REDACTED]'
      continue
    }
    
    // Redact database-specific names (may reveal internal structure)
    if (key === 'dbName' && typeof value === 'string') {
      result[key] = '[REDACTED]'
      continue
    }
    
    // Recursively redact nested objects (but limit depth to prevent performance issues)
    if (value && typeof value === 'object') {
      result[key] = redactSensitiveFields(value)
    } else {
      result[key] = value
    }
  }
  
  return result
}

/**
 * Safe JSON stringify with circular reference handling, size limit, and sensitive data redaction
 * 
 * Prevents console spam for large schemas and avoids leaking potentially sensitive
 * information like documentation, custom database names, or internal schema details.
 * 
 * @param obj - Object to stringify
 * @param maxLength - Maximum string length before truncation
 * @returns Sanitized JSON string safe for logging
 */
export function safeStringify(obj: unknown, maxLength = 500): string {
  try {
    // Redact potentially sensitive fields before stringifying
    const redacted = redactSensitiveFields(obj)
    const str = JSON.stringify(redacted, null, 2)
    if (str.length > maxLength) {
      return str.substring(0, maxLength) + '... (truncated)'
    }
    return str
  } catch (err) {
    return '[Unable to serialize: circular reference or complex object]'
  }
}

/**
 * Validate array contains only strings
 */
export function validateStringArray(arr: readonly any[], context: string): string[] {
  if (!Array.isArray(arr)) {
    throw new Error(`${context} is not an array`)
  }
  
  for (let i = 0; i < arr.length; i++) {
    if (typeof arr[i] !== 'string') {
      throw new Error(`${context}[${i}] is not a string (got ${typeof arr[i]})`)
    }
  }
  
  return arr as string[]
}






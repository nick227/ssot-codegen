/**
 * Default value stringification for code generation
 * 
 * Converts Prisma default values to TypeScript code strings.
 */

import type { ParsedField } from '../types.js'
import { escapeForCodeGen } from '../security/escaping.js'

/**
 * Get default value as string for TypeScript code generation
 * 
 * Converts Prisma default values to TypeScript code strings for client-side defaults.
 * 
 * Supported:
 * - Primitive literals: string, number (safe range), boolean, null
 * - Client-managed functions: now() → new Date()
 * - Enum values: returns qualified reference (e.g., "EnumName.VALUE")
 * 
 * Not supported (returns undefined):
 * - DB-managed functions: autoincrement(), uuid(), cuid(), dbgenerated()
 * - Complex types: Decimal, BigInt, Bytes, JSON (requires special handling)
 * - Array/object literals (Prisma doesn't support for scalar fields)
 * - Unknown functions (future Prisma additions, treated conservatively as DB-managed)
 * 
 * Security:
 * - String values are escaped for safe embedding in generated code
 * - Prevents code injection via backslashes, quotes, newlines, script tags
 * 
 * Note: Prisma doesn't support array defaults for scalar fields.
 * Array defaults exist only for composite types which aren't generated here.
 * 
 * @param field - Parsed field with potential default value
 * @returns TypeScript code string for the default value, or undefined if:
 *  - No default value
 *  - DB-managed default (handled by database)
 *  - Cannot be safely represented in TypeScript
 *  - Requires special handling by generators (complex types)
 */
export function getDefaultValueString(field: ParsedField): string | undefined {
  if (!field.hasDefaultValue || field.default === undefined) return undefined
  
  const def = field.default
  
  // Primitive values with proper escaping
  if (typeof def === 'string') {
    // Check if it's an enum value (enum fields have kind === 'enum')
    if (field.kind === 'enum') {
      // Validate that enum value is a valid TypeScript identifier
      // Valid identifiers: start with letter/underscore, continue with alphanumeric/underscore
      const isValidIdentifier = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(def)
      
      if (isValidIdentifier) {
        // Return qualified enum reference for generators to use (dot notation)
        return `${field.type}.${def}`
      } else {
        // Fallback to bracket notation for invalid identifiers (e.g., "123", "my-value")
        return `${field.type}["${escapeForCodeGen(def)}"]`
      }
    }
    return `"${escapeForCodeGen(def)}"`
  }
  
  if (typeof def === 'number') {
    // Reject special numbers that don't have safe TypeScript representations
    if (!Number.isFinite(def)) return undefined
    
    // BigInt fields should not use number defaults
    // Even if the number is within safe range, it's semantically wrong
    // Prisma may serialize BigInt defaults as numbers in DMMF, but we can't
    // reliably convert them to BigInt literals (would need 123n syntax)
    if (field.type === 'BigInt') {
      return undefined  // Generators must handle BigInt defaults specially
    }
    
    // Guard against Decimal fields (also need special handling)
    if (field.type === 'Decimal') {
      return undefined  // Decimal requires special Prisma.Decimal() handling
    }
    
    // For regular numeric types, guard against values exceeding safe range
    if (def > Number.MAX_SAFE_INTEGER || def < Number.MIN_SAFE_INTEGER) {
      return undefined
    }
    
    return String(def)
  }
  
  if (typeof def === 'boolean') return String(def)
  if (def === null) return 'null'
  
  // Prisma function defaults
  if (typeof def === 'object' && 'name' in def) {
    const defObj = def as { name: string; args?: readonly unknown[] }
    
    switch (defObj.name) {
      // Client-managed defaults (evaluated on client before sending to DB)
      case 'now': 
        return 'new Date()'
      
      // DB-managed defaults (return undefined - handled by DB, not client)
      // These should never appear in INSERT statements or create DTOs
      case 'autoincrement': 
      case 'uuid': 
      case 'cuid': 
      case 'dbgenerated': 
        return undefined
      
      // Unknown function - treat conservatively as DB-managed
      // Future Prisma versions may add new functions
      // Generators can override this behavior if needed
      default: 
        return undefined
    }
  }
  
  // Complex objects or unexpected types
  // Including: Decimal, Bytes, Json, DateTime (non-function)
  return undefined
}


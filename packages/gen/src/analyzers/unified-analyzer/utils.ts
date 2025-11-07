/**
 * Unified Analyzer - Utility Functions
 * 
 * Shared utilities used across analyzer modules
 */

/**
 * Normalize field name: remove underscores, hyphens, spaces, dots and lowercase
 * 
 * @example
 * 'deleted_at' → 'deletedat'
 * 'is-published' → 'ispublished'
 * 'is.Active' → 'isactive'
 */
export function normalizeFieldName(name: string): string {
  return name.toLowerCase().replace(/[_\-\s.]/g, '')
}

/**
 * Check if field name matches sensitive patterns
 * 
 * @param fieldName - Field name to check
 * @param patterns - Array of RegExp patterns to test against
 * @returns true if field matches any pattern
 */
export function isSensitiveField(fieldName: string, patterns: RegExp[]): boolean {
  const normalized = normalizeFieldName(fieldName)
  return patterns.some(pattern => pattern.test(normalized))
}


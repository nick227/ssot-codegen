/**
 * Utilities for accessing nested field values
 */

/**
 * Get nested value from object using dot notation
 * e.g., get(post, 'author.name') → post.author?.name
 */
export function getNestedValue(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== 'object' || !path) return undefined
  
  const parts = path.split('.')
  let value: unknown = obj
  
  for (const part of parts) {
    if (value === null || value === undefined || typeof value !== 'object') {
      return undefined
    }
    value = (value as Record<string, unknown>)[part]
  }
  
  return value
}

/**
 * Check if a field path references a relation
 */
export function isRelationPath(path: string): boolean {
  return path.includes('.')
}

/**
 * Get relation name from path
 * e.g., 'author.name' → 'author'
 */
export function getRelationName(path: string): string | null {
  if (!isRelationPath(path)) return null
  return path.split('.')[0]
}

/**
 * Format field label from camelCase/snake_case
 * e.g., 'createdAt' → 'Created At'
 * e.g., 'author_name' → 'Author Name'
 */
export function formatFieldLabel(field: string): string {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim()
}


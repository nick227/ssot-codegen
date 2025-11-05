/**
 * String utility functions for code generation
 */

/**
 * Convert PascalCase to camelCase
 * @example pascalToCamelCase('PostCategory') // 'postCategory'
 * @example pascalToCamelCase('User') // 'user'
 */
export function pascalToCamelCase(str: string): string {
  if (!str) return str
  return str.charAt(0).toLowerCase() + str.slice(1)
}

/**
 * Convert PascalCase to lowercase (for file paths, etc)
 * @example toSnakeCase('PostCategory') // 'postcategory'
 * @deprecated Use pascalToCamelCase for variable names
 */
export function toLowerCase(str: string): string {
  return str.toLowerCase()
}


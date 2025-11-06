/**
 * Naming Utilities - Centralized string transformation functions
 * 
 * CRITICAL: Use the correct function for your use case!
 * - toCamelCase: For PascalCase → camelCase (e.g., "UserService" → "userService")
 * - kebabToCamelCase: For kebab-case → camelCase (e.g., "user-service" → "userService")
 */

/**
 * Convert PascalCase to camelCase
 * 
 * @example
 * toCamelCase("UserService") // "userService"
 * toCamelCase("APIResponse") // "aPIResponse"
 * toCamelCase("User") // "user"
 */
export function toCamelCase(str: string): string {
  if (!str) return str
  return str.charAt(0).toLowerCase() + str.slice(1)
}

/**
 * Convert kebab-case to camelCase
 * 
 * @example
 * kebabToCamelCase("user-service") // "userService"
 * kebabToCamelCase("api-response") // "apiResponse"
 * kebabToCamelCase("user") // "user"
 */
export function kebabToCamelCase(str: string): string {
  if (!str) return str
  
  return str
    .split('-')
    .map((word, index) => 
      index === 0 
        ? word.toLowerCase() 
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join('')
}

/**
 * Convert string to kebab-case
 * 
 * @example
 * toKebabCase("UserService") // "user-service"
 * toKebabCase("userService") // "user-service"
 * toKebabCase("APIResponse") // "api-response"
 */
export function toKebabCase(str: string): string {
  if (!str) return str
  
  return str
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '')
}

/**
 * Convert string to PascalCase
 * 
 * @example
 * toPascalCase("user-service") // "UserService"
 * toPascalCase("userService") // "UserService"
 * toPascalCase("user") // "User"
 */
export function toPascalCase(str: string): string {
  if (!str) return str
  
  // Handle kebab-case
  if (str.includes('-')) {
    return str
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
  }
  
  // Handle camelCase
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Convert string to snake_case
 * 
 * @example
 * toSnakeCase("UserService") // "user_service"
 * toSnakeCase("userService") // "user_service"
 * toSnakeCase("APIResponse") // "api_response"
 */
export function toSnakeCase(str: string): string {
  if (!str) return str
  
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
}

/**
 * Pluralize a word (simple English rules)
 * 
 * @example
 * pluralize("user") // "users"
 * pluralize("category") // "categories"
 * pluralize("child") // "children"
 */
export function pluralize(word: string): string {
  if (!word) return word
  
  const irregulars: Record<string, string> = {
    'child': 'children',
    'person': 'people',
    'man': 'men',
    'woman': 'women',
    'tooth': 'teeth',
    'foot': 'feet',
    'mouse': 'mice',
    'goose': 'geese'
  }
  
  const lower = word.toLowerCase()
  if (irregulars[lower]) {
    return word === lower 
      ? irregulars[lower]
      : irregulars[lower].charAt(0).toUpperCase() + irregulars[lower].slice(1)
  }
  
  if (word.endsWith('y') && !['a', 'e', 'i', 'o', 'u'].includes(word[word.length - 2])) {
    return word.slice(0, -1) + 'ies'
  }
  
  if (word.endsWith('s') || word.endsWith('x') || word.endsWith('z') || 
      word.endsWith('ch') || word.endsWith('sh')) {
    return word + 'es'
  }
  
  return word + 's'
}

/**
 * Singularize a word (simple English rules)
 * 
 * @example
 * singularize("users") // "user"
 * singularize("categories") // "category"
 * singularize("children") // "child"
 */
export function singularize(word: string): string {
  if (!word) return word
  
  const irregulars: Record<string, string> = {
    'children': 'child',
    'people': 'person',
    'men': 'man',
    'women': 'woman',
    'teeth': 'tooth',
    'feet': 'foot',
    'mice': 'mouse',
    'geese': 'goose'
  }
  
  const lower = word.toLowerCase()
  if (irregulars[lower]) {
    return word === lower 
      ? irregulars[lower]
      : irregulars[lower].charAt(0).toUpperCase() + irregulars[lower].slice(1)
  }
  
  if (word.endsWith('ies')) {
    return word.slice(0, -3) + 'y'
  }
  
  if (word.endsWith('ses') || word.endsWith('xes') || word.endsWith('zes') || 
      word.endsWith('ches') || word.endsWith('shes')) {
    return word.slice(0, -2)
  }
  
  if (word.endsWith('s')) {
    return word.slice(0, -1)
  }
  
  return word
}


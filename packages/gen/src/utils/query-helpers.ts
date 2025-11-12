/**
 * Query Helpers - Shared utilities for query generation
 * 
 * These utilities are used across query generators to ensure consistency
 */

/**
 * Stable cache key generator
 * Serializes objects to ensure React Query cache keys are stable
 * 
 * @example
 * stableKey('users', { take: 20 }) // ['users', '{"take":20}']
 * stableKey('user', '123') // ['user', '123']
 * stableKey('users') // ['users']
 */
export function stableKey(key: string, data?: any): any[] {
  if (data === undefined || data === null) return [key]
  if (typeof data === 'object') return [key, JSON.stringify(data)]
  return [key, data]
}


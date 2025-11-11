/**
 * Array Operations
 * 
 * SRP: Only array operations
 * DRY: Used by all components that need array manipulation
 */

import type { OperationRegistry } from '../types.js'

export const arrayOperations: OperationRegistry = {
  /**
   * Count array length
   * @example count([1, 2, 3]) → 3
   */
  count: (arr: any[]): number => {
    if (!Array.isArray(arr)) return 0
    return arr.length
  },

  /**
   * Sum array values or field values
   * @example sum([1, 2, 3]) → 6
   * @example sum(items, 'price') → total
   */
  sum: (arr: any[], field?: string): number => {
    if (!Array.isArray(arr)) return 0
    
    if (field) {
      return arr.reduce((sum, item) => {
        const value = typeof item === 'object' ? item[field] : item
        return sum + Number(value || 0)
      }, 0)
    }
    
    return arr.reduce((sum, value) => sum + Number(value || 0), 0)
  },

  /**
   * Average of array values
   * @example avg([1, 2, 3, 4]) → 2.5
   */
  avg: (arr: any[], field?: string): number => {
    if (!Array.isArray(arr) || arr.length === 0) return 0
    
    const total = arrayOperations.sum(arr, field) as number
    return total / arr.length
  },

  /**
   * Get first element
   * @example first([1, 2, 3]) → 1
   */
  first: (arr: any[]): any => {
    if (!Array.isArray(arr) || arr.length === 0) return undefined
    return arr[0]
  },

  /**
   * Get last element
   * @example last([1, 2, 3]) → 3
   */
  last: (arr: any[]): any => {
    if (!Array.isArray(arr) || arr.length === 0) return undefined
    return arr[arr.length - 1]
  },

  /**
   * Map array (extract field)
   * @example map(items, 'name') → ['John', 'Jane']
   */
  map: (arr: any[], field: string): any[] => {
    if (!Array.isArray(arr)) return []
    return arr.map(item => typeof item === 'object' ? item[field] : item)
  },

  /**
   * Filter array (simple predicate)
   * @example filter(items, 'published', true) → published items
   */
  filter: (arr: any[], field: string, value: any): any[] => {
    if (!Array.isArray(arr)) return []
    return arr.filter(item => {
      const fieldValue = typeof item === 'object' ? item[field] : item
      return fieldValue === value
    })
  },

  /**
   * Find element
   * @example find(items, 'id', 123) → item with id 123
   */
  find: (arr: any[], field: string, value: any): any => {
    if (!Array.isArray(arr)) return undefined
    return arr.find(item => {
      const fieldValue = typeof item === 'object' ? item[field] : item
      return fieldValue === value
    })
  },

  /**
   * Check if any element matches
   * @example some(items, 'published', true) → true
   */
  some: (arr: any[], field: string, value: any): boolean => {
    if (!Array.isArray(arr)) return false
    return arr.some(item => {
      const fieldValue = typeof item === 'object' ? item[field] : item
      return fieldValue === value
    })
  },

  /**
   * Check if all elements match
   * @example every(items, 'published', true) → false
   */
  every: (arr: any[], field: string, value: any): boolean => {
    if (!Array.isArray(arr)) return false
    return arr.every(item => {
      const fieldValue = typeof item === 'object' ? item[field] : item
      return fieldValue === value
    })
  },

  /**
   * Slice array
   * @example slice([1, 2, 3, 4], 1, 3) → [2, 3]
   */
  slice: (arr: any[], start: number, end?: number): any[] => {
    if (!Array.isArray(arr)) return []
    return arr.slice(start, end)
  },

  /**
   * Unique values
   * @example unique([1, 2, 2, 3, 3]) → [1, 2, 3]
   */
  unique: (arr: any[]): any[] => {
    if (!Array.isArray(arr)) return []
    return [...new Set(arr)]
  },

  /**
   * Flatten array
   * @example flatten([[1, 2], [3, 4]]) → [1, 2, 3, 4]
   */
  flatten: (arr: any[]): any[] => {
    if (!Array.isArray(arr)) return []
    return arr.flat()
  }
}


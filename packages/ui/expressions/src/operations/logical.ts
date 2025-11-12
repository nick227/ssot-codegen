/**
 * Logical Operations
 * 
 * SRP: Only logical operations
 * DRY: Used by all components that need logical operations
 */

import type { OperationRegistry } from '../types.js'

export const logicalOperations: OperationRegistry = {
  /**
   * Logical AND
   * @example and(true, true, false) → false
   */
  and: (...args: any[]): boolean => {
    return args.every(v => Boolean(v))
  },

  /**
   * Logical OR
   * @example or(false, false, true) → true
   */
  or: (...args: any[]): boolean => {
    return args.some(v => Boolean(v))
  },

  /**
   * Logical NOT
   * @example not(true) → false
   */
  not: (value: any): boolean => {
    return !Boolean(value)
  },

  /**
   * If-then-else
   * @example if(condition, 'yes', 'no')
   */
  if: (condition: any, thenValue: any, elseValue: any): any => {
    return Boolean(condition) ? thenValue : elseValue
  },

  /**
   * Coalesce (return first non-null value)
   * @example coalesce(null, undefined, 'default') → 'default'
   */
  coalesce: (...args: any[]): any => {
    return args.find(v => v != null)
  },

  /**
   * Check if value exists (not null/undefined)
   * @example exists(value) → true
   */
  exists: (value: any): boolean => {
    return value != null
  },

  /**
   * Check if value is null or undefined
   * @example isNull(value) → false
   */
  isNull: (value: any): boolean => {
    return value == null
  },

  /**
   * Check if value is empty (null, undefined, '', [], {})
   * @example isEmpty('') → true
   */
  isEmpty: (value: any): boolean => {
    if (value == null) return true
    if (typeof value === 'string') return value.length === 0
    if (Array.isArray(value)) return value.length === 0
    if (typeof value === 'object') return Object.keys(value).length === 0
    return false
  }
}



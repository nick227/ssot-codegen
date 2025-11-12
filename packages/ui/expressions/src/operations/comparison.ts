/**
 * Comparison Operations
 * 
 * SRP: Only comparison operations
 * DRY: Used by all components that need comparisons
 */

import type { OperationRegistry } from '../types.js'

export const comparisonOperations: OperationRegistry = {
  /**
   * Equal
   * @example eq(5, 5) → true
   */
  eq: (a: any, b: any): boolean => {
    return a === b
  },

  /**
   * Not equal
   * @example ne(5, 3) → true
   */
  ne: (a: any, b: any): boolean => {
    return a !== b
  },

  /**
   * Greater than
   * @example gt(5, 3) → true
   */
  gt: (a: any, b: any): boolean => {
    return a > b
  },

  /**
   * Less than
   * @example lt(3, 5) → true
   */
  lt: (a: any, b: any): boolean => {
    return a < b
  },

  /**
   * Greater than or equal
   * @example gte(5, 5) → true
   */
  gte: (a: any, b: any): boolean => {
    return a >= b
  },

  /**
   * Less than or equal
   * @example lte(3, 5) → true
   */
  lte: (a: any, b: any): boolean => {
    return a <= b
  },

  /**
   * In array
   * @example in(3, [1, 2, 3]) → true
   */
  in: (value: any, array: any[]): boolean => {
    if (!Array.isArray(array)) return false
    return array.includes(value)
  },

  /**
   * Between (inclusive)
   * @example between(5, 3, 7) → true
   */
  between: (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max
  }
}



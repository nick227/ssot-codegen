/**
 * Math Operations
 * 
 * SRP: Only math operations
 * DRY: Used by all components that need math
 */

import type { OperationRegistry } from '../types.js'

export const mathOperations: OperationRegistry = {
  /**
   * Add numbers
   * @example add(5, 3) → 8
   */
  add: (...args: number[]): number => {
    return args.reduce((sum, n) => sum + Number(n || 0), 0)
  },

  /**
   * Subtract numbers
   * @example subtract(10, 3) → 7
   */
  subtract: (a: number, b: number): number => {
    return Number(a || 0) - Number(b || 0)
  },

  /**
   * Multiply numbers
   * @example multiply(5, 3) → 15
   */
  multiply: (...args: number[]): number => {
    return args.reduce((product, n) => product * Number(n || 1), 1)
  },

  /**
   * Divide numbers
   * @example divide(10, 2) → 5
   */
  divide: (a: number, b: number): number => {
    const divisor = Number(b)
    if (divisor === 0) {
      throw new Error('Division by zero')
    }
    return Number(a || 0) / divisor
  },

  /**
   * Modulo operation
   * @example mod(10, 3) → 1
   */
  mod: (a: number, b: number): number => {
    return Number(a || 0) % Number(b || 1)
  },

  /**
   * Power operation
   * @example pow(2, 3) → 8
   */
  pow: (base: number, exponent: number): number => {
    return Math.pow(Number(base || 0), Number(exponent || 1))
  },

  /**
   * Absolute value
   * @example abs(-5) → 5
   */
  abs: (n: number): number => {
    return Math.abs(Number(n || 0))
  },

  /**
   * Round to nearest integer
   * @example round(3.7) → 4
   */
  round: (n: number): number => {
    return Math.round(Number(n || 0))
  },

  /**
   * Round down
   * @example floor(3.7) → 3
   */
  floor: (n: number): number => {
    return Math.floor(Number(n || 0))
  },

  /**
   * Round up
   * @example ceil(3.2) → 4
   */
  ceil: (n: number): number => {
    return Math.ceil(Number(n || 0))
  },

  /**
   * Minimum value
   * @example min(5, 3, 7) → 3
   */
  min: (...args: number[]): number => {
    return Math.min(...args.map(n => Number(n || 0)))
  },

  /**
   * Maximum value
   * @example max(5, 3, 7) → 7
   */
  max: (...args: number[]): number => {
    return Math.max(...args.map(n => Number(n || 0)))
  }
}



/**
 * String Operations
 * 
 * SRP: Only string operations
 * DRY: Used by all components that need string manipulation
 */

import type { OperationRegistry } from '../types.js'

export const stringOperations: OperationRegistry = {
  /**
   * Concatenate strings
   * @example concat('Hello', ' ', 'World') → 'Hello World'
   */
  concat: (...args: any[]): string => {
    return args.map(v => String(v ?? '')).join('')
  },

  /**
   * Convert to uppercase
   * @example upper('hello') → 'HELLO'
   */
  upper: (s: string): string => {
    return String(s ?? '').toUpperCase()
  },

  /**
   * Convert to lowercase
   * @example lower('HELLO') → 'hello'
   */
  lower: (s: string): string => {
    return String(s ?? '').toLowerCase()
  },

  /**
   * Capitalize first letter
   * @example capitalize('hello') → 'Hello'
   */
  capitalize: (s: string): string => {
    const str = String(s ?? '')
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  },

  /**
   * Trim whitespace
   * @example trim('  hello  ') → 'hello'
   */
  trim: (s: string): string => {
    return String(s ?? '').trim()
  },

  /**
   * Get substring
   * @example substring('hello', 1, 4) → 'ell'
   */
  substring: (s: string, start: number, end?: number): string => {
    return String(s ?? '').substring(start, end)
  },

  /**
   * Replace string
   * @example replace('hello world', 'world', 'there') → 'hello there'
   */
  replace: (s: string, search: string, replacement: string): string => {
    return String(s ?? '').replace(search, replacement)
  },

  /**
   * Split string
   * @example split('a,b,c', ',') → ['a', 'b', 'c']
   */
  split: (s: string, separator: string): string[] => {
    return String(s ?? '').split(separator)
  },

  /**
   * Join array
   * @example join(['a', 'b', 'c'], ',') → 'a,b,c'
   */
  join: (arr: any[], separator: string = ','): string => {
    return arr.map(v => String(v ?? '')).join(separator)
  },

  /**
   * Check if string contains substring
   * @example contains('hello world', 'world') → true
   */
  contains: (s: string, search: string): boolean => {
    return String(s ?? '').includes(String(search ?? ''))
  },

  /**
   * Check if string starts with substring
   * @example startsWith('hello', 'hel') → true
   */
  startsWith: (s: string, search: string): boolean => {
    return String(s ?? '').startsWith(String(search ?? ''))
  },

  /**
   * Check if string ends with substring
   * @example endsWith('hello', 'lo') → true
   */
  endsWith: (s: string, search: string): boolean => {
    return String(s ?? '').endsWith(String(search ?? ''))
  },

  /**
   * Get string length
   * @example length('hello') → 5
   */
  length: (s: string): number => {
    return String(s ?? '').length
  }
}


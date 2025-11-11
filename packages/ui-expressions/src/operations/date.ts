/**
 * Date Operations
 * 
 * SRP: Only date operations
 * DRY: Used by all components that need date manipulation
 */

import { format, formatDistanceToNow, differenceInYears, differenceInMonths, differenceInDays } from 'date-fns'
import type { OperationRegistry } from '../types.js'

export const dateOperations: OperationRegistry = {
  /**
   * Format date
   * @example formatDate(new Date(), 'yyyy-MM-dd') → '2025-11-11'
   */
  formatDate: (date: Date | string, formatStr: string = 'yyyy-MM-dd'): string => {
    const d = typeof date === 'string' ? new Date(date) : date
    return format(d, formatStr)
  },

  /**
   * Time ago (relative time)
   * @example timeAgo(date) → '2 hours ago'
   */
  timeAgo: (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date
    return formatDistanceToNow(d, { addSuffix: true })
  },

  /**
   * Years between dates
   * @example yearsAgo(birthDate) → 25
   */
  yearsAgo: (date: Date | string, from?: Date | string): number => {
    const d = typeof date === 'string' ? new Date(date) : date
    const f = from ? (typeof from === 'string' ? new Date(from) : from) : new Date()
    return differenceInYears(f, d)
  },

  /**
   * Months between dates
   * @example monthsAgo(date) → 3
   */
  monthsAgo: (date: Date | string, from?: Date | string): number => {
    const d = typeof date === 'string' ? new Date(date) : date
    const f = from ? (typeof from === 'string' ? new Date(from) : from) : new Date()
    return differenceInMonths(f, d)
  },

  /**
   * Days between dates
   * @example daysAgo(date) → 10
   */
  daysAgo: (date: Date | string, from?: Date | string): number => {
    const d = typeof date === 'string' ? new Date(date) : date
    const f = from ? (typeof from === 'string' ? new Date(from) : from) : new Date()
    return differenceInDays(f, d)
  },

  /**
   * Get current date/time
   * @example now() → Date
   */
  now: (): Date => {
    return new Date()
  },

  /**
   * Get current year
   * @example currentYear() → 2025
   */
  currentYear: (): number => {
    return new Date().getFullYear()
  },

  /**
   * Parse date from string
   * @example parseDate('2025-11-11') → Date
   */
  parseDate: (dateStr: string): Date => {
    return new Date(dateStr)
  },

  /**
   * Check if date is in the past
   * @example isPast(date) → true
   */
  isPast: (date: Date | string): boolean => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d < new Date()
  },

  /**
   * Check if date is in the future
   * @example isFuture(date) → false
   */
  isFuture: (date: Date | string): boolean => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d > new Date()
  }
}


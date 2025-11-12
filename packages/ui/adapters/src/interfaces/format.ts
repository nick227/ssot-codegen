/**
 * FormatAdapter Interface
 * 
 * CONTRACT:
 * - Deterministic (same input → same output)
 * - HTML sanitize is pure function with policy param
 * - No side effects
 * - Locale-aware via i18n.json
 */

// ============================================================================
// Sanitization Policy
// ============================================================================

export interface SanitizePolicy {
  allowedTags: string[]
  allowedAttrs: Record<string, string[]>
}

// ============================================================================
// Date Formats
// ============================================================================

export type DateFormat = 'short' | 'medium' | 'long' | 'full' | 'relative' | 'iso'

// ============================================================================
// FormatAdapter Interface
// ============================================================================

export interface FormatAdapter {
  /**
   * Format date with locale support
   * 
   * DETERMINISTIC: Same inputs always produce same output
   */
  formatDate(
    date: Date | string,
    format: DateFormat,
    locale?: string
  ): string
  
  /**
   * Format number with locale support
   */
  formatNumber(
    value: number,
    options?: {
      decimals?: number
      locale?: string
    }
  ): string
  
  /**
   * Format currency
   */
  formatCurrency(
    amount: number,
    currency: string,
    locale?: string
  ): string
  
  /**
   * Sanitize HTML (PURE FUNCTION)
   * 
   * REDLINE: Must use policy from capabilities.json
   */
  sanitizeHTML(
    html: string,
    policy: SanitizePolicy
  ): string
  
  /**
   * Truncate text with smart word boundaries
   */
  truncate(
    text: string,
    length: number,
    suffix?: string
  ): string
  
  /**
   * Format relative time ("2 hours ago")
   */
  formatRelative(
    date: Date | string,
    locale?: string
  ): string
  
  /**
   * Pluralize based on count
   */
  pluralize(
    count: number,
    singular: string,
    plural: string,
    locale?: string
  ): string
}

// ============================================================================
// Built-In Policies
// ============================================================================

export const SANITIZE_POLICIES: Record<string, SanitizePolicy> = {
  strict: {
    allowedTags: [],
    allowedAttrs: {}
  },
  basic: {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'a', 'ul', 'ol', 'li'],
    allowedAttrs: {
      a: ['href', 'title']
    }
  },
  rich: {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'a', 'ul', 'ol', 'li',
      'img', 'table', 'tr', 'td', 'th',
      'code', 'pre', 'blockquote',
      'b', 'i', 'em', 'strong'
    ],
    allowedAttrs: {
      a: ['href', 'title', 'target'],
      img: ['src', 'alt', 'width', 'height'],
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan']
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get sanitize policy by name
 */
export function getSanitizePolicy(name: string, custom?: SanitizePolicy): SanitizePolicy {
  if (name === 'custom' && custom) {
    return custom
  }
  
  return SANITIZE_POLICIES[name] || SANITIZE_POLICIES.basic
}

/**
 * Parse ISO date string
 */
export function parseDate(input: Date | string): Date {
  return typeof input === 'string' ? new Date(input) : input
}

/**
 * Check if date is valid
 */
export function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime())
}


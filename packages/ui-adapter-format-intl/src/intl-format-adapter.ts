/**
 * IntlFormatAdapter
 * 
 * Reference implementation of FormatAdapter using Intl API + DOMPurify.
 * 
 * ENFORCES:
 * - Deterministic formatting (same input → same output)
 * - Pure HTML sanitization with policy
 * - No side effects
 */

import DOMPurify from 'isomorphic-dompurify'
import type { FormatAdapter, SanitizePolicy, DateFormat, getSanitizePolicy, parseDate } from '@ssot-ui/adapters'

// ============================================================================
// Intl Format Adapter
// ============================================================================

export class IntlFormatAdapter implements FormatAdapter {
  constructor(private defaultLocale: string = 'en-US') {}
  
  /**
   * Format date with Intl API
   * 
   * DETERMINISTIC: Same inputs always produce same output
   */
  formatDate(
    date: Date | string,
    format: DateFormat,
    locale?: string
  ): string {
    const { parseDate } = require('@ssot-ui/adapters/format')
    const d = parseDate(date)
    
    const loc = locale || this.defaultLocale
    
    switch (format) {
      case 'short':
        return new Intl.DateTimeFormat(loc, {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric'
        }).format(d)
      
      case 'medium':
        return new Intl.DateTimeFormat(loc, {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }).format(d)
      
      case 'long':
        return new Intl.DateTimeFormat(loc, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }).format(d)
      
      case 'full':
        return new Intl.DateTimeFormat(loc, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }).format(d)
      
      case 'relative':
        return this.formatRelative(d, loc)
      
      case 'iso':
        return d.toISOString()
      
      default:
        return d.toLocaleDateString(loc)
    }
  }
  
  /**
   * Format number with Intl API
   */
  formatNumber(
    value: number,
    options?: { decimals?: number; locale?: string }
  ): string {
    const loc = options?.locale || this.defaultLocale
    
    return new Intl.NumberFormat(loc, {
      minimumFractionDigits: options?.decimals,
      maximumFractionDigits: options?.decimals
    }).format(value)
  }
  
  /**
   * Format currency
   */
  formatCurrency(
    amount: number,
    currency: string,
    locale?: string
  ): string {
    const loc = locale || this.defaultLocale
    
    return new Intl.NumberFormat(loc, {
      style: 'currency',
      currency
    }).format(amount)
  }
  
  /**
   * Sanitize HTML (PURE FUNCTION)
   * 
   * REDLINE: Uses policy from capabilities.json
   */
  sanitizeHTML(html: string, policy: SanitizePolicy): string {
    // Configure DOMPurify with policy
    const config = {
      ALLOWED_TAGS: policy.allowedTags,
      ALLOWED_ATTR: Object.keys(policy.allowedAttrs).reduce((acc, tag) => {
        policy.allowedAttrs[tag].forEach(attr => {
          if (!acc.includes(attr)) acc.push(attr)
        })
        return acc
      }, [] as string[])
    }
    
    // Sanitize (pure function)
    return DOMPurify.sanitize(html, config)
  }
  
  /**
   * Truncate text with smart word boundaries
   */
  truncate(text: string, length: number, suffix: string = '...'): string {
    if (text.length <= length) return text
    
    // Find last space before length
    const truncated = text.substring(0, length)
    const lastSpace = truncated.lastIndexOf(' ')
    
    if (lastSpace > 0) {
      return truncated.substring(0, lastSpace) + suffix
    }
    
    return truncated + suffix
  }
  
  /**
   * Format relative time ("2 hours ago")
   */
  formatRelative(date: Date | string, locale?: string): string {
    const { parseDate } = require('@ssot-ui/adapters/format')
    const d = parseDate(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)
    
    if (diffSec < 60) return 'just now'
    if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`
    if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`
    if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`
    if (diffDay < 30) {
      const weeks = Math.floor(diffDay / 7)
      return `${weeks} week${weeks !== 1 ? 's' : ''} ago`
    }
    if (diffDay < 365) {
      const months = Math.floor(diffDay / 30)
      return `${months} month${months !== 1 ? 's' : ''} ago`
    }
    
    const years = Math.floor(diffDay / 365)
    return `${years} year${years !== 1 ? 's' : ''} ago`
  }
  
  /**
   * Pluralize based on count
   */
  pluralize(
    count: number,
    singular: string,
    plural: string,
    locale?: string
  ): string {
    return count === 1 ? singular : plural
  }
}


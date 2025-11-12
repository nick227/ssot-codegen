/**
 * I18n Schema
 * 
 * Internationalization strings and labels per locale.
 * Supports ICU message format for plurals and interpolation.
 */

import { z } from 'zod'

// ============================================================================
// Locale Messages
// ============================================================================

export const LocaleMessagesSchema = z.record(z.string()) // { "key": "translated string" }

export type LocaleMessages = z.infer<typeof LocaleMessagesSchema>

// ============================================================================
// Format Config
// ============================================================================

export const DateFormatSchema = z.object({
  short: z.string().optional(),      // "M/d/yyyy"
  medium: z.string().optional(),     // "MMM d, yyyy"
  long: z.string().optional(),       // "MMMM d, yyyy"
  full: z.string().optional()        // "EEEE, MMMM d, yyyy"
})

export const NumberFormatSchema = z.object({
  decimal: z.string().optional(),
  thousands: z.string().optional(),
  currency: z.string().optional()
})

export const FormatConfigSchema = z.object({
  date: DateFormatSchema.optional(),
  number: NumberFormatSchema.optional()
})

export type FormatConfig = z.infer<typeof FormatConfigSchema>

// ============================================================================
// Locale Configuration
// ============================================================================

export const LocaleConfigSchema = z.object({
  code: z.string(),                   // "en-US"
  name: z.string(),                   // "English (United States)"
  messages: LocaleMessagesSchema,
  formats: FormatConfigSchema.optional()
})

export type LocaleConfig = z.infer<typeof LocaleConfigSchema>

// ============================================================================
// I18n (Root)
// ============================================================================

export const I18nSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  
  // Plural rules format
  pluralRules: z.enum(['simple', 'icu']).default('simple'),
  
  // Default locale
  defaultLocale: z.string(), // "en"
  
  // Available locales
  locales: z.array(LocaleConfigSchema)
})

export type I18n = z.infer<typeof I18nSchema>

// ============================================================================
// Validation Helpers
// ============================================================================

export function validateI18n(data: unknown) {
  const result = I18nSchema.safeParse(data)
  
  if (!result.success) {
    const errors = result.error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message,
      code: err.code
    }))
    
    return {
      valid: false as const,
      errors
    }
  }
  
  return {
    valid: true as const,
    data: result.data
  }
}

/**
 * Validate i18n configuration
 */
export function validateI18nRules(i18n: I18n): string[] {
  const warnings: string[] = []
  
  // Check defaultLocale exists in locales
  const defaultLocaleExists = i18n.locales.some(l => l.code === i18n.defaultLocale)
  if (!defaultLocaleExists) {
    warnings.push(
      `Default locale "${i18n.defaultLocale}" not found in locales array. ` +
      `Add a locale configuration for "${i18n.defaultLocale}".`
    )
  }
  
  // Check all locales have same message keys
  if (i18n.locales.length > 1) {
    const firstLocale = i18n.locales[0]
    const firstKeys = new Set(Object.keys(firstLocale.messages))
    
    for (let i = 1; i < i18n.locales.length; i++) {
      const locale = i18n.locales[i]
      const keys = new Set(Object.keys(locale.messages))
      
      // Missing keys
      for (const key of firstKeys) {
        if (!keys.has(key)) {
          warnings.push(
            `Locale "${locale.code}" is missing message key "${key}" ` +
            `that exists in "${firstLocale.code}".`
          )
        }
      }
      
      // Extra keys
      for (const key of keys) {
        if (!firstKeys.has(key)) {
          warnings.push(
            `Locale "${locale.code}" has extra message key "${key}" ` +
            `that doesn't exist in "${firstLocale.code}".`
          )
        }
      }
    }
  }
  
  return warnings
}

/**
 * Get locale configuration
 */
export function getLocale(i18n: I18n, localeCode: string): LocaleConfig | null {
  return i18n.locales.find(l => l.code === localeCode) || null
}

/**
 * Get translated message
 */
export function getMessage(
  i18n: I18n,
  localeCode: string,
  key: string,
  fallback?: string
): string {
  const locale = getLocale(i18n, localeCode)
  if (!locale) {
    // Try default locale
    const defaultLoc = getLocale(i18n, i18n.defaultLocale)
    return defaultLoc?.messages[key] || fallback || key
  }
  
  return locale.messages[key] || fallback || key
}

/**
 * Get all available locale codes
 */
export function getAvailableLocales(i18n: I18n): string[] {
  return i18n.locales.map(l => l.code)
}


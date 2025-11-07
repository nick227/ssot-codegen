/**
 * Unified Analyzer - Configuration
 * 
 * Default configuration values and validation
 */

import type { UnifiedAnalyzerConfig, SpecialFieldMatcher, SpecialFields } from './types.js'
import type { ParsedField } from '../../dmmf-parser.js'

// ============================================================================
// CONSTANTS
// ============================================================================

/** Sensitive field patterns (normalized field names - no underscores/hyphens) */
export const SENSITIVE_FIELD_PATTERN = /^(password|token|secret|hash|salt|apikey|privatekey|credential|authcode|refreshtoken)/i

/** Default pattern for parent field detection */
export const DEFAULT_PARENT_PATTERN = /^(parent|ancestor|root)/i

/** Field kind constants */
export const FIELD_KIND_SCALAR = 'scalar' as const
export const FIELD_KIND_ENUM = 'enum' as const
export const FIELD_KIND_OBJECT = 'object' as const

// ============================================================================
// DEFAULT MATCHERS
// ============================================================================

export const DEFAULT_SPECIAL_FIELD_MATCHERS: Record<string, SpecialFieldMatcher> = {
  published: {
    pattern: /^(is)?published$/,
    validator: (f) => f.type === 'Boolean'
  },
  slug: {
    pattern: /^slug$/,
    validator: (f) => f.type === 'String'
  },
  views: {
    pattern: /^(view|views)(count)?$/,
    validator: (f) => ['Int', 'BigInt', 'Decimal'].includes(f.type)
  },
  likes: {
    pattern: /^(like|likes)(count)?$/,
    validator: (f) => ['Int', 'BigInt', 'Decimal'].includes(f.type)
  },
  approved: {
    pattern: /^(is)?approved$/,
    validator: (f) => f.type === 'Boolean'
  },
  deletedAt: {
    pattern: /^deleted(at)?$/,
    validator: (f) => f.type === 'DateTime'
  },
  parentId: {
    pattern: /^parent(id)?$/,
    validator: (f) => ['Int', 'BigInt', 'String'].includes(f.type)
  }
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

export const DEFAULT_CONFIG: UnifiedAnalyzerConfig = {
  junctionTableMaxDataFields: 2,
  autoIncludeManyToOne: true,
  autoIncludeRequiredOnly: false,
  excludeSensitiveSearchFields: true,
  sensitiveFieldPatterns: [SENSITIVE_FIELD_PATTERN],
  parentFieldPatterns: DEFAULT_PARENT_PATTERN,
  collectErrors: false
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Type guard: check if key is valid SpecialFields property
 */
export function isSpecialFieldKey(key: string): key is keyof SpecialFields {
  return ['published', 'slug', 'views', 'likes', 'approved', 'deletedAt', 'parentId'].includes(key)
}

/**
 * Validate config.specialFieldMatchers keys match SpecialFields type
 */
export function validateConfig(config: UnifiedAnalyzerConfig): void {
  if (config.specialFieldMatchers) {
    for (const key of Object.keys(config.specialFieldMatchers)) {
      if (!isSpecialFieldKey(key)) {
        throw new Error(
          `Invalid special field matcher key '${key}'. ` +
          `Valid keys: published, slug, views, likes, approved, deletedAt, parentId`
        )
      }
    }
  }
}


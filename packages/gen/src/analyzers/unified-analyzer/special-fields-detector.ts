/**
 * Unified Analyzer - Special Fields Detection
 * 
 * Detects special fields like published, slug, views, deletedAt, etc.
 */

import type { ParsedModel, ParsedField } from '../../dmmf-parser.js'
import type { UnifiedAnalyzerConfig, SpecialFields, SpecialFieldMatcher } from './types.js'
import { DEFAULT_SPECIAL_FIELD_MATCHERS, isSpecialFieldKey, FIELD_KIND_SCALAR } from './config.js'
import { isFieldUnique } from './unique-validator.js'

/**
 * Detect special fields in a model using configurable matchers
 * 
 * @param model - Model to analyze
 * @param config - Analyzer configuration
 * @param normalizedNames - Pre-computed normalized field names (performance optimization)
 * @returns Detected special fields
 * 
 * @example
 * ```prisma
 * model Post {
 *   slug String @unique
 *   published Boolean
 *   deletedAt DateTime?
 * }
 * 
 * // Result:
 * {
 *   slug: { name: 'slug', type: 'String', ... },
 *   published: { name: 'published', type: 'Boolean', ... },
 *   deletedAt: { name: 'deletedAt', type: 'DateTime', ... }
 * }
 * ```
 */
export function detectSpecialFields(
  model: ParsedModel,
  config: UnifiedAnalyzerConfig,
  normalizedNames: Map<string, string>
): SpecialFields {
  const specialFields: SpecialFields = {}
  
  // Config extraction
  const matchers = config.specialFieldMatchers ?? DEFAULT_SPECIAL_FIELD_MATCHERS
  const matcherEntries = Object.entries(matchers)
  const foundKeys = new Set<string>()
  
  // Iterate through scalar fields only
  for (const field of model.fields) {
    if (field.kind !== FIELD_KIND_SCALAR) continue
    if (foundKeys.size >= matcherEntries.length) break  // All found
    
    const normalized = normalizedNames.get(field.name)!
    
    for (const [key, matcher] of matcherEntries) {
      if (foundKeys.has(key)) continue
      
      if (!matcher.pattern.test(normalized)) continue
      
      // Special case for slug: must be unique ALONE (not part of composite unique)
      // CRITICAL: Composite unique like @@unique([slug, tenantId]) would break findBySlug()
      if (key === 'slug') {
        if (field.type === 'String' && isFieldUnique(model, field.name, true)) {
          if (isSpecialFieldKey(key)) {
            specialFields[key] = field
          }
          foundKeys.add(key)
        }
        continue
      }
      
      // Standard validation
      if (matcher.validator(field)) {
        // Type-safe assignment - only set if key is valid SpecialFields property
        if (isSpecialFieldKey(key)) {
          specialFields[key] = field
        }
        foundKeys.add(key)
        break  // Move to next field after first match
      }
    }
  }
  
  return specialFields
}


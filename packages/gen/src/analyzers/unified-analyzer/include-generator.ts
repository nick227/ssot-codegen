/**
 * Unified Analyzer - Include Object Generation
 * 
 * Generates Prisma include objects for auto-loaded relations
 */

import type { UnifiedModelAnalysis } from './types.js'

/**
 * Generate Prisma include object for auto-loaded relations
 * 
 * Returns typed object instead of string fragments for better composability.
 * 
 * NOTE: This only generates flat includes ({ relation: true }).
 * For nested includes/selects, build the structure manually.
 * 
 * @param analysis - Model analysis result
 * @returns Include object or null if no auto-included relations
 * 
 * @example
 * ```ts
 * const analysis = analyzeModelUnified(model, schema)
 * const include = generateIncludeObject(analysis)
 * 
 * if (include) {
 *   await prisma.post.findMany({ include })
 *   // { include: { author: true, category: true } }
 * }
 * ```
 */
export function generateIncludeObject(
  analysis: UnifiedModelAnalysis
): Record<string, boolean> | null {
  if (analysis.autoIncludeRelations.length === 0) {
    return null
  }
  
  const include: Record<string, boolean> = {}
  for (const rel of analysis.autoIncludeRelations) {
    include[rel.field.name] = true
  }
  
  return include
}

/**
 * Generate Prisma include statement as string (LEGACY)
 * 
 * @deprecated Use `generateIncludeObject()` instead for type safety.
 * String-based includes are error-prone and difficult to compose correctly.
 * This function will be removed in v3.0.
 * 
 * @param analysis - Model analysis result
 * @param options - Formatting options
 * @returns Formatted include string (empty if no relations)
 * 
 * @example
 * ```ts
 * // Deprecated:
 * const str = generateSummaryInclude(analysis)
 * 
 * // Preferred:
 * const obj = generateIncludeObject(analysis)
 * if (obj) {
 *   await prisma.model.findMany({ include: obj })
 * }
 * ```
 */
export function generateSummaryInclude(
  analysis: UnifiedModelAnalysis,
  options: { standalone?: boolean } = {}
): string {
  // Emit deprecation warning in development
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '[DEPRECATED] generateSummaryInclude() is deprecated and will be removed in v3.0. ' +
      'Use generateIncludeObject() instead for type safety.'
    )
  }
  
  const includeObj = generateIncludeObject(analysis)
  if (!includeObj) return ''
  
  const includes = Object.keys(includeObj)
    .map(key => `      ${key}: true`)
    .join(',\n')
  
  // Standalone mode: return the full include object
  if (options.standalone) {
    return `include: {
${includes}
    }`
  }
  
  // Default mode: return as a property (with leading comma)
  return `,
      include: {
${includes}
      }`
}


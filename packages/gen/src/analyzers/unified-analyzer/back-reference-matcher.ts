/**
 * Unified Analyzer - Back-Reference Matching
 * 
 * Finds and matches back-references for bidirectional relations
 * Handles cases where a model has multiple relations to the same target
 */

import type { ParsedField, ParsedModel } from '../../dmmf-parser.js'

/**
 * Find back-reference using relationName and FK fields for proper pairing
 * 
 * Handles:
 * - Single relation to target (trivial)
 * - Multiple relations to same target (requires precise matching)
 * - Mixed relationName presence (skip mismatched pairs)
 * 
 * @example
 * ```prisma
 * model Post {
 *   authorId Int
 *   editorId Int
 *   author User @relation("PostAuthor", fields: [authorId], references: [id])
 *   editor User @relation("PostEditor", fields: [editorId], references: [id])
 * }
 * 
 * model User {
 *   authoredPosts Post[] @relation("PostAuthor")
 *   editedPosts Post[] @relation("PostEditor")
 * }
 * 
 * // findBackReference(author, User, Post) → authoredPosts ✅
 * // findBackReference(editor, User, Post) → editedPosts ✅
 * ```
 */
export function findBackReference(
  sourceField: ParsedField,
  targetModel: ParsedModel,
  sourceModel: ParsedModel
): ParsedField | null {
  const candidates = targetModel.relationFields.filter(f => f.type === sourceModel.name)
  
  if (candidates.length === 0) return null
  if (candidates.length === 1) return candidates[0]
  
  // Multiple relations to same model - need precise pairing
  for (const candidate of candidates) {
    // Strategy 1: Match by relationName (most reliable)
    if (sourceField.relationName && candidate.relationName) {
      if (sourceField.relationName === candidate.relationName) {
        return candidate
      }
      continue
    }
    
    // If only one side has relationName, they can't be a valid pair
    // CRITICAL: Skip FK matching to prevent incorrect pairing
    if (sourceField.relationName || candidate.relationName) {
      continue
    }
    
    // Strategy 2: Match by FK field sets (when both omit relationName)
    // If source has FK fields, candidate should reference them
    if (sourceField.relationFromFields && candidate.relationToFields) {
      const sourceSet = new Set(sourceField.relationFromFields)
      const candidateSet = new Set(candidate.relationToFields)
      if (sourceSet.size === candidateSet.size && 
          [...sourceSet].every(f => candidateSet.has(f))) {
        return candidate
      }
    }
    
    // If candidate has FK fields, source should reference them
    if (candidate.relationFromFields && sourceField.relationToFields) {
      const candidateSet = new Set(candidate.relationFromFields)
      const sourceSet = new Set(sourceField.relationToFields)
      if (candidateSet.size === sourceSet.size && 
          [...candidateSet].every(f => sourceSet.has(f))) {
        return candidate
      }
    }
  }
  
  // No clear match - return null rather than guessing
  return null
}


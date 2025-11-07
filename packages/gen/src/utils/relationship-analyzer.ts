/**
 * Relationship Analyzer - Detects and analyzes model relationships
 */

import type { ParsedModel, ParsedField, ParsedSchema } from '../dmmf-parser.js'
import { isJunctionTable, isJunctionTableSimple } from './junction-table.js'

export interface RelationshipInfo {
  field: ParsedField
  targetModel: ParsedModel
  isManyToMany: boolean
  isOneToMany: boolean
  isManyToOne: boolean
  shouldAutoInclude: boolean
}

export interface ModelAnalysis {
  model: ParsedModel
  relationships: RelationshipInfo[]
  autoIncludeRelations: RelationshipInfo[]
  hasPublishedField: boolean
  hasSlugField: boolean
  isJunctionTable: boolean
  specialFields: {
    published?: ParsedField
    slug?: ParsedField
    views?: ParsedField
    likes?: ParsedField
    approved?: ParsedField
    deletedAt?: ParsedField
    parentId?: ParsedField
  }
}

/**
 * Analyze a model's relationships and special fields
 */
export function analyzeModel(model: ParsedModel, schema: ParsedSchema): ModelAnalysis {
  const relationships = analyzeRelationships(model, schema)
  const autoIncludeRelations = relationships.filter(r => r.shouldAutoInclude)
  const specialFields = detectSpecialFields(model)
  
  return {
    model,
    relationships,
    autoIncludeRelations,
    hasPublishedField: !!specialFields.published,
    hasSlugField: !!specialFields.slug,
    isJunctionTable: detectJunctionTable(model, schema),
    specialFields
  }
}

/**
 * Analyze all relationships for a model
 */
function analyzeRelationships(model: ParsedModel, schema: ParsedSchema): RelationshipInfo[] {
  return model.relationFields.map(field => {
    // NULL SAFETY: Check if target model exists
    const targetModel = schema.modelMap.get(field.type)
    if (!targetModel) {
      throw new Error(
        `Model '${model.name}' has relation field '${field.name}' ` +
        `pointing to undefined model '${field.type}'. Check your schema for typos or missing models.`
      )
    }
    
    // OPTIMIZED: Single back-reference check instead of 2
    const backRef = findBackReference(targetModel, model)
    
    // Determine relationship type from back-reference
    const isManyToMany = field.isList && backRef?.isList === true
    const isOneToMany = field.isList && !isManyToMany
    const isManyToOne = !field.isList && backRef !== null
    
    // Decide if we should auto-include (many-to-one relationships typically)
    const shouldAutoInclude = isManyToOne && !isJunctionTable(targetModel)
    
    return {
      field,
      targetModel,
      isManyToMany,
      isOneToMany,
      isManyToOne,
      shouldAutoInclude
    }
  })
}

/**
 * Find the back-reference field from target model to source model
 * OPTIMIZED: Returns the actual field (useful for navigation) or null
 */
function findBackReference(targetModel: ParsedModel, sourceModel: ParsedModel): ParsedField | null {
  return targetModel.relationFields.find(f => f.type === sourceModel.name) || null
}

/**
 * Detect if model is a junction table (many-to-many)
 * @deprecated Use isJunctionTable from utils/junction-table.ts instead
 */
function detectJunctionTable(model: ParsedModel, schema: ParsedSchema): boolean {
  return isJunctionTable(model)
}

/**
 * Pattern definitions for special field detection
 * OPTIMIZED: Single-pass detection with validator functions
 */
const SPECIAL_FIELD_PATTERNS: Record<string, (field: ParsedField) => boolean> = {
  published: (f) => f.type === 'Boolean',
  slug: (f) => f.type === 'String',
  views: (f) => f.type === 'Int' || f.type === 'BigInt',
  likes: (f) => f.type === 'Int' || f.type === 'BigInt',
  approved: (f) => f.type === 'Boolean',
  deletedat: (f) => f.type === 'DateTime',
  parentid: (f) => f.type === 'Int' || f.type === 'BigInt' || f.type === 'String'
}

/**
 * Detect special fields that require custom logic
 * OPTIMIZED: Single pass, O(n) instead of O(n×7)
 */
function detectSpecialFields(model: ParsedModel): ModelAnalysis['specialFields'] {
  const fields: ModelAnalysis['specialFields'] = {}
  
  // Build lookup map once: O(n) where n = scalar fields
  const fieldMap = new Map(
    model.scalarFields.map(f => [f.name.toLowerCase(), f])
  )
  
  // Check patterns: O(m) where m = 7 patterns
  // Total complexity: O(n+m) instead of O(n×m)
  for (const [key, validator] of Object.entries(SPECIAL_FIELD_PATTERNS)) {
    const field = fieldMap.get(key)
    if (field && validator(field)) {
      // Map pattern keys to field keys (handle 'deletedat' → 'deletedAt', etc.)
      const fieldKey = key === 'deletedat' ? 'deletedAt' : 
                       key === 'parentid' ? 'parentId' : 
                       key as keyof ModelAnalysis['specialFields']
      fields[fieldKey] = field
    }
  }
  
  return fields
}

/**
 * Generate Prisma include statement for relationships
 */
export function generateIncludeStatement(analysis: ModelAnalysis): string {
  if (analysis.autoIncludeRelations.length === 0) {
    return ''
  }
  
  const includes = analysis.autoIncludeRelations.map(rel => {
    // For many-to-one, include basic fields
    if (rel.isManyToOne) {
      return `        ${rel.field.name}: true`
    }
    return null
  }).filter(Boolean)
  
  if (includes.length === 0) return ''
  
  return `,
      include: {
${includes.join(',\n')}
      }`
}

/**
 * Generate summary include for related models (subset of fields)
 */
export function generateSummaryInclude(analysis: ModelAnalysis): string {
  if (analysis.autoIncludeRelations.length === 0) {
    return ''
  }
  
  const includes = analysis.autoIncludeRelations.map(rel => {
    if (rel.isManyToOne) {
      // Include id and common display fields
      const targetFields = ['id']
      
      // Add common name fields
      for (const field of rel.targetModel.scalarFields) {
        const lowerName = field.name.toLowerCase()
        if (
          lowerName.includes('name') ||
          lowerName.includes('title') ||
          lowerName.includes('username') ||
          lowerName.includes('email')
        ) {
          targetFields.push(field.name)
        }
      }
      
      if (targetFields.length > 1) {
        const selectFields = targetFields.map(f => `${f}: true`).join(', ')
        return `        ${rel.field.name}: {
          select: { ${selectFields} }
        }`
      }
      return `        ${rel.field.name}: true`
    }
    return null
  }).filter(Boolean)
  
  if (includes.length === 0) return ''
  
  return `,
      include: {
${includes.join(',\n')}
      }`
}

// ============================================================================
// PUBLIC API: For api/implementation.ts
// ============================================================================

/**
 * Analyze all relationships in schema (for public API use)
 * Returns simplified relationship list for API consumers
 */
export function analyzeRelationshipsForSchema(schema: ParsedSchema): Array<{
  fromModel: string
  toModel: string
  type: 'one-to-one' | 'one-to-many' | 'many-to-many'
}> {
  const relationships: Array<{
    fromModel: string
    toModel: string
    type: 'one-to-one' | 'one-to-many' | 'many-to-many'
  }> = []
  
  for (const model of schema.models) {
    const analysis = analyzeModel(model, schema)
    for (const rel of analysis.relationships) {
      relationships.push({
        fromModel: model.name,
        toModel: rel.targetModel.name,
        type: rel.isManyToMany ? 'many-to-many' 
            : rel.isOneToMany ? 'one-to-many'
            : 'one-to-one'
      })
    }
  }
  
  return relationships
}


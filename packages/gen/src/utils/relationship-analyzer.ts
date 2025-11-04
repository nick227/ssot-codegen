/**
 * Relationship Analyzer - Detects and analyzes model relationships
 */

import type { ParsedModel, ParsedField, ParsedSchema } from '../dmmf-parser.js'

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
    const targetModel = schema.modelMap.get(field.type)!
    
    // Determine relationship type
    const isManyToMany = field.isList && hasBackReference(targetModel, model, true)
    const isOneToMany = field.isList && !isManyToMany
    const isManyToOne = !field.isList && hasBackReference(targetModel, model, true)
    
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
 * Check if target model has a back-reference to source model
 */
function hasBackReference(targetModel: ParsedModel, sourceModel: ParsedModel, checkList: boolean): boolean {
  return targetModel.relationFields.some(f => 
    f.type === sourceModel.name && (!checkList || f.isList)
  )
}

/**
 * Detect if model is a junction table (many-to-many)
 * Junction tables typically:
 * - Have no scalar fields beyond IDs
 * - Have exactly 2 foreign key relationships
 * - Have a composite primary key
 */
function detectJunctionTable(model: ParsedModel, schema: ParsedSchema): boolean {
  // Must have 2 or more relation fields
  if (model.relationFields.length < 2) return false
  
  // Check for composite primary key
  const hasCompositePK = !!(model.primaryKey && model.primaryKey.fields.length > 1)
  
  // Count non-id, non-relation scalar fields
  const dataFields = model.scalarFields.filter(f => 
    !f.isId && 
    !f.isReadOnly && 
    !f.isUpdatedAt &&
    f.name !== 'createdAt'
  )
  
  // Junction tables have few or no data fields beyond foreign keys
  const maxDataFields = 2 // Allow a couple of extra fields (timestamps, etc.)
  
  return hasCompositePK && dataFields.length <= maxDataFields
}

/**
 * Check if a model is a junction table (simplified)
 */
function isJunctionTable(model: ParsedModel): boolean {
  // Quick check: if model has very few scalar fields and multiple relations, likely a junction
  const scalarCount = model.scalarFields.filter(f => !f.isId && !f.isReadOnly).length
  const relationCount = model.relationFields.length
  
  return relationCount >= 2 && scalarCount <= 3
}

/**
 * Detect special fields that require custom logic
 */
function detectSpecialFields(model: ParsedModel): ModelAnalysis['specialFields'] {
  const fields: ModelAnalysis['specialFields'] = {}
  
  for (const field of model.scalarFields) {
    const lowerName = field.name.toLowerCase()
    
    if (lowerName === 'published' && field.type === 'Boolean') {
      fields.published = field
    }
    if (lowerName === 'slug' && field.type === 'String') {
      fields.slug = field
    }
    if (lowerName === 'views' && (field.type === 'Int' || field.type === 'BigInt')) {
      fields.views = field
    }
    if (lowerName === 'likes' && (field.type === 'Int' || field.type === 'BigInt')) {
      fields.likes = field
    }
    if (lowerName === 'approved' && field.type === 'Boolean') {
      fields.approved = field
    }
    if (lowerName === 'deletedat' && field.type === 'DateTime') {
      fields.deletedAt = field
    }
    if (lowerName === 'parentid' && (field.type === 'Int' || field.type === 'BigInt' || field.type === 'String')) {
      fields.parentId = field
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


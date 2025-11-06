/**
 * Model Capabilities Analyzer
 * Detects patterns in Prisma models to auto-generate features
 */

import type { ParsedModel, ParsedSchema } from '../dmmf-parser.js'
import type { FilterField } from './field-analyzer.js'
import { 
  getSearchableFields as getSearchableFieldsParsed, 
  getFilterableFields as getFilterableFieldsParsed 
} from './field-analyzer-parsed.js'

export interface ModelCapabilities {
  // Search
  hasSearch: boolean
  searchFields: string[]
  
  // Filtering
  hasFilters: boolean
  filterFields: FilterField[]
  
  // Special methods
  hasFindBySlug: boolean
  hasFeatured: boolean
  hasActive: boolean
  hasPublished: boolean
  hasSoftDelete: boolean
  
  // Relationships
  hasParentChild: boolean
  foreignKeys: ForeignKeyInfo[]
}

export interface ForeignKeyInfo {
  fieldName: string      // e.g., 'categoryId'
  relationName: string   // e.g., 'category'
  relatedModel: string   // e.g., 'Category'
}

/**
 * Analyze a model to determine what features to auto-generate
 */
export function analyzeModelCapabilities(model: ParsedModel): ModelCapabilities {
  const searchFields = getSearchableFieldsParsed(model)
  const filterFields = getFilterableFieldsParsed(model)
  
  const capabilities: ModelCapabilities = {
    // Search capabilities
    hasSearch: searchFields.length > 0,
    searchFields,
    
    // Filter capabilities
    hasFilters: filterFields.length > 0,
    filterFields,
    
    // Special method detection
    hasFindBySlug: hasField(model, 'slug'),
    hasFeatured: hasField(model, 'isFeatured'),
    hasActive: hasField(model, 'isActive'),
    hasPublished: hasField(model, 'publishedAt'),
    hasSoftDelete: hasField(model, 'deletedAt'),
    
    // Relationship detection
    hasParentChild: hasParentChildRelation(model),
    foreignKeys: getForeignKeys(model)
  }
  
  return capabilities
}

function hasField(model: ParsedModel, fieldName: string): boolean {
  return model.fields.some(f => f.name === fieldName)
}

function hasParentChildRelation(model: ParsedModel): boolean {
  // Detect self-referential relations (e.g., Category.parentId -> Category)
  return model.fields.some(field => 
    field.kind === 'object' && 
    field.type === model.name &&
    field.relationFromFields &&
    field.relationFromFields.includes('parentId')
  )
}

function getForeignKeys(model: ParsedModel): ForeignKeyInfo[] {
  return model.fields
    .filter(field => 
      field.kind === 'object' && 
      field.relationFromFields && 
      field.relationFromFields.length > 0 &&
      field.type !== model.name  // Exclude self-references
    )
    .map(field => ({
      fieldName: field.relationFromFields![0],
      relationName: field.name,
      relatedModel: field.type
    }))
}

/**
 * Get a summary of what will be generated for a model
 */
export function getGenerationSummary(model: ParsedModel): string[] {
  const caps = analyzeModelCapabilities(model)
  const features: string[] = []
  
  // Base CRUD
  features.push('✅ CRUD: list, findById, create, update, delete, count')
  
  // Search
  if (caps.hasSearch) {
    features.push(`✅ Search: ${caps.searchFields.join(', ')}`)
  }
  
  // Filters
  if (caps.hasFilters) {
    const filterNames = caps.filterFields.map(f => f.name).join(', ')
    features.push(`✅ Filters: ${filterNames}`)
  }
  
  // Special methods
  if (caps.hasFindBySlug) features.push('✅ findBySlug(slug)')
  if (caps.hasFeatured) features.push('✅ getFeatured(limit)')
  if (caps.hasActive) features.push('✅ getActive(query)')
  if (caps.hasPublished) features.push('✅ getPublished()')
  if (caps.hasSoftDelete) features.push('✅ Soft delete support')
  
  // Relationships
  if (caps.foreignKeys.length > 0) {
    for (const fk of caps.foreignKeys) {
      features.push(`✅ getBy${capitalize(fk.relationName)}(${fk.fieldName})`)
    }
  }
  
  if (caps.hasParentChild) {
    features.push('✅ getChildren(id), getAncestors(id), getTree()')
  }
  
  return features
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}


/**
 * Unified Analyzer - Type Definitions
 * 
 * All interfaces and types for the unified model analyzer
 */

import type { ParsedModel, ParsedField } from '../../dmmf-parser.js'
import type { FilterField } from '../field-analyzer.js'

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface SpecialFieldMatcher {
  pattern: RegExp
  validator: (field: ParsedField) => boolean
}

export interface UnifiedAnalyzerConfig {
  /** Custom special field matchers (keys must match SpecialFields properties) */
  specialFieldMatchers?: Record<string, SpecialFieldMatcher>
  
  /** Maximum non-system fields allowed in junction tables (default: 2) */
  junctionTableMaxDataFields?: number
  
  /** System field names to exclude from junction detection */
  systemFieldNames?: string[]
  
  /** Whether to auto-include many-to-one relations (default: true) */
  autoIncludeManyToOne?: boolean
  
  /** Only auto-include if ALL FK fields are required (default: false) */
  autoIncludeRequiredOnly?: boolean
  
  /** Custom auto-include logic - overrides defaults */
  shouldAutoInclude?: (relation: RelationshipInfo, model: ParsedModel) => boolean
  
  /** Exclude sensitive fields from search (default: true) */
  excludeSensitiveSearchFields?: boolean
  
  /** Custom patterns for sensitive fields */
  sensitiveFieldPatterns?: RegExp[]
  
  /** Pattern for parent field detection */
  parentFieldPatterns?: RegExp
  
  /** Collect errors instead of throwing (default: false) */
  collectErrors?: boolean
}

// ============================================================================
// RELATIONSHIP TYPES
// ============================================================================

export interface RelationshipInfo {
  field: ParsedField
  targetModel: ParsedModel
  isOneToOne: boolean
  isManyToMany: boolean
  isOneToMany: boolean
  isManyToOne: boolean
  shouldAutoInclude: boolean
}

export interface ForeignKeyInfo {
  fieldNames: string[]         // e.g., ['categoryId'] or ['userId', 'tenantId'] for composite
  relationAlias: string        // The field name, e.g., 'category'
  relationName: string | null  // Prisma @relation(name: "..."), e.g., 'PostCategory'
  relatedModel: string         // e.g., 'Category'
}

// ============================================================================
// FIELD TYPES
// ============================================================================

export interface SpecialFields {
  published?: ParsedField
  slug?: ParsedField
  views?: ParsedField
  likes?: ParsedField
  approved?: ParsedField
  deletedAt?: ParsedField
  parentId?: ParsedField
}

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

// ============================================================================
// ANALYSIS RESULT
// ============================================================================

export interface UnifiedModelAnalysis {
  model: ParsedModel
  
  // Relationships
  relationships: RelationshipInfo[]
  autoIncludeRelations: RelationshipInfo[]
  isJunctionTable: boolean
  
  // Special Fields
  specialFields: SpecialFields
  hasPublishedField: boolean
  hasSlugField: boolean
  
  // Capabilities
  capabilities: ModelCapabilities
  
  // Errors (only when collectErrors: true)
  errors?: Array<{ model: string; field: string; message: string }>
}

// ============================================================================
// INTERNAL RESULT TYPES
// ============================================================================

export interface RelationshipAnalysisResult {
  relationships: RelationshipInfo[]
  autoInclude: RelationshipInfo[]
  isJunctionTable: boolean
  skippedRelations?: string[]
  errors?: Array<{ model: string; field: string; message: string }>
}

export interface FieldAnalysisResult {
  specialFields: SpecialFields
  searchFields: string[]
  filterFields: FilterField[]
  normalizedNames: Map<string, string>
}


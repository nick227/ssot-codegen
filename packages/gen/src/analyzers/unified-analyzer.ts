/**
 * Unified Model Analyzer
 * 
 * Combines relationship-analyzer.ts and model-capabilities.ts into an optimized
 * analyzer that minimizes field traversals.
 * 
 * PERFORMANCE: Previously multiple analyzers would scan the same model repeatedly.
 * This unified analyzer performs:
 * - Single pass for all field analysis (special fields + searchable + filterable)
 * - Separate pass for relationships (requires schema context)
 * - Minimal overhead for capability detection
 * 
 * CORRECTNESS: Properly handles enums, arrays, unidirectional relations, and composite keys.
 * 
 * FLEXIBILITY: Configurable patterns, error collection, and auto-include behavior.
 */

import type { ParsedModel, ParsedField, ParsedSchema } from '../dmmf-parser.js'
import type { FilterField } from './field-analyzer.js'
import { isJunctionTable } from '../utils/junction-table.js'

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface SpecialFieldMatcher {
  pattern: RegExp
  validator: (field: ParsedField) => boolean
}

export interface UnifiedAnalyzerConfig {
  specialFieldMatchers?: Record<string, SpecialFieldMatcher>
  junctionTableMaxDataFields?: number
  systemFieldNames?: string[]  // System fields to exclude from junction table detection
  autoIncludeManyToOne?: boolean  // Whether to auto-include many-to-one relations
  autoIncludeRequiredOnly?: boolean  // Only auto-include if all FK fields are required
  excludeSensitiveSearchFields?: boolean  // Exclude password, token, secret from search
  sensitiveFieldPatterns?: RegExp[]  // Custom patterns for sensitive fields
  parentFieldPatterns?: RegExp  // Pattern for parent field detection (default: /^parent/)
  collectErrors?: boolean  // Collect errors instead of throwing (default: false)
}

// ============================================================================
// TYPES
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
  fieldNames: string[]      // e.g., ['categoryId'] or ['userId', 'tenantId'] for composite
  relationAlias: string     // The field name, e.g., 'category'
  relationName: string | null  // Prisma @relation(name: "..."), e.g., 'UserToPost'
  relatedModel: string      // e.g., 'Category'
}

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

/**
 * Unified analysis result - combines relationship and capability analysis
 */
export interface UnifiedModelAnalysis {
  model: ParsedModel
  
  // Relationships (from relationship-analyzer)
  relationships: RelationshipInfo[]
  autoIncludeRelations: RelationshipInfo[]
  isJunctionTable: boolean
  
  // Special Fields (from relationship-analyzer)
  specialFields: SpecialFields
  hasPublishedField: boolean
  hasSlugField: boolean
  
  // Capabilities (from model-capabilities)
  capabilities: ModelCapabilities
  
  // Errors encountered during analysis (when collectErrors is true)
  errors?: Array<{ field: string; message: string }>
}

// ============================================================================
// MAIN ANALYZER
// ============================================================================

// Constants
const SENSITIVE_FIELD_PATTERN = /^(password|token|secret|hash|salt|api[_-]?key|private[_-]?key)/i
const DEFAULT_PARENT_PATTERN = /^(parent|ancestor|root)/i

// Default configuration
const DEFAULT_CONFIG: UnifiedAnalyzerConfig = {
  junctionTableMaxDataFields: 2,
  autoIncludeManyToOne: true,
  autoIncludeRequiredOnly: false,
  excludeSensitiveSearchFields: true,
  sensitiveFieldPatterns: [SENSITIVE_FIELD_PATTERN],
  parentFieldPatterns: DEFAULT_PARENT_PATTERN,
  collectErrors: false
}

/**
 * Analyze a model and return ALL analysis data
 * 
 * Performs optimized analysis with minimal field traversals:
 * - Single pass for field analysis (special fields, search, filters)
 * - Relationship analysis (with schema)
 * - Capability detection
 * 
 * This replaces separate calls to:
 * - analyzeModel() from relationship-analyzer.ts
 * - analyzeModelCapabilities() from model-capabilities.ts
 */
export function analyzeModelUnified(
  model: ParsedModel,
  schema: ParsedSchema,
  config: UnifiedAnalyzerConfig = {}
): UnifiedModelAnalysis {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const allErrors: Array<{ field: string; message: string }> = []
  
  // 1. Analyze relationships (requires schema for target models)
  const relationshipAnalysis = analyzeRelationships(model, schema, cfg)
  if (relationshipAnalysis.errors) {
    allErrors.push(...relationshipAnalysis.errors)
  }
  
  // 2. SINGLE-PASS field analysis: special fields, search, filters all at once
  const fieldAnalysis = analyzeFieldsOnce(model, cfg)
  
  // 3. Analyze capabilities using already-computed field analysis
  const capabilities = analyzeCapabilities(
    model,
    fieldAnalysis.specialFields,
    fieldAnalysis.searchFields,
    fieldAnalysis.filterFields,
    cfg
  )
  
  const result: UnifiedModelAnalysis = {
    model,
    // Relationships
    relationships: relationshipAnalysis.relationships,
    autoIncludeRelations: relationshipAnalysis.autoInclude,
    isJunctionTable: relationshipAnalysis.isJunctionTable,
    // Special Fields
    specialFields: fieldAnalysis.specialFields,
    hasPublishedField: !!fieldAnalysis.specialFields.published,
    hasSlugField: !!fieldAnalysis.specialFields.slug,
    // Capabilities
    capabilities
  }
  
  if (allErrors.length > 0 && cfg.collectErrors) {
    result.errors = allErrors
  }
  
  return result
}

// ============================================================================
// RELATIONSHIP ANALYSIS
// ============================================================================

interface RelationshipAnalysisResult {
  relationships: RelationshipInfo[]
  autoInclude: RelationshipInfo[]
  isJunctionTable: boolean
  errors?: Array<{ field: string; message: string }>
}

function analyzeRelationships(
  model: ParsedModel,
  schema: ParsedSchema,
  config: UnifiedAnalyzerConfig
): RelationshipAnalysisResult {
  // Detect junction table first (pass systemFieldNames)
  const isJunction = isJunctionTable(model, {
    junctionTableMaxDataFields: config.junctionTableMaxDataFields,
    systemFieldNames: config.systemFieldNames
  })
  
  const errors: Array<{ field: string; message: string }> = []
  
  const relationships = model.relationFields.map(field => {
    // Validate target model exists
    const targetModel = schema.modelMap.get(field.type)
    if (!targetModel) {
      const error = {
        field: field.name,
        message: `Relation '${field.name}' points to undefined model '${field.type}'`
      }
      
      if (config.collectErrors) {
        errors.push(error)
        // Return stub relationship to continue analysis
        return {
          field,
          targetModel: null as any, // Will be filtered later
          isOneToOne: false,
          isManyToMany: false,
          isOneToMany: false,
          isManyToOne: false,
          shouldAutoInclude: false
        }
      } else {
        throw new Error(
          `Model '${model.name}' has relation field '${field.name}' pointing to undefined model '${field.type}'. ` +
          `Check your schema for typos or missing models.`
        )
      }
    }
    
    // Find back-reference field using relationName for proper pairing
    const backRef = findBackReference(field, targetModel, model)
    
    // Determine relationship type
    // IMPROVED: Handle unidirectional relations with fallback heuristics
    let isOneToOne = false
    let isManyToMany = false
    let isOneToMany = false
    let isManyToOne = false
    
    if (backRef !== null) {
      // Bidirectional - use both sides to classify
      isOneToOne = !field.isList && !backRef.isList
      isManyToMany = field.isList && backRef.isList
      isOneToMany = field.isList && !backRef.isList
      isManyToOne = !field.isList && backRef.isList
    } else {
      // Unidirectional - use heuristics
      if (field.relationFromFields && field.relationFromFields.length > 0) {
        // Has FK fields = this side owns the relation = likely M:1 or 1:1
        isManyToOne = true  // Conservative: treat as M:1
      } else if (field.isList) {
        // List field without back-ref = likely 1:M
        isOneToMany = true
      } else {
        // Scalar without FK = implicit 1:1
        isOneToOne = true
      }
    }
    
    // Decide if we should auto-include
    // IMPROVED: Check FK requiredness if configured
    let shouldAutoInclude = false
    if (config.autoIncludeManyToOne !== false && isManyToOne && !isJunction) {
      if (config.autoIncludeRequiredOnly) {
        // Only include if all FK fields are required
        const fkFields = field.relationFromFields || []
        const allRequired = fkFields.every(fkName => {
          const fkField = model.scalarFields.find(f => f.name === fkName)
          return fkField?.isRequired === true
        })
        shouldAutoInclude = allRequired
      } else {
        shouldAutoInclude = true
      }
    }
    
    return {
      field,
      targetModel,
      isOneToOne,
      isManyToMany,
      isOneToMany,
      isManyToOne,
      shouldAutoInclude
    }
  }).filter(r => r.targetModel !== null)  // Remove broken relationships when collecting errors
  
  return {
    relationships,
    autoInclude: relationships.filter(r => r.shouldAutoInclude),
    isJunctionTable: isJunction,
    errors: errors.length > 0 ? errors : undefined
  }
}

/**
 * Find back-reference using relationName to properly pair bidirectional relations
 * This handles cases where a model has multiple relations to the same target
 */
function findBackReference(
  sourceField: ParsedField,
  targetModel: ParsedModel,
  sourceModel: ParsedModel
): ParsedField | null {
  return targetModel.relationFields.find(f => {
    // Must point back to source model
    if (f.type !== sourceModel.name) return false
    
    // Use relationName to match bidirectional pairs
    // Both sides of a relation share the same relationName
    if (sourceField.relationName && f.relationName) {
      return f.relationName === sourceField.relationName
    }
    
    // Fallback: if no relationName, it's the only relation between these models
    return true
  }) || null
}

// Junction table detection moved to centralized utility (see imports at top)

// ============================================================================
// SPECIAL FIELDS DETECTION
// ============================================================================

/**
 * Normalize field name: remove underscores, hyphens, spaces, dots and lowercase
 * Examples: 'deleted_at' → 'deletedat', 'is-published' → 'ispublished', 'is.Active' → 'isactive'
 */
function normalizeFieldName(name: string): string {
  return name.toLowerCase().replace(/[_\-\s.]/g, '')
}

/**
 * Default special field matchers with flexible pattern matching
 */
const DEFAULT_SPECIAL_FIELD_MATCHERS: Record<string, SpecialFieldMatcher> = {
  published: {
    pattern: /^(is)?published$/,
    validator: (f) => f.type === 'Boolean'
  },
  slug: {
    pattern: /^slug$/,
    // Note: isUnique check is redundant - isFieldUnique() handles composite unique indexes
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

/**
 * Check if a field is part of a unique index (including composite)
 */
function isFieldUnique(model: ParsedModel, fieldName: string): boolean {
  // Check direct @unique attribute
  const field = model.fields.find(f => f.name === fieldName)
  if (field?.isUnique) return true
  
  // Check composite unique indexes (@@unique([field, ...]))
  if (model.uniqueFields && model.uniqueFields.length > 0) {
    return model.uniqueFields.some(uniqueIndex => uniqueIndex.includes(fieldName))
  }
  
  return false
}

// ============================================================================
// CAPABILITIES ANALYSIS
// ============================================================================

/**
 * Check if field name matches sensitive patterns
 * IMPROVED: Normalizes field name before checking (handles api_key, api-key, apiKey)
 */
function isSensitiveField(fieldName: string, patterns: RegExp[]): boolean {
  const normalized = normalizeFieldName(fieldName)
  return patterns.some(pattern => pattern.test(normalized))
}

/**
 * TRUE SINGLE-PASS field analysis
 * Processes all fields once to detect special fields, searchable fields, and filterable fields
 * CRITICAL FIX: Iterates model.fields (not scalarFields) to catch enums and arrays
 */
interface FieldAnalysisResult {
  specialFields: SpecialFields
  searchFields: string[]
  filterFields: FilterField[]
}

function analyzeFieldsOnce(model: ParsedModel, config: UnifiedAnalyzerConfig): FieldAnalysisResult {
  type FilterType = 'exact' | 'range' | 'boolean' | 'enum' | 'array'
  
  const specialFields: SpecialFields = {}
  const searchFields: string[] = []
  const filterFields: FilterField[] = []
  
  // Config extraction
  const matchers = config.specialFieldMatchers ?? DEFAULT_SPECIAL_FIELD_MATCHERS
  const matcherEntries = Object.entries(matchers)
  const foundKeys = new Set<string>()
  const excludeSensitive = config.excludeSensitiveSearchFields ?? true
  const sensitivePatterns = config.sensitiveFieldPatterns ?? [SENSITIVE_FIELD_PATTERN]
  
  const FILTERABLE_SCALAR_TYPES = new Set([
    'String', 'Int', 'BigInt', 'Float', 'Decimal', 
    'Boolean', 'DateTime'
  ])
  
  const getFilterType = (field: ParsedField): FilterType => {
    if (field.isList) return 'array'
    if (field.kind === 'enum') return 'enum'
    if (field.type === 'Boolean') return 'boolean'
    if (field.type === 'DateTime') return 'range'
    if (['Int', 'BigInt', 'Float', 'Decimal'].includes(field.type)) return 'range'
    return 'exact'
  }
  
  // SINGLE PASS through ALL fields (not just scalarFields)
  for (const field of model.fields) {
    // Skip relation fields
    if (field.kind === 'object') continue
    
    const normalized = normalizeFieldName(field.name)
    
    // 1. Check for special fields (only on scalar fields, not enums)
    if (field.kind === 'scalar' && foundKeys.size < matcherEntries.length) {
      for (const [key, matcher] of matcherEntries) {
        if (foundKeys.has(key)) continue
        
        if (matcher.pattern.test(normalized)) {
          if (key === 'slug' && field.type === 'String') {
            if (isFieldUnique(model, field.name)) {
              (specialFields as Record<string, ParsedField>)[key] = field
              foundKeys.add(key)
            }
          } else if (matcher.validator(field)) {
            (specialFields as Record<string, ParsedField>)[key] = field
            foundKeys.add(key)
          }
        }
      }
    }
    
    // 2. Check for searchable fields (String scalars only, not enums)
    if (field.kind === 'scalar' && field.type === 'String' && !field.isId && !field.isReadOnly) {
      if (!excludeSensitive || !isSensitiveField(field.name, sensitivePatterns)) {
        searchFields.push(field.name)
      }
    }
    
    // 3. Check for filterable fields (scalars AND enums)
    const isFilterable = 
      (field.kind === 'enum' && !field.isReadOnly) ||
      (field.kind === 'scalar' && field.isList && FILTERABLE_SCALAR_TYPES.has(field.type) && !field.isReadOnly) ||
      (field.kind === 'scalar' && FILTERABLE_SCALAR_TYPES.has(field.type) && !field.isId && !field.isReadOnly)
    
    if (isFilterable) {
      filterFields.push({
        name: field.name,
        type: getFilterType(field),
        fieldType: field.type,
        isRequired: field.isRequired
      })
    }
  }
  
  return { specialFields, searchFields, filterFields }
}

function analyzeCapabilities(
  model: ParsedModel,
  specialFields: SpecialFields,
  searchFields: string[],
  filterFields: FilterField[],
  config: UnifiedAnalyzerConfig
): ModelCapabilities {
  return {
    // Search capabilities (already computed)
    hasSearch: searchFields.length > 0,
    searchFields,
    
    // Filter capabilities (already computed)
    hasFilters: filterFields.length > 0,
    filterFields,
    
    // Special method detection (use already-detected special fields)
    hasFindBySlug: !!specialFields.slug,
    hasFeatured: hasFieldNormalized(model, 'isFeatured'),
    hasActive: hasFieldNormalized(model, 'isActive'),
    hasPublished: !!specialFields.published,
    hasSoftDelete: !!specialFields.deletedAt,
    
    // Relationship detection
    hasParentChild: hasParentChildRelation(model, specialFields, config),
    foreignKeys: getForeignKeys(model)
  }
}

function hasField(model: ParsedModel, fieldName: string): boolean {
  return model.fields.some(f => f.name === fieldName)
}

/**
 * Check if field exists with normalized name matching
 * IMPROVED: Handles is_featured, isFeatured, is-featured variations
 */
function hasFieldNormalized(model: ParsedModel, targetName: string): boolean {
  const normalizedTarget = normalizeFieldName(targetName)
  return model.fields.some(f => normalizeFieldName(f.name) === normalizedTarget)
}

/**
 * Detect self-referential parent/child relations
 * IMPROVED: Uses already-detected parentId field and configurable patterns
 */
function hasParentChildRelation(
  model: ParsedModel, 
  specialFields: SpecialFields,
  config: UnifiedAnalyzerConfig
): boolean {
  // Use the already-detected parentId field if available
  if (specialFields.parentId) {
    return model.fields.some(field => 
      field.kind === 'object' && 
      field.type === model.name &&
      field.relationFromFields &&
      field.relationFromFields.includes(specialFields.parentId!.name)
    )
  }
  
  // Fallback: detect using configurable pattern (parent|ancestor|root)
  const pattern = config.parentFieldPatterns ?? DEFAULT_PARENT_PATTERN
  return model.fields.some(field => {
    if (field.kind !== 'object' || field.type !== model.name) return false
    if (!field.relationFromFields || field.relationFromFields.length === 0) return false
    
    return field.relationFromFields.some(fkField => 
      pattern.test(normalizeFieldName(fkField))
    )
  })
}

/**
 * Extract foreign key information, handling composite foreign keys
 * IMPROVED: Returns all fields in composite FKs, includes self-references, proper relationName
 */
function getForeignKeys(model: ParsedModel): ForeignKeyInfo[] {
  return model.fields
    .filter(field => 
      field.kind === 'object' && 
      field.relationFromFields && 
      field.relationFromFields.length > 0
      // FIXED: Don't exclude self-references - they're still foreign keys
    )
    .map(field => ({
      fieldNames: field.relationFromFields!,  // Return all fields for composite FKs
      relationAlias: field.name,              // The field name (e.g., 'category')
      relationName: field.relationName ?? null,  // Prisma @relation(name: "...")
      relatedModel: field.type
    }))
}

// ============================================================================
// UTILITY: Generate include statement for auto-loaded relations
// ============================================================================

/**
 * Generate Prisma include object for auto-loaded relations
 * IMPROVED: Returns typed object instead of string fragments
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
 * Legacy: Generate Prisma include statement as string
 * 
 * @deprecated Use `generateIncludeObject()` instead for type safety.
 * String-based includes are error-prone and difficult to compose correctly.
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


/**
 * Unified Model Analyzer
 * 
 * Combines relationship-analyzer.ts and model-capabilities.ts into an optimized
 * analyzer that minimizes field traversals.
 * 
 * PERFORMANCE: Previously multiple analyzers would scan the same model repeatedly.
 * This unified analyzer performs:
 * - Single pass for all field analysis (special fields + searchable + filterable)
 * - Separate pass for relationships (requires schema context for back-reference resolution)
 * - Minimal overhead for capability detection
 * 
 * CORRECTNESS: Properly handles enums, enum lists, scalar arrays, unidirectional relations, 
 * composite keys, and composite unique indexes.
 * 
 * FLEXIBILITY: Configurable patterns, error collection, custom auto-include hooks, and 
 * extensible field matchers.
 */

import type { ParsedModel, ParsedField, ParsedSchema } from '../dmmf-parser.js'
import type { FilterField } from './field-analyzer.js'
import { isJunctionTable } from '@/utils/junction-table.js'

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface SpecialFieldMatcher {
  pattern: RegExp
  validator: (field: ParsedField) => boolean
}

/**
 * Configuration for unified model analyzer
 * 
 * @example
 * ```ts
 * // Custom auto-include: only required unique M:1
 * analyzeModelUnified(model, schema, {
 *   shouldAutoInclude: (rel, model) => {
 *     if (!rel.isManyToOne) return false
 *     const fkFields = rel.field.relationFromFields || []
 *     return fkFields.every(fk => {
 *       const field = model.scalarFields.find(f => f.name === fk)
 *       return field?.isRequired && isFieldUnique(model, fk)
 *     })
 *   }
 * })
 * ```
 */
export interface UnifiedAnalyzerConfig {
  /** Custom special field matchers (keys must match SpecialFields properties) */
  specialFieldMatchers?: Record<string, SpecialFieldMatcher>
  
  /** Maximum non-system fields allowed in junction tables (default: 2) */
  junctionTableMaxDataFields?: number
  
  /** System field names to exclude from junction detection (default: createdAt, updatedAt, deletedAt, etc.) */
  systemFieldNames?: string[]
  
  /** Whether to auto-include many-to-one relations (default: true) */
  autoIncludeManyToOne?: boolean
  
  /** Only auto-include if ALL FK fields are required (default: false) */
  autoIncludeRequiredOnly?: boolean
  
  /** Custom auto-include logic - overrides autoIncludeManyToOne and autoIncludeRequiredOnly */
  shouldAutoInclude?: (relation: RelationshipInfo, model: ParsedModel) => boolean
  
  /** Exclude sensitive fields from search (password, token, etc.) (default: true) */
  excludeSensitiveSearchFields?: boolean
  
  /** Custom patterns for sensitive fields (default: password|token|secret|...) */
  sensitiveFieldPatterns?: RegExp[]
  
  /** Pattern for parent field detection (default: /^(parent|ancestor|root)/i) */
  parentFieldPatterns?: RegExp
  
  /** Collect errors instead of throwing (default: false) */
  collectErrors?: boolean
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

/**
 * Foreign key metadata
 * 
 * MIGRATION NOTE (v2.0):
 * - `fieldName` (singular) → `fieldNames` (array) to support composite FKs
 * - `relationName` → split into `relationAlias` + `relationName`:
 *   - `relationAlias`: The field name (e.g., 'category')
 *   - `relationName`: Prisma's @relation(name: "...") or null
 * 
 * @example
 * ```prisma
 * model Post {
 *   categoryId Int
 *   category   Category @relation("PostCategory", fields: [categoryId], references: [id])
 * }
 * 
 * // Produces:
 * {
 *   fieldNames: ['categoryId'],
 *   relationAlias: 'category',
 *   relationName: 'PostCategory',
 *   relatedModel: 'Category'
 * }
 * ```
 */
export interface ForeignKeyInfo {
  fieldNames: string[]         // e.g., ['categoryId'] or ['userId', 'tenantId'] for composite
  relationAlias: string        // The field name, e.g., 'category'
  relationName: string | null  // Prisma @relation(name: "..."), e.g., 'PostCategory'
  relatedModel: string         // e.g., 'Category'
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
 * 
 * ERROR HANDLING:
 * - When `config.collectErrors === false` (default): Throws on first error
 * - When `config.collectErrors === true`: Collects all errors in `errors` array,
 *   broken relationships are skipped (not included in `relationships` array)
 * 
 * @example
 * ```ts
 * // Strict mode (default) - throws immediately
 * const analysis = analyzeModelUnified(model, schema)
 * 
 * // Lenient mode - collects all errors
 * const analysis = analyzeModelUnified(model, schema, { collectErrors: true })
 * if (analysis.errors) {
 *   analysis.errors.forEach(err => console.error(`${err.model}.${err.field}: ${err.message}`))
 * }
 * ```
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
  
  // Errors encountered during analysis (only when collectErrors: true)
  errors?: Array<{ model: string; field: string; message: string }>
}

// ============================================================================
// MAIN ANALYZER
// ============================================================================

// Constants
// Sensitive field patterns (normalized field names - no underscores/hyphens)
// Add credential, authcode, refreshtoken to catch more sensitive fields
const SENSITIVE_FIELD_PATTERN = /^(password|token|secret|hash|salt|apikey|privatekey|credential|authcode|refreshtoken)/i
const DEFAULT_PARENT_PATTERN = /^(parent|ancestor|root)/i

// Field kind constants
const FIELD_KIND_SCALAR = 'scalar' as const
const FIELD_KIND_ENUM = 'enum' as const
const FIELD_KIND_OBJECT = 'object' as const

// Default configuration
const DEFAULT_CONFIG: UnifiedAnalyzerConfig = {
  junctionTableMaxDataFields: 2,
  autoIncludeManyToOne: true,
  autoIncludeRequiredOnly: true, // Conservative default: only include if all FK fields are required
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
/**
 * Validate config.specialFieldMatchers keys match SpecialFields type
 */
function validateConfig(config: UnifiedAnalyzerConfig): void {
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

export function analyzeModelUnified(
  model: ParsedModel,
  schema: ParsedSchema,
  config: UnifiedAnalyzerConfig = {}
): UnifiedModelAnalysis {
  // Validate configuration
  validateConfig(config)
  
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const allErrors: Array<{ model: string; field: string; message: string }> = []
  
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
  skippedRelations?: string[]  // Track which relations were skipped due to errors
  errors?: Array<{ model: string; field: string; message: string }>
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
  
  const errors: Array<{ model: string; field: string; message: string }> = []
  const skippedRelations: string[] = []
  
  const relationships = model.relationFields.flatMap(field => {
    // Validate target model exists
    const targetModel = schema.modelMap.get(field.type)
    if (!targetModel) {
      const error = {
        model: model.name,
        field: field.name,
        message: `Relation '${field.name}' points to undefined model '${field.type}'`
      }
      
      if (config.collectErrors) {
        errors.push(error)
        skippedRelations.push(field.name)
        // Return empty array to skip this relationship cleanly (flatMap will flatten it)
        return []
      } else {
        throw new Error(
          `Model '${model.name}' has relation field '${field.name}' pointing to undefined model '${field.type}'. ` +
          `Check your schema for typos or missing models.`
        )
      }
    }
    
    // Find back-reference field using relationName for proper pairing
    const backRef = findBackReference(field, targetModel, model)
    
    /**
     * Determine relationship type using both bidirectional and unidirectional heuristics
     * 
     * BIDIRECTIONAL (has back-reference):
     * - 1:1 = scalar on both sides
     * - M:N = list on both sides
     * - 1:M = list on this side, scalar on other
     * - M:1 = scalar on this side, list on other
     * 
     * UNIDIRECTIONAL (no back-reference):
     * - Has FK + unique FK = 1:1
     * - Has FK + non-unique = M:1
     * - List + target is not junction = 1:M
     * - List + target is junction = unidirectional M:N (set isManyToMany)
     * - Scalar without FK = implicit 1:1 (rare)
     */
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
      // Unidirectional - use heuristics based on field characteristics
      const hasFKFields = Array.isArray(field.relationFromFields) && field.relationFromFields.length > 0
      
      if (hasFKFields) {
        // Has FK fields = this side owns the relation
        // Extract to local variable for type safety (validated by hasFKFields check above)
        const fkFields = field.relationFromFields as string[]
        
        // Check if FK is unique to distinguish 1:1 from M:1
        
        // Use improved validation that ensures ALL FK fields form a unique constraint
        const fkAreUnique = areFieldsUnique(model, fkFields)
        
        if (fkAreUnique) {
          isOneToOne = true  // Unique FK (single or composite) = 1:1
        } else {
          isManyToOne = true  // Non-unique FK = M:1
        }
      } else if (field.isList) {
        // List field without back-ref could be 1:M or unidirectional M:N
        const targetIsJunction = isJunctionTable(targetModel, {
          junctionTableMaxDataFields: config.junctionTableMaxDataFields,
          systemFieldNames: config.systemFieldNames
        })
        
        if (targetIsJunction) {
          // Target is junction table = unidirectional M:N
          isManyToMany = true
        } else {
          // Target is regular model = 1:M
          isOneToMany = true
        }
      } else {
        // Scalar without FK = implicit 1:1 (rare case)
        isOneToOne = true
      }
    }
    
    // Build relationship object first
    const relationship: RelationshipInfo = {
      field,
      targetModel,
      isOneToOne,
      isManyToMany,
      isOneToMany,
      isManyToOne,
      shouldAutoInclude: false  // Computed below
    }
    
    // Decide if we should auto-include
    // IMPROVED: Support custom hook, check FK requiredness and uniqueness
    if (config.shouldAutoInclude) {
      relationship.shouldAutoInclude = config.shouldAutoInclude(relationship, model)
    } else if (config.autoIncludeManyToOne !== false && isManyToOne && !isJunction) {
      if (config.autoIncludeRequiredOnly) {
        // Only include if all FK fields are required
        const fkFields = field.relationFromFields || []
        const allRequired = fkFields.every(fkName => {
          const fkField = model.scalarFields.find(f => f.name === fkName)
          return fkField?.isRequired === true
        })
        relationship.shouldAutoInclude = allRequired
      } else {
        relationship.shouldAutoInclude = true
      }
    }
    
    return relationship
  })
  
  return {
    relationships,
    autoInclude: relationships.filter(r => r.shouldAutoInclude),
    isJunctionTable: isJunction,
    skippedRelations: skippedRelations.length > 0 ? skippedRelations : undefined,
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
  const candidates = targetModel.relationFields.filter(f => f.type === sourceModel.name)
  
  if (candidates.length === 0) return null
  if (candidates.length === 1) return candidates[0]
  
  // Multiple relations to same model - need precise pairing
  for (const candidate of candidates) {
    // Use relationName to match bidirectional pairs
    if (sourceField.relationName && candidate.relationName) {
      if (sourceField.relationName === candidate.relationName) {
        return candidate
      }
      continue
    }
    
    // If only one side has relationName, they can't be a valid pair - skip FK matching
    if (sourceField.relationName || candidate.relationName) {
      continue
    }
    
    // Fallback: compare FK field sets when both omit relationName
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
 * Type guard: check if key is valid SpecialFields property
 */
function isSpecialFieldKey(key: string): key is keyof SpecialFields {
  return ['published', 'slug', 'views', 'likes', 'approved', 'deletedAt', 'parentId'].includes(key)
}

/**
 * Check if a field is part of a unique index (including composite)
 * 
 * @param model - The model to check
 * @param fieldName - Single field name to check
 * @param requireExactMatch - For composite FK validation: require the unique index to ONLY contain the specified field
 * @returns true if field is unique (alone or as part of composite unique)
 */
function isFieldUnique(model: ParsedModel, fieldName: string, requireExactMatch = false): boolean {
  // Check direct @unique attribute
  const field = model.fields.find(f => f.name === fieldName)
  if (field?.isUnique) return true
  
  // Check composite unique indexes (@@unique([field, ...]))
  if (Array.isArray(model.uniqueFields) && model.uniqueFields.length > 0) {
    if (requireExactMatch) {
      // For single-field queries: unique index must contain ONLY this field
      return model.uniqueFields.some(uniqueIndex => 
        uniqueIndex.length === 1 && uniqueIndex[0] === fieldName
      )
    }
    // Default: field is unique if it's part of ANY unique index
    return model.uniqueFields.some(uniqueIndex => uniqueIndex.includes(fieldName))
  }
  
  return false
}

/**
 * Check if a set of fields together form a unique constraint
 * Used for composite foreign key validation
 */
function areFieldsUnique(model: ParsedModel, fieldNames: string[]): boolean {
  // Single field case
  if (fieldNames.length === 1) {
    return isFieldUnique(model, fieldNames[0], true)
  }
  
  // Check if there's a unique index that exactly matches ALL these fields
  if (Array.isArray(model.uniqueFields) && model.uniqueFields.length > 0) {
    return model.uniqueFields.some(uniqueIndex => {
      if (uniqueIndex.length !== fieldNames.length) return false
      const indexSet = new Set(uniqueIndex)
      return fieldNames.every(fk => indexSet.has(fk))
    })
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
 * PERFORMANCE: Caches normalized field names to avoid repeated normalization
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
    // Lists (including enum lists like Role[]) are treated as 'array'
    if (field.isList) return 'array'
    // Single enums (like Role)
    if (field.kind === FIELD_KIND_ENUM) return 'enum'
    // Scalars
    if (field.type === 'Boolean') return 'boolean'
    if (field.type === 'DateTime') return 'range'
    if (['Int', 'BigInt', 'Float', 'Decimal'].includes(field.type)) return 'range'
    return 'exact'
  }
  
  // PERFORMANCE OPTIMIZATION: Pre-compute normalized names once
  const normalizedNames = new Map<string, string>()
  for (const field of model.fields) {
    if (field.kind !== FIELD_KIND_OBJECT) {
      normalizedNames.set(field.name, normalizeFieldName(field.name))
    }
  }
  
  // SINGLE PASS through ALL fields (not just scalarFields)
  for (const field of model.fields) {
    // Skip relation fields
    if (field.kind === FIELD_KIND_OBJECT) continue
    
    // Use cached normalized name (performance optimization - avoids repeated normalization)
    const normalized = normalizedNames.get(field.name)!
    const isScalar = field.kind === FIELD_KIND_SCALAR
    const isEnum = field.kind === FIELD_KIND_ENUM
    
    // 1. Check for special fields (only on scalar fields, not enums)
    if (isScalar && foundKeys.size < matcherEntries.length) {
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
    
    // 2. Check for searchable fields (String scalars only, not enums)
    if (isScalar && field.type === 'String' && !field.isId && !field.isReadOnly) {
      // Reuse already-normalized name for performance
      if (!excludeSensitive || !sensitivePatterns.some(p => p.test(normalized))) {
        searchFields.push(field.name)
      }
    }
    
    // 3. Check for filterable fields (scalars, enums, and their lists)
    const isFilterable = 
      (isEnum && !field.isReadOnly) ||  // Enum (includes lists)
      (isScalar && field.isList && FILTERABLE_SCALAR_TYPES.has(field.type) && !field.isReadOnly) ||  // Scalar lists
      (isScalar && FILTERABLE_SCALAR_TYPES.has(field.type) && !field.isId && !field.isReadOnly)  // Scalars
    
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
  const parentIdField = specialFields.parentId
  if (parentIdField) {
    return model.fields.some(field => 
      field.kind === FIELD_KIND_OBJECT && 
      field.type === model.name &&
      Array.isArray(field.relationFromFields) &&
      field.relationFromFields.includes(parentIdField.name)
    )
  }
  
  // Fallback: detect using configurable pattern (parent|ancestor|root)
  const providedPattern = config.parentFieldPatterns ?? DEFAULT_PARENT_PATTERN
  
  // Ensure pattern is case-insensitive (reconstruct if needed)
  const pattern = providedPattern.flags.includes('i')
    ? providedPattern
    : new RegExp(providedPattern.source, 'i')
  
  return model.fields.some(field => {
    if (field.kind !== FIELD_KIND_OBJECT || field.type !== model.name) return false
    if (!Array.isArray(field.relationFromFields) || field.relationFromFields.length === 0) {
      return false
    }
    
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
  const result: ForeignKeyInfo[] = []
  
  for (const field of model.fields) {
    if (field.kind !== FIELD_KIND_OBJECT) continue
    if (!Array.isArray(field.relationFromFields) || field.relationFromFields.length === 0) {
      continue
    }
    
    result.push({
      fieldNames: field.relationFromFields,  // Type-safe: validated above
      relationAlias: field.name,
      relationName: field.relationName ?? null,
      relatedModel: field.type
    })
  }
  
  return result
}

// ============================================================================
// UTILITY: Generate include statement for auto-loaded relations
// ============================================================================

/**
 * Generate Prisma include object for auto-loaded relations
 * 
 * IMPROVED: Returns typed object instead of string fragments
 * 
 * NOTE: This only generates flat includes ({ relation: true }).
 * For nested includes/selects, you'll need to build the structure manually:
 * 
 * @example
 * ```ts
 * // Flat include (this function)
 * { author: true, category: true }
 * 
 * // Nested include (build manually)
 * { 
 *   author: { 
 *     include: { profile: true } 
 *   } 
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
 * Legacy: Generate Prisma include statement as string
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


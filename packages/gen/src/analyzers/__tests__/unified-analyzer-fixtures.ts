/**
 * Test Fixtures for Unified Analyzer
 * 
 * Provides mock models and schemas for testing all analyzer functionality
 */

import type { ParsedModel, ParsedField, ParsedSchema } from '../../dmmf-parser.js'

/**
 * Create mock field with defaults
 */
export function createMockField(overrides: Partial<ParsedField> = {}): ParsedField {
  const isRequired = overrides.isRequired !== undefined ? overrides.isRequired : true
  const hasDefaultValue = overrides.hasDefaultValue || false
  
  return {
    name: 'testField',
    type: 'String',
    kind: 'scalar',
    isList: false,
    isRequired,
    isNullable: !isRequired,
    isOptional: !isRequired || hasDefaultValue,
    isUnique: false,
    isId: false,
    isReadOnly: false,
    isUpdatedAt: false,
    hasDefaultValue,
    hasDbDefault: false,
    isPartOfCompositePrimaryKey: false,
    isSelfRelation: false,
    relationFromFields: undefined,
    relationToFields: undefined,
    relationName: undefined,
    ...overrides
  } as ParsedField
}

/**
 * Create mock model with defaults
 */
export function createMockModel(overrides: Partial<ParsedModel> = {}): ParsedModel {
  const fields = overrides.fields || [
    createMockField({ name: 'id', type: 'Int', isId: true }),
    createMockField({ name: 'name', type: 'String', isRequired: true })
  ]
  
  const idField = fields.find(f => f.isId)
  const scalarFields = fields.filter(f => f.kind !== 'object' && f.kind !== 'unsupported')
  const relationFields = fields.filter(f => f.kind === 'object')
  const hasSelfRelation = fields.some(f => f.isSelfRelation)
  
  return {
    name: 'TestModel',
    nameLower: (overrides.name || 'TestModel').toLowerCase(),
    fields,
    primaryKey: overrides.primaryKey || (idField ? { fields: [idField.name] } : undefined),
    uniqueFields: overrides.uniqueFields || [],
    idField,
    scalarFields,
    relationFields,
    createFields: scalarFields.filter(f => !f.isId && !f.isReadOnly && !f.isUpdatedAt),
    updateFields: scalarFields.filter(f => !f.isId && !f.isReadOnly && !f.isUpdatedAt),
    readFields: scalarFields,
    reverseRelations: [],
    hasSelfRelation,
    ...overrides
  } as ParsedModel
}

/**
 * Create mock schema with models
 */
export function createMockSchema(models: ParsedModel[]): ParsedSchema {
  const modelMap = new Map(models.map(m => [m.name, m]))
  const reverseRelationMap = new Map<string, ParsedField[]>()
  
  // Build reverse relation map
  for (const model of models) {
    reverseRelationMap.set(model.name, [])
  }
  
  for (const model of models) {
    for (const field of model.fields) {
      if (field.kind === 'object') {
        const relations = reverseRelationMap.get(field.type)
        if (relations) {
          relations.push(field)
        }
      }
    }
  }
  
  return {
    models,
    modelMap,
    enums: [],
    enumMap: new Map(),
    reverseRelationMap
  } as ParsedSchema
}

// ============================================================================
// Test Model Fixtures
// ============================================================================

/**
 * Blog Post Model - comprehensive model with special fields
 */
export const BLOG_POST_MODEL = createMockModel({
  name: 'Post',
  fields: [
    createMockField({ name: 'id', type: 'Int', isId: true }),
    createMockField({ name: 'title', type: 'String', isRequired: true }),
    createMockField({ name: 'slug', type: 'String', isUnique: true }),
    createMockField({ name: 'content', type: 'String', isRequired: false }),
    createMockField({ name: 'published', type: 'Boolean', hasDefaultValue: true, default: false }),
    createMockField({ name: 'views', type: 'Int', hasDefaultValue: true, default: 0 }),
    createMockField({ name: 'createdAt', type: 'DateTime', hasDefaultValue: true }),
    createMockField({ name: 'updatedAt', type: 'DateTime', isUpdatedAt: true, isReadOnly: true }),
    createMockField({ name: 'deletedAt', type: 'DateTime', isRequired: false })
  ]
})

/**
 * User Model - basic model with relations
 */
export const USER_MODEL = createMockModel({
  name: 'User',
  fields: [
    createMockField({ name: 'id', type: 'Int', isId: true }),
    createMockField({ name: 'email', type: 'String', isRequired: true, isUnique: true }),
    createMockField({ name: 'name', type: 'String', isRequired: true }),
    createMockField({ name: 'posts', type: 'Post', kind: 'object', isList: true })
  ]
})

/**
 * Category Model - for testing relationships
 */
export const CATEGORY_MODEL = createMockModel({
  name: 'Category',
  fields: [
    createMockField({ name: 'id', type: 'Int', isId: true }),
    createMockField({ name: 'name', type: 'String', isRequired: true }),
    createMockField({ name: 'posts', type: 'Post', kind: 'object', isList: true })
  ]
})

/**
 * Post-Tag Junction Table - classic composite PK pattern
 */
export const POST_TAG_JUNCTION_MODEL = createMockModel({
  name: 'PostTag',
  fields: [
    createMockField({ name: 'postId', type: 'Int', isId: true }),
    createMockField({ name: 'tagId', type: 'Int', isId: true }),
    createMockField({ 
      name: 'post', 
      type: 'Post', 
      kind: 'object',
      relationFromFields: ['postId'],
      relationToFields: ['id']
    }),
    createMockField({ 
      name: 'tag', 
      type: 'Tag', 
      kind: 'object',
      relationFromFields: ['tagId'],
      relationToFields: ['id']
    }),
    createMockField({ name: 'createdAt', type: 'DateTime', hasDefaultValue: true })
  ],
  primaryKey: { fields: ['postId', 'tagId'] }
})

/**
 * Junction Table with Audit Fields - tests system field exclusion
 */
export const JUNCTION_WITH_AUDIT_MODEL = createMockModel({
  name: 'UserRole',
  fields: [
    createMockField({ name: 'userId', type: 'Int', isId: true }),
    createMockField({ name: 'roleId', type: 'Int', isId: true }),
    createMockField({ 
      name: 'user', 
      type: 'User', 
      kind: 'object',
      relationFromFields: ['userId']
    }),
    createMockField({ 
      name: 'role', 
      type: 'Role', 
      kind: 'object',
      relationFromFields: ['roleId']
    }),
    createMockField({ name: 'createdAt', type: 'DateTime', hasDefaultValue: true }),
    createMockField({ name: 'deletedAt', type: 'DateTime', isRequired: false }),
    createMockField({ name: 'createdBy', type: 'Int', isRequired: false })
  ],
  primaryKey: { fields: ['userId', 'roleId'] }
})

/**
 * Post with Enums - tests enum field detection
 */
export const POST_WITH_ENUMS_MODEL = createMockModel({
  name: 'Post',
  fields: [
    createMockField({ name: 'id', type: 'Int', isId: true }),
    createMockField({ name: 'title', type: 'String', isRequired: true }),
    createMockField({ name: 'status', type: 'PostStatus', kind: 'enum', isRequired: true }),
    createMockField({ name: 'visibility', type: 'Visibility', kind: 'enum', isRequired: true }),
    createMockField({ name: 'tags', type: 'String', isList: true }), // Array field
    createMockField({ name: 'ratings', type: 'Int', isList: true }) // Array field
  ]
})

/**
 * Unidirectional Model - tests unidirectional relationship classification
 */
export const UNIDIRECTIONAL_MODEL = createMockModel({
  name: 'Comment',
  fields: [
    createMockField({ name: 'id', type: 'Int', isId: true }),
    createMockField({ name: 'content', type: 'String', isRequired: true }),
    createMockField({ name: 'authorId', type: 'Int', isRequired: true }),
    createMockField({ 
      name: 'author', 
      type: 'User', 
      kind: 'object',
      relationFromFields: ['authorId'],
      relationToFields: ['id']
    })
  ]
})

/**
 * Self-Referential Category Model - tests parent/child detection
 */
export const SELF_REF_CATEGORY_MODEL = createMockModel({
  name: 'Category',
  fields: [
    createMockField({ name: 'id', type: 'Int', isId: true }),
    createMockField({ name: 'name', type: 'String', isRequired: true }),
    createMockField({ name: 'parentId', type: 'Int', isRequired: false }),
    createMockField({ 
      name: 'parent', 
      type: 'Category', 
      kind: 'object',
      relationFromFields: ['parentId'],
      relationToFields: ['id']
    }),
    createMockField({ 
      name: 'children', 
      type: 'Category', 
      kind: 'object',
      isList: true
    })
  ]
})

/**
 * Model with Normalized Field Names - tests field name normalization
 */
export const NORMALIZED_FIELDS_MODEL = createMockModel({
  name: 'Product',
  fields: [
    createMockField({ name: 'id', type: 'Int', isId: true }),
    createMockField({ name: 'is_published', type: 'Boolean' }),
    createMockField({ name: 'deleted-at', type: 'DateTime' }),
    createMockField({ name: 'view.count', type: 'Int' }),
    createMockField({ name: 'parent_id', type: 'Int' })
  ]
})

/**
 * Model with Sensitive Fields - tests sensitive field exclusion
 */
export const SENSITIVE_FIELDS_MODEL = createMockModel({
  name: 'User',
  fields: [
    createMockField({ name: 'id', type: 'Int', isId: true }),
    createMockField({ name: 'email', type: 'String' }),
    createMockField({ name: 'name', type: 'String' }),
    createMockField({ name: 'password', type: 'String' }),
    createMockField({ name: 'password_hash', type: 'String' }),
    createMockField({ name: 'apiKey', type: 'String' }),
    createMockField({ name: 'api_key', type: 'String' }),
    createMockField({ name: 'secret_token', type: 'String' }),
    createMockField({ name: 'privateKey', type: 'String' })
  ]
})

/**
 * Model with Composite Unique Index - tests slug detection in composite unique
 */
export const COMPOSITE_UNIQUE_MODEL = createMockModel({
  name: 'Post',
  fields: [
    createMockField({ name: 'id', type: 'Int', isId: true }),
    createMockField({ name: 'slug', type: 'String', isUnique: false }),
    createMockField({ name: 'tenantId', type: 'Int' }),
    createMockField({ name: 'title', type: 'String' })
  ],
  uniqueFields: [['slug', 'tenantId']]
})

/**
 * Model with Decimal Counters - tests Decimal type support
 */
export const DECIMAL_COUNTERS_MODEL = createMockModel({
  name: 'Post',
  fields: [
    createMockField({ name: 'id', type: 'Int', isId: true }),
    createMockField({ name: 'viewCount', type: 'Decimal' }),
    createMockField({ name: 'likes', type: 'Decimal' }),
    createMockField({ name: 'shares', type: 'BigInt' })
  ]
})

/**
 * Model with Composite Foreign Keys - tests composite FK handling
 */
export const COMPOSITE_FK_MODEL = createMockModel({
  name: 'OrderItem',
  fields: [
    createMockField({ name: 'id', type: 'Int', isId: true }),
    createMockField({ name: 'orderId', type: 'Int' }),
    createMockField({ name: 'productId', type: 'Int' }),
    createMockField({ name: 'quantity', type: 'Int' }),
    createMockField({ 
      name: 'productVariant', 
      type: 'ProductVariant', 
      kind: 'object',
      relationFromFields: ['orderId', 'productId'],
      relationToFields: ['orderId', 'productId']
    })
  ]
})

/**
 * Model with Multiple Relations to Same Target - tests relationName pairing
 */
export const MULTIPLE_RELATIONS_MODEL = createMockModel({
  name: 'Post',
  fields: [
    createMockField({ name: 'id', type: 'Int', isId: true }),
    createMockField({ name: 'title', type: 'String' }),
    createMockField({ name: 'authorId', type: 'Int' }),
    createMockField({ 
      name: 'author', 
      type: 'User', 
      kind: 'object',
      relationFromFields: ['authorId'],
      relationName: 'PostAuthor'
    }),
    createMockField({ name: 'editorId', type: 'Int', isRequired: false }),
    createMockField({ 
      name: 'editor', 
      type: 'User', 
      kind: 'object',
      relationFromFields: ['editorId'],
      relationName: 'PostEditor'
    })
  ]
})


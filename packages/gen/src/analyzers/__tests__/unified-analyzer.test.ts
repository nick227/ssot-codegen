/**
 * Unified Analyzer Tests
 * 
 * Comprehensive tests covering:
 * - Basic functionality
 * - Critical fixes (enums, arrays, unidirectional relations)
 * - Configuration options
 * - Edge cases
 * - Error collection mode
 */

import { describe, it, expect } from 'vitest'
import { 
  analyzeModelUnified,
  generateIncludeObject,
  generateSummaryInclude,
  type UnifiedAnalyzerConfig 
} from '../index.js'
import type { ParsedSchema } from '../../dmmf-parser.js'
import {
  createMockModel,
  createMockField,
  createMockSchema,
  // Test models
  BLOG_POST_MODEL,
  USER_MODEL,
  CATEGORY_MODEL,
  POST_TAG_JUNCTION_MODEL,
  POST_WITH_ENUMS_MODEL,
  UNIDIRECTIONAL_MODEL,
  JUNCTION_WITH_AUDIT_MODEL,
  SELF_REF_CATEGORY_MODEL
} from './unified-analyzer-fixtures.js'

describe('analyzeModelUnified', () => {
  describe('Basic Functionality', () => {
    it('should analyze a simple model', () => {
      const model = createMockModel({
        name: 'User',
        fields: [
          createMockField({ name: 'id', type: 'Int', isId: true }),
          createMockField({ name: 'email', type: 'String', isUnique: true }),
          createMockField({ name: 'name', type: 'String' })
        ]
      })
      const schema = createMockSchema([model])
      
      const analysis = analyzeModelUnified(model, schema)
      
      expect(analysis.model.name).toBe('User')
      expect(analysis.relationships).toEqual([])
      expect(analysis.isJunctionTable).toBe(false)
      expect(analysis.capabilities.hasSearch).toBe(true)
      expect(analysis.capabilities.searchFields).toEqual(['email', 'name'])
    })

    it('should detect special fields', () => {
      const analysis = analyzeModelUnified(BLOG_POST_MODEL, createMockSchema([BLOG_POST_MODEL]))
      
      expect(analysis.specialFields.published).toBeDefined()
      expect(analysis.specialFields.slug).toBeDefined()
      expect(analysis.specialFields.deletedAt).toBeDefined()
      expect(analysis.hasPublishedField).toBe(true)
      expect(analysis.hasSlugField).toBe(true)
    })

    it('should detect capabilities', () => {
      const analysis = analyzeModelUnified(BLOG_POST_MODEL, createMockSchema([BLOG_POST_MODEL]))
      
      expect(analysis.capabilities.hasSearch).toBe(true)
      expect(analysis.capabilities.hasFilters).toBe(true)
      expect(analysis.capabilities.hasFindBySlug).toBe(true)
      expect(analysis.capabilities.hasPublished).toBe(true)
      expect(analysis.capabilities.hasSoftDelete).toBe(true)
    })
  })

  describe('Critical Fix: Enum Detection', () => {
    it('should detect enum fields as filterable', () => {
      const schema = createMockSchema([POST_WITH_ENUMS_MODEL])
      const analysis = analyzeModelUnified(POST_WITH_ENUMS_MODEL, schema)
      
      const statusFilter = analysis.capabilities.filterFields.find(f => f.name === 'status')
      expect(statusFilter).toBeDefined()
      expect(statusFilter?.type).toBe('enum')
      expect(statusFilter?.fieldType).toBe('PostStatus')
    })

    it('should detect multiple enum fields', () => {
      const model = createMockModel({
        name: 'Product',
        fields: [
          createMockField({ name: 'id', type: 'Int', isId: true }),
          createMockField({ name: 'status', type: 'ProductStatus', kind: 'enum' }),
          createMockField({ name: 'category', type: 'ProductCategory', kind: 'enum' })
        ]
      })
      const schema = createMockSchema([model])
      const analysis = analyzeModelUnified(model, schema)
      
      const enumFilters = analysis.capabilities.filterFields.filter(f => f.type === 'enum')
      expect(enumFilters.length).toBe(2)
      expect(enumFilters.map(f => f.name)).toEqual(['status', 'category'])
    })
  })

  describe('Critical Fix: Array Detection', () => {
    it('should detect array fields as filterable', () => {
      const model = createMockModel({
        name: 'Post',
        fields: [
          createMockField({ name: 'id', type: 'Int', isId: true }),
          createMockField({ name: 'tags', type: 'String', isList: true }),
          createMockField({ name: 'ratings', type: 'Int', isList: true })
        ]
      })
      const schema = createMockSchema([model])
      const analysis = analyzeModelUnified(model, schema)
      
      const arrayFilters = analysis.capabilities.filterFields.filter(f => f.type === 'array')
      expect(arrayFilters.length).toBe(2)
      expect(arrayFilters.map(f => f.name)).toEqual(['tags', 'ratings'])
    })

    it('should not include array fields in search fields', () => {
      const model = createMockModel({
        name: 'Post',
        fields: [
          createMockField({ name: 'id', type: 'Int', isId: true }),
          createMockField({ name: 'title', type: 'String' }),
          createMockField({ name: 'tags', type: 'String', isList: true })
        ]
      })
      const schema = createMockSchema([model])
      const analysis = analyzeModelUnified(model, schema)
      
      expect(analysis.capabilities.searchFields).toEqual(['title'])
      expect(analysis.capabilities.searchFields).not.toContain('tags')
    })
  })

  describe('Critical Fix: Unidirectional Relations', () => {
    it('should classify unidirectional M:1 relation', () => {
      const schema = createMockSchema([UNIDIRECTIONAL_MODEL, USER_MODEL])
      const analysis = analyzeModelUnified(UNIDIRECTIONAL_MODEL, schema)
      
      const authorRel = analysis.relationships.find(r => r.field.name === 'author')
      expect(authorRel).toBeDefined()
      expect(authorRel?.isManyToOne).toBe(true)
      expect(authorRel?.isOneToOne).toBe(false)
      expect(authorRel?.isOneToMany).toBe(false)
      expect(authorRel?.isManyToMany).toBe(false)
    })

    it('should classify unidirectional 1:M relation', () => {
      const model = createMockModel({
        name: 'Author',
        fields: [
          createMockField({ name: 'id', type: 'Int', isId: true }),
          createMockField({ name: 'posts', type: 'Post', kind: 'object', isList: true })
        ]
      })
      const postModel = createMockModel({
        name: 'Post',
        fields: [
          createMockField({ name: 'id', type: 'Int', isId: true })
        ]
      })
      const schema = createMockSchema([model, postModel])
      const analysis = analyzeModelUnified(model, schema)
      
      const postsRel = analysis.relationships[0]
      expect(postsRel.isOneToMany).toBe(true)
      expect(postsRel.isManyToOne).toBe(false)
    })
  })

  describe('Relationship Classification', () => {
    it('should correctly identify 1:1 relationship', () => {
      const userModel = createMockModel({
        name: 'User',
        fields: [
          createMockField({ name: 'id', type: 'Int', isId: true }),
          createMockField({ 
            name: 'profile', 
            type: 'Profile', 
            kind: 'object',
            relationFromFields: ['profileId'],
            relationToFields: ['id']
          }),
          createMockField({ name: 'profileId', type: 'Int', isUnique: true })
        ]
      })
      
      const profileModel = createMockModel({
        name: 'Profile',
        fields: [
          createMockField({ name: 'id', type: 'Int', isId: true }),
          createMockField({ 
            name: 'user', 
            type: 'User', 
            kind: 'object'
          })
        ]
      })
      
      const schema = createMockSchema([userModel, profileModel])
      const analysis = analyzeModelUnified(userModel, schema)
      
      const profileRel = analysis.relationships[0]
      expect(profileRel.isOneToOne).toBe(true)
      expect(profileRel.isManyToOne).toBe(false)
    })

    it('should correctly identify M:N relationship', () => {
      const schema = createMockSchema([POST_TAG_JUNCTION_MODEL, BLOG_POST_MODEL, CATEGORY_MODEL])
      const analysis = analyzeModelUnified(POST_TAG_JUNCTION_MODEL, schema)
      
      expect(analysis.relationships.length).toBe(2)
      analysis.relationships.forEach(rel => {
        expect(rel.isManyToMany).toBe(false) // Junction table side is M:1
        expect(rel.isManyToOne).toBe(true)
      })
    })
  })

  describe('Junction Table Detection', () => {
    it('should detect classic composite-PK junction table', () => {
      const schema = createMockSchema([POST_TAG_JUNCTION_MODEL, BLOG_POST_MODEL, CATEGORY_MODEL])
      const analysis = analyzeModelUnified(POST_TAG_JUNCTION_MODEL, schema)
      
      expect(analysis.isJunctionTable).toBe(true)
    })

    it('should detect junction table with audit fields', () => {
      const schema = createMockSchema([JUNCTION_WITH_AUDIT_MODEL, BLOG_POST_MODEL, CATEGORY_MODEL])
      const analysis = analyzeModelUnified(JUNCTION_WITH_AUDIT_MODEL, schema)
      
      expect(analysis.isJunctionTable).toBe(true)
    })

    it('should not classify regular models as junction tables', () => {
      const schema = createMockSchema([BLOG_POST_MODEL])
      const analysis = analyzeModelUnified(BLOG_POST_MODEL, schema)
      
      expect(analysis.isJunctionTable).toBe(false)
    })

    it('should use custom systemFieldNames config', () => {
      const model = createMockModel({
        name: 'UserRole',
        fields: [
          createMockField({ name: 'userId', type: 'Int', isId: true }),
          createMockField({ name: 'roleId', type: 'Int', isId: true }),
          createMockField({ name: 'user', type: 'User', kind: 'object', relationFromFields: ['userId'] }),
          createMockField({ name: 'role', type: 'Role', kind: 'object', relationFromFields: ['roleId'] }),
          createMockField({ name: 'customAuditField', type: 'DateTime' })
        ],
        primaryKey: { fields: ['userId', 'roleId'] }
      })
      
      const schema = createMockSchema([model])
      
      // Without custom config - not detected as junction (has extra field)
      const analysis1 = analyzeModelUnified(model, schema)
      expect(analysis1.isJunctionTable).toBe(false)
      
      // With custom config - detected as junction
      const analysis2 = analyzeModelUnified(model, schema, {
        systemFieldNames: ['createdAt', 'updatedAt', 'deletedAt', 'customAuditField']
      })
      expect(analysis2.isJunctionTable).toBe(true)
    })
  })

  describe('Auto-Include Behavior', () => {
    it('should auto-include M:1 relations by default', () => {
      const schema = createMockSchema([UNIDIRECTIONAL_MODEL, USER_MODEL])
      const analysis = analyzeModelUnified(UNIDIRECTIONAL_MODEL, schema)
      
      expect(analysis.autoIncludeRelations.length).toBe(1)
      expect(analysis.autoIncludeRelations[0].field.name).toBe('author')
    })

    it('should not auto-include when disabled', () => {
      const schema = createMockSchema([UNIDIRECTIONAL_MODEL, USER_MODEL])
      const analysis = analyzeModelUnified(UNIDIRECTIONAL_MODEL, schema, {
        autoIncludeManyToOne: false
      })
      
      expect(analysis.autoIncludeRelations.length).toBe(0)
    })

    it('should only auto-include required FKs when configured', () => {
      const model = createMockModel({
        name: 'Post',
        fields: [
          createMockField({ name: 'id', type: 'Int', isId: true }),
          // Required relation
          createMockField({ name: 'authorId', type: 'Int', isRequired: true }),
          createMockField({ 
            name: 'author', 
            type: 'User', 
            kind: 'object',
            relationFromFields: ['authorId']
          }),
          // Optional relation
          createMockField({ name: 'editorId', type: 'Int', isRequired: false }),
          createMockField({ 
            name: 'editor', 
            type: 'User', 
            kind: 'object',
            relationFromFields: ['editorId']
          })
        ]
      })
      
      const userModel = createMockModel({
        name: 'User',
        fields: [
          createMockField({ name: 'id', type: 'Int', isId: true }),
          createMockField({ name: 'authored', type: 'Post', kind: 'object', isList: true }),
          createMockField({ name: 'edited', type: 'Post', kind: 'object', isList: true })
        ]
      })
      
      const schema = createMockSchema([model, userModel])
      
      // Default: both included
      const analysis1 = analyzeModelUnified(model, schema)
      expect(analysis1.autoIncludeRelations.length).toBe(2)
      
      // Required only: only author included
      const analysis2 = analyzeModelUnified(model, schema, {
        autoIncludeRequiredOnly: true
      })
      expect(analysis2.autoIncludeRelations.length).toBe(1)
      expect(analysis2.autoIncludeRelations[0].field.name).toBe('author')
    })
  })

  describe('Special Field Detection', () => {
    it('should detect normalized field names', () => {
      const model = createMockModel({
        name: 'Post',
        fields: [
          createMockField({ name: 'id', type: 'Int', isId: true }),
          createMockField({ name: 'is_published', type: 'Boolean' }),
          createMockField({ name: 'deleted-at', type: 'DateTime' }),
          createMockField({ name: 'view.count', type: 'Int' })
        ]
      })
      const schema = createMockSchema([model])
      const analysis = analyzeModelUnified(model, schema)
      
      expect(analysis.specialFields.published).toBeDefined()
      expect(analysis.specialFields.deletedAt).toBeDefined()
      expect(analysis.specialFields.views).toBeDefined()
    })

    it('should detect slug in composite unique index', () => {
      const model = createMockModel({
        name: 'Post',
        fields: [
          createMockField({ name: 'id', type: 'Int', isId: true }),
          createMockField({ name: 'slug', type: 'String', isUnique: false }),
          createMockField({ name: 'tenantId', type: 'Int' })
        ],
        uniqueFields: [['slug', 'tenantId']]
      })
      const schema = createMockSchema([model])
      const analysis = analyzeModelUnified(model, schema)
      
      expect(analysis.specialFields.slug).toBeDefined()
      expect(analysis.capabilities.hasFindBySlug).toBe(true)
    })

    it('should support Decimal counters', () => {
      const model = createMockModel({
        name: 'Post',
        fields: [
          createMockField({ name: 'id', type: 'Int', isId: true }),
          createMockField({ name: 'viewCount', type: 'Decimal' }),
          createMockField({ name: 'likes', type: 'Decimal' })
        ]
      })
      const schema = createMockSchema([model])
      const analysis = analyzeModelUnified(model, schema)
      
      expect(analysis.specialFields.views).toBeDefined()
      expect(analysis.specialFields.likes).toBeDefined()
    })
  })

  describe('Sensitive Field Exclusion', () => {
    it('should exclude sensitive fields from search by default', () => {
      const model = createMockModel({
        name: 'User',
        fields: [
          createMockField({ name: 'id', type: 'Int', isId: true }),
          createMockField({ name: 'email', type: 'String' }),
          createMockField({ name: 'password', type: 'String' }),
          createMockField({ name: 'apiKey', type: 'String' }),
          createMockField({ name: 'secret_token', type: 'String' })
        ]
      })
      const schema = createMockSchema([model])
      const analysis = analyzeModelUnified(model, schema)
      
      expect(analysis.capabilities.searchFields).toEqual(['email'])
      expect(analysis.capabilities.searchFields).not.toContain('password')
      expect(analysis.capabilities.searchFields).not.toContain('apiKey')
      expect(analysis.capabilities.searchFields).not.toContain('secret_token')
    })

    it('should include sensitive fields when exclusion disabled', () => {
      const model = createMockModel({
        name: 'User',
        fields: [
          createMockField({ name: 'id', type: 'Int', isId: true }),
          createMockField({ name: 'password', type: 'String' })
        ]
      })
      const schema = createMockSchema([model])
      const analysis = analyzeModelUnified(model, schema, {
        excludeSensitiveSearchFields: false
      })
      
      expect(analysis.capabilities.searchFields).toContain('password')
    })
  })

  describe('Parent/Child Detection', () => {
    it('should detect self-referential relations', () => {
      const schema = createMockSchema([SELF_REF_CATEGORY_MODEL])
      const analysis = analyzeModelUnified(SELF_REF_CATEGORY_MODEL, schema)
      
      expect(analysis.capabilities.hasParentChild).toBe(true)
    })

    it('should support custom parent patterns', () => {
      const model = createMockModel({
        name: 'Node',
        fields: [
          createMockField({ name: 'id', type: 'Int', isId: true }),
          createMockField({ name: 'ancestorId', type: 'Int' }),
          createMockField({ 
            name: 'ancestor', 
            type: 'Node', 
            kind: 'object',
            relationFromFields: ['ancestorId']
          })
        ]
      })
      const schema = createMockSchema([model])
      
      // Default pattern doesn't include 'ancestor'
      const analysis1 = analyzeModelUnified(model, schema)
      expect(analysis1.capabilities.hasParentChild).toBe(false)
      
      // Custom pattern includes 'ancestor'
      const analysis2 = analyzeModelUnified(model, schema, {
        parentFieldPatterns: /^(parent|ancestor|root)/i
      })
      expect(analysis2.capabilities.hasParentChild).toBe(true)
    })
  })

  describe('Error Collection Mode', () => {
    it('should throw on missing target model by default', () => {
      const model = createMockModel({
        name: 'Post',
        fields: [
          createMockField({ name: 'id', type: 'Int', isId: true }),
          createMockField({ name: 'author', type: 'MissingUser', kind: 'object' })
        ]
      })
      const schema = createMockSchema([model])
      
      expect(() => analyzeModelUnified(model, schema)).toThrow(/MissingUser/)
    })

    it('should collect errors instead of throwing when configured', () => {
      const model = createMockModel({
        name: 'Post',
        fields: [
          createMockField({ name: 'id', type: 'Int', isId: true }),
          createMockField({ name: 'author', type: 'MissingUser', kind: 'object' }),
          createMockField({ name: 'editor', type: 'MissingEditor', kind: 'object' })
        ]
      })
      const schema = createMockSchema([model])
      
      const analysis = analyzeModelUnified(model, schema, { collectErrors: true })
      
      expect(analysis.errors).toBeDefined()
      expect(analysis.errors?.length).toBe(2)
      expect(analysis.errors?.[0].field).toBe('author')
      expect(analysis.errors?.[1].field).toBe('editor')
      expect(analysis.relationships.length).toBe(0) // Broken relations filtered out
    })
  })

  describe('Foreign Key Information', () => {
    it('should include self-referential FKs', () => {
      const schema = createMockSchema([SELF_REF_CATEGORY_MODEL])
      const analysis = analyzeModelUnified(SELF_REF_CATEGORY_MODEL, schema)
      
      const parentFK = analysis.capabilities.foreignKeys.find(fk => fk.relationAlias === 'parent')
      expect(parentFK).toBeDefined()
      expect(parentFK?.fieldNames).toEqual(['parentId'])
      expect(parentFK?.relatedModel).toBe('Category')
    })

    it('should handle composite foreign keys', () => {
      const model = createMockModel({
        name: 'OrderItem',
        fields: [
          createMockField({ name: 'id', type: 'Int', isId: true }),
          createMockField({ name: 'orderId', type: 'Int' }),
          createMockField({ name: 'productId', type: 'Int' }),
          createMockField({ 
            name: 'productVariant', 
            type: 'ProductVariant', 
            kind: 'object',
            relationFromFields: ['orderId', 'productId']
          })
        ]
      })
      const schema = createMockSchema([model])
      const analysis = analyzeModelUnified(model, schema)
      
      const fk = analysis.capabilities.foreignKeys[0]
      expect(fk.fieldNames).toEqual(['orderId', 'productId'])
    })

    it('should provide relationName and relationAlias', () => {
      const model = createMockModel({
        name: 'Post',
        fields: [
          createMockField({ name: 'id', type: 'Int', isId: true }),
          createMockField({ name: 'authorId', type: 'Int' }),
          createMockField({ 
            name: 'author', 
            type: 'User', 
            kind: 'object',
            relationFromFields: ['authorId'],
            relationName: 'UserPosts'
          })
        ]
      })
      const schema = createMockSchema([model])
      const analysis = analyzeModelUnified(model, schema)
      
      const fk = analysis.capabilities.foreignKeys[0]
      expect(fk.relationAlias).toBe('author')
      expect(fk.relationName).toBe('UserPosts')
    })
  })
})

describe('generateIncludeObject', () => {
  it('should return null when no auto-include relations', () => {
    const model = createMockModel({ name: 'User', fields: [
      createMockField({ name: 'id', type: 'Int', isId: true })
    ]})
    const schema = createMockSchema([model])
    const analysis = analyzeModelUnified(model, schema)
    
    const result = generateIncludeObject(analysis)
    expect(result).toBeNull()
  })

  it('should return include object for auto-include relations', () => {
    const schema = createMockSchema([UNIDIRECTIONAL_MODEL, USER_MODEL])
    const analysis = analyzeModelUnified(UNIDIRECTIONAL_MODEL, schema)
    
    const result = generateIncludeObject(analysis)
    expect(result).toEqual({ author: true })
  })

  it('should handle multiple auto-include relations', () => {
    const model = createMockModel({
      name: 'Post',
      fields: [
        createMockField({ name: 'id', type: 'Int', isId: true }),
        createMockField({ name: 'authorId', type: 'Int' }),
        createMockField({ name: 'categoryId', type: 'Int' }),
        createMockField({ 
          name: 'author', 
          type: 'User', 
          kind: 'object',
          relationFromFields: ['authorId']
        }),
        createMockField({ 
          name: 'category', 
          type: 'Category', 
          kind: 'object',
          relationFromFields: ['categoryId']
        })
      ]
    })
    
    const userModel = createMockModel({ name: 'User', fields: [
      createMockField({ name: 'id', type: 'Int', isId: true }),
      createMockField({ name: 'posts', type: 'Post', kind: 'object', isList: true })
    ]})
    
    const categoryModel = createMockModel({ name: 'Category', fields: [
      createMockField({ name: 'id', type: 'Int', isId: true }),
      createMockField({ name: 'posts', type: 'Post', kind: 'object', isList: true })
    ]})
    
    const schema = createMockSchema([model, userModel, categoryModel])
    const analysis = analyzeModelUnified(model, schema)
    
    const result = generateIncludeObject(analysis)
    expect(result).toEqual({ author: true, category: true })
  })
})

describe('generateSummaryInclude (deprecated)', () => {
  it('should return empty string when no relations', () => {
    const model = createMockModel({ name: 'User', fields: [
      createMockField({ name: 'id', type: 'Int', isId: true })
    ]})
    const schema = createMockSchema([model])
    const analysis = analyzeModelUnified(model, schema)
    
    const result = generateSummaryInclude(analysis)
    expect(result).toBe('')
  })

  it('should generate default format with leading comma', () => {
    const schema = createMockSchema([UNIDIRECTIONAL_MODEL, USER_MODEL])
    const analysis = analyzeModelUnified(UNIDIRECTIONAL_MODEL, schema)
    
    const result = generateSummaryInclude(analysis)
    expect(result).toContain(',')
    expect(result).toContain('include: {')
    expect(result).toContain('author: true')
  })

  it('should generate standalone format', () => {
    const schema = createMockSchema([UNIDIRECTIONAL_MODEL, USER_MODEL])
    const analysis = analyzeModelUnified(UNIDIRECTIONAL_MODEL, schema)
    
    const result = generateSummaryInclude(analysis, { standalone: true })
    expect(result).not.toStartWith(',')
    expect(result).toStartWith('include: {')
  })
})

describe('Critical Fix: Back-Reference Pairing', () => {
  it('should correctly pair multiple relations without relationName using FK fields', () => {
    const postModel = createMockModel({
      name: 'Post',
      fields: [
        createMockField({ name: 'id', type: 'Int', isId: true }),
        createMockField({ name: 'authorId', type: 'Int' }),
        createMockField({ 
          name: 'author', 
          type: 'User', 
          kind: 'object',
          relationFromFields: ['authorId'],
          relationToFields: ['id'],
          relationName: undefined  // No explicit name
        }),
        createMockField({ name: 'editorId', type: 'Int' }),
        createMockField({ 
          name: 'editor', 
          type: 'User', 
          kind: 'object',
          relationFromFields: ['editorId'],
          relationToFields: ['id'],
          relationName: undefined  // No explicit name
        })
      ]
    })
    
    const userModel = createMockModel({
      name: 'User',
      fields: [
        createMockField({ name: 'id', type: 'Int', isId: true }),
        createMockField({ 
          name: 'authoredPosts', 
          type: 'Post', 
          kind: 'object',
          isList: true,
          relationToFields: ['authorId'],  // References author relation
          relationName: undefined
        }),
        createMockField({ 
          name: 'editedPosts', 
          type: 'Post', 
          kind: 'object',
          isList: true,
          relationToFields: ['editorId'],  // References editor relation
          relationName: undefined
        })
      ]
    })
    
    const schema = createMockSchema([postModel, userModel])
    const analysis = analyzeModelUnified(postModel, schema)
    
    // Should have found correct back-references
    expect(analysis.relationships.length).toBe(2)
    
    const authorRel = analysis.relationships.find(r => r.field.name === 'author')
    const editorRel = analysis.relationships.find(r => r.field.name === 'editor')
    
    expect(authorRel).toBeDefined()
    expect(editorRel).toBeDefined()
    expect(authorRel?.isManyToOne).toBe(true)
    expect(editorRel?.isManyToOne).toBe(true)
  })
})

describe('Critical Fix: Custom Auto-Include Hook', () => {
  it('should use custom shouldAutoInclude hook when provided', () => {
    const model = createMockModel({
      name: 'Post',
      fields: [
        createMockField({ name: 'id', type: 'Int', isId: true }),
        createMockField({ name: 'authorId', type: 'Int', isRequired: true }),
        createMockField({ 
          name: 'author', 
          type: 'User', 
          kind: 'object',
          relationFromFields: ['authorId']
        }),
        createMockField({ name: 'categoryId', type: 'Int', isRequired: true }),
        createMockField({ 
          name: 'category', 
          type: 'Category', 
          kind: 'object',
          relationFromFields: ['categoryId']
        })
      ]
    })
    
    const userModel = createMockModel({
      name: 'User',
      fields: [
        createMockField({ name: 'id', type: 'Int', isId: true }),
        createMockField({ name: 'posts', type: 'Post', kind: 'object', isList: true })
      ]
    })
    
    const categoryModel = createMockModel({
      name: 'Category',
      fields: [
        createMockField({ name: 'id', type: 'Int', isId: true }),
        createMockField({ name: 'posts', type: 'Post', kind: 'object', isList: true })
      ]
    })
    
    const schema = createMockSchema([model, userModel, categoryModel])
    
    // Custom hook: only include 'author', not 'category'
    const analysis = analyzeModelUnified(model, schema, {
      shouldAutoInclude: (rel, model) => rel.field.name === 'author'
    })
    
    expect(analysis.autoIncludeRelations.length).toBe(1)
    expect(analysis.autoIncludeRelations[0].field.name).toBe('author')
  })
})

describe('Critical Fix: Unidirectional M:N Detection', () => {
  it('should not classify list to junction table as 1:M', () => {
    const userModel = createMockModel({
      name: 'User',
      fields: [
        createMockField({ name: 'id', type: 'Int', isId: true }),
        createMockField({ 
          name: 'userRoles', 
          type: 'UserRole', 
          kind: 'object',
          isList: true
          // No back-reference
        })
      ]
    })
    
    const junctionModel = createMockModel({
      name: 'UserRole',
      fields: [
        createMockField({ name: 'userId', type: 'Int', isId: true }),
        createMockField({ name: 'roleId', type: 'Int', isId: true }),
        createMockField({ name: 'user', type: 'User', kind: 'object', relationFromFields: ['userId'] }),
        createMockField({ name: 'role', type: 'Role', kind: 'object', relationFromFields: ['roleId'] })
      ],
      primaryKey: { fields: ['userId', 'roleId'] }
    })
    
    const schema = createMockSchema([userModel, junctionModel])
    const analysis = analyzeModelUnified(userModel, schema)
    
    const userRolesRel = analysis.relationships[0]
    
    // Should NOT be classified as 1:M (ambiguous M:N)
    expect(userRolesRel.isOneToMany).toBe(false)
    expect(userRolesRel.isManyToMany).toBe(false)
    expect(userRolesRel.isManyToOne).toBe(false)
    expect(userRolesRel.isOneToOne).toBe(false)
  })
})

describe('Enhanced Sensitive Field Patterns', () => {
  it('should exclude additional sensitive fields', () => {
    const model = createMockModel({
      name: 'User',
      fields: [
        createMockField({ name: 'id', type: 'Int', isId: true }),
        createMockField({ name: 'email', type: 'String' }),
        createMockField({ name: 'credential', type: 'String' }),
        createMockField({ name: 'authCode', type: 'String' }),
        createMockField({ name: 'refresh_token', type: 'String' })
      ]
    })
    const schema = createMockSchema([model])
    const analysis = analyzeModelUnified(model, schema)
    
    expect(analysis.capabilities.searchFields).toEqual(['email'])
    expect(analysis.capabilities.searchFields).not.toContain('credential')
    expect(analysis.capabilities.searchFields).not.toContain('authCode')
    expect(analysis.capabilities.searchFields).not.toContain('refresh_token')
  })
})


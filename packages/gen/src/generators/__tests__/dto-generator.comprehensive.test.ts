/**
 * DTO Generator - Comprehensive Tests
 * Uses new test utilities for better coverage
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { DTOGenerator } from '../dto-generator-v2.js'
import {
  models,
  field,
  ModelBuilder,
  FieldBuilder,
  assertIncludes,
  assertExcludes,
  assertValidTypeScript,
  extractImports,
  extractExports,
  normalizeGenerated,
  minimalSnapshot
} from '../../__tests__/index.js'
import { createMockModel } from './fixtures.js'

describe('DTOGenerator - Comprehensive Tests', () => {
  describe('Basic DTO Generation', () => {
    let generator: DTOGenerator

    beforeEach(() => {
      generator = new DTOGenerator({ model: models.todo() })
    })

    it('should generate all four DTO types', () => {
      const output = generator.generate()

      expect(output.files.size).toBe(4)
      expect(output.files.has('todo.create.dto.ts')).toBe(true)
      expect(output.files.has('todo.update.dto.ts')).toBe(true)
      expect(output.files.has('todo.read.dto.ts')).toBe(true)
      expect(output.files.has('todo.query.dto.ts')).toBe(true)
    })

    it('should generate valid TypeScript', () => {
      const output = generator.generate()

      output.files.forEach((content, filename) => {
        assertValidTypeScript(content)
      })
    })

    it('should include generation markers', () => {
      const output = generator.generate()

      output.files.forEach((content) => {
        expect(content).toContain('// @generated')
      })
    })

    it('should export correct DTO names', () => {
      const exports = generator.getExports()

      expect(exports).toEqual([
        'TodoCreateDTO',
        'TodoUpdateDTO',
        'TodoReadDTO',
        'TodoQueryDTO',
        'TodoListResponse'
      ])
    })
  })

  describe('CreateDTO Generation', () => {
    it('should include only createable fields', () => {
      const model = new ModelBuilder()
        .name('Article')
        .withIntId()
        .addField(field.string('title'))
        .addField(field.string('content', false))
        .addField(field.boolean('published', false))
        .withTimestamps()
        .build()

      const generator = new DTOGenerator({ model })
      const createDto = generator.generateCreate()

      assertIncludes(createDto, [
        'export interface ArticleCreateDTO',
        'title: string',
        'content?: string | null',
        'published?: boolean'
      ])

      assertExcludes(createDto, [
        'id:',
        'createdAt:',
        'updatedAt:'
      ])
    })

    it('should handle required fields correctly', () => {
      const model = new ModelBuilder()
        .name('Product')
        .withIntId()
        .addField(field.string('sku'))
        .addField(field.string('name'))
        .addField(field.int('price'))
        .build()

      const generator = new DTOGenerator({ model })
      const createDto = generator.generateCreate()

      // Required fields should NOT have ?
      expect(createDto).toMatch(/sku: string(?!\?)/)
      expect(createDto).toMatch(/name: string(?!\?)/)
      expect(createDto).toMatch(/price: number(?!\?)/)
    })

    it('should handle optional fields correctly', () => {
      const model = new ModelBuilder()
        .name('User')
        .withStringId()
        .addField(field.string('email'))
        .addField(field.string('nickname', false))
        .addField(field.string('bio', false))
        .build()

      const generator = new DTOGenerator({ model })
      const createDto = generator.generateCreate()

      assertIncludes(createDto, [
        'email: string',
        'nickname?: string | null',
        'bio?: string | null'
      ])
    })

    it('should handle default values', () => {
      const model = new ModelBuilder()
        .name('Setting')
        .withIntId()
        .addField(field.string('key'))
        .addField(field.boolean('enabled', true))
        .addField(field.int('maxRetries', false))
        .build()

      const generator = new DTOGenerator({ model })
      const createDto = generator.generateCreate()

      // Fields with defaults should be optional
      expect(createDto).toContain('enabled?: boolean')
    })

    it('should exclude relation fields', () => {
      const model = new ModelBuilder()
        .name('Post')
        .withIntId()
        .addField(field.string('title'))
        .addField(field.string('authorId'))
        .addField(field.relation('author', 'User'))
        .addField(field.relation('comments', 'Comment', true))
        .build()

      const generator = new DTOGenerator({ model })
      const createDto = generator.generateCreate()

      assertIncludes(createDto, ['title: string', 'authorId: string'])
      assertExcludes(createDto, ['author:', 'comments:'])
    })
  })

  describe('UpdateDTO Generation', () => {
    it('should make all fields optional', () => {
      const model = models.todo()
      const generator = new DTOGenerator({ model })
      const updateDto = generator.generateUpdate()

      assertIncludes(updateDto, [
        'export interface TodoUpdateDTO',
        'title?: string',
        'completed?: boolean',
        'description?: string | null'
      ])
    })

    it('should exclude readonly fields', () => {
      const model = new ModelBuilder()
        .name('Post')
        .withIntId()
        .addField(field.string('title'))
        .addField(field.datetime('publishedAt', false))
        .withTimestamps()
        .build()

      const generator = new DTOGenerator({ model })
      const updateDto = generator.generateUpdate()

      assertIncludes(updateDto, [
        'title?: string',
        'publishedAt?: Date'
      ])

      assertExcludes(updateDto, [
        'id:',
        'createdAt:',
        'updatedAt:'
      ])
    })

    it('should include all updateable field types', () => {
      const model = new ModelBuilder()
        .name('TestModel')
        .withIntId()
        .addField(field.string('stringField'))
        .addField(field.int('intField'))
        .addField(field.boolean('boolField'))
        .addField(
          new FieldBuilder()
            .name('floatField')
            .type('Float')
            .scalar()
            .required()
            .build()
        )
        .addField(field.datetime('dateField'))
        .build()

      const generator = new DTOGenerator({ model })
      const updateDto = generator.generateUpdate()

      assertIncludes(updateDto, [
        'stringField?: string',
        'intField?: number',
        'boolField?: boolean',
        'floatField?: number',
        'dateField?: Date'
      ])
    })
  })

  describe('ReadDTO Generation', () => {
    it('should include all scalar fields', () => {
      const model = models.todo()
      const generator = new DTOGenerator({ model })
      const readDto = generator.generateRead()

      assertIncludes(readDto, [
        'export interface TodoReadDTO',
        'id: number',
        'title: string',
        'completed: boolean',
        'description?: string',
        'createdAt: Date',
        'updatedAt: Date'
      ])
    })

    it('should exclude relation fields', () => {
      const model = models.post()
      const generator = new DTOGenerator({ model })
      const readDto = generator.generateRead()

      assertIncludes(readDto, [
        'id: number',
        'title: string',
        'authorId: string'
      ])

      assertExcludes(readDto, ['author:', 'comments:'])
    })

    it('should handle nullable fields correctly', () => {
      const model = new ModelBuilder()
        .name('Profile')
        .withIntId()
        .addField(field.string('userId'))
        .addField(field.string('avatar', false))
        .addField(field.string('bio', false))
        .addField(field.int('age', false))
        .build()

      const generator = new DTOGenerator({ model })
      const readDto = generator.generateRead()

      assertIncludes(readDto, [
        'userId: string',
        'avatar?: string',
        'bio?: string',
        'age?: number'
      ])
    })
  })

  describe('QueryDTO Generation', () => {
    it('should include pagination fields', () => {
      const model = models.todo()
      const generator = new DTOGenerator({ model })
      const queryDto = generator.generateQuery()

      assertIncludes(queryDto, [
        'export interface TodoQueryDTO',
        'skip?: number',
        'take?: number'
      ])
    })

    it('should include where clause', () => {
      const model = models.todo()
      const generator = new DTOGenerator({ model })
      const queryDto = generator.generateQuery()

      expect(queryDto).toContain('where?:')
      expect(queryDto).toContain('title?:')
    })

    it('should include orderBy', () => {
      const model = models.todo()
      const generator = new DTOGenerator({ model })
      const queryDto = generator.generateQuery()

      expect(queryDto).toContain('orderBy?:')
    })

    it('should include include for relations', () => {
      const model = models.post()
      const generator = new DTOGenerator({ model })
      const queryDto = generator.generateQuery()

      expect(queryDto).toContain('include?:')
    })

    it('should include select for field selection', () => {
      const model = models.todo()
      const generator = new DTOGenerator({ model })
      const queryDto = generator.generateQuery()

      expect(queryDto).toContain('select?:')
    })

    it('should generate string filter operators', () => {
      const model = new ModelBuilder()
        .name('Article')
        .withIntId()
        .addField(field.string('title'))
        .addField(field.string('slug'))
        .build()

      const generator = new DTOGenerator({ model })
      const queryDto = generator.generateQuery()

      assertIncludes(queryDto, [
        'title?:',
        'equals?: string',
        'contains?: string',
        'startsWith?: string',
        'endsWith?: string'
      ])
    })

    it('should generate numeric filter operators', () => {
      const model = new ModelBuilder()
        .name('Product')
        .withIntId()
        .addField(field.string('name'))
        .addField(field.int('price'))
        .addField(field.int('stock'))
        .build()

      const generator = new DTOGenerator({ model })
      const queryDto = generator.generateQuery()

      assertIncludes(queryDto, [
        'price?:',
        'equals?: number',
        'gt?: number',
        'gte?: number',
        'lt?: number',
        'lte?: number'
      ])
    })

    it('should generate DateTime filter operators', () => {
      const model = new ModelBuilder()
        .name('Event')
        .withIntId()
        .addField(field.string('name'))
        .addField(field.datetime('startDate'))
        .addField(field.datetime('endDate', false))
        .build()

      const generator = new DTOGenerator({ model })
      const queryDto = generator.generateQuery()

      assertIncludes(queryDto, [
        'startDate?:',
        'equals?: Date',
        'gt?: Date',
        'gte?: Date',
        'lt?: Date',
        'lte?: Date'
      ])
    })

    it('should generate List Response interface', () => {
      const model = models.todo()
      const generator = new DTOGenerator({ model })
      const queryDto = generator.generateQuery()

      assertIncludes(queryDto, [
        'export interface TodoListResponse',
        'data: TodoReadDTO[]',
        'meta:',
        'total: number',
        'skip: number',
        'take: number',
        'hasMore: boolean'
      ])
    })

    it('should include orderBy for all scalar fields', () => {
      const model = new ModelBuilder()
        .name('Article')
        .withIntId()
        .addField(field.string('title'))
        .addField(field.int('views'))
        .addField(field.datetime('publishedAt'))
        .build()

      const generator = new DTOGenerator({ model })
      const queryDto = generator.generateQuery()

      assertIncludes(queryDto, [
        "title?: 'asc' | 'desc'",
        "views?: 'asc' | 'desc'",
        "publishedAt?: 'asc' | 'desc'"
      ])
    })

    it('should include relation orderBy', () => {
      const model = models.post()
      const generator = new DTOGenerator({ model })
      const queryDto = generator.generateQuery()

      // Relation fields should have nested orderBy
      expect(queryDto).toMatch(/author\?:.*'asc' \| 'desc'/s)
    })
  })

  describe('Field Type Mapping', () => {
    it('should map String to string', () => {
      const model = new ModelBuilder()
        .name('Test')
        .withIntId()
        .addField(field.string('name'))
        .build()

      const generator = new DTOGenerator({ model })
      const readDto = generator.generateRead()

      expect(readDto).toContain('name: string')
    })

    it('should map Int to number', () => {
      const model = new ModelBuilder()
        .name('Test')
        .withIntId()
        .addField(field.int('count'))
        .build()

      const generator = new DTOGenerator({ model })
      const readDto = generator.generateRead()

      expect(readDto).toContain('count: number')
    })

    it('should map Float to number', () => {
      const model = new ModelBuilder()
        .name('Test')
        .withIntId()
        .addField(
          new FieldBuilder()
            .name('price')
            .type('Float')
            .scalar()
            .required()
            .build()
        )
        .build()

      const generator = new DTOGenerator({ model })
      const readDto = generator.generateRead()

      expect(readDto).toContain('price: number')
    })

    it('should map Boolean to boolean', () => {
      const model = new ModelBuilder()
        .name('Test')
        .withIntId()
        .addField(field.boolean('active'))
        .build()

      const generator = new DTOGenerator({ model })
      const readDto = generator.generateRead()

      expect(readDto).toContain('active: boolean')
    })

    it('should map DateTime to Date', () => {
      const model = new ModelBuilder()
        .name('Test')
        .withIntId()
        .addField(field.datetime('createdAt'))
        .build()

      const generator = new DTOGenerator({ model })
      const readDto = generator.generateRead()

      expect(readDto).toContain('createdAt: Date')
    })

    it('should map Json to Record<string, any>', () => {
      const model = new ModelBuilder()
        .name('Test')
        .withIntId()
        .addField(
          new FieldBuilder()
            .name('metadata')
            .type('Json')
            .scalar()
            .required()
            .build()
        )
        .build()

      const generator = new DTOGenerator({ model })
      const readDto = generator.generateRead()

      expect(readDto).toContain('metadata: Record<string, any>')
    })

    it('should handle array types', () => {
      const model = new ModelBuilder()
        .name('Test')
        .withIntId()
        .addField(
          new FieldBuilder()
            .name('tags')
            .type('String')
            .scalar()
            .list()
            .required()
            .build()
        )
        .build()

      const generator = new DTOGenerator({ model })
      const readDto = generator.generateRead()

      expect(readDto).toContain('tags: string[]')
    })
  })

  describe('Enum Handling', () => {
    it('should import enums from @prisma/client', () => {
      const model = new ModelBuilder()
        .name('Post')
        .withIntId()
        .addField(field.string('title'))
        .addField(
          new FieldBuilder()
            .name('status')
            .type('PostStatus')
            .enum()
            .required()
            .build()
        )
        .build()

      const generator = new DTOGenerator({ model })
      const createDto = generator.generateCreate()

      expect(createDto).toContain(
        "import type { PostStatus } from '@prisma/client'"
      )
    })

    it('should use enum types in DTOs', () => {
      const model = new ModelBuilder()
        .name('User')
        .withIntId()
        .addField(field.string('email'))
        .addField(
          new FieldBuilder()
            .name('role')
            .type('UserRole')
            .enum()
            .required()
            .build()
        )
        .build()

      const generator = new DTOGenerator({ model })
      const createDto = generator.generateCreate()

      expect(createDto).toContain('role: UserRole')
    })

    it('should import multiple enums', () => {
      const model = new ModelBuilder()
        .name('Order')
        .withIntId()
        .addField(
          new FieldBuilder()
            .name('status')
            .type('OrderStatus')
            .enum()
            .required()
            .build()
        )
        .addField(
          new FieldBuilder()
            .name('paymentMethod')
            .type('PaymentMethod')
            .enum()
            .required()
            .build()
        )
        .build()

      const generator = new DTOGenerator({ model })
      const imports = generator.getImports()

      expect(imports.length).toBeGreaterThan(0)
      expect(imports[0]).toContain('OrderStatus')
      expect(imports[0]).toContain('PaymentMethod')
    })
  })

  describe('Edge Cases', () => {
    it('should handle model with only ID field', () => {
      const model = new ModelBuilder()
        .name('MinimalModel')
        .withIntId()
        .build()

      const generator = new DTOGenerator({ model })
      const createDto = generator.generateCreate()

      expect(createDto).toContain('export interface MinimalModelCreateDTO')
      assertValidTypeScript(createDto)
    })

    it('should handle model with no optional fields', () => {
      const model = new ModelBuilder()
        .name('RequiredModel')
        .withIntId()
        .addField(field.string('field1'))
        .addField(field.string('field2'))
        .addField(field.int('field3'))
        .build()

      const generator = new DTOGenerator({ model })
      const createDto = generator.generateCreate()

      // No fields should have ?
      expect(createDto).not.toMatch(/field\d\?:/)
    })

    it('should handle model with all optional fields', () => {
      const model = new ModelBuilder()
        .name('OptionalModel')
        .withIntId()
        .addField(field.string('field1', false))
        .addField(field.string('field2', false))
        .addField(field.int('field3', false))
        .build()

      const generator = new DTOGenerator({ model })
      const createDto = generator.generateCreate()

      // All fields should have ?
      expect(createDto).toMatch(/field1\?: string \| null/)
      expect(createDto).toMatch(/field2\?: string \| null/)
      expect(createDto).toMatch(/field3\?: number \| null/)
    })

    it('should handle model with no relations', () => {
      const model = models.todo()
      const generator = new DTOGenerator({ model })
      const queryDto = generator.generateQuery()

      expect(queryDto).toContain('include?: Record<string, boolean>')
    })

    it('should handle model with multiple relations', () => {
      const model = new ModelBuilder()
        .name('Post')
        .withIntId()
        .addField(field.string('title'))
        .addField(field.relation('author', 'User'))
        .addField(field.relation('category', 'Category'))
        .addField(field.relation('tags', 'Tag', true))
        .addField(field.relation('comments', 'Comment', true))
        .build()

      const generator = new DTOGenerator({ model })
      const queryDto = generator.generateQuery()

      assertIncludes(queryDto, [
        'include?:',
        'author?: boolean',
        'category?: boolean',
        'tags?: boolean',
        'comments?: boolean'
      ])
    })

    it('should handle UUID id type', () => {
      const model = models.user() // Has String ID
      const generator = new DTOGenerator({ model })
      const readDto = generator.generateRead()

      expect(readDto).toContain('id: string')
    })

    it('should handle BigInt type', () => {
      const model = new ModelBuilder()
        .name('Test')
        .withIntId()
        .addField(
          new FieldBuilder()
            .name('bigNumber')
            .type('BigInt')
            .scalar()
            .required()
            .build()
        )
        .build()

      const generator = new DTOGenerator({ model })
      const readDto = generator.generateRead()

      // BigInt maps to number in DTOs for JSON compatibility
      expect(readDto).toContain('bigNumber: number')
    })

    it('should handle Decimal type', () => {
      const model = new ModelBuilder()
        .name('Test')
        .withIntId()
        .addField(
          new FieldBuilder()
            .name('amount')
            .type('Decimal')
            .scalar()
            .required()
            .build()
        )
        .build()

      const generator = new DTOGenerator({ model })
      const readDto = generator.generateRead()

      expect(readDto).toContain('amount: number')
    })
  })

  describe('Barrel Export', () => {
    it('should generate barrel with all DTO files', () => {
      const model = models.todo()
      const generator = new DTOGenerator({ model })
      const barrel = generator.generateBarrel()

      assertIncludes(barrel, [
        '// @generated barrel',
        "export * from './todo.create.dto.js'",
        "export * from './todo.update.dto.js'",
        "export * from './todo.read.dto.js'",
        "export * from './todo.query.dto.js'"
      ])

      assertValidTypeScript(barrel)
    })
  })

  describe('Validation', () => {
    it('should validate model has ID field', () => {
      const model = createMockModel({ idField: undefined })
      const generator = new DTOGenerator({ model })
      const errors = generator.validate()

      expect(errors).toContain('Model TestModel has no @id field')
    })

    it('should return no errors for valid model', () => {
      const model = models.todo()
      const generator = new DTOGenerator({ model })
      const errors = generator.validate()

      expect(errors).toEqual([])
    })
  })

  describe('Snapshot Testing', () => {
    it('should match CreateDTO snapshot', () => {
      const model = models.todo()
      const generator = new DTOGenerator({ model })
      const createDto = generator.generateCreate()

      const normalized = normalizeGenerated(createDto)
      expect(normalized).toMatchSnapshot()
    })

    it('should match minimal snapshot structure', () => {
      const model = models.post()
      const generator = new DTOGenerator({ model })
      const output = generator.generate()

      const snapshots = Array.from(output.files.entries()).map(([filename, content]) => ({
        filename,
        snapshot: minimalSnapshot(content)
      }))

      expect(snapshots).toMatchSnapshot()
    })
  })

  describe('Metadata', () => {
    it('should include file count in metadata', () => {
      const model = models.todo()
      const generator = new DTOGenerator({ model })
      const output = generator.generate()

      expect(output.metadata?.fileCount).toBe(4)
    })

    it('should include line count in metadata', () => {
      const model = models.todo()
      const generator = new DTOGenerator({ model })
      const output = generator.generate()

      expect(output.metadata?.lineCount).toBeGreaterThan(0)
    })

    it('should track total lines across all DTOs', () => {
      const model = models.post()
      const generator = new DTOGenerator({ model })
      const output = generator.generate()

      const manualCount = Array.from(output.files.values())
        .reduce((sum, content) => sum + content.split('\n').length, 0)

      expect(output.metadata?.lineCount).toBe(manualCount)
    })
  })

  describe('Import/Export Analysis', () => {
    it('should extract imports correctly', () => {
      const model = new ModelBuilder()
        .name('Post')
        .withIntId()
        .addField(
          new FieldBuilder()
            .name('status')
            .type('PostStatus')
            .enum()
            .required()
            .build()
        )
        .build()

      const generator = new DTOGenerator({ model })
      const createDto = generator.generateCreate()

      const imports = extractImports(createDto)
      expect(imports).toContain('@prisma/client')
    })

    it('should extract exports correctly', () => {
      const model = models.todo()
      const generator = new DTOGenerator({ model })
      const createDto = generator.generateCreate()

      const exports = extractExports(createDto)
      expect(exports).toContain('TodoCreateDTO')
    })
  })

  describe('Complex Models', () => {
    it('should handle blog post model', () => {
      const model = new ModelBuilder()
        .name('BlogPost')
        .withIntId()
        .addField(field.string('title'))
        .addField(field.string('slug'))
        .addField(field.string('excerpt', false))
        .addField(field.string('content'))
        .addField(field.boolean('published', false))
        .addField(field.int('views', false))
        .addField(field.string('authorId'))
        .addField(field.relation('author', 'User'))
        .addField(field.relation('comments', 'Comment', true))
        .addField(field.relation('tags', 'Tag', true))
        .withTimestamps()
        .build()

      const generator = new DTOGenerator({ model })
      const output = generator.generate()

      expect(output.files.size).toBe(4)
      output.files.forEach((content) => {
        assertValidTypeScript(content)
      })
    })

    it('should handle e-commerce product model', () => {
      const model = new ModelBuilder()
        .name('Product')
        .withIntId()
        .addField(field.string('sku'))
        .addField(field.string('name'))
        .addField(field.string('description', false))
        .addField(
          new FieldBuilder()
            .name('price')
            .type('Decimal')
            .scalar()
            .required()
            .build()
        )
        .addField(field.int('stock'))
        .addField(field.boolean('isActive', true))
        .addField(field.boolean('isFeatured', false))
        .addField(field.relation('category', 'Category'))
        .addField(field.relation('images', 'ProductImage', true))
        .addField(field.relation('reviews', 'Review', true))
        .withTimestamps()
        .build()

      const generator = new DTOGenerator({ model })
      const output = generator.generate()

      expect(output.files.size).toBe(4)
      
      const createDto = output.files.get('product.create.dto.ts')!
      assertIncludes(createDto, [
        'sku: string',
        'name: string',
        'price: number',
        'stock: number'
      ])
    })
  })
})


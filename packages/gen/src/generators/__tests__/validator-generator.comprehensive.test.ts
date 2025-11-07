/**
 * Validator Generator - Comprehensive Tests
 * Uses new test utilities for better coverage
 * 
 * TODO: Migrate to test production validator-generator.ts (functional API)
 * These tests were for the experimental v2 class-based API (removed in consolidation)
 */

import { describe, it, expect, beforeEach } from 'vitest'
// import { ValidatorGenerator } from '../validator-generator-v2.js' // REMOVED: v2 generators consolidated
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

describe.skip('ValidatorGenerator - Comprehensive Tests (V2 API - DEPRECATED)', () => {
  // TODO: Rewrite tests for functional API (generateAllValidators from validator-generator.ts)
  describe('Basic Validator Generation', () => {
    let generator: ValidatorGenerator

    beforeEach(() => {
      generator = new ValidatorGenerator({ model: models.todo() })
    })

    it('should generate all three validator types', () => {
      const output = generator.generate()

      expect(output.files.size).toBe(3)
      expect(output.files.has('todo.create.zod.ts')).toBe(true)
      expect(output.files.has('todo.update.zod.ts')).toBe(true)
      expect(output.files.has('todo.query.zod.ts')).toBe(true)
    })

    it('should generate valid TypeScript', () => {
      const output = generator.generate()

      output.files.forEach((content) => {
        assertValidTypeScript(content)
      })
    })

    it('should include generation markers', () => {
      const output = generator.generate()

      output.files.forEach((content) => {
        expect(content).toContain('// @generated')
      })
    })

    it('should import Zod in all files', () => {
      const output = generator.generate()

      output.files.forEach((content) => {
        expect(content).toContain("import { z } from 'zod'")
      })
    })

    it('should export correct validator names', () => {
      const exports = generator.getExports()

      expect(exports).toEqual([
        'TodoCreateSchema',
        'TodoCreateInput',
        'TodoUpdateSchema',
        'TodoUpdateInput',
        'TodoQuerySchema',
        'TodoQueryInput'
      ])
    })
  })

  describe('CreateSchema Generation', () => {
    it('should include only createable fields', () => {
      const model = new ModelBuilder()
        .name('Article')
        .withIntId()
        .addField(field.string('title'))
        .addField(field.string('content', false))
        .addField(field.boolean('published', false))
        .withTimestamps()
        .build()

      const generator = new ValidatorGenerator({ model })
      const createSchema = generator.generateCreate()

      assertIncludes(createSchema, [
        'export const ArticleCreateSchema',
        'z.object({',
        'title: z.string()',
        'content:',
        'published:'
      ])

      // ID and updatedAt are excluded
      assertExcludes(createSchema, [
        'id:',
        'updatedAt:'
      ])
      
      // createdAt has default so it IS included
      expect(createSchema).toContain('createdAt:')
    })

    it('should handle required fields', () => {
      const model = new ModelBuilder()
        .name('Product')
        .withIntId()
        .addField(field.string('sku'))
        .addField(field.string('name'))
        .addField(field.int('stock'))
        .build()

      const generator = new ValidatorGenerator({ model })
      const createSchema = generator.generateCreate()

      // Required fields should NOT have .optional()
      expect(createSchema).toMatch(/sku: z\.string\(\)(?!.*optional)/)
      expect(createSchema).toMatch(/name: z\.string\(\)(?!.*optional)/)
      expect(createSchema).toMatch(/stock: z\.number\(\)(?!.*optional)/)
    })

    it('should handle optional fields', () => {
      const model = new ModelBuilder()
        .name('User')
        .withStringId()
        .addField(field.string('email'))
        .addField(field.string('nickname', false))
        .addField(field.int('age', false))
        .build()

      const generator = new ValidatorGenerator({ model })
      const createSchema = generator.generateCreate()

      assertIncludes(createSchema, [
        'email: z.string()',
        'nickname:',
        'optional()',
        'age:',
        'optional()'
      ])
    })

    it('should handle fields with defaults as optional', () => {
      const model = new ModelBuilder()
        .name('Setting')
        .withIntId()
        .addField(field.string('key'))
        .addField(field.boolean('enabled', true))
        .addField(field.int('retryCount', false))
        .build()

      const generator = new ValidatorGenerator({ model })
      const createSchema = generator.generateCreate()

      // Fields with defaults should be optional
      expect(createSchema).toContain('enabled:')
      expect(createSchema).toContain('optional()')
    })

    it('should export TypeScript type', () => {
      const model = models.todo()
      const generator = new ValidatorGenerator({ model })
      const createSchema = generator.generateCreate()

      assertIncludes(createSchema, [
        'export type TodoCreateInput',
        'z.infer<typeof TodoCreateSchema>'
      ])
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

      const generator = new ValidatorGenerator({ model })
      const createSchema = generator.generateCreate()

      assertIncludes(createSchema, [
        'title: z.string()',
        'authorId: z.string()'
      ])

      assertExcludes(createSchema, [
        'author:',
        'comments:'
      ])
    })
  })

  describe('UpdateSchema Generation', () => {
    it('should use partial of CreateSchema', () => {
      const model = models.todo()
      const generator = new ValidatorGenerator({ model })
      const updateSchema = generator.generateUpdate()

      assertIncludes(updateSchema, [
        'export const TodoUpdateSchema',
        'TodoCreateSchema.partial()',
        'export type TodoUpdateInput',
        'z.infer<typeof TodoUpdateSchema>'
      ])
    })

    it('should import CreateSchema', () => {
      const model = models.todo()
      const generator = new ValidatorGenerator({ model })
      const updateSchema = generator.generateUpdate()

      expect(updateSchema).toContain(
        "import { TodoCreateSchema } from './todo.create.zod.js'"
      )
    })

    it('should export TypeScript type', () => {
      const model = new ModelBuilder()
        .name('Article')
        .withIntId()
        .addField(field.string('title'))
        .build()

      const generator = new ValidatorGenerator({ model })
      const updateSchema = generator.generateUpdate()

      assertIncludes(updateSchema, [
        'export type ArticleUpdateInput',
        'z.infer<typeof ArticleUpdateSchema>'
      ])
    })
  })

  describe('QuerySchema Generation', () => {
    it('should include pagination fields', () => {
      const model = models.todo()
      const generator = new ValidatorGenerator({ model })
      const querySchema = generator.generateQuery()

      assertIncludes(querySchema, [
        'export const TodoQuerySchema',
        'z.object({',
        'skip: z.coerce.number().min(0).optional()',
        'take: z.coerce.number().min(1).max(100).optional().default(20)'
      ])
    })

    it('should validate pagination constraints', () => {
      const model = models.todo()
      const generator = new ValidatorGenerator({ model })
      const querySchema = generator.generateQuery()

      // Skip must be >= 0
      expect(querySchema).toContain('skip: z.coerce.number().min(0)')
      
      // Take must be 1-100
      expect(querySchema).toContain('take: z.coerce.number().min(1).max(100)')
      
      // Take defaults to 20
      expect(querySchema).toContain('.default(20)')
    })

    it('should include orderBy for scalar fields', () => {
      const model = new ModelBuilder()
        .name('Post')
        .withIntId()
        .addField(field.string('title'))
        .addField(field.int('views'))
        .withTimestamps()
        .build()

      const generator = new ValidatorGenerator({ model })
      const querySchema = generator.generateQuery()

      assertIncludes(querySchema, [
        'orderBy:',
        "title: z.enum(['asc', 'desc']).optional()",
        "views: z.enum(['asc', 'desc']).optional()",
        "createdAt: z.enum(['asc', 'desc']).optional()"
      ])
    })

    it('should include orderBy for relation fields', () => {
      const model = models.post()
      const generator = new ValidatorGenerator({ model })
      const querySchema = generator.generateQuery()

      assertIncludes(querySchema, [
        'orderBy:',
        "author: z.record(z.enum(['asc', 'desc'])).optional()"
      ])
    })

    it('should include where clause placeholder', () => {
      const model = models.todo()
      const generator = new ValidatorGenerator({ model })
      const querySchema = generator.generateQuery()

      assertIncludes(querySchema, [
        'where: z.object({',
        '// Filterable fields based on model',
        '}).optional()'
      ])
    })

    it('should include include for relations', () => {
      const model = models.post()
      const generator = new ValidatorGenerator({ model })
      const querySchema = generator.generateQuery()

      assertIncludes(querySchema, [
        'include:',
        'author: z.boolean().optional()'
      ])
    })

    it('should include select for all fields', () => {
      const model = new ModelBuilder()
        .name('Todo')
        .withIntId()
        .addField(field.string('title'))
        .addField(field.boolean('completed'))
        .build()

      const generator = new ValidatorGenerator({ model })
      const querySchema = generator.generateQuery()

      assertIncludes(querySchema, [
        'select:',
        'id: z.boolean().optional()',
        'title: z.boolean().optional()',
        'completed: z.boolean().optional()'
      ])
    })

    it('should handle model with no relations', () => {
      const model = models.todo()
      const generator = new ValidatorGenerator({ model })
      const querySchema = generator.generateQuery()

      // Should have generic include
      expect(querySchema).toContain('include: z.record(z.boolean()).optional()')
    })

    it('should handle model with multiple relations', () => {
      const model = new ModelBuilder()
        .name('Post')
        .withIntId()
        .addField(field.string('title'))
        .addField(field.relation('author', 'User'))
        .addField(field.relation('category', 'Category'))
        .addField(field.relation('tags', 'Tag', true))
        .build()

      const generator = new ValidatorGenerator({ model })
      const querySchema = generator.generateQuery()

      assertIncludes(querySchema, [
        'author: z.boolean().optional()',
        'category: z.boolean().optional()',
        'tags: z.boolean().optional()'
      ])
    })

    it('should export TypeScript type', () => {
      const model = models.todo()
      const generator = new ValidatorGenerator({ model })
      const querySchema = generator.generateQuery()

      assertIncludes(querySchema, [
        'export type TodoQueryInput',
        'z.infer<typeof TodoQuerySchema>'
      ])
    })
  })

  describe('Field Type Mapping to Zod', () => {
    it('should map String to z.string()', () => {
      const model = new ModelBuilder()
        .name('Test')
        .withIntId()
        .addField(field.string('name'))
        .build()

      const generator = new ValidatorGenerator({ model })
      const createSchema = generator.generateCreate()

      expect(createSchema).toContain('name: z.string()')
    })

    it('should map Int to z.number()', () => {
      const model = new ModelBuilder()
        .name('Test')
        .withIntId()
        .addField(field.int('count'))
        .build()

      const generator = new ValidatorGenerator({ model })
      const createSchema = generator.generateCreate()

      expect(createSchema).toContain('count: z.number()')
    })

    it('should map Float to z.number()', () => {
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

      const generator = new ValidatorGenerator({ model })
      const createSchema = generator.generateCreate()

      expect(createSchema).toContain('price: z.number()')
    })

    it('should map Boolean to z.boolean()', () => {
      const model = new ModelBuilder()
        .name('Test')
        .withIntId()
        .addField(field.boolean('active'))
        .build()

      const generator = new ValidatorGenerator({ model })
      const createSchema = generator.generateCreate()

      expect(createSchema).toContain('active: z.boolean()')
    })

    it('should map DateTime to z.coerce.date()', () => {
      const model = new ModelBuilder()
        .name('Test')
        .withIntId()
        .addField(field.datetime('startDate'))
        .build()

      const generator = new ValidatorGenerator({ model })
      const createSchema = generator.generateCreate()

      expect(createSchema).toContain('startDate: z.coerce.date()')
    })

    it('should map Json to z.record(z.any())', () => {
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

      const generator = new ValidatorGenerator({ model })
      const createSchema = generator.generateCreate()

      expect(createSchema).toContain('metadata: z.record(z.any())')
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

      const generator = new ValidatorGenerator({ model })
      const createSchema = generator.generateCreate()

      // Arrays include validation messages
      expect(createSchema).toContain('tags: z.array(z.string()')
      expect(createSchema).toContain('z.array(')
    })

    it('should handle enum types', () => {
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

      const generator = new ValidatorGenerator({ model })
      const createSchema = generator.generateCreate()

      expect(createSchema).toContain('status: z.nativeEnum(PostStatus)')
    })
  })

  describe('Optional and Nullable Fields', () => {
    it('should add .optional() for optional fields', () => {
      const model = new ModelBuilder()
        .name('User')
        .withIntId()
        .addField(field.string('email'))
        .addField(field.string('bio', false))
        .build()

      const generator = new ValidatorGenerator({ model })
      const createSchema = generator.generateCreate()

      expect(createSchema).toMatch(/bio:.*\.optional\(\)/)
    })

    it('should add .nullable() for nullable fields', () => {
      const model = new ModelBuilder()
        .name('Profile')
        .withIntId()
        .addField(field.string('userId'))
        .addField(field.string('avatar', false))
        .build()

      const generator = new ValidatorGenerator({ model })
      const createSchema = generator.generateCreate()

      // Optional fields should be both optional and nullable
      expect(createSchema).toMatch(/avatar:.*\.optional\(\)/)
    })

    it('should handle fields with defaults', () => {
      const model = new ModelBuilder()
        .name('Setting')
        .withIntId()
        .addField(field.string('key'))
        .addField(field.boolean('enabled', true))
        .addField(
          new FieldBuilder()
            .name('maxRetries')
            .type('Int')
            .scalar()
            .required()
            .defaultValue(3)
            .build()
        )
        .build()

      const generator = new ValidatorGenerator({ model })
      const createSchema = generator.generateCreate()

      // Fields with defaults should be optional
      expect(createSchema).toMatch(/enabled:.*\.optional\(\)/)
      expect(createSchema).toMatch(/maxRetries:.*\.optional\(\)/)
    })
  })

  describe('Edge Cases', () => {
    it('should handle model with only ID field', () => {
      const model = new ModelBuilder()
        .name('MinimalModel')
        .withIntId()
        .build()

      const generator = new ValidatorGenerator({ model })
      const createSchema = generator.generateCreate()

      expect(createSchema).toContain('export const MinimalModelCreateSchema')
      expect(createSchema).toContain('z.object({')
      assertValidTypeScript(createSchema)
    })

    it('should handle model with no optional fields', () => {
      const model = new ModelBuilder()
        .name('RequiredModel')
        .withIntId()
        .addField(field.string('field1'))
        .addField(field.string('field2'))
        .addField(field.int('field3'))
        .build()

      const generator = new ValidatorGenerator({ model })
      const createSchema = generator.generateCreate()

      // No fields should have .optional()
      expect(createSchema).not.toMatch(/field\d:.*\.optional\(\)/)
    })

    it('should handle model with all optional fields', () => {
      const model = new ModelBuilder()
        .name('OptionalModel')
        .withIntId()
        .addField(field.string('field1', false))
        .addField(field.string('field2', false))
        .addField(field.int('field3', false))
        .build()

      const generator = new ValidatorGenerator({ model })
      const createSchema = generator.generateCreate()

      // All fields should have .optional()
      expect(createSchema).toMatch(/field1:.*\.optional\(\)/)
      expect(createSchema).toMatch(/field2:.*\.optional\(\)/)
      expect(createSchema).toMatch(/field3:.*\.optional\(\)/)
    })

    it('should handle model with no relations', () => {
      const model = models.todo()
      const generator = new ValidatorGenerator({ model })
      const querySchema = generator.generateQuery()

      // Model has scalar fields, so orderBy is an object
      expect(querySchema).toContain('orderBy:')
      expect(querySchema).toContain("z.enum(['asc', 'desc'])")
      
      // No relations, so include uses generic record
      expect(querySchema).toContain('include: z.record(z.boolean()).optional()')
    })

    it('should handle UUID id type', () => {
      const model = models.user() // Has String ID
      const generator = new ValidatorGenerator({ model })
      
      const output = generator.generate()
      expect(output.files.size).toBe(3)
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

      const generator = new ValidatorGenerator({ model })
      const createSchema = generator.generateCreate()

      expect(createSchema).toContain('bigNumber: z.bigint()')
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

      const generator = new ValidatorGenerator({ model })
      const createSchema = generator.generateCreate()

      expect(createSchema).toContain('amount: z.number()')
    })
  })

  describe('Barrel Export', () => {
    it('should generate barrel with all validator files', () => {
      const model = models.todo()
      const generator = new ValidatorGenerator({ model })
      const barrel = generator.generateBarrel()

      assertIncludes(barrel, [
        '// @generated barrel',
        "export * from './todo.create.zod.js'",
        "export * from './todo.update.zod.js'",
        "export * from './todo.query.zod.js'"
      ])

      assertValidTypeScript(barrel)
    })
  })

  describe('Validation', () => {
    it('should validate model has fields', () => {
      const model = models.todo()
      const generator = new ValidatorGenerator({ model })
      const errors = generator.validate()

      expect(errors).toEqual([])
    })

    it('should return no errors for valid model', () => {
      const model = new ModelBuilder()
        .name('ValidModel')
        .withIntId()
        .addField(field.string('name'))
        .build()

      const generator = new ValidatorGenerator({ model })
      const errors = generator.validate()

      expect(errors).toEqual([])
    })
  })

  describe('Snapshot Testing', () => {
    it('should match CreateSchema snapshot', () => {
      const model = models.todo()
      const generator = new ValidatorGenerator({ model })
      const createSchema = generator.generateCreate()

      const normalized = normalizeGenerated(createSchema)
      expect(normalized).toMatchSnapshot()
    })

    it('should match minimal snapshot structure', () => {
      const model = models.post()
      const generator = new ValidatorGenerator({ model })
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
      const generator = new ValidatorGenerator({ model })
      const output = generator.generate()

      expect(output.metadata?.fileCount).toBe(3)
    })

    it('should include line count in metadata', () => {
      const model = models.todo()
      const generator = new ValidatorGenerator({ model })
      const output = generator.generate()

      expect(output.metadata?.lineCount).toBeGreaterThan(0)
    })

    it('should track total lines across all validators', () => {
      const model = models.post()
      const generator = new ValidatorGenerator({ model })
      const output = generator.generate()

      const manualCount = Array.from(output.files.values())
        .reduce((sum, content) => sum + content.split('\n').length, 0)

      expect(output.metadata?.lineCount).toBe(manualCount)
    })
  })

  describe('Import/Export Analysis', () => {
    it('should extract imports correctly', () => {
      const model = models.todo()
      const generator = new ValidatorGenerator({ model })
      const createSchema = generator.generateCreate()

      const imports = extractImports(createSchema)
      expect(imports).toContain('zod')
    })

    it('should extract exports correctly', () => {
      const model = models.todo()
      const generator = new ValidatorGenerator({ model })
      const createSchema = generator.generateCreate()

      const exports = extractExports(createSchema)
      expect(exports).toContain('TodoCreateSchema')
      expect(exports).toContain('TodoCreateInput')
    })

    it('should have correct exports list', () => {
      const model = models.user()
      const generator = new ValidatorGenerator({ model })
      const exports = generator.getExports()

      expect(exports).toHaveLength(6)
      expect(exports).toContain('UserCreateSchema')
      expect(exports).toContain('UserUpdateSchema')
      expect(exports).toContain('UserQuerySchema')
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
        .withTimestamps()
        .build()

      const generator = new ValidatorGenerator({ model })
      const output = generator.generate()

      expect(output.files.size).toBe(3)
      output.files.forEach((content) => {
        assertValidTypeScript(content)
      })

      const createSchema = output.files.get('blogpost.create.zod.ts')!
      assertIncludes(createSchema, [
        'title: z.string()',
        'slug: z.string()',
        'content: z.string()',
        'authorId: z.string()'
      ])

      // Should exclude relations
      assertExcludes(createSchema, ['author:', 'comments:'])
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
        .addField(field.relation('category', 'Category'))
        .addField(field.relation('images', 'ProductImage', true))
        .withTimestamps()
        .build()

      const generator = new ValidatorGenerator({ model })
      const output = generator.generate()

      expect(output.files.size).toBe(3)

      const createSchema = output.files.get('product.create.zod.ts')!
      assertIncludes(createSchema, [
        'sku: z.string()',
        'name: z.string()',
        'price: z.number()',
        'stock: z.number()'
      ])

      // isActive has default, should be optional
      expect(createSchema).toMatch(/isActive:.*\.optional\(\)/)
    })

    it('should handle model with multiple enums', () => {
      const model = new ModelBuilder()
        .name('Order')
        .withIntId()
        .addField(field.string('orderNumber'))
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

      const generator = new ValidatorGenerator({ model })
      const createSchema = generator.generateCreate()

      assertIncludes(createSchema, [
        'status: z.nativeEnum(OrderStatus)',
        'paymentMethod: z.nativeEnum(PaymentMethod)'
      ])
    })
  })

  describe('Zod-specific Features', () => {
    it('should use z.coerce.number() for pagination', () => {
      const model = models.todo()
      const generator = new ValidatorGenerator({ model })
      const querySchema = generator.generateQuery()

      // Coerce converts string query params to numbers
      expect(querySchema).toContain('z.coerce.number()')
    })

    it('should use z.coerce.date() for DateTime', () => {
      const model = new ModelBuilder()
        .name('Event')
        .withIntId()
        .addField(field.string('name'))
        .addField(field.datetime('startDate'))
        .build()

      const generator = new ValidatorGenerator({ model })
      const createSchema = generator.generateCreate()

      expect(createSchema).toContain('startDate: z.coerce.date()')
    })

    it('should use z.nativeEnum() for Prisma enums', () => {
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

      const generator = new ValidatorGenerator({ model })
      const createSchema = generator.generateCreate()

      expect(createSchema).toContain('z.nativeEnum(UserRole)')
    })

    it('should use z.array() for list types', () => {
      const model = new ModelBuilder()
        .name('Post')
        .withIntId()
        .addField(field.string('title'))
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

      const generator = new ValidatorGenerator({ model })
      const createSchema = generator.generateCreate()

      // Arrays use z.array() with validation
      expect(createSchema).toContain('tags: z.array(z.string()')
      expect(createSchema).toContain('z.array(')
    })

    it('should set min/max constraints on pagination', () => {
      const model = models.todo()
      const generator = new ValidatorGenerator({ model })
      const querySchema = generator.generateQuery()

      // skip >= 0
      expect(querySchema).toContain('.min(0)')
      
      // take between 1-100
      expect(querySchema).toContain('.min(1)')
      expect(querySchema).toContain('.max(100)')
      
      // take defaults to 20
      expect(querySchema).toContain('.default(20)')
    })
  })

  describe('Output Structure', () => {
    it('should generate correct output structure', () => {
      const model = models.todo()
      const generator = new ValidatorGenerator({ model })
      const outputs = generator.generate()

      expect(outputs.files.size).toBe(3)
      
      outputs.files.forEach((content, filename) => {
        expect(content).toContain('// @generated')
        expect(content).toContain("import { z } from 'zod'")
        expect(filename).toMatch(/\.zod\.ts$/)
      })
    })

    it('should generate correct file extensions', () => {
      const model = models.todo()
      const generator = new ValidatorGenerator({ model })
      const output = generator.generate()
      
      // All files should have .zod.ts extension
      output.files.forEach((content, filename) => {
        expect(filename).toMatch(/\.zod\.ts$/)
      })
    })
  })
})



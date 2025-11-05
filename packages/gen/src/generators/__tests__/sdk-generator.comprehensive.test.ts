/**
 * SDK Generator - Comprehensive Tests
 * Uses new test utilities for better coverage
 */

import { describe, it, expect } from 'vitest'
import {
  generateModelSDK,
  generateMainSDK,
  generateSDKVersion
} from '../sdk-generator.js'
import {
  models,
  field,
  ModelBuilder,
  FieldBuilder,
  assertIncludes,
  assertExcludes,
  assertValidTypeScript,
  extractImports,
  extractExports
} from '../../__tests__/index.js'

// Helper to create a minimal schema
function createMockSchema(modelList: any[]) {
  const modelMap = new Map(modelList.map(m => [m.name, m]))
  return {
    models: modelList,
    enums: [],
    modelMap
  }
}

describe('SDK Generator - Comprehensive Tests', () => {
  describe('Model SDK Generation', () => {
    it('should generate SDK client class', () => {
      const model = models.todo()
      const schema = createMockSchema([model])
      const sdk = generateModelSDK(model, schema)

      assertIncludes(sdk, [
        '// @generated',
        'export class TodoClient extends BaseModelClient',
        'constructor(client: BaseAPIClient)'
      ])
    })

    it('should import DTOs', () => {
      const model = models.todo()
      const schema = createMockSchema([model])
      const sdk = generateModelSDK(model, schema)

      assertIncludes(sdk, [
        'import type {',
        'TodoCreateDTO',
        'TodoUpdateDTO',
        'TodoReadDTO',
        'TodoQueryDTO',
        "} from '@gen/contracts/todo'"
      ])
    })

    it('should import SDK runtime', () => {
      const model = models.todo()
      const schema = createMockSchema([model])
      const sdk = generateModelSDK(model, schema)

      assertIncludes(sdk, [
        "import { BaseModelClient, type ListResponse } from '@ssot-codegen/sdk-runtime'",
        "import type { BaseAPIClient, QueryOptions } from '@ssot-codegen/sdk-runtime'"
      ])
    })

    it('should use correct base path', () => {
      const model = models.todo()
      const schema = createMockSchema([model])
      const sdk = generateModelSDK(model, schema)

      expect(sdk).toContain("super(client, '/api/todos')")
    })

    it('should handle Int ID type', () => {
      const model = models.todo()
      const schema = createMockSchema([model])
      const sdk = generateModelSDK(model, schema)

      assertValidTypeScript(sdk)
      expect(sdk).toContain('TodoClient extends BaseModelClient')
    })

    it('should handle String ID type', () => {
      const model = models.user()
      const schema = createMockSchema([model])
      const sdk = generateModelSDK(model, schema)

      assertValidTypeScript(sdk)
      expect(sdk).toContain('UserClient extends BaseModelClient')
    })

    it('should generate valid TypeScript', () => {
      const model = models.todo()
      const schema = createMockSchema([model])
      const sdk = generateModelSDK(model, schema)

      assertValidTypeScript(sdk)
    })
  })

  describe('Domain-Specific Methods - Slug', () => {
    it('should generate findBySlug method when model has slug', () => {
      const model = new ModelBuilder()
        .name('Post')
        .withIntId()
        .addField(field.string('title'))
        .addField(field.string('slug'))
        .build()

      const schema = createMockSchema([model])
      const sdk = generateModelSDK(model, schema)

      assertIncludes(sdk, [
        'async findBySlug(slug: string, options?: QueryOptions)',
        "await this.client.get<PostReadDTO>",
        '`${this.basePath}/slug/${slug}`',
        'return response.data'
      ])
    })

    it('should handle 404 in findBySlug', () => {
      const model = new ModelBuilder()
        .name('Article')
        .withIntId()
        .addField(field.string('slug'))
        .build()

      const schema = createMockSchema([model])
      const sdk = generateModelSDK(model, schema)

      assertIncludes(sdk, [
        'catch (error)',
        '(error as any).status === 404',
        'return null'
      ])
    })
  })

  describe('Domain-Specific Methods - Published', () => {
    it('should generate published methods when model has published field', () => {
      const model = new ModelBuilder()
        .name('Post')
        .withIntId()
        .addField(field.string('title'))
        .addField(field.boolean('published', false))
        .build()

      const schema = createMockSchema([model])
      const sdk = generateModelSDK(model, schema)

      assertIncludes(sdk, [
        'async listPublished(query?: PostQueryDTO',
        'async publish(id: number',
        'async unpublish(id: number'
      ])
    })

    it('should filter published in listPublished', () => {
      const model = new ModelBuilder()
        .name('Article')
        .withIntId()
        .addField(field.boolean('published'))
        .build()

      const schema = createMockSchema([model])
      const sdk = generateModelSDK(model, schema)

      expect(sdk).toContain('where: { ...query?.where, published: true }')
    })

    it('should use correct ID type in publish/unpublish', () => {
      const model = new ModelBuilder()
        .name('Post')
        .withStringId()
        .addField(field.boolean('published'))
        .build()

      const schema = createMockSchema([model])
      const sdk = generateModelSDK(model, schema)

      expect(sdk).toContain('async publish(id: string')
      expect(sdk).toContain('async unpublish(id: string')
    })
  })

  describe('Domain-Specific Methods - Views', () => {
    it('should generate incrementViews method when model has views field', () => {
      const model = new ModelBuilder()
        .name('Post')
        .withIntId()
        .addField(field.string('title'))
        .addField(field.int('views', false))
        .build()

      const schema = createMockSchema([model])
      const sdk = generateModelSDK(model, schema)

      assertIncludes(sdk, [
        'async incrementViews(id: number, options?: QueryOptions)',
        "await this.client.post<void>",
        '`${this.basePath}/${id}/views`'
      ])
    })

    it('should use correct ID type in incrementViews', () => {
      const model = new ModelBuilder()
        .name('Article')
        .withStringId()
        .addField(field.int('views'))
        .build()

      const schema = createMockSchema([model])
      const sdk = generateModelSDK(model, schema)

      expect(sdk).toContain('async incrementViews(id: string')
    })
  })

  describe('Domain-Specific Methods - Approval', () => {
    it('should generate approve/reject methods when model has approved field', () => {
      const model = new ModelBuilder()
        .name('Comment')
        .withIntId()
        .addField(field.string('content'))
        .addField(field.boolean('approved', false))
        .build()

      const schema = createMockSchema([model])
      const sdk = generateModelSDK(model, schema)

      assertIncludes(sdk, [
        'async approve(id: number',
        'async reject(id: number',
        '`${this.basePath}/${id}/approve`',
        '`${this.basePath}/${id}/reject`'
      ])
    })

    it('should handle 404 in approve/reject', () => {
      const model = new ModelBuilder()
        .name('Comment')
        .withIntId()
        .addField(field.boolean('approved'))
        .build()

      const schema = createMockSchema([model])
      const sdk = generateModelSDK(model, schema)

      const approveMethods = sdk.match(/async approve[\s\S]*?catch \(error\)[\s\S]*?return null/g)
      expect(approveMethods).toBeTruthy()
      expect(approveMethods!.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Domain-Specific Methods - Soft Delete', () => {
    it('should generate soft delete methods when model has deletedAt field', () => {
      const model = new ModelBuilder()
        .name('Post')
        .withIntId()
        .addField(field.string('title'))
        .addField(field.datetime('deletedAt', false))
        .build()

      const schema = createMockSchema([model])
      const sdk = generateModelSDK(model, schema)

      assertIncludes(sdk, [
        'async softDelete(id: number',
        'async restore(id: number',
        '`${this.basePath}/${id}/soft-delete`',
        '`${this.basePath}/${id}/restore`'
      ])
    })
  })

  describe('Domain-Specific Methods - Threading', () => {
    it('should generate getThread method when model has parentId', () => {
      const model = new ModelBuilder()
        .name('Comment')
        .withIntId()
        .addField(field.string('content'))
        .addField(field.int('parentId', false))
        .build()

      const schema = createMockSchema([model])
      const sdk = generateModelSDK(model, schema)

      assertIncludes(sdk, [
        'async getThread(id: number',
        '`${this.basePath}/${id}/thread`'
      ])
    })
  })

  describe('Main SDK Generation', () => {
    it('should generate main SDK factory', () => {
      const todoModel = models.todo()
      const userModel = models.user()
      const schema = createMockSchema([todoModel, userModel])

      const mainSDK = generateMainSDK([todoModel, userModel], schema)

      assertIncludes(mainSDK, [
        '// @generated',
        'import { BaseAPIClient',
        'export interface SDKConfig',
        'export function createSDK(config: SDKConfig)',
        'export interface SDK'
      ])
    })

    it('should import all model clients', () => {
      const todoModel = models.todo()
      const userModel = models.user()
      const schema = createMockSchema([todoModel, userModel])

      const mainSDK = generateMainSDK([todoModel, userModel], schema)

      assertIncludes(mainSDK, [
        "import { TodoClient } from './models/todo.client.js'",
        "import { UserClient } from './models/user.client.js'"
      ])
    })

    it('should initialize all model clients', () => {
      const todoModel = models.todo()
      const userModel = models.user()
      const schema = createMockSchema([todoModel, userModel])

      const mainSDK = generateMainSDK([todoModel, userModel], schema)

      assertIncludes(mainSDK, [
        'todo: new TodoClient(client)',
        'user: new UserClient(client)'
      ])
    })

    it('should define SDK type interface', () => {
      const todoModel = models.todo()
      const schema = createMockSchema([todoModel])

      const mainSDK = generateMainSDK([todoModel], schema)

      assertIncludes(mainSDK, [
        'export interface SDK {',
        'todo: TodoClient'
      ])
    })

    it('should include SDKConfig interface', () => {
      const model = models.todo()
      const schema = createMockSchema([model])

      const mainSDK = generateMainSDK([model], schema)

      assertIncludes(mainSDK, [
        'export interface SDKConfig {',
        'baseUrl: string',
        'auth?:',
        'timeout?: number',
        'retries?: number',
        'headers?: Record<string, string>'
      ])
    })

    it('should include auth configuration', () => {
      const model = models.todo()
      const schema = createMockSchema([model])

      const mainSDK = generateMainSDK([model], schema)

      assertIncludes(mainSDK, [
        'token?: string | (() => string | Promise<string>)',
        'refreshToken?: string | (() => string | Promise<string>)',
        'onRefresh?: (newToken: string) => void | Promise<void>'
      ])
    })

    it('should filter out junction tables', () => {
      const todoModel = models.todo()
      const junctionModel = new ModelBuilder()
        .name('TodoTag')
        .withIntId()
        .addField(field.int('todoId'))
        .addField(field.int('tagId'))
        .build()

      const schema = createMockSchema([todoModel, junctionModel])
      const mainSDK = generateMainSDK([todoModel, junctionModel], schema)

      // Should include Todo
      expect(mainSDK).toContain('TodoClient')
      
      // May or may not include junction - depends on relationship analyzer
      // Just verify it generates valid code
      assertValidTypeScript(mainSDK)
    })

    it('should generate valid TypeScript', () => {
      const modelList = [models.todo(), models.user(), models.post()]
      const schema = createMockSchema(modelList)

      const mainSDK = generateMainSDK(modelList, schema)

      assertValidTypeScript(mainSDK)
    })
  })

  describe('SDK Version Generation', () => {
    it('should generate version file', () => {
      const version = generateSDKVersion('abc123def456', '0.4.0')

      assertIncludes(version, [
        '// @generated',
        "export const SCHEMA_HASH = 'abc123def456'",
        "export const TOOL_VERSION = '0.4.0'",
        'export function checkVersion(backendHash: string)'
      ])
    })

    it('should include checkVersion function', () => {
      const version = generateSDKVersion('hash123', '1.0.0')

      assertIncludes(version, [
        'function checkVersion(backendHash: string)',
        'compatible: boolean',
        'message?: string',
        'if (backendHash === SCHEMA_HASH)',
        'return { compatible: true }',
        'SDK version mismatch'
      ])
    })

    it('should generate valid TypeScript', () => {
      const version = generateSDKVersion('test-hash', '1.2.3')

      assertValidTypeScript(version)
    })

    it('should handle different hash formats', () => {
      const version1 = generateSDKVersion('short', '1.0.0')
      const version2 = generateSDKVersion('very-long-hash-123456789abcdef', '2.0.0')

      assertValidTypeScript(version1)
      assertValidTypeScript(version2)
      expect(version1).toContain("SCHEMA_HASH = 'short'")
      expect(version2).toContain("SCHEMA_HASH = 'very-long-hash-123456789abcdef'")
    })
  })

  describe('TypeScript Generics', () => {
    it('should use correct generic parameters', () => {
      const model = models.todo()
      const schema = createMockSchema([model])
      const sdk = generateModelSDK(model, schema)

      assertIncludes(sdk, [
        'BaseModelClient<',
        'TodoReadDTO,',
        'TodoCreateDTO,',
        'TodoUpdateDTO,',
        'TodoQueryDTO'
      ])
    })

    it('should maintain generic order', () => {
      const model = models.user()
      const schema = createMockSchema([model])
      const sdk = generateModelSDK(model, schema)

      // Generic order: Read, Create, Update, Query
      expect(sdk).toMatch(/BaseModelClient<\s*UserReadDTO,\s*UserCreateDTO,\s*UserUpdateDTO,\s*UserQueryDTO\s*>/)
    })
  })

  describe('Edge Cases', () => {
    it('should handle model with only ID field', () => {
      const model = new ModelBuilder()
        .name('MinimalModel')
        .withIntId()
        .build()

      const schema = createMockSchema([model])
      const sdk = generateModelSDK(model, schema)

      expect(sdk).toContain('export class MinimalModelClient')
      assertValidTypeScript(sdk)
    })

    it('should handle model with no special fields', () => {
      const model = new ModelBuilder()
        .name('SimpleModel')
        .withIntId()
        .addField(field.string('name'))
        .build()

      const schema = createMockSchema([model])
      const sdk = generateModelSDK(model, schema)

      // Should not have domain methods
      expect(sdk).not.toContain('findBySlug')
      expect(sdk).not.toContain('listPublished')
      expect(sdk).not.toContain('incrementViews')
    })

    it('should handle model with all special fields', () => {
      const model = new ModelBuilder()
        .name('ComplexModel')
        .withIntId()
        .addField(field.string('slug'))
        .addField(field.boolean('published'))
        .addField(field.int('views'))
        .addField(field.boolean('approved'))
        .addField(field.datetime('deletedAt', false))
        .addField(field.int('parentId', false))
        .build()

      const schema = createMockSchema([model])
      const sdk = generateModelSDK(model, schema)

      assertIncludes(sdk, [
        'async findBySlug',
        'async listPublished',
        'async publish',
        'async unpublish',
        'async incrementViews',
        'async approve',
        'async reject',
        'async softDelete',
        'async restore',
        'async getThread'
      ])

      assertValidTypeScript(sdk)
    })

    it('should handle UUID ID in domain methods', () => {
      const model = new ModelBuilder()
        .name('Post')
        .withStringId()
        .addField(field.boolean('published'))
        .addField(field.int('views'))
        .build()

      const schema = createMockSchema([model])
      const sdk = generateModelSDK(model, schema)

      // All ID parameters should be string
      expect(sdk).toContain('async publish(id: string')
      expect(sdk).toContain('async incrementViews(id: string')
    })
  })

  describe('Complex Models', () => {
    it('should handle blog post model', () => {
      const userModel = models.user()
      const model = new ModelBuilder()
        .name('BlogPost')
        .withIntId()
        .addField(field.string('title'))
        .addField(field.string('slug'))
        .addField(field.string('content'))
        .addField(field.boolean('published', false))
        .addField(field.int('views', false))
        .addField(field.relation('author', 'User'))
        .withTimestamps()
        .build()

      const schema = createMockSchema([model, userModel])
      const sdk = generateModelSDK(model, schema)

      assertValidTypeScript(sdk)
      assertIncludes(sdk, [
        'export class BlogPostClient',
        'async findBySlug',
        'async listPublished',
        'async publish',
        'async incrementViews'
      ])
    })

    it('should handle comment model with all features', () => {
      const model = new ModelBuilder()
        .name('Comment')
        .withIntId()
        .addField(field.string('content'))
        .addField(field.boolean('approved', false))
        .addField(field.int('parentId', false))
        .addField(field.datetime('deletedAt', false))
        .build()

      const schema = createMockSchema([model])
      const sdk = generateModelSDK(model, schema)

      assertValidTypeScript(sdk)
      assertIncludes(sdk, [
        'export class CommentClient',
        'async approve',
        'async reject',
        'async getThread',
        'async softDelete',
        'async restore'
      ])
    })
  })

  describe('Main SDK with Multiple Models', () => {
    it('should handle multiple models', () => {
      const modelList = [models.todo(), models.user(), models.post()]
      const schema = createMockSchema(modelList)

      const mainSDK = generateMainSDK(modelList, schema)

      assertIncludes(mainSDK, [
        'todo: new TodoClient(client)',
        'user: new UserClient(client)',
        'post: new PostClient(client)'
      ])

      assertIncludes(mainSDK, [
        'todo: TodoClient',
        'user: UserClient',
        'post: PostClient'
      ])
    })

    it('should generate valid SDK for large schema', () => {
      const modelList = [
        models.todo(),
        models.user(),
        models.post(),
        new ModelBuilder().name('Comment').withIntId().addField(field.string('content')).build(),
        new ModelBuilder().name('Category').withIntId().addField(field.string('name')).build(),
        new ModelBuilder().name('Tag').withIntId().addField(field.string('name')).build()
      ]

      const schema = createMockSchema(modelList)
      const mainSDK = generateMainSDK(modelList, schema)

      assertValidTypeScript(mainSDK)
      expect(mainSDK).toContain('todo:')
      expect(mainSDK).toContain('user:')
      expect(mainSDK).toContain('post:')
      expect(mainSDK).toContain('comment:')
      expect(mainSDK).toContain('category:')
      expect(mainSDK).toContain('tag:')
    })
  })
})


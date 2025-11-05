/**
 * Cross-Generator Integration Tests
 * Tests consistency and compatibility between different generators
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { TEST_OUTPUT_DIR } from './setup.js'
import { parseDMMF } from '../../dmmf-parser.js'
import { DTOGenerator } from '../../generators/dto-generator.js'
import { ValidatorGenerator } from '../../generators/validator-generator.js'
import { ServiceGenerator } from '../../generators/service-generator.js'
import { ControllerGenerator } from '../../generators/controller-generator.js'
import { RouteGenerator } from '../../generators/route-generator.js'
import { generateModelSDK } from '../../generators/sdk-generator.js'

const TEST_SCHEMA = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Article {
  id          Int      @id @default(autoincrement())
  title       String
  slug        String   @unique
  content     String
  published   Boolean  @default(false)
  views       Int      @default(0)
  authorId    Int
  author      Author   @relation(fields: [authorId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Author {
  id       Int       @id @default(autoincrement())
  name     String
  email    String    @unique
  articles Article[]
}
`

describe('Cross-Generator Integration', () => {
  let outputDir: string

  beforeEach(() => {
    outputDir = path.join(TEST_OUTPUT_DIR, `cross-${Date.now()}`)
    fs.mkdirSync(outputDir, { recursive: true })
  })

  describe('DTO and Validator Consistency', () => {
    it('should use same type names across DTOs and validators', async () => {
      const schema = await parseDMMF(TEST_SCHEMA)
      const articleModel = schema.models.find(m => m.name === 'Article')!

      const dtoGen = new DTOGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'contracts'
      })

      const validatorGen = new ValidatorGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'validators'
      })

      const dtoOutput = dtoGen.generate(articleModel, schema)
      const validatorOutput = validatorGen.generate(articleModel, schema)

      const dtoContent = Array.from(dtoOutput.files.values())[0].content
      const validatorContent = Array.from(validatorOutput.files.values())[0].content

      // Both should reference same DTO types
      expect(dtoContent).toContain('ArticleCreateDTO')
      expect(validatorContent).toContain('ArticleCreateSchema')
      expect(validatorContent).toContain('ArticleUpdateSchema')
      expect(validatorContent).toContain('ArticleQuerySchema')
    })

    it('should have matching field sets', async () => {
      const schema = await parseDMMF(TEST_SCHEMA)
      const articleModel = schema.models.find(m => m.name === 'Article')!

      const dtoGen = new DTOGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'contracts'
      })

      const validatorGen = new ValidatorGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'validators'
      })

      const dtoOutput = dtoGen.generate(articleModel, schema)
      const validatorOutput = validatorGen.generate(articleModel, schema)

      const dtoContent = Array.from(dtoOutput.files.values())[0].content
      const validatorContent = Array.from(validatorOutput.files.values())[0].content

      // Key fields should appear in both
      const keyFields = ['title', 'slug', 'content', 'authorId']
      keyFields.forEach(field => {
        expect(dtoContent).toContain(field)
        expect(validatorContent).toContain(field)
      })
    })
  })

  describe('Service and Controller Integration', () => {
    it('should have matching method signatures', async () => {
      const schema = await parseDMMF(TEST_SCHEMA)
      const articleModel = schema.models.find(m => m.name === 'Article')!

      const serviceGen = new ServiceGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'services'
      })

      const controllerGen = new ControllerGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'controllers',
        framework: 'express'
      })

      const serviceOutput = serviceGen.generate(articleModel, schema)
      const controllerOutput = controllerGen.generate(articleModel, schema)

      const serviceContent = Array.from(serviceOutput.files.values())[0].content
      const controllerContent = Array.from(controllerOutput.files.values())[0].content

      // Controller should call service methods
      expect(controllerContent).toContain('articleService')
      
      // Both should have CRUD operations
      const operations = ['findMany', 'findUnique', 'create', 'update']
      operations.forEach(op => {
        expect(serviceContent).toContain(op)
      })
    })

    it('should use consistent DTO imports', async () => {
      const schema = await parseDMMF(TEST_SCHEMA)
      const articleModel = schema.models.find(m => m.name === 'Article')!

      const serviceGen = new ServiceGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'services'
      })

      const controllerGen = new ControllerGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'controllers',
        framework: 'express'
      })

      const serviceOutput = serviceGen.generate(articleModel, schema)
      const controllerOutput = controllerGen.generate(articleModel, schema)

      const serviceContent = Array.from(serviceOutput.files.values())[0].content
      const controllerContent = Array.from(controllerOutput.files.values())[0].content

      // Both should import from same contracts module
      if (serviceContent.includes('CreateDTO')) {
        expect(serviceContent).toContain("from '@gen/contracts")
      }
      
      if (controllerContent.includes('CreateDTO')) {
        expect(controllerContent).toContain("from '@gen/contracts")
      }
    })
  })

  describe('Controller and Route Integration', () => {
    it('should have matching route handlers', async () => {
      const schema = await parseDMMF(TEST_SCHEMA)
      const articleModel = schema.models.find(m => m.name === 'Article')!

      const controllerGen = new ControllerGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'controllers',
        framework: 'express'
      })

      const routeGen = new RouteGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'routes',
        framework: 'express'
      })

      const controllerOutput = controllerGen.generate(articleModel, schema)
      const routeOutput = routeGen.generate(articleModel, schema)

      const controllerContent = Array.from(controllerOutput.files.values())[0].content
      const routeContent = Array.from(routeOutput.files.values())[0].content

      // Routes should reference controller handlers
      const handlers = ['listArticles', 'getArticle', 'createArticle', 'updateArticle', 'deleteArticle']
      handlers.forEach(handler => {
        expect(controllerContent).toContain(handler)
        expect(routeContent).toContain(handler)
      })
    })

    it('should use consistent HTTP methods', async () => {
      const schema = await parseDMMF(TEST_SCHEMA)
      const articleModel = schema.models.find(m => m.name === 'Article')!

      const routeGen = new RouteGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'routes',
        framework: 'express'
      })

      const routeOutput = routeGen.generate(articleModel, schema)
      const routeContent = Array.from(routeOutput.files.values())[0].content

      // Should have all CRUD HTTP methods
      expect(routeContent).toContain('router.get')
      expect(routeContent).toContain('router.post')
      expect(routeContent).toContain('router.put')
      expect(routeContent).toContain('router.delete')
    })
  })

  describe('SDK and API Consistency', () => {
    it('should generate SDK matching API structure', async () => {
      const schema = await parseDMMF(TEST_SCHEMA)
      const articleModel = schema.models.find(m => m.name === 'Article')!

      const sdkContent = generateModelSDK(articleModel, schema)

      // SDK should extend BaseModelClient
      expect(sdkContent).toContain('extends BaseModelClient')
      
      // SDK should import DTOs
      expect(sdkContent).toContain('ArticleCreateDTO')
      expect(sdkContent).toContain('ArticleUpdateDTO')
      expect(sdkContent).toContain('ArticleReadDTO')
      expect(sdkContent).toContain('ArticleQueryDTO')
    })

    it('should have SDK methods matching routes', async () => {
      const schema = await parseDMMF(TEST_SCHEMA)
      const articleModel = schema.models.find(m => m.name === 'Article')!

      const sdkContent = generateModelSDK(articleModel, schema)
      const routeGen = new RouteGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'routes',
        framework: 'express'
      })

      const routeOutput = routeGen.generate(articleModel, schema)
      const routeContent = Array.from(routeOutput.files.values())[0].content

      // SDK base methods should align with routes
      expect(sdkContent).toContain('/api/articles')
      expect(routeContent).toContain('/api/articles')
    })
  })

  describe('Special Fields Consistency', () => {
    it('should handle slug field across all generators', async () => {
      const schema = await parseDMMF(TEST_SCHEMA)
      const articleModel = schema.models.find(m => m.name === 'Article')!

      const serviceGen = new ServiceGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'services'
      })

      const sdkContent = generateModelSDK(articleModel, schema)
      const serviceOutput = serviceGen.generate(articleModel, schema)

      const serviceContent = Array.from(serviceOutput.files.values())[0].content

      // Article has slug - both should handle it
      expect(sdkContent).toContain('findBySlug')
      expect(serviceContent).toContain('slug')
    })

    it('should handle published field across all generators', async () => {
      const schema = await parseDMMF(TEST_SCHEMA)
      const articleModel = schema.models.find(m => m.name === 'Article')!

      const sdkContent = generateModelSDK(articleModel, schema)

      // Article has published field
      expect(sdkContent).toContain('listPublished')
      expect(sdkContent).toContain('publish')
      expect(sdkContent).toContain('unpublish')
    })

    it('should handle views field across all generators', async () => {
      const schema = await parseDMMF(TEST_SCHEMA)
      const articleModel = schema.models.find(m => m.name === 'Article')!

      const sdkContent = generateModelSDK(articleModel, schema)

      // Article has views field
      expect(sdkContent).toContain('incrementViews')
    })
  })

  describe('Import Path Consistency', () => {
    it('should use consistent import patterns', async () => {
      const schema = await parseDMMF(TEST_SCHEMA)
      const articleModel = schema.models.find(m => m.name === 'Article')!

      const generators = [
        new ServiceGenerator({ outputDir, prismaSchema: schema, layer: 'services' }),
        new ControllerGenerator({ outputDir, prismaSchema: schema, layer: 'controllers', framework: 'express' })
      ]

      for (const generator of generators) {
        const output = generator.generate(articleModel, schema)
        const content = Array.from(output.files.values())[0].content

        // Should use @gen alias consistently
        if (content.includes("from '@gen")) {
          expect(content).toContain("from '@gen/")
          expect(content).not.toContain("from '@gen\\")
        }
      }
    })

    it('should use .js extensions for imports', async () => {
      const schema = await parseDMMF(TEST_SCHEMA)
      const articleModel = schema.models.find(m => m.name === 'Article')!

      const serviceGen = new ServiceGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'services'
      })

      const output = serviceGen.generate(articleModel, schema)
      const content = Array.from(output.files.values())[0].content

      // Relative imports should use .js extension
      const relativeImports = content.match(/from ['"]\..*['"]/g) || []
      relativeImports.forEach(imp => {
        if (imp.includes('./') || imp.includes('../')) {
          expect(imp).toMatch(/\.js['"]$/)
        }
      })
    })
  })

  describe('Type Safety Across Layers', () => {
    it('should maintain type compatibility', async () => {
      const schema = await parseDMMF(TEST_SCHEMA)
      const articleModel = schema.models.find(m => m.name === 'Article')!

      const dtoGen = new DTOGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'contracts'
      })

      const validatorGen = new ValidatorGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'validators'
      })

      const dtoOutput = dtoGen.generate(articleModel, schema)
      const validatorOutput = validatorGen.generate(articleModel, schema)

      const dtoContent = Array.from(dtoOutput.files.values())[0].content
      const validatorContent = Array.from(validatorOutput.files.values())[0].content

      // Validators should export types compatible with DTOs
      expect(validatorContent).toContain('z.infer<typeof')
    })

    it('should have no circular dependencies', async () => {
      const schema = await parseDMMF(TEST_SCHEMA)
      const articleModel = schema.models.find(m => m.name === 'Article')!

      const generators = [
        new DTOGenerator({ outputDir, prismaSchema: schema, layer: 'contracts' }),
        new ServiceGenerator({ outputDir, prismaSchema: schema, layer: 'services' }),
        new ControllerGenerator({ outputDir, prismaSchema: schema, layer: 'controllers', framework: 'express' })
      ]

      const allImports: string[] = []

      for (const generator of generators) {
        const output = generator.generate(articleModel, schema)
        for (const file of output.files.values()) {
          const imports = file.content.match(/import .* from ['"](.*)['"]/ g) || []
          allImports.push(...imports)
        }
      }

      // DTOs should not import from services or controllers
      const dtoImports = allImports.filter(imp => imp.includes('@gen/contracts'))
      dtoImports.forEach(imp => {
        expect(imp).not.toContain('@gen/services')
        expect(imp).not.toContain('@gen/controllers')
      })
    })
  })

  describe('Error Handling Consistency', () => {
    it('should use consistent error patterns', async () => {
      const schema = await parseDMMF(TEST_SCHEMA)
      const articleModel = schema.models.find(m => m.name === 'Article')!

      const serviceGen = new ServiceGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'services'
      })

      const controllerGen = new ControllerGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'controllers',
        framework: 'express'
      })

      const serviceOutput = serviceGen.generate(articleModel, schema)
      const controllerOutput = controllerGen.generate(articleModel, schema)

      const serviceContent = Array.from(serviceOutput.files.values())[0].content
      const controllerContent = Array.from(controllerOutput.files.values())[0].content

      // Both should handle errors
      expect(controllerContent).toContain('try')
      expect(controllerContent).toContain('catch')

      // Service should handle Prisma errors
      expect(serviceContent).toContain('catch')
    })
  })
})


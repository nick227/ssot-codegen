/**
 * End-to-End Code Generation Integration Tests
 * Tests the complete generation pipeline from schema to code
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
import { getDMMF } from '@prisma/internals'

// Simple test schema
const TEST_SCHEMA = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  active    Boolean  @default(true)
  role      Role     @default(USER)
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id          Int       @id @default(autoincrement())
  title       String
  slug        String    @unique
  content     String
  published   Boolean   @default(false)
  views       Int       @default(0)
  authorId    Int
  author      User      @relation(fields: [authorId], references: [id])
  tags        PostTag[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Tag {
  id    Int       @id @default(autoincrement())
  name  String    @unique
  posts PostTag[]
}

model PostTag {
  postId Int
  tagId  Int
  post   Post @relation(fields: [postId], references: [id])
  tag    Tag  @relation(fields: [tagId], references: [id])

  @@id([postId, tagId])
}

enum Role {
  USER
  ADMIN
  MODERATOR
}
`

describe('End-to-End Code Generation', () => {
  let outputDir: string

  beforeEach(() => {
    outputDir = path.join(TEST_OUTPUT_DIR, `test-${Date.now()}`)
    fs.mkdirSync(outputDir, { recursive: true })
  })

  describe('Full Pipeline', () => {
    it('should parse schema and generate all artifacts', async () => {
      // Parse schema
      const dmmf = await getDMMF({ datamodel: TEST_SCHEMA })
      const schema = parseDMMF(dmmf)

      expect(schema.models).toHaveLength(4) // User, Post, Tag, PostTag
      expect(schema.enums).toHaveLength(1) // Role

      // Verify models
      const userModel = schema.models.find(m => m.name === 'User')
      const postModel = schema.models.find(m => m.name === 'Post')
      const tagModel = schema.models.find(m => m.name === 'Tag')
      const junctionModel = schema.models.find(m => m.name === 'PostTag')

      expect(userModel).toBeDefined()
      expect(postModel).toBeDefined()
      expect(tagModel).toBeDefined()
      expect(junctionModel).toBeDefined()

      // Verify relationships
      expect(userModel?.relationFields).toHaveLength(1) // posts
      expect(postModel?.relationFields).toHaveLength(2) // author, tags
    })

    it('should generate DTOs for all models', async () => {
      const schema = await parseDMMF(TEST_SCHEMA)
      const generator = new DTOGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'contracts'
      })

      for (const model of schema.models) {
        const output = generator.generate(model, schema)
        
        expect(output.files.size).toBeGreaterThan(0)
        
        // Check that DTOs were generated
        const files = Array.from(output.files.values())
        const content = files.map(f => f.content).join('\n')
        
        expect(content).toContain(`${model.name}CreateDTO`)
        expect(content).toContain(`${model.name}UpdateDTO`)
        expect(content).toContain(`${model.name}ReadDTO`)
        expect(content).toContain(`${model.name}QueryDTO`)
      }
    })

    it('should generate validators for all models', async () => {
      const schema = await parseDMMF(TEST_SCHEMA)
      const generator = new ValidatorGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'validators'
      })

      for (const model of schema.models) {
        const output = generator.generate(model, schema)
        
        expect(output.files.size).toBeGreaterThan(0)
        
        const files = Array.from(output.files.values())
        const content = files.map(f => f.content).join('\n')
        
        expect(content).toContain(`${model.name}CreateSchema`)
        expect(content).toContain(`${model.name}UpdateSchema`)
        expect(content).toContain(`${model.name}QuerySchema`)
        expect(content).toContain('z.object')
      }
    })

    it('should generate services for all models', async () => {
      const schema = await parseDMMF(TEST_SCHEMA)
      const generator = new ServiceGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'services'
      })

      for (const model of schema.models) {
        const output = generator.generate(model, schema)
        
        expect(output.files.size).toBeGreaterThan(0)
        
        const files = Array.from(output.files.values())
        const content = files.map(f => f.content).join('\n')
        
        expect(content).toContain(`${model.name.toLowerCase()}Service`)
        expect(content).toContain('findMany')
        expect(content).toContain('findUnique')
        expect(content).toContain('create')
        expect(content).toContain('update')
      }
    })

    it('should generate controllers for all models', async () => {
      const schema = await parseDMMF(TEST_SCHEMA)
      const generator = new ControllerGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'controllers',
        framework: 'express'
      })

      for (const model of schema.models) {
        const output = generator.generate(model, schema)
        
        expect(output.files.size).toBeGreaterThan(0)
        
        const files = Array.from(output.files.values())
        const content = files.map(f => f.content).join('\n')
        
        expect(content).toContain(`list${model.name}s`)
        expect(content).toContain(`get${model.name}`)
        expect(content).toContain(`create${model.name}`)
        expect(content).toContain(`update${model.name}`)
        expect(content).toContain(`delete${model.name}`)
      }
    })

    it('should generate routes for all models', async () => {
      const schema = await parseDMMF(TEST_SCHEMA)
      const generator = new RouteGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'routes',
        framework: 'express'
      })

      for (const model of schema.models) {
        const output = generator.generate(model, schema)
        
        expect(output.files.size).toBeGreaterThan(0)
        
        const files = Array.from(output.files.values())
        const content = files.map(f => f.content).join('\n')
        
        expect(content).toContain('router.get')
        expect(content).toContain('router.post')
        expect(content).toContain('router.put')
        expect(content).toContain('router.delete')
      }
    })
  })

  describe('Generated Code Quality', () => {
    it('should generate valid TypeScript', async () => {
      const schema = await parseDMMF(TEST_SCHEMA)
      const userModel = schema.models.find(m => m.name === 'User')!

      const dtoGen = new DTOGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'contracts'
      })

      const output = dtoGen.generate(userModel, schema)
      const files = Array.from(output.files.values())

      // Check for TypeScript syntax elements
      for (const file of files) {
        expect(file.content).toContain('export')
        expect(file.content).toContain('interface')
        expect(file.content).not.toContain('undefined')
        expect(file.content).not.toContain('null;') // Avoid null type issues
      }
    })

    it('should generate consistent imports', async () => {
      const schema = await parseDMMF(TEST_SCHEMA)
      const postModel = schema.models.find(m => m.name === 'Post')!

      const serviceGen = new ServiceGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'services'
      })

      const output = serviceGen.generate(postModel, schema)
      const files = Array.from(output.files.values())
      const content = files[0].content

      // Check for proper imports
      expect(content).toContain('import')
      
      // If it imports types, they should be from generated contracts
      if (content.includes('CreateDTO')) {
        expect(content).toContain("from '@gen/contracts")
      }
    })

    it('should maintain naming conventions', async () => {
      const schema = await parseDMMF(TEST_SCHEMA)
      
      for (const model of schema.models) {
        const dtoGen = new DTOGenerator({
          outputDir,
          prismaSchema: schema,
          layer: 'contracts'
        })

        const output = dtoGen.generate(model, schema)
        const files = Array.from(output.files.values())
        const content = files.map(f => f.content).join('\n')

        // DTOs should follow naming convention
        expect(content).toContain(`${model.name}CreateDTO`)
        expect(content).toContain(`${model.name}UpdateDTO`)
        expect(content).toContain(`${model.name}ReadDTO`)
        
        // Should not have typos or inconsistencies
        expect(content).not.toContain(`${model.name}createDTO`)
        expect(content).not.toContain(`${model.name}Create_DTO`)
      }
    })
  })

  describe('Special Field Handling', () => {
    it('should generate domain methods for published field', async () => {
      const schema = await parseDMMF(TEST_SCHEMA)
      const postModel = schema.models.find(m => m.name === 'Post')!

      const serviceGen = new ServiceGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'services'
      })

      const output = serviceGen.generate(postModel, schema)
      const files = Array.from(output.files.values())
      const content = files[0].content

      // Post has published field - should have published methods
      expect(content).toContain('published')
    })

    it('should generate slug lookup methods', async () => {
      const schema = await parseDMMF(TEST_SCHEMA)
      const postModel = schema.models.find(m => m.name === 'Post')!

      const serviceGen = new ServiceGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'services'
      })

      const output = serviceGen.generate(postModel, schema)
      const files = Array.from(output.files.values())
      const content = files[0].content

      // Post has slug field - should have slug methods
      expect(content).toContain('slug')
    })

    it('should handle enums correctly', async () => {
      const schema = await parseDMMF(TEST_SCHEMA)
      const userModel = schema.models.find(m => m.name === 'User')!

      const dtoGen = new DTOGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'contracts'
      })

      const output = dtoGen.generate(userModel, schema)
      const files = Array.from(output.files.values())
      const content = files.map(f => f.content).join('\n')

      // User has Role enum
      expect(content).toContain('Role')
      expect(content).toContain("from '@prisma/client'")
    })

    it('should handle timestamps correctly', async () => {
      const schema = await parseDMMF(TEST_SCHEMA)
      const userModel = schema.models.find(m => m.name === 'User')!

      const dtoGen = new DTOGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'contracts'
      })

      const output = dtoGen.generate(userModel, schema)
      const files = Array.from(output.files.values())
      const content = files.map(f => f.content).join('\n')

      // Should handle DateTime fields
      expect(content).toContain('createdAt')
      expect(content).toContain('updatedAt')
      
      // Timestamps should be in ReadDTO but not CreateDTO
      const match = content.match(/interface\s+UserCreateDTO[\s\S]*?}/)?.[0]
      if (match) {
        expect(match).not.toContain('createdAt')
        expect(match).not.toContain('updatedAt')
      }
    })
  })

  describe('Relationship Handling', () => {
    it('should handle one-to-many relationships', async () => {
      const schema = await parseDMMF(TEST_SCHEMA)
      const userModel = schema.models.find(m => m.name === 'User')!

      expect(userModel.relationFields).toHaveLength(1)
      expect(userModel.relationFields[0].name).toBe('posts')
      expect(userModel.relationFields[0].type).toBe('Post')
      expect(userModel.relationFields[0].isList).toBe(true)
    })

    it('should handle many-to-one relationships', async () => {
      const schema = await parseDMMF(TEST_SCHEMA)
      const postModel = schema.models.find(m => m.name === 'Post')!

      const authorRelation = postModel.relationFields.find(r => r.name === 'author')
      expect(authorRelation).toBeDefined()
      expect(authorRelation?.type).toBe('User')
      expect(authorRelation?.isList).toBe(false)
    })

    it('should detect junction tables', async () => {
      const schema = await parseDMMF(TEST_SCHEMA)
      const junctionModel = schema.models.find(m => m.name === 'PostTag')!

      // Junction table should have composite ID
      expect(junctionModel.idField).toBeUndefined()
      expect(junctionModel.fields.filter(f => f.isId).length).toBe(2)
    })

    it('should exclude relations from CreateDTO', async () => {
      const schema = await parseDMMF(TEST_SCHEMA)
      const postModel = schema.models.find(m => m.name === 'Post')!

      const dtoGen = new DTOGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'contracts'
      })

      const output = dtoGen.generate(postModel, schema)
      const files = Array.from(output.files.values())
      const content = files.map(f => f.content).join('\n')

      // CreateDTO should not include relation fields
      const createDTO = content.match(/interface\s+PostCreateDTO[\s\S]*?}/)?.[0]
      if (createDTO) {
        expect(createDTO).not.toContain('author:')
        expect(createDTO).not.toContain('tags:')
        // But should include foreign keys
        expect(createDTO).toContain('authorId')
      }
    })
  })
})


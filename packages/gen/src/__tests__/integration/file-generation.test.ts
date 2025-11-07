/**
 * File Generation Integration Tests
 * Tests file system operations and file structure
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { TEST_OUTPUT_DIR } from './setup.js'
import { parseDMMF } from '../../dmmf-parser.js'
import { DTOGenerator } from '@/generators/dto-generator.js'
import { ValidatorGenerator } from '@/generators/validator-generator.js'
import { ServiceGenerator } from '@/generators/service-generator.js'

const SIMPLE_SCHEMA = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Product {
  id          Int      @id @default(autoincrement())
  name        String
  price       Int
  description String?
  inStock     Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
`

describe('File Generation Integration', () => {
  let outputDir: string

  beforeEach(() => {
    outputDir = path.join(TEST_OUTPUT_DIR, `files-${Date.now()}`)
    fs.mkdirSync(outputDir, { recursive: true })
  })

  describe('File Structure', () => {
    it('should create proper directory structure', async () => {
      const schema = await parseDMMF(SIMPLE_SCHEMA)
      const model = schema.models[0]

      const dtoGen = new DTOGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'contracts'
      })

      const output = dtoGen.generate(model, schema)

      // Write files
      for (const [filePath, file] of output.files) {
        const fullPath = path.join(outputDir, filePath)
        fs.mkdirSync(path.dirname(fullPath), { recursive: true })
        fs.writeFileSync(fullPath, file.content, 'utf-8')
      }

      // Verify files were created
      for (const [filePath] of output.files) {
        const fullPath = path.join(outputDir, filePath)
        expect(fs.existsSync(fullPath)).toBe(true)
      }
    })

    it('should generate index files for barrel exports', async () => {
      const schema = await parseDMMF(SIMPLE_SCHEMA)
      const model = schema.models[0]

      const dtoGen = new DTOGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'contracts'
      })

      const output = dtoGen.generate(model, schema)

      // Check for index.ts files
      const indexFiles = Array.from(output.files.keys()).filter(p => p.endsWith('index.ts'))
      expect(indexFiles.length).toBeGreaterThan(0)
    })

    it('should generate consistent file names', async () => {
      const schema = await parseDMMF(SIMPLE_SCHEMA)
      const model = schema.models[0]

      const generators = [
        new DTOGenerator({ outputDir, prismaSchema: schema, layer: 'contracts' }),
        new ValidatorGenerator({ outputDir, prismaSchema: schema, layer: 'validators' }),
        new ServiceGenerator({ outputDir, prismaSchema: schema, layer: 'services' })
      ]

      for (const generator of generators) {
        const output = generator.generate(model, schema)
        const filePaths = Array.from(output.files.keys())

        // All files should use lowercase for model names in paths
        filePaths.forEach(filePath => {
          expect(filePath).not.toContain('Product/') // Should be 'product/'
          expect(filePath.toLowerCase()).toBe(filePath)
        })
      }
    })
  })

  describe('File Content', () => {
    it('should generate files with UTF-8 encoding', async () => {
      const schema = await parseDMMF(SIMPLE_SCHEMA)
      const model = schema.models[0]

      const dtoGen = new DTOGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'contracts'
      })

      const output = dtoGen.generate(model, schema)

      // Write and read back files
      for (const [filePath, file] of output.files) {
        const fullPath = path.join(outputDir, filePath)
        fs.mkdirSync(path.dirname(fullPath), { recursive: true })
        fs.writeFileSync(fullPath, file.content, 'utf-8')

        const readContent = fs.readFileSync(fullPath, 'utf-8')
        expect(readContent).toBe(file.content)
      }
    })

    it('should generate files with proper line endings', async () => {
      const schema = await parseDMMF(SIMPLE_SCHEMA)
      const model = schema.models[0]

      const dtoGen = new DTOGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'contracts'
      })

      const output = dtoGen.generate(model, schema)

      for (const file of output.files.values()) {
        // Check for consistent line endings (LF)
        expect(file.content).not.toContain('\r\n\r\n')
        
        // Should not have trailing whitespace
        const lines = file.content.split('\n')
        lines.forEach(line => {
          if (line.length > 0) {
            expect(line).not.toMatch(/\s+$/)
          }
        })
      }
    })

    it('should generate files with generation markers', async () => {
      const schema = await parseDMMF(SIMPLE_SCHEMA)
      const model = schema.models[0]

      const dtoGen = new DTOGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'contracts'
      })

      const output = dtoGen.generate(model, schema)

      for (const file of output.files.values()) {
        // Should have @generated marker
        expect(file.content).toContain('@generated')
        expect(file.content).toContain('Do not edit manually')
      }
    })
  })

  describe('Multiple Models', () => {
    it('should handle multiple models without conflicts', async () => {
      const multiModelSchema = `
        datasource db {
          provider = "postgresql"
          url      = env("DATABASE_URL")
        }

        model User {
          id    Int    @id @default(autoincrement())
          email String @unique
          posts Post[]
        }

        model Post {
          id       Int    @id @default(autoincrement())
          title    String
          authorId Int
          author   User   @relation(fields: [authorId], references: [id])
        }
      `

      const schema = await parseDMMF(multiModelSchema)
      const dtoGen = new DTOGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'contracts'
      })

      const userOutput = dtoGen.generate(schema.models[0], schema)
      const postOutput = dtoGen.generate(schema.models[1], schema)

      // Write all files
      const allFiles = new Map([
        ...userOutput.files,
        ...postOutput.files
      ])

      for (const [filePath, file] of allFiles) {
        const fullPath = path.join(outputDir, filePath)
        fs.mkdirSync(path.dirname(fullPath), { recursive: true })
        fs.writeFileSync(fullPath, file.content, 'utf-8')
      }

      // Verify no conflicts
      for (const [filePath] of allFiles) {
        const fullPath = path.join(outputDir, filePath)
        expect(fs.existsSync(fullPath)).toBe(true)
      }
    })

    it('should generate isolated modules per model', async () => {
      const multiModelSchema = `
        datasource db {
          provider = "postgresql"
          url      = env("DATABASE_URL")
        }

        model Product {
          id   Int    @id
          name String
        }

        model Order {
          id    Int @id
          total Int
        }
      `

      const schema = await parseDMMF(multiModelSchema)
      const dtoGen = new DTOGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'contracts'
      })

      const productOutput = dtoGen.generate(schema.models[0], schema)
      const orderOutput = dtoGen.generate(schema.models[1], schema)

      // Product files should not reference Order
      for (const file of productOutput.files.values()) {
        expect(file.content).not.toContain('Order')
      }

      // Order files should not reference Product
      for (const file of orderOutput.files.values()) {
        expect(file.content).not.toContain('Product')
      }
    })
  })

  describe('File Permissions and Access', () => {
    it('should create readable files', async () => {
      const schema = await parseDMMF(SIMPLE_SCHEMA)
      const model = schema.models[0]

      const dtoGen = new DTOGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'contracts'
      })

      const output = dtoGen.generate(model, schema)

      for (const [filePath, file] of output.files) {
        const fullPath = path.join(outputDir, filePath)
        fs.mkdirSync(path.dirname(fullPath), { recursive: true })
        fs.writeFileSync(fullPath, file.content, 'utf-8')

        // Should be able to read file
        expect(() => fs.readFileSync(fullPath, 'utf-8')).not.toThrow()
      }
    })

    it('should handle existing files (overwrite)', async () => {
      const schema = await parseDMMF(SIMPLE_SCHEMA)
      const model = schema.models[0]

      const dtoGen = new DTOGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'contracts'
      })

      const output = dtoGen.generate(model, schema)

      // Write files first time
      for (const [filePath, file] of output.files) {
        const fullPath = path.join(outputDir, filePath)
        fs.mkdirSync(path.dirname(fullPath), { recursive: true })
        fs.writeFileSync(fullPath, file.content, 'utf-8')
      }

      // Write files second time (overwrite)
      for (const [filePath, file] of output.files) {
        const fullPath = path.join(outputDir, filePath)
        expect(() => fs.writeFileSync(fullPath, file.content, 'utf-8')).not.toThrow()
      }
    })
  })

  describe('Output Consistency', () => {
    it('should generate deterministic output', async () => {
      const schema = await parseDMMF(SIMPLE_SCHEMA)
      const model = schema.models[0]

      const dtoGen1 = new DTOGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'contracts'
      })

      const dtoGen2 = new DTOGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'contracts'
      })

      const output1 = dtoGen1.generate(model, schema)
      const output2 = dtoGen2.generate(model, schema)

      // Same schema should produce same output
      expect(output1.files.size).toBe(output2.files.size)

      for (const [filePath, file1] of output1.files) {
        const file2 = output2.files.get(filePath)
        expect(file2).toBeDefined()
        expect(file2?.content).toBe(file1.content)
      }
    })

    it('should maintain file order', async () => {
      const schema = await parseDMMF(SIMPLE_SCHEMA)
      const model = schema.models[0]

      const dtoGen = new DTOGenerator({
        outputDir,
        prismaSchema: schema,
        layer: 'contracts'
      })

      const output1 = dtoGen.generate(model, schema)
      const output2 = dtoGen.generate(model, schema)

      const keys1 = Array.from(output1.files.keys())
      const keys2 = Array.from(output2.files.keys())

      expect(keys1).toEqual(keys2)
    })
  })
})


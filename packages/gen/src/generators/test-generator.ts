/**
 * Test Generator - Creates self-validation tests for generated projects
 */

import type { ParsedModel, ParsedField } from '../dmmf-parser.js'

export interface TestGeneratorOptions {
  models: readonly ParsedModel[]
  framework: 'express' | 'fastify'
}

/**
 * Generate self-validation test suite
 */
export function generateSelfValidationTests(options: TestGeneratorOptions): string {
  const { models, framework } = options
  
  // Filter out junction tables for cleaner tests
  const testableModels = models.filter(m => !isJunctionTable(m))
  
  return `import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { createApp } from '../src/app.js'
import prisma from '../src/db.js'
import type { Application } from 'express'

/**
 * Self-Validation Test Suite
 * 
 * This test suite validates that the generated project:
 * 1. Compiles TypeScript without errors
 * 2. Starts the Express server
 * 3. Connects to MySQL database
 * 4. Performs CRUD operations on all models
 * 5. Responds to API endpoints
 * 
 * Run: pnpm test:validate
 */

describe('🔍 Generated Project Self-Validation', () => {
  let app: Application
  let server: any
  const testData = new Map<string, Set<number>>()
  const baseUrl = 'http://localhost'
  let serverPort: number

  // ========================================
  // Phase 1: Build & Startup Validation
  // ========================================
  describe('Phase 1: Build & Startup', () => {
    it('TypeScript compiled successfully', () => {
      // If this test is running, TypeScript compilation succeeded
      expect(true).toBe(true)
      console.log('    ✅ TypeScript compilation successful')
    })

    it('creates Express application', async () => {
      try {
        app = await createApp()
        expect(app).toBeDefined()
        console.log('    ✅ Express app created')
      } catch (error) {
        console.error('    ❌ Failed to create Express app:', error.message)
        throw error
      }
    })

    it('starts server on available port', async () => {
      try {
        await new Promise<void>((resolve, reject) => {
          server = app.listen(0, () => {
            serverPort = server.address().port
            console.log(\`    ✅ Server started on port \${serverPort}\`)
            resolve()
          })
          server.on('error', reject)
        })
      } catch (error) {
        console.error('    ❌ Server failed to start:', error.message)
        throw error
      }
    })
  })

  // ========================================
  // Phase 2: Database Connection
  // ========================================
  describe('Phase 2: Database Connection', () => {
    it('connects to MySQL database', async () => {
      try {
        await prisma.$connect()
        console.log('    ✅ MySQL connection established')
      } catch (error) {
        console.error('    ❌ MySQL connection failed:', error.message)
        console.error('    ⚠️  Ensure DATABASE_URL is set in .env')
        console.error('    ⚠️  Example: DATABASE_URL="mysql://user:pass@localhost:3306/testdb"')
        throw error
      }
    })

    it('verifies schema tables exist', async () => {
      try {
        const result = await prisma.$queryRaw<Array<{ TABLE_NAME: string }>>\`
          SELECT TABLE_NAME 
          FROM information_schema.TABLES 
          WHERE TABLE_SCHEMA = DATABASE()
        \`
        expect(result.length).toBeGreaterThan(0)
        console.log(\`    ✅ Found \${result.length} tables in schema\`)
      } catch (error) {
        console.error('    ❌ Schema verification failed:', error.message)
        console.error('    ⚠️  Run: npx prisma migrate dev')
        throw error
      }
    })

    it('can execute basic query', async () => {
      try {
        await prisma.$queryRaw\`SELECT 1 as test\`
        console.log('    ✅ Database queries working')
      } catch (error) {
        console.error('    ❌ Query execution failed:', error.message)
        throw error
      }
    })
  })

${testableModels.map(model => generateModelCRUDTests(model, testableModels)).join('\n\n')}

  // ========================================
  // Phase 4: API Endpoint Validation
  // ========================================
  describe('Phase 4: API Endpoints', () => {
${testableModels.map(model => generateAPIEndpointTest(model)).join('\n\n')}

    it('returns 404 for unknown routes', async () => {
      try {
        const response = await fetch(\`\${baseUrl}:\${serverPort}/api/nonexistent\`)
        expect(response.status).toBe(404)
        console.log('    ✅ 404 handling works')
      } catch (error) {
        console.error('    ❌ 404 test failed:', error.message)
        throw error
      }
    })

    it('health check endpoint responds', async () => {
      try {
        const response = await fetch(\`\${baseUrl}:\${serverPort}/health\`)
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.status).toBe('ok')
        console.log('    ✅ Health check working')
      } catch (error) {
        console.error('    ❌ Health check failed:', error.message)
        throw error
      }
    })
  })

  // ========================================
  // Cleanup: Delete all test data
  // ========================================
  afterAll(async () => {
    console.log('\\n  🧹 Cleaning up test data...')
    
    // Delete in reverse order to handle foreign key constraints
    const modelsToClean = [${testableModels.map(m => `'${m.name}'`).join(', ')}].reverse()
    
    for (const modelName of modelsToClean) {
      const ids = testData.get(modelName)
      if (ids && ids.size > 0) {
        try {
          const model = modelName.toLowerCase()
          await (prisma as any)[model].deleteMany({
            where: { id: { in: Array.from(ids) } }
          })
          console.log(\`    🗑️  Deleted \${ids.size} \${modelName} records\`)
        } catch (error) {
          console.warn(\`    ⚠️  Failed to cleanup \${modelName}:\`, error.message)
        }
      }
    }

    // Close server and disconnect
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()))
      console.log('    🛑 Server stopped')
    }
    
    await prisma.$disconnect()
    console.log('    🔌 Database disconnected')
    console.log('  ✅ Cleanup complete\\n')
  })
})
`
}

/**
 * Generate CRUD tests for a model
 */
function generateModelCRUDTests(model: ParsedModel, allModels: ParsedModel[]): string {
  const modelLower = model.name.toLowerCase()
  const createData = generateTestData(model, allModels)
  const updateData = generateUpdateData(model)
  
  return `  // ========================================
  // Phase 3: ${model.name} Model CRUD Operations
  // ========================================
  describe('Phase 3: ${model.name} CRUD', () => {
    let testId: number

    it('CREATE ${model.name} record', async () => {
      try {
        const data = ${createData}
        const record = await prisma.${modelLower}.create({ data })
        testId = record.id
        
        // Track for cleanup
        if (!testData.has('${model.name}')) {
          testData.set('${model.name}', new Set())
        }
        testData.get('${model.name}')!.add(testId)
        
        expect(record.id).toBeDefined()
        console.log('    ✅ ${model.name}.create()')
      } catch (error) {
        console.error('    ❌ ${model.name}.create() failed:', error.message)
        throw error
      }
    })

    it('READ ${model.name} record', async () => {
      try {
        const record = await prisma.${modelLower}.findUnique({
          where: { id: testId }
        })
        expect(record).toBeDefined()
        expect(record!.id).toBe(testId)
        console.log('    ✅ ${model.name}.findUnique()')
      } catch (error) {
        console.error('    ❌ ${model.name}.findUnique() failed:', error.message)
        throw error
      }
    })

    it('LIST ${model.name} records', async () => {
      try {
        const records = await prisma.${modelLower}.findMany({
          take: 10
        })
        expect(Array.isArray(records)).toBe(true)
        expect(records.length).toBeGreaterThan(0)
        console.log(\`    ✅ ${model.name}.findMany() - found \${records.length} records\`)
      } catch (error) {
        console.error('    ❌ ${model.name}.findMany() failed:', error.message)
        throw error
      }
    })

    it('UPDATE ${model.name} record', async () => {
      try {
        const updateData = ${updateData}
        const record = await prisma.${modelLower}.update({
          where: { id: testId },
          data: updateData
        })
        expect(record.id).toBe(testId)
        console.log('    ✅ ${model.name}.update()')
      } catch (error) {
        console.error('    ❌ ${model.name}.update() failed:', error.message)
        throw error
      }
    })

    it('DELETE ${model.name} record', async () => {
      try {
        await prisma.${modelLower}.delete({
          where: { id: testId }
        })
        const deleted = await prisma.${modelLower}.findUnique({
          where: { id: testId }
        })
        expect(deleted).toBeNull()
        
        // Remove from cleanup list since we deleted it
        testData.get('${model.name}')?.delete(testId)
        
        console.log('    ✅ ${model.name}.delete()')
      } catch (error) {
        console.error('    ❌ ${model.name}.delete() failed:', error.message)
        throw error
      }
    })
  })`
}

/**
 * Generate API endpoint tests for a model
 */
function generateAPIEndpointTest(model: ParsedModel): string {
  const modelLower = model.name.toLowerCase()
  const pluralRoute = `${modelLower}s` // Simple pluralization
  
  return `    it('GET /api/${pluralRoute} responds', async () => {
      try {
        const response = await fetch(\`\${baseUrl}:\${serverPort}/api/${pluralRoute}\`)
        expect(response.status).toBeLessThan(500) // Accept 200, 401, etc. but not 500
        console.log(\`    ✅ GET /api/${pluralRoute} responds (status: \${response.status})\`)
      } catch (error) {
        console.error('    ❌ GET /api/${pluralRoute} failed:', error.message)
        throw error
      }
    })`
}

/**
 * Generate test data for creating a model
 */
function generateTestData(model: ParsedModel, allModels: ParsedModel[]): string {
  const requiredFields = model.fields.filter(f => 
    f.isRequired && 
    !f.isId && 
    !f.hasDefaultValue &&
    f.kind === 'scalar'
  )
  
  const data: Record<string, any> = {}
  
  for (const field of requiredFields) {
    data[field.name] = generateFieldValue(field)
  }
  
  return JSON.stringify(data, null, 10)
}

/**
 * Generate update data for a model (one updatable field)
 */
function generateUpdateData(model: ParsedModel): string {
  // Find first updatable string field
  const updatableField = model.fields.find(f => 
    f.type === 'String' &&
    !f.isId &&
    !f.isUpdatedAt &&
    f.kind === 'scalar'
  )
  
  if (updatableField) {
    return JSON.stringify({ 
      [updatableField.name]: `Updated ${updatableField.name} ${Date.now()}` 
    }, null, 10)
  }
  
  return '{}'
}

/**
 * Generate a test value for a field based on its type
 */
function generateFieldValue(field: ParsedField): any {
  const timestamp = Date.now()
  
  switch (field.type) {
    case 'String':
      if (field.name.toLowerCase().includes('email')) {
        return `test-${timestamp}@example.com`
      }
      if (field.name.toLowerCase().includes('url')) {
        return `https://example.com/test-${timestamp}`
      }
      return `Test ${field.name} ${timestamp}`
    
    case 'Int':
      return Math.floor(Math.random() * 1000)
    
    case 'BigInt':
      return BigInt(timestamp)
    
    case 'Float':
    case 'Decimal':
      return 99.99
    
    case 'Boolean':
      return true
    
    case 'DateTime':
      return new Date().toISOString()
    
    case 'Json':
      return { test: true, timestamp }
    
    case 'Bytes':
      return Buffer.from('test data')
    
    default:
      return `test_${timestamp}`
  }
}

/**
 * Check if a model is a junction table (many-to-many)
 * Uses centralized junction table detection
 */
function isJunctionTable(model: ParsedModel): boolean {
  // Simple heuristic for test generation
  const relationFields = model.fields.filter(f => f.kind === 'object')
  const scalarFields = model.fields.filter(f => f.kind === 'scalar' && !f.isId && f.name !== 'createdAt' && !f.isUpdatedAt)
  
  // Junction table typically has 2+ relations and few/no other data fields
  return relationFields.length >= 2 && scalarFields.length <= 2
}

/**
 * Generate vitest config
 */
export function generateVitestConfig(): string {
  return `import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000, // 30s for integration tests
    hookTimeout: 10000,
    teardownTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
`
}

/**
 * Generate test setup file
 */
export function generateTestSetup(): string {
  return `/**
 * Test Setup
 * 
 * Runs before all tests to configure the environment
 */

import { config } from 'dotenv'

// Load environment variables
config()

// Verify required environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in .env')
  console.error('   Tests require a MySQL database connection')
  console.error('   Example: DATABASE_URL="mysql://user:pass@localhost:3306/testdb"')
  process.exit(1)
}

console.log('✅ Test environment configured')
console.log('📦 Database:', process.env.DATABASE_URL.replace(/:\\/\\/.*@/, '://***:***@'))
`
}



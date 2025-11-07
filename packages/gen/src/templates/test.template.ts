/**
 * Test Template Generator
 * 
 * Generates Vitest test scaffolding with Supertest integration
 */

import type { ParsedModel } from '../dmmf-parser.js'
import { toKebabCase, toCamelCase } from '../utils/naming.js'

/**
 * Generate Vitest configuration file
 */
export function generateVitestConfig(): string {
  return `import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'gen/**',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@gen': path.resolve(__dirname, './gen'),
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
 * Global test configuration and utilities
 */

import { beforeAll, afterAll, afterEach } from 'vitest'
import prisma from '../src/db.js'

// Setup runs once before all tests
beforeAll(async () => {
  // Optional: Run migrations or seed test data
  // await prisma.$executeRaw\`CREATE DATABASE IF NOT EXISTS test_db\`
})

// Cleanup after each test
afterEach(async () => {
  // Clean up test data between tests
  // This helps maintain test isolation
  
  // NOTE: This uses PostgreSQL-specific syntax
  // For other databases, adapt the cleanup strategy
  try {
    const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>\`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    \`
    
    for (const { tablename } of tablenames) {
      if (tablename !== '_prisma_migrations') {
        try {
          await prisma.$executeRawUnsafe(\`TRUNCATE TABLE "\${tablename}" CASCADE;\`)
        } catch (error) {
          console.log(\`Error truncating \${tablename}\`, error)
        }
      }
    }
  } catch (error) {
    // For non-PostgreSQL databases, you may need to manually delete records
    // Example: await prisma.user.deleteMany()
    console.warn('Database cleanup failed:', error)
  }
})

// Cleanup after all tests
afterAll(async () => {
  await prisma.$disconnect()
})
`
}

/**
 * Generate integration tests for a model
 */
export function generateModelTests(model: ParsedModel): string {
  const modelName = model.name
  const modelKebab = toKebabCase(modelName)
  const modelCamel = toCamelCase(modelName)
  const pluralPath = `${modelKebab}s`
  const idType = model.idField?.type === 'String' ? 'string' : 'number'
  
  // Generate example test data
  const createData = generateTestData(model, 'create')
  const updateData = generateTestData(model, 'update')

  return `/**
 * ${modelName} API Tests
 * 
 * Integration tests for ${modelName} endpoints
 */

import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import prisma from '../src/db.js'

describe('${modelName} API', () => {
  let app: any
  let created${modelName}Id: ${idType}

  beforeEach(async () => {
    app = createApp()
  })

  describe('POST /api/${pluralPath}', () => {
    it('should create a new ${modelName}', async () => {
      const response = await request(app)
        .post('/api/${pluralPath}')
        .send(${JSON.stringify(createData, null, 6)})
        .expect(201)

      expect(response.body).toMatchObject(${JSON.stringify(createData, null, 6)})
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('createdAt')
      
      created${modelName}Id = response.body.id
    })

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/${pluralPath}')
        .send({})
        .expect(400)

      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('Validation')
    })

    ${model.scalarFields.some(f => f.isUnique) ? `
    it('should return 409 for duplicate unique field', async () => {
      // Create first record
      await request(app)
        .post('/api/${pluralPath}')
        .send(${JSON.stringify(createData, null, 6)})
        .expect(201)

      // Try to create duplicate
      const response = await request(app)
        .post('/api/${pluralPath}')
        .send(${JSON.stringify(createData, null, 6)})
        .expect(409)

      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('already exists')
    })` : ''}
  })

  describe('GET /api/${pluralPath}', () => {
    beforeEach(async () => {
      // Create test data
      await request(app)
        .post('/api/${pluralPath}')
        .send(${JSON.stringify(createData, null, 6)})
    })

    it('should return paginated list', async () => {
      const response = await request(app)
        .get('/api/${pluralPath}')
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('meta')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.meta).toMatchObject({
        total: expect.any(Number),
        skip: expect.any(Number),
        take: expect.any(Number),
        hasMore: expect.any(Boolean),
      })
    })

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/${pluralPath}?skip=0&take=10')
        .expect(200)

      expect(response.body.meta.skip).toBe(0)
      expect(response.body.meta.take).toBe(10)
    })
  })

  describe('GET /api/${pluralPath}/:id', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/${pluralPath}')
        .send(${JSON.stringify(createData, null, 6)})
      
      created${modelName}Id = response.body.id
    })

    it('should return ${modelName} by id', async () => {
      const response = await request(app)
        .get(\`/api/${pluralPath}/\${created${modelName}Id}\`)
        .expect(200)

      expect(response.body).toMatchObject(${JSON.stringify(createData, null, 6)})
      expect(response.body.id).toBe(created${modelName}Id)
    })

    it('should return 404 for non-existent id', async () => {
      const nonExistentId = ${idType === 'string' ? "'non-existent-id'" : '999999'}
      
      const response = await request(app)
        .get(\`/api/${pluralPath}/\${nonExistentId}\`)
        .expect(404)

      expect(response.body).toHaveProperty('error')
    })
  })

  describe('PATCH /api/${pluralPath}/:id', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/${pluralPath}')
        .send(${JSON.stringify(createData, null, 6)})
      
      created${modelName}Id = response.body.id
    })

    it('should update ${modelName}', async () => {
      const response = await request(app)
        .patch(\`/api/${pluralPath}/\${created${modelName}Id}\`)
        .send(${JSON.stringify(updateData, null, 6)})
        .expect(200)

      expect(response.body).toMatchObject(${JSON.stringify(updateData, null, 6)})
      expect(response.body.id).toBe(created${modelName}Id)
    })

    it('should return 404 for non-existent id', async () => {
      const nonExistentId = ${idType === 'string' ? "'non-existent-id'" : '999999'}
      
      const response = await request(app)
        .patch(\`/api/${pluralPath}/\${nonExistentId}\`)
        .send(${JSON.stringify(updateData, null, 6)})
        .expect(404)

      expect(response.body).toHaveProperty('error')
    })
  })

  describe('DELETE /api/${pluralPath}/:id', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/${pluralPath}')
        .send(${JSON.stringify(createData, null, 6)})
      
      created${modelName}Id = response.body.id
    })

    it('should delete ${modelName}', async () => {
      await request(app)
        .delete(\`/api/${pluralPath}/\${created${modelName}Id}\`)
        .expect(204)

      // Verify deleted
      await request(app)
        .get(\`/api/${pluralPath}/\${created${modelName}Id}\`)
        .expect(404)
    })

    it('should return 404 for non-existent id', async () => {
      const nonExistentId = ${idType === 'string' ? "'non-existent-id'" : '999999'}
      
      await request(app)
        .delete(\`/api/${pluralPath}/\${nonExistentId}\`)
        .expect(404)
    })
  })
})
`
}

/**
 * Generate realistic test data for a model
 */
function generateTestData(model: ParsedModel, context: 'create' | 'update'): Record<string, any> {
  const data: Record<string, any> = {}

  const fields = context === 'create' ? model.createFields : model.updateFields.slice(0, 2) // Update only 2 fields for tests

  for (const field of fields) {
    // Skip auto-generated fields
    if (context === 'create' && (field.name === 'id' || field.name === 'createdAt' || field.name === 'updatedAt')) {
      continue
    }

    // Skip optional fields sometimes in create
    if (context === 'create' && !field.isRequired && Math.random() > 0.5) {
      continue
    }

    const name = field.name.toLowerCase()

    // Smart test data based on field name and type
    if (name.includes('email')) {
      data[field.name] = 'test@example.com'
    } else if (name.includes('name')) {
      data[field.name] = field.name.includes('first') ? 'John' : field.name.includes('last') ? 'Doe' : 'Test Name'
    } else if (name.includes('title')) {
      data[field.name] = context === 'update' ? 'Updated Title' : 'Test Title'
    } else if (name.includes('description')) {
      data[field.name] = 'Test description'
    } else if (name.includes('slug')) {
      data[field.name] = context === 'update' ? 'updated-slug' : 'test-slug'
    } else if (name.includes('url')) {
      data[field.name] = 'https://example.com'
    } else if (name.includes('price')) {
      data[field.name] = 29.99
    } else if (name.includes('quantity') || name.includes('count') || name.includes('stock')) {
      data[field.name] = 10
    } else if (name.includes('active') || name.includes('enabled') || name.includes('published')) {
      data[field.name] = true
    } else {
      // Type-based defaults
      switch (field.type) {
        case 'String':
          data[field.name] = context === 'update' ? 'updated value' : 'test value'
          break
        case 'Int':
          data[field.name] = 42
          break
        case 'Float':
        case 'Decimal':
          data[field.name] = 3.14
          break
        case 'Boolean':
          data[field.name] = true
          break
        case 'DateTime':
          data[field.name] = new Date().toISOString()
          break
        default:
          if (field.kind === 'enum') {
            data[field.name] = `${field.type}_VALUE_1`
          }
      }
    }
  }

  return data
}

/**
 * Generate README for tests
 */
export function generateTestReadme(): string {
  return `# Tests

This directory contains integration tests for the generated API.

## Running Tests

\`\`\`bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test tests/todos.test.ts
\`\`\`

## Test Structure

- **Integration Tests**: Test entire API endpoints end-to-end
- **Supertest**: HTTP assertions for API testing
- **Vitest**: Fast unit test framework with TypeScript support

## Writing Tests

Each model has a corresponding test file that covers:

- ✅ Create (POST)
- ✅ Read List (GET)
- ✅ Read Single (GET /:id)
- ✅ Update (PATCH /:id)
- ✅ Delete (DELETE /:id)
- ✅ Error cases (validation, not found, conflicts)

Example:

\`\`\`typescript
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'

describe('POST /api/todos', () => {
  it('should create todo', async () => {
    const app = createApp()
    
    const response = await request(app)
      .post('/api/todos')
      .send({ title: 'Test', completed: false })
      .expect(201)
    
    expect(response.body).toMatchObject({
      title: 'Test',
      completed: false
    })
  })
})
\`\`\`

## Test Database

Tests use the same database configured in \`.env\`. Make sure to:

1. Use a separate test database
2. Run migrations: \`npm run db:push\`
3. Tests auto-clean data between runs

## Coverage

Aim for:
- 80%+ code coverage
- All happy paths tested
- Key error cases covered
- Edge cases for business logic
`
}


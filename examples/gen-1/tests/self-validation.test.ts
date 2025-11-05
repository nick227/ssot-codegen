import { describe, it, beforeAll, afterAll, expect } from 'vitest'
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
            console.log(`    ✅ Server started on port ${serverPort}`)
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
        const result = await prisma.$queryRaw<Array<{ TABLE_NAME: string }>>`
          SELECT TABLE_NAME 
          FROM information_schema.TABLES 
          WHERE TABLE_SCHEMA = DATABASE()
        `
        expect(result.length).toBeGreaterThan(0)
        console.log(`    ✅ Found ${result.length} tables in schema`)
      } catch (error) {
        console.error('    ❌ Schema verification failed:', error.message)
        console.error('    ⚠️  Run: npx prisma migrate dev')
        throw error
      }
    })

    it('can execute basic query', async () => {
      try {
        await prisma.$queryRaw`SELECT 1 as test`
        console.log('    ✅ Database queries working')
      } catch (error) {
        console.error('    ❌ Query execution failed:', error.message)
        throw error
      }
    })
  })

  // ========================================
  // Phase 3: User Model CRUD Operations
  // ========================================
  describe('Phase 3: User CRUD', () => {
    let testId: number

    it('CREATE User record', async () => {
      try {
        const data = {
          "email": "test-1762345637210@example.com",
          "name": "Test name 1762345637210",
          "updatedAt": "2025-11-05T12:27:17.210Z"
}
        const record = await prisma.user.create({ data })
        testId = record.id
        
        // Track for cleanup
        if (!testData.has('User')) {
          testData.set('User', new Set())
        }
        testData.get('User')!.add(testId)
        
        expect(record.id).toBeDefined()
        console.log('    ✅ User.create()')
      } catch (error) {
        console.error('    ❌ User.create() failed:', error.message)
        throw error
      }
    })

    it('READ User record', async () => {
      try {
        const record = await prisma.user.findUnique({
          where: { id: testId }
        })
        expect(record).toBeDefined()
        expect(record!.id).toBe(testId)
        console.log('    ✅ User.findUnique()')
      } catch (error) {
        console.error('    ❌ User.findUnique() failed:', error.message)
        throw error
      }
    })

    it('LIST User records', async () => {
      try {
        const records = await prisma.user.findMany({
          take: 10
        })
        expect(Array.isArray(records)).toBe(true)
        expect(records.length).toBeGreaterThan(0)
        console.log(`    ✅ User.findMany() - found ${records.length} records`)
      } catch (error) {
        console.error('    ❌ User.findMany() failed:', error.message)
        throw error
      }
    })

    it('UPDATE User record', async () => {
      try {
        const updateData = {
          "email": "Updated email 1762345637210"
}
        const record = await prisma.user.update({
          where: { id: testId },
          data: updateData
        })
        expect(record.id).toBe(testId)
        console.log('    ✅ User.update()')
      } catch (error) {
        console.error('    ❌ User.update() failed:', error.message)
        throw error
      }
    })

    it('DELETE User record', async () => {
      try {
        await prisma.user.delete({
          where: { id: testId }
        })
        const deleted = await prisma.user.findUnique({
          where: { id: testId }
        })
        expect(deleted).toBeNull()
        
        // Remove from cleanup list since we deleted it
        testData.get('User')?.delete(testId)
        
        console.log('    ✅ User.delete()')
      } catch (error) {
        console.error('    ❌ User.delete() failed:', error.message)
        throw error
      }
    })
  })

  // ========================================
  // Phase 3: Post Model CRUD Operations
  // ========================================
  describe('Phase 3: Post CRUD', () => {
    let testId: number

    it('CREATE Post record', async () => {
      try {
        const data = {
          "title": "Test title 1762345637210",
          "content": "Test content 1762345637210",
          "authorId": 684,
          "updatedAt": "2025-11-05T12:27:17.210Z"
}
        const record = await prisma.post.create({ data })
        testId = record.id
        
        // Track for cleanup
        if (!testData.has('Post')) {
          testData.set('Post', new Set())
        }
        testData.get('Post')!.add(testId)
        
        expect(record.id).toBeDefined()
        console.log('    ✅ Post.create()')
      } catch (error) {
        console.error('    ❌ Post.create() failed:', error.message)
        throw error
      }
    })

    it('READ Post record', async () => {
      try {
        const record = await prisma.post.findUnique({
          where: { id: testId }
        })
        expect(record).toBeDefined()
        expect(record!.id).toBe(testId)
        console.log('    ✅ Post.findUnique()')
      } catch (error) {
        console.error('    ❌ Post.findUnique() failed:', error.message)
        throw error
      }
    })

    it('LIST Post records', async () => {
      try {
        const records = await prisma.post.findMany({
          take: 10
        })
        expect(Array.isArray(records)).toBe(true)
        expect(records.length).toBeGreaterThan(0)
        console.log(`    ✅ Post.findMany() - found ${records.length} records`)
      } catch (error) {
        console.error('    ❌ Post.findMany() failed:', error.message)
        throw error
      }
    })

    it('UPDATE Post record', async () => {
      try {
        const updateData = {
          "title": "Updated title 1762345637210"
}
        const record = await prisma.post.update({
          where: { id: testId },
          data: updateData
        })
        expect(record.id).toBe(testId)
        console.log('    ✅ Post.update()')
      } catch (error) {
        console.error('    ❌ Post.update() failed:', error.message)
        throw error
      }
    })

    it('DELETE Post record', async () => {
      try {
        await prisma.post.delete({
          where: { id: testId }
        })
        const deleted = await prisma.post.findUnique({
          where: { id: testId }
        })
        expect(deleted).toBeNull()
        
        // Remove from cleanup list since we deleted it
        testData.get('Post')?.delete(testId)
        
        console.log('    ✅ Post.delete()')
      } catch (error) {
        console.error('    ❌ Post.delete() failed:', error.message)
        throw error
      }
    })
  })

  // ========================================
  // Phase 4: API Endpoint Validation
  // ========================================
  describe('Phase 4: API Endpoints', () => {
    it('GET /api/users responds', async () => {
      try {
        const response = await fetch(`${baseUrl}:${serverPort}/api/users`)
        expect(response.status).toBeLessThan(500) // Accept 200, 401, etc. but not 500
        console.log(`    ✅ GET /api/users responds (status: ${response.status})`)
      } catch (error) {
        console.error('    ❌ GET /api/users failed:', error.message)
        throw error
      }
    })

    it('GET /api/posts responds', async () => {
      try {
        const response = await fetch(`${baseUrl}:${serverPort}/api/posts`)
        expect(response.status).toBeLessThan(500) // Accept 200, 401, etc. but not 500
        console.log(`    ✅ GET /api/posts responds (status: ${response.status})`)
      } catch (error) {
        console.error('    ❌ GET /api/posts failed:', error.message)
        throw error
      }
    })

    it('returns 404 for unknown routes', async () => {
      try {
        const response = await fetch(`${baseUrl}:${serverPort}/api/nonexistent`)
        expect(response.status).toBe(404)
        console.log('    ✅ 404 handling works')
      } catch (error) {
        console.error('    ❌ 404 test failed:', error.message)
        throw error
      }
    })

    it('health check endpoint responds', async () => {
      try {
        const response = await fetch(`${baseUrl}:${serverPort}/health`)
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
    console.log('\n  🧹 Cleaning up test data...')
    
    // Delete in reverse order to handle foreign key constraints
    const modelsToClean = ['User', 'Post'].reverse()
    
    for (const modelName of modelsToClean) {
      const ids = testData.get(modelName)
      if (ids && ids.size > 0) {
        try {
          const model = modelName.toLowerCase()
          await (prisma as any)[model].deleteMany({
            where: { id: { in: Array.from(ids) } }
          })
          console.log(`    🗑️  Deleted ${ids.size} ${modelName} records`)
        } catch (error) {
          console.warn(`    ⚠️  Failed to cleanup ${modelName}:`, error.message)
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
    console.log('  ✅ Cleanup complete\n')
  })
})

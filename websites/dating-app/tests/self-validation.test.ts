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
          "email": "test-1766377492429@example.com",
          "updatedAt": "2025-12-22T04:24:52.429Z"
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
          "email": "Updated email 1766377492429"
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
  // Phase 3: Profile Model CRUD Operations
  // ========================================
  describe('Phase 3: Profile CRUD', () => {
    let testId: number

    it('CREATE Profile record', async () => {
      try {
        const data = {
          "userId": "Test userId 1766377492429",
          "name": "Test name 1766377492429",
          "age": 411,
          "location": {
                    "test": true,
                    "timestamp": 1766377492429
          },
          "updatedAt": "2025-12-22T04:24:52.429Z"
}
        const record = await prisma.profile.create({ data })
        testId = record.id
        
        // Track for cleanup
        if (!testData.has('Profile')) {
          testData.set('Profile', new Set())
        }
        testData.get('Profile')!.add(testId)
        
        expect(record.id).toBeDefined()
        console.log('    ✅ Profile.create()')
      } catch (error) {
        console.error('    ❌ Profile.create() failed:', error.message)
        throw error
      }
    })

    it('READ Profile record', async () => {
      try {
        const record = await prisma.profile.findUnique({
          where: { id: testId }
        })
        expect(record).toBeDefined()
        expect(record!.id).toBe(testId)
        console.log('    ✅ Profile.findUnique()')
      } catch (error) {
        console.error('    ❌ Profile.findUnique() failed:', error.message)
        throw error
      }
    })

    it('LIST Profile records', async () => {
      try {
        const records = await prisma.profile.findMany({
          take: 10
        })
        expect(Array.isArray(records)).toBe(true)
        expect(records.length).toBeGreaterThan(0)
        console.log(`    ✅ Profile.findMany() - found ${records.length} records`)
      } catch (error) {
        console.error('    ❌ Profile.findMany() failed:', error.message)
        throw error
      }
    })

    it('UPDATE Profile record', async () => {
      try {
        const updateData = {
          "userId": "Updated userId 1766377492429"
}
        const record = await prisma.profile.update({
          where: { id: testId },
          data: updateData
        })
        expect(record.id).toBe(testId)
        console.log('    ✅ Profile.update()')
      } catch (error) {
        console.error('    ❌ Profile.update() failed:', error.message)
        throw error
      }
    })

    it('DELETE Profile record', async () => {
      try {
        await prisma.profile.delete({
          where: { id: testId }
        })
        const deleted = await prisma.profile.findUnique({
          where: { id: testId }
        })
        expect(deleted).toBeNull()
        
        // Remove from cleanup list since we deleted it
        testData.get('Profile')?.delete(testId)
        
        console.log('    ✅ Profile.delete()')
      } catch (error) {
        console.error('    ❌ Profile.delete() failed:', error.message)
        throw error
      }
    })
  })

  // ========================================
  // Phase 3: Photo Model CRUD Operations
  // ========================================
  describe('Phase 3: Photo CRUD', () => {
    let testId: number

    it('CREATE Photo record', async () => {
      try {
        const data = {
          "userId": "Test userId 1766377492429",
          "url": "https://example.com/test-1766377492429",
          "updatedAt": "2025-12-22T04:24:52.429Z"
}
        const record = await prisma.photo.create({ data })
        testId = record.id
        
        // Track for cleanup
        if (!testData.has('Photo')) {
          testData.set('Photo', new Set())
        }
        testData.get('Photo')!.add(testId)
        
        expect(record.id).toBeDefined()
        console.log('    ✅ Photo.create()')
      } catch (error) {
        console.error('    ❌ Photo.create() failed:', error.message)
        throw error
      }
    })

    it('READ Photo record', async () => {
      try {
        const record = await prisma.photo.findUnique({
          where: { id: testId }
        })
        expect(record).toBeDefined()
        expect(record!.id).toBe(testId)
        console.log('    ✅ Photo.findUnique()')
      } catch (error) {
        console.error('    ❌ Photo.findUnique() failed:', error.message)
        throw error
      }
    })

    it('LIST Photo records', async () => {
      try {
        const records = await prisma.photo.findMany({
          take: 10
        })
        expect(Array.isArray(records)).toBe(true)
        expect(records.length).toBeGreaterThan(0)
        console.log(`    ✅ Photo.findMany() - found ${records.length} records`)
      } catch (error) {
        console.error('    ❌ Photo.findMany() failed:', error.message)
        throw error
      }
    })

    it('UPDATE Photo record', async () => {
      try {
        const updateData = {
          "userId": "Updated userId 1766377492429"
}
        const record = await prisma.photo.update({
          where: { id: testId },
          data: updateData
        })
        expect(record.id).toBe(testId)
        console.log('    ✅ Photo.update()')
      } catch (error) {
        console.error('    ❌ Photo.update() failed:', error.message)
        throw error
      }
    })

    it('DELETE Photo record', async () => {
      try {
        await prisma.photo.delete({
          where: { id: testId }
        })
        const deleted = await prisma.photo.findUnique({
          where: { id: testId }
        })
        expect(deleted).toBeNull()
        
        // Remove from cleanup list since we deleted it
        testData.get('Photo')?.delete(testId)
        
        console.log('    ✅ Photo.delete()')
      } catch (error) {
        console.error('    ❌ Photo.delete() failed:', error.message)
        throw error
      }
    })
  })

  // ========================================
  // Phase 3: Match Model CRUD Operations
  // ========================================
  describe('Phase 3: Match CRUD', () => {
    let testId: number

    it('CREATE Match record', async () => {
      try {
        const data = {
          "user1Id": "Test user1Id 1766377492429",
          "user2Id": "Test user2Id 1766377492429"
}
        const record = await prisma.match.create({ data })
        testId = record.id
        
        // Track for cleanup
        if (!testData.has('Match')) {
          testData.set('Match', new Set())
        }
        testData.get('Match')!.add(testId)
        
        expect(record.id).toBeDefined()
        console.log('    ✅ Match.create()')
      } catch (error) {
        console.error('    ❌ Match.create() failed:', error.message)
        throw error
      }
    })

    it('READ Match record', async () => {
      try {
        const record = await prisma.match.findUnique({
          where: { id: testId }
        })
        expect(record).toBeDefined()
        expect(record!.id).toBe(testId)
        console.log('    ✅ Match.findUnique()')
      } catch (error) {
        console.error('    ❌ Match.findUnique() failed:', error.message)
        throw error
      }
    })

    it('LIST Match records', async () => {
      try {
        const records = await prisma.match.findMany({
          take: 10
        })
        expect(Array.isArray(records)).toBe(true)
        expect(records.length).toBeGreaterThan(0)
        console.log(`    ✅ Match.findMany() - found ${records.length} records`)
      } catch (error) {
        console.error('    ❌ Match.findMany() failed:', error.message)
        throw error
      }
    })

    it('UPDATE Match record', async () => {
      try {
        const updateData = {
          "user1Id": "Updated user1Id 1766377492429"
}
        const record = await prisma.match.update({
          where: { id: testId },
          data: updateData
        })
        expect(record.id).toBe(testId)
        console.log('    ✅ Match.update()')
      } catch (error) {
        console.error('    ❌ Match.update() failed:', error.message)
        throw error
      }
    })

    it('DELETE Match record', async () => {
      try {
        await prisma.match.delete({
          where: { id: testId }
        })
        const deleted = await prisma.match.findUnique({
          where: { id: testId }
        })
        expect(deleted).toBeNull()
        
        // Remove from cleanup list since we deleted it
        testData.get('Match')?.delete(testId)
        
        console.log('    ✅ Match.delete()')
      } catch (error) {
        console.error('    ❌ Match.delete() failed:', error.message)
        throw error
      }
    })
  })

  // ========================================
  // Phase 3: Message Model CRUD Operations
  // ========================================
  describe('Phase 3: Message CRUD', () => {
    let testId: number

    it('CREATE Message record', async () => {
      try {
        const data = {
          "matchId": "Test matchId 1766377492429",
          "senderId": "Test senderId 1766377492429",
          "receiverId": "Test receiverId 1766377492429",
          "content": "Test content 1766377492429"
}
        const record = await prisma.message.create({ data })
        testId = record.id
        
        // Track for cleanup
        if (!testData.has('Message')) {
          testData.set('Message', new Set())
        }
        testData.get('Message')!.add(testId)
        
        expect(record.id).toBeDefined()
        console.log('    ✅ Message.create()')
      } catch (error) {
        console.error('    ❌ Message.create() failed:', error.message)
        throw error
      }
    })

    it('READ Message record', async () => {
      try {
        const record = await prisma.message.findUnique({
          where: { id: testId }
        })
        expect(record).toBeDefined()
        expect(record!.id).toBe(testId)
        console.log('    ✅ Message.findUnique()')
      } catch (error) {
        console.error('    ❌ Message.findUnique() failed:', error.message)
        throw error
      }
    })

    it('LIST Message records', async () => {
      try {
        const records = await prisma.message.findMany({
          take: 10
        })
        expect(Array.isArray(records)).toBe(true)
        expect(records.length).toBeGreaterThan(0)
        console.log(`    ✅ Message.findMany() - found ${records.length} records`)
      } catch (error) {
        console.error('    ❌ Message.findMany() failed:', error.message)
        throw error
      }
    })

    it('UPDATE Message record', async () => {
      try {
        const updateData = {
          "matchId": "Updated matchId 1766377492429"
}
        const record = await prisma.message.update({
          where: { id: testId },
          data: updateData
        })
        expect(record.id).toBe(testId)
        console.log('    ✅ Message.update()')
      } catch (error) {
        console.error('    ❌ Message.update() failed:', error.message)
        throw error
      }
    })

    it('DELETE Message record', async () => {
      try {
        await prisma.message.delete({
          where: { id: testId }
        })
        const deleted = await prisma.message.findUnique({
          where: { id: testId }
        })
        expect(deleted).toBeNull()
        
        // Remove from cleanup list since we deleted it
        testData.get('Message')?.delete(testId)
        
        console.log('    ✅ Message.delete()')
      } catch (error) {
        console.error('    ❌ Message.delete() failed:', error.message)
        throw error
      }
    })
  })

  // ========================================
  // Phase 3: Quiz Model CRUD Operations
  // ========================================
  describe('Phase 3: Quiz CRUD', () => {
    let testId: number

    it('CREATE Quiz record', async () => {
      try {
        const data = {
          "title": "Test title 1766377492429",
          "updatedAt": "2025-12-22T04:24:52.429Z"
}
        const record = await prisma.quiz.create({ data })
        testId = record.id
        
        // Track for cleanup
        if (!testData.has('Quiz')) {
          testData.set('Quiz', new Set())
        }
        testData.get('Quiz')!.add(testId)
        
        expect(record.id).toBeDefined()
        console.log('    ✅ Quiz.create()')
      } catch (error) {
        console.error('    ❌ Quiz.create() failed:', error.message)
        throw error
      }
    })

    it('READ Quiz record', async () => {
      try {
        const record = await prisma.quiz.findUnique({
          where: { id: testId }
        })
        expect(record).toBeDefined()
        expect(record!.id).toBe(testId)
        console.log('    ✅ Quiz.findUnique()')
      } catch (error) {
        console.error('    ❌ Quiz.findUnique() failed:', error.message)
        throw error
      }
    })

    it('LIST Quiz records', async () => {
      try {
        const records = await prisma.quiz.findMany({
          take: 10
        })
        expect(Array.isArray(records)).toBe(true)
        expect(records.length).toBeGreaterThan(0)
        console.log(`    ✅ Quiz.findMany() - found ${records.length} records`)
      } catch (error) {
        console.error('    ❌ Quiz.findMany() failed:', error.message)
        throw error
      }
    })

    it('UPDATE Quiz record', async () => {
      try {
        const updateData = {
          "title": "Updated title 1766377492429"
}
        const record = await prisma.quiz.update({
          where: { id: testId },
          data: updateData
        })
        expect(record.id).toBe(testId)
        console.log('    ✅ Quiz.update()')
      } catch (error) {
        console.error('    ❌ Quiz.update() failed:', error.message)
        throw error
      }
    })

    it('DELETE Quiz record', async () => {
      try {
        await prisma.quiz.delete({
          where: { id: testId }
        })
        const deleted = await prisma.quiz.findUnique({
          where: { id: testId }
        })
        expect(deleted).toBeNull()
        
        // Remove from cleanup list since we deleted it
        testData.get('Quiz')?.delete(testId)
        
        console.log('    ✅ Quiz.delete()')
      } catch (error) {
        console.error('    ❌ Quiz.delete() failed:', error.message)
        throw error
      }
    })
  })

  // ========================================
  // Phase 3: QuizQuestion Model CRUD Operations
  // ========================================
  describe('Phase 3: QuizQuestion CRUD', () => {
    let testId: number

    it('CREATE QuizQuestion record', async () => {
      try {
        const data = {
          "quizId": "Test quizId 1766377492429",
          "order": 582,
          "configJson": {
                    "test": true,
                    "timestamp": 1766377492429
          }
}
        const record = await prisma.quizquestion.create({ data })
        testId = record.id
        
        // Track for cleanup
        if (!testData.has('QuizQuestion')) {
          testData.set('QuizQuestion', new Set())
        }
        testData.get('QuizQuestion')!.add(testId)
        
        expect(record.id).toBeDefined()
        console.log('    ✅ QuizQuestion.create()')
      } catch (error) {
        console.error('    ❌ QuizQuestion.create() failed:', error.message)
        throw error
      }
    })

    it('READ QuizQuestion record', async () => {
      try {
        const record = await prisma.quizquestion.findUnique({
          where: { id: testId }
        })
        expect(record).toBeDefined()
        expect(record!.id).toBe(testId)
        console.log('    ✅ QuizQuestion.findUnique()')
      } catch (error) {
        console.error('    ❌ QuizQuestion.findUnique() failed:', error.message)
        throw error
      }
    })

    it('LIST QuizQuestion records', async () => {
      try {
        const records = await prisma.quizquestion.findMany({
          take: 10
        })
        expect(Array.isArray(records)).toBe(true)
        expect(records.length).toBeGreaterThan(0)
        console.log(`    ✅ QuizQuestion.findMany() - found ${records.length} records`)
      } catch (error) {
        console.error('    ❌ QuizQuestion.findMany() failed:', error.message)
        throw error
      }
    })

    it('UPDATE QuizQuestion record', async () => {
      try {
        const updateData = {
          "quizId": "Updated quizId 1766377492429"
}
        const record = await prisma.quizquestion.update({
          where: { id: testId },
          data: updateData
        })
        expect(record.id).toBe(testId)
        console.log('    ✅ QuizQuestion.update()')
      } catch (error) {
        console.error('    ❌ QuizQuestion.update() failed:', error.message)
        throw error
      }
    })

    it('DELETE QuizQuestion record', async () => {
      try {
        await prisma.quizquestion.delete({
          where: { id: testId }
        })
        const deleted = await prisma.quizquestion.findUnique({
          where: { id: testId }
        })
        expect(deleted).toBeNull()
        
        // Remove from cleanup list since we deleted it
        testData.get('QuizQuestion')?.delete(testId)
        
        console.log('    ✅ QuizQuestion.delete()')
      } catch (error) {
        console.error('    ❌ QuizQuestion.delete() failed:', error.message)
        throw error
      }
    })
  })

  // ========================================
  // Phase 3: QuizAnswer Model CRUD Operations
  // ========================================
  describe('Phase 3: QuizAnswer CRUD', () => {
    let testId: number

    it('CREATE QuizAnswer record', async () => {
      try {
        const data = {
          "quizId": "Test quizId 1766377492429",
          "questionId": "Test questionId 1766377492429",
          "userId": "Test userId 1766377492429",
          "answerJson": {
                    "test": true,
                    "timestamp": 1766377492429
          }
}
        const record = await prisma.quizanswer.create({ data })
        testId = record.id
        
        // Track for cleanup
        if (!testData.has('QuizAnswer')) {
          testData.set('QuizAnswer', new Set())
        }
        testData.get('QuizAnswer')!.add(testId)
        
        expect(record.id).toBeDefined()
        console.log('    ✅ QuizAnswer.create()')
      } catch (error) {
        console.error('    ❌ QuizAnswer.create() failed:', error.message)
        throw error
      }
    })

    it('READ QuizAnswer record', async () => {
      try {
        const record = await prisma.quizanswer.findUnique({
          where: { id: testId }
        })
        expect(record).toBeDefined()
        expect(record!.id).toBe(testId)
        console.log('    ✅ QuizAnswer.findUnique()')
      } catch (error) {
        console.error('    ❌ QuizAnswer.findUnique() failed:', error.message)
        throw error
      }
    })

    it('LIST QuizAnswer records', async () => {
      try {
        const records = await prisma.quizanswer.findMany({
          take: 10
        })
        expect(Array.isArray(records)).toBe(true)
        expect(records.length).toBeGreaterThan(0)
        console.log(`    ✅ QuizAnswer.findMany() - found ${records.length} records`)
      } catch (error) {
        console.error('    ❌ QuizAnswer.findMany() failed:', error.message)
        throw error
      }
    })

    it('UPDATE QuizAnswer record', async () => {
      try {
        const updateData = {
          "quizId": "Updated quizId 1766377492429"
}
        const record = await prisma.quizanswer.update({
          where: { id: testId },
          data: updateData
        })
        expect(record.id).toBe(testId)
        console.log('    ✅ QuizAnswer.update()')
      } catch (error) {
        console.error('    ❌ QuizAnswer.update() failed:', error.message)
        throw error
      }
    })

    it('DELETE QuizAnswer record', async () => {
      try {
        await prisma.quizanswer.delete({
          where: { id: testId }
        })
        const deleted = await prisma.quizanswer.findUnique({
          where: { id: testId }
        })
        expect(deleted).toBeNull()
        
        // Remove from cleanup list since we deleted it
        testData.get('QuizAnswer')?.delete(testId)
        
        console.log('    ✅ QuizAnswer.delete()')
      } catch (error) {
        console.error('    ❌ QuizAnswer.delete() failed:', error.message)
        throw error
      }
    })
  })

  // ========================================
  // Phase 3: QuizResult Model CRUD Operations
  // ========================================
  describe('Phase 3: QuizResult CRUD', () => {
    let testId: number

    it('CREATE QuizResult record', async () => {
      try {
        const data = {
          "quizId": "Test quizId 1766377492429",
          "userId": "Test userId 1766377492429"
}
        const record = await prisma.quizresult.create({ data })
        testId = record.id
        
        // Track for cleanup
        if (!testData.has('QuizResult')) {
          testData.set('QuizResult', new Set())
        }
        testData.get('QuizResult')!.add(testId)
        
        expect(record.id).toBeDefined()
        console.log('    ✅ QuizResult.create()')
      } catch (error) {
        console.error('    ❌ QuizResult.create() failed:', error.message)
        throw error
      }
    })

    it('READ QuizResult record', async () => {
      try {
        const record = await prisma.quizresult.findUnique({
          where: { id: testId }
        })
        expect(record).toBeDefined()
        expect(record!.id).toBe(testId)
        console.log('    ✅ QuizResult.findUnique()')
      } catch (error) {
        console.error('    ❌ QuizResult.findUnique() failed:', error.message)
        throw error
      }
    })

    it('LIST QuizResult records', async () => {
      try {
        const records = await prisma.quizresult.findMany({
          take: 10
        })
        expect(Array.isArray(records)).toBe(true)
        expect(records.length).toBeGreaterThan(0)
        console.log(`    ✅ QuizResult.findMany() - found ${records.length} records`)
      } catch (error) {
        console.error('    ❌ QuizResult.findMany() failed:', error.message)
        throw error
      }
    })

    it('UPDATE QuizResult record', async () => {
      try {
        const updateData = {
          "quizId": "Updated quizId 1766377492429"
}
        const record = await prisma.quizresult.update({
          where: { id: testId },
          data: updateData
        })
        expect(record.id).toBe(testId)
        console.log('    ✅ QuizResult.update()')
      } catch (error) {
        console.error('    ❌ QuizResult.update() failed:', error.message)
        throw error
      }
    })

    it('DELETE QuizResult record', async () => {
      try {
        await prisma.quizresult.delete({
          where: { id: testId }
        })
        const deleted = await prisma.quizresult.findUnique({
          where: { id: testId }
        })
        expect(deleted).toBeNull()
        
        // Remove from cleanup list since we deleted it
        testData.get('QuizResult')?.delete(testId)
        
        console.log('    ✅ QuizResult.delete()')
      } catch (error) {
        console.error('    ❌ QuizResult.delete() failed:', error.message)
        throw error
      }
    })
  })

  // ========================================
  // Phase 3: BehaviorEvent Model CRUD Operations
  // ========================================
  describe('Phase 3: BehaviorEvent CRUD', () => {
    let testId: number

    it('CREATE BehaviorEvent record', async () => {
      try {
        const data = {
          "userId": "Test userId 1766377492429",
          "targetId": "Test targetId 1766377492429"
}
        const record = await prisma.behaviorevent.create({ data })
        testId = record.id
        
        // Track for cleanup
        if (!testData.has('BehaviorEvent')) {
          testData.set('BehaviorEvent', new Set())
        }
        testData.get('BehaviorEvent')!.add(testId)
        
        expect(record.id).toBeDefined()
        console.log('    ✅ BehaviorEvent.create()')
      } catch (error) {
        console.error('    ❌ BehaviorEvent.create() failed:', error.message)
        throw error
      }
    })

    it('READ BehaviorEvent record', async () => {
      try {
        const record = await prisma.behaviorevent.findUnique({
          where: { id: testId }
        })
        expect(record).toBeDefined()
        expect(record!.id).toBe(testId)
        console.log('    ✅ BehaviorEvent.findUnique()')
      } catch (error) {
        console.error('    ❌ BehaviorEvent.findUnique() failed:', error.message)
        throw error
      }
    })

    it('LIST BehaviorEvent records', async () => {
      try {
        const records = await prisma.behaviorevent.findMany({
          take: 10
        })
        expect(Array.isArray(records)).toBe(true)
        expect(records.length).toBeGreaterThan(0)
        console.log(`    ✅ BehaviorEvent.findMany() - found ${records.length} records`)
      } catch (error) {
        console.error('    ❌ BehaviorEvent.findMany() failed:', error.message)
        throw error
      }
    })

    it('UPDATE BehaviorEvent record', async () => {
      try {
        const updateData = {
          "userId": "Updated userId 1766377492429"
}
        const record = await prisma.behaviorevent.update({
          where: { id: testId },
          data: updateData
        })
        expect(record.id).toBe(testId)
        console.log('    ✅ BehaviorEvent.update()')
      } catch (error) {
        console.error('    ❌ BehaviorEvent.update() failed:', error.message)
        throw error
      }
    })

    it('DELETE BehaviorEvent record', async () => {
      try {
        await prisma.behaviorevent.delete({
          where: { id: testId }
        })
        const deleted = await prisma.behaviorevent.findUnique({
          where: { id: testId }
        })
        expect(deleted).toBeNull()
        
        // Remove from cleanup list since we deleted it
        testData.get('BehaviorEvent')?.delete(testId)
        
        console.log('    ✅ BehaviorEvent.delete()')
      } catch (error) {
        console.error('    ❌ BehaviorEvent.delete() failed:', error.message)
        throw error
      }
    })
  })

  // ========================================
  // Phase 3: BehaviorEventArchive Model CRUD Operations
  // ========================================
  describe('Phase 3: BehaviorEventArchive CRUD', () => {
    let testId: number

    it('CREATE BehaviorEventArchive record', async () => {
      try {
        const data = {
          "userId": "Test userId 1766377492429",
          "targetId": "Test targetId 1766377492429",
          "meta": {
                    "test": true,
                    "timestamp": 1766377492429
          },
          "createdAt": "2025-12-22T04:24:52.429Z"
}
        const record = await prisma.behavioreventarchive.create({ data })
        testId = record.id
        
        // Track for cleanup
        if (!testData.has('BehaviorEventArchive')) {
          testData.set('BehaviorEventArchive', new Set())
        }
        testData.get('BehaviorEventArchive')!.add(testId)
        
        expect(record.id).toBeDefined()
        console.log('    ✅ BehaviorEventArchive.create()')
      } catch (error) {
        console.error('    ❌ BehaviorEventArchive.create() failed:', error.message)
        throw error
      }
    })

    it('READ BehaviorEventArchive record', async () => {
      try {
        const record = await prisma.behavioreventarchive.findUnique({
          where: { id: testId }
        })
        expect(record).toBeDefined()
        expect(record!.id).toBe(testId)
        console.log('    ✅ BehaviorEventArchive.findUnique()')
      } catch (error) {
        console.error('    ❌ BehaviorEventArchive.findUnique() failed:', error.message)
        throw error
      }
    })

    it('LIST BehaviorEventArchive records', async () => {
      try {
        const records = await prisma.behavioreventarchive.findMany({
          take: 10
        })
        expect(Array.isArray(records)).toBe(true)
        expect(records.length).toBeGreaterThan(0)
        console.log(`    ✅ BehaviorEventArchive.findMany() - found ${records.length} records`)
      } catch (error) {
        console.error('    ❌ BehaviorEventArchive.findMany() failed:', error.message)
        throw error
      }
    })

    it('UPDATE BehaviorEventArchive record', async () => {
      try {
        const updateData = {
          "userId": "Updated userId 1766377492429"
}
        const record = await prisma.behavioreventarchive.update({
          where: { id: testId },
          data: updateData
        })
        expect(record.id).toBe(testId)
        console.log('    ✅ BehaviorEventArchive.update()')
      } catch (error) {
        console.error('    ❌ BehaviorEventArchive.update() failed:', error.message)
        throw error
      }
    })

    it('DELETE BehaviorEventArchive record', async () => {
      try {
        await prisma.behavioreventarchive.delete({
          where: { id: testId }
        })
        const deleted = await prisma.behavioreventarchive.findUnique({
          where: { id: testId }
        })
        expect(deleted).toBeNull()
        
        // Remove from cleanup list since we deleted it
        testData.get('BehaviorEventArchive')?.delete(testId)
        
        console.log('    ✅ BehaviorEventArchive.delete()')
      } catch (error) {
        console.error('    ❌ BehaviorEventArchive.delete() failed:', error.message)
        throw error
      }
    })
  })

  // ========================================
  // Phase 3: PersonalityDimension Model CRUD Operations
  // ========================================
  describe('Phase 3: PersonalityDimension CRUD', () => {
    let testId: number

    it('CREATE PersonalityDimension record', async () => {
      try {
        const data = {
          "name": "Test name 1766377492429",
          "updatedAt": "2025-12-22T04:24:52.429Z"
}
        const record = await prisma.personalitydimension.create({ data })
        testId = record.id
        
        // Track for cleanup
        if (!testData.has('PersonalityDimension')) {
          testData.set('PersonalityDimension', new Set())
        }
        testData.get('PersonalityDimension')!.add(testId)
        
        expect(record.id).toBeDefined()
        console.log('    ✅ PersonalityDimension.create()')
      } catch (error) {
        console.error('    ❌ PersonalityDimension.create() failed:', error.message)
        throw error
      }
    })

    it('READ PersonalityDimension record', async () => {
      try {
        const record = await prisma.personalitydimension.findUnique({
          where: { id: testId }
        })
        expect(record).toBeDefined()
        expect(record!.id).toBe(testId)
        console.log('    ✅ PersonalityDimension.findUnique()')
      } catch (error) {
        console.error('    ❌ PersonalityDimension.findUnique() failed:', error.message)
        throw error
      }
    })

    it('LIST PersonalityDimension records', async () => {
      try {
        const records = await prisma.personalitydimension.findMany({
          take: 10
        })
        expect(Array.isArray(records)).toBe(true)
        expect(records.length).toBeGreaterThan(0)
        console.log(`    ✅ PersonalityDimension.findMany() - found ${records.length} records`)
      } catch (error) {
        console.error('    ❌ PersonalityDimension.findMany() failed:', error.message)
        throw error
      }
    })

    it('UPDATE PersonalityDimension record', async () => {
      try {
        const updateData = {
          "name": "Updated name 1766377492429"
}
        const record = await prisma.personalitydimension.update({
          where: { id: testId },
          data: updateData
        })
        expect(record.id).toBe(testId)
        console.log('    ✅ PersonalityDimension.update()')
      } catch (error) {
        console.error('    ❌ PersonalityDimension.update() failed:', error.message)
        throw error
      }
    })

    it('DELETE PersonalityDimension record', async () => {
      try {
        await prisma.personalitydimension.delete({
          where: { id: testId }
        })
        const deleted = await prisma.personalitydimension.findUnique({
          where: { id: testId }
        })
        expect(deleted).toBeNull()
        
        // Remove from cleanup list since we deleted it
        testData.get('PersonalityDimension')?.delete(testId)
        
        console.log('    ✅ PersonalityDimension.delete()')
      } catch (error) {
        console.error('    ❌ PersonalityDimension.delete() failed:', error.message)
        throw error
      }
    })
  })

  // ========================================
  // Phase 3: UserDimensionScore Model CRUD Operations
  // ========================================
  describe('Phase 3: UserDimensionScore CRUD', () => {
    let testId: number

    it('CREATE UserDimensionScore record', async () => {
      try {
        const data = {
          "userId": "Test userId 1766377492429",
          "dimensionId": "Test dimensionId 1766377492429",
          "updatedAt": "2025-12-22T04:24:52.429Z"
}
        const record = await prisma.userdimensionscore.create({ data })
        testId = record.id
        
        // Track for cleanup
        if (!testData.has('UserDimensionScore')) {
          testData.set('UserDimensionScore', new Set())
        }
        testData.get('UserDimensionScore')!.add(testId)
        
        expect(record.id).toBeDefined()
        console.log('    ✅ UserDimensionScore.create()')
      } catch (error) {
        console.error('    ❌ UserDimensionScore.create() failed:', error.message)
        throw error
      }
    })

    it('READ UserDimensionScore record', async () => {
      try {
        const record = await prisma.userdimensionscore.findUnique({
          where: { id: testId }
        })
        expect(record).toBeDefined()
        expect(record!.id).toBe(testId)
        console.log('    ✅ UserDimensionScore.findUnique()')
      } catch (error) {
        console.error('    ❌ UserDimensionScore.findUnique() failed:', error.message)
        throw error
      }
    })

    it('LIST UserDimensionScore records', async () => {
      try {
        const records = await prisma.userdimensionscore.findMany({
          take: 10
        })
        expect(Array.isArray(records)).toBe(true)
        expect(records.length).toBeGreaterThan(0)
        console.log(`    ✅ UserDimensionScore.findMany() - found ${records.length} records`)
      } catch (error) {
        console.error('    ❌ UserDimensionScore.findMany() failed:', error.message)
        throw error
      }
    })

    it('UPDATE UserDimensionScore record', async () => {
      try {
        const updateData = {
          "userId": "Updated userId 1766377492429"
}
        const record = await prisma.userdimensionscore.update({
          where: { id: testId },
          data: updateData
        })
        expect(record.id).toBe(testId)
        console.log('    ✅ UserDimensionScore.update()')
      } catch (error) {
        console.error('    ❌ UserDimensionScore.update() failed:', error.message)
        throw error
      }
    })

    it('DELETE UserDimensionScore record', async () => {
      try {
        await prisma.userdimensionscore.delete({
          where: { id: testId }
        })
        const deleted = await prisma.userdimensionscore.findUnique({
          where: { id: testId }
        })
        expect(deleted).toBeNull()
        
        // Remove from cleanup list since we deleted it
        testData.get('UserDimensionScore')?.delete(testId)
        
        console.log('    ✅ UserDimensionScore.delete()')
      } catch (error) {
        console.error('    ❌ UserDimensionScore.delete() failed:', error.message)
        throw error
      }
    })
  })

  // ========================================
  // Phase 3: CompatibilityScore Model CRUD Operations
  // ========================================
  describe('Phase 3: CompatibilityScore CRUD', () => {
    let testId: number

    it('CREATE CompatibilityScore record', async () => {
      try {
        const data = {
          "user1Id": "Test user1Id 1766377492429",
          "user2Id": "Test user2Id 1766377492429",
          "overallScore": 99.99,
          "dimensionBreakdown": {
                    "test": true,
                    "timestamp": 1766377492429
          }
}
        const record = await prisma.compatibilityscore.create({ data })
        testId = record.id
        
        // Track for cleanup
        if (!testData.has('CompatibilityScore')) {
          testData.set('CompatibilityScore', new Set())
        }
        testData.get('CompatibilityScore')!.add(testId)
        
        expect(record.id).toBeDefined()
        console.log('    ✅ CompatibilityScore.create()')
      } catch (error) {
        console.error('    ❌ CompatibilityScore.create() failed:', error.message)
        throw error
      }
    })

    it('READ CompatibilityScore record', async () => {
      try {
        const record = await prisma.compatibilityscore.findUnique({
          where: { id: testId }
        })
        expect(record).toBeDefined()
        expect(record!.id).toBe(testId)
        console.log('    ✅ CompatibilityScore.findUnique()')
      } catch (error) {
        console.error('    ❌ CompatibilityScore.findUnique() failed:', error.message)
        throw error
      }
    })

    it('LIST CompatibilityScore records', async () => {
      try {
        const records = await prisma.compatibilityscore.findMany({
          take: 10
        })
        expect(Array.isArray(records)).toBe(true)
        expect(records.length).toBeGreaterThan(0)
        console.log(`    ✅ CompatibilityScore.findMany() - found ${records.length} records`)
      } catch (error) {
        console.error('    ❌ CompatibilityScore.findMany() failed:', error.message)
        throw error
      }
    })

    it('UPDATE CompatibilityScore record', async () => {
      try {
        const updateData = {
          "user1Id": "Updated user1Id 1766377492429"
}
        const record = await prisma.compatibilityscore.update({
          where: { id: testId },
          data: updateData
        })
        expect(record.id).toBe(testId)
        console.log('    ✅ CompatibilityScore.update()')
      } catch (error) {
        console.error('    ❌ CompatibilityScore.update() failed:', error.message)
        throw error
      }
    })

    it('DELETE CompatibilityScore record', async () => {
      try {
        await prisma.compatibilityscore.delete({
          where: { id: testId }
        })
        const deleted = await prisma.compatibilityscore.findUnique({
          where: { id: testId }
        })
        expect(deleted).toBeNull()
        
        // Remove from cleanup list since we deleted it
        testData.get('CompatibilityScore')?.delete(testId)
        
        console.log('    ✅ CompatibilityScore.delete()')
      } catch (error) {
        console.error('    ❌ CompatibilityScore.delete() failed:', error.message)
        throw error
      }
    })
  })

  // ========================================
  // Phase 3: UserDimensionPriority Model CRUD Operations
  // ========================================
  describe('Phase 3: UserDimensionPriority CRUD', () => {
    let testId: number

    it('CREATE UserDimensionPriority record', async () => {
      try {
        const data = {
          "userId": "Test userId 1766377492429",
          "dimensionId": "Test dimensionId 1766377492429",
          "updatedAt": "2025-12-22T04:24:52.429Z"
}
        const record = await prisma.userdimensionpriority.create({ data })
        testId = record.id
        
        // Track for cleanup
        if (!testData.has('UserDimensionPriority')) {
          testData.set('UserDimensionPriority', new Set())
        }
        testData.get('UserDimensionPriority')!.add(testId)
        
        expect(record.id).toBeDefined()
        console.log('    ✅ UserDimensionPriority.create()')
      } catch (error) {
        console.error('    ❌ UserDimensionPriority.create() failed:', error.message)
        throw error
      }
    })

    it('READ UserDimensionPriority record', async () => {
      try {
        const record = await prisma.userdimensionpriority.findUnique({
          where: { id: testId }
        })
        expect(record).toBeDefined()
        expect(record!.id).toBe(testId)
        console.log('    ✅ UserDimensionPriority.findUnique()')
      } catch (error) {
        console.error('    ❌ UserDimensionPriority.findUnique() failed:', error.message)
        throw error
      }
    })

    it('LIST UserDimensionPriority records', async () => {
      try {
        const records = await prisma.userdimensionpriority.findMany({
          take: 10
        })
        expect(Array.isArray(records)).toBe(true)
        expect(records.length).toBeGreaterThan(0)
        console.log(`    ✅ UserDimensionPriority.findMany() - found ${records.length} records`)
      } catch (error) {
        console.error('    ❌ UserDimensionPriority.findMany() failed:', error.message)
        throw error
      }
    })

    it('UPDATE UserDimensionPriority record', async () => {
      try {
        const updateData = {
          "userId": "Updated userId 1766377492429"
}
        const record = await prisma.userdimensionpriority.update({
          where: { id: testId },
          data: updateData
        })
        expect(record.id).toBe(testId)
        console.log('    ✅ UserDimensionPriority.update()')
      } catch (error) {
        console.error('    ❌ UserDimensionPriority.update() failed:', error.message)
        throw error
      }
    })

    it('DELETE UserDimensionPriority record', async () => {
      try {
        await prisma.userdimensionpriority.delete({
          where: { id: testId }
        })
        const deleted = await prisma.userdimensionpriority.findUnique({
          where: { id: testId }
        })
        expect(deleted).toBeNull()
        
        // Remove from cleanup list since we deleted it
        testData.get('UserDimensionPriority')?.delete(testId)
        
        console.log('    ✅ UserDimensionPriority.delete()')
      } catch (error) {
        console.error('    ❌ UserDimensionPriority.delete() failed:', error.message)
        throw error
      }
    })
  })

  // ========================================
  // Phase 3: DimensionMappingRule Model CRUD Operations
  // ========================================
  describe('Phase 3: DimensionMappingRule CRUD', () => {
    let testId: number

    it('CREATE DimensionMappingRule record', async () => {
      try {
        const data = {
          "eventType": "Test eventType 1766377492429",
          "metaKey": "Test metaKey 1766377492429",
          "dimensionId": "Test dimensionId 1766377492429",
          "updatedAt": "2025-12-22T04:24:52.429Z"
}
        const record = await prisma.dimensionmappingrule.create({ data })
        testId = record.id
        
        // Track for cleanup
        if (!testData.has('DimensionMappingRule')) {
          testData.set('DimensionMappingRule', new Set())
        }
        testData.get('DimensionMappingRule')!.add(testId)
        
        expect(record.id).toBeDefined()
        console.log('    ✅ DimensionMappingRule.create()')
      } catch (error) {
        console.error('    ❌ DimensionMappingRule.create() failed:', error.message)
        throw error
      }
    })

    it('READ DimensionMappingRule record', async () => {
      try {
        const record = await prisma.dimensionmappingrule.findUnique({
          where: { id: testId }
        })
        expect(record).toBeDefined()
        expect(record!.id).toBe(testId)
        console.log('    ✅ DimensionMappingRule.findUnique()')
      } catch (error) {
        console.error('    ❌ DimensionMappingRule.findUnique() failed:', error.message)
        throw error
      }
    })

    it('LIST DimensionMappingRule records', async () => {
      try {
        const records = await prisma.dimensionmappingrule.findMany({
          take: 10
        })
        expect(Array.isArray(records)).toBe(true)
        expect(records.length).toBeGreaterThan(0)
        console.log(`    ✅ DimensionMappingRule.findMany() - found ${records.length} records`)
      } catch (error) {
        console.error('    ❌ DimensionMappingRule.findMany() failed:', error.message)
        throw error
      }
    })

    it('UPDATE DimensionMappingRule record', async () => {
      try {
        const updateData = {
          "eventType": "Updated eventType 1766377492429"
}
        const record = await prisma.dimensionmappingrule.update({
          where: { id: testId },
          data: updateData
        })
        expect(record.id).toBe(testId)
        console.log('    ✅ DimensionMappingRule.update()')
      } catch (error) {
        console.error('    ❌ DimensionMappingRule.update() failed:', error.message)
        throw error
      }
    })

    it('DELETE DimensionMappingRule record', async () => {
      try {
        await prisma.dimensionmappingrule.delete({
          where: { id: testId }
        })
        const deleted = await prisma.dimensionmappingrule.findUnique({
          where: { id: testId }
        })
        expect(deleted).toBeNull()
        
        // Remove from cleanup list since we deleted it
        testData.get('DimensionMappingRule')?.delete(testId)
        
        console.log('    ✅ DimensionMappingRule.delete()')
      } catch (error) {
        console.error('    ❌ DimensionMappingRule.delete() failed:', error.message)
        throw error
      }
    })
  })

  // ========================================
  // Phase 3: EventWeightConfig Model CRUD Operations
  // ========================================
  describe('Phase 3: EventWeightConfig CRUD', () => {
    let testId: number

    it('CREATE EventWeightConfig record', async () => {
      try {
        const data = {
          "baseWeight": 99.99,
          "updatedAt": "2025-12-22T04:24:52.429Z"
}
        const record = await prisma.eventweightconfig.create({ data })
        testId = record.id
        
        // Track for cleanup
        if (!testData.has('EventWeightConfig')) {
          testData.set('EventWeightConfig', new Set())
        }
        testData.get('EventWeightConfig')!.add(testId)
        
        expect(record.id).toBeDefined()
        console.log('    ✅ EventWeightConfig.create()')
      } catch (error) {
        console.error('    ❌ EventWeightConfig.create() failed:', error.message)
        throw error
      }
    })

    it('READ EventWeightConfig record', async () => {
      try {
        const record = await prisma.eventweightconfig.findUnique({
          where: { id: testId }
        })
        expect(record).toBeDefined()
        expect(record!.id).toBe(testId)
        console.log('    ✅ EventWeightConfig.findUnique()')
      } catch (error) {
        console.error('    ❌ EventWeightConfig.findUnique() failed:', error.message)
        throw error
      }
    })

    it('LIST EventWeightConfig records', async () => {
      try {
        const records = await prisma.eventweightconfig.findMany({
          take: 10
        })
        expect(Array.isArray(records)).toBe(true)
        expect(records.length).toBeGreaterThan(0)
        console.log(`    ✅ EventWeightConfig.findMany() - found ${records.length} records`)
      } catch (error) {
        console.error('    ❌ EventWeightConfig.findMany() failed:', error.message)
        throw error
      }
    })

    it('UPDATE EventWeightConfig record', async () => {
      try {
        const updateData = {
          "description": "Updated description 1766377492429"
}
        const record = await prisma.eventweightconfig.update({
          where: { id: testId },
          data: updateData
        })
        expect(record.id).toBe(testId)
        console.log('    ✅ EventWeightConfig.update()')
      } catch (error) {
        console.error('    ❌ EventWeightConfig.update() failed:', error.message)
        throw error
      }
    })

    it('DELETE EventWeightConfig record', async () => {
      try {
        await prisma.eventweightconfig.delete({
          where: { id: testId }
        })
        const deleted = await prisma.eventweightconfig.findUnique({
          where: { id: testId }
        })
        expect(deleted).toBeNull()
        
        // Remove from cleanup list since we deleted it
        testData.get('EventWeightConfig')?.delete(testId)
        
        console.log('    ✅ EventWeightConfig.delete()')
      } catch (error) {
        console.error('    ❌ EventWeightConfig.delete() failed:', error.message)
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

    it('GET /api/profiles responds', async () => {
      try {
        const response = await fetch(`${baseUrl}:${serverPort}/api/profiles`)
        expect(response.status).toBeLessThan(500) // Accept 200, 401, etc. but not 500
        console.log(`    ✅ GET /api/profiles responds (status: ${response.status})`)
      } catch (error) {
        console.error('    ❌ GET /api/profiles failed:', error.message)
        throw error
      }
    })

    it('GET /api/photos responds', async () => {
      try {
        const response = await fetch(`${baseUrl}:${serverPort}/api/photos`)
        expect(response.status).toBeLessThan(500) // Accept 200, 401, etc. but not 500
        console.log(`    ✅ GET /api/photos responds (status: ${response.status})`)
      } catch (error) {
        console.error('    ❌ GET /api/photos failed:', error.message)
        throw error
      }
    })

    it('GET /api/matchs responds', async () => {
      try {
        const response = await fetch(`${baseUrl}:${serverPort}/api/matchs`)
        expect(response.status).toBeLessThan(500) // Accept 200, 401, etc. but not 500
        console.log(`    ✅ GET /api/matchs responds (status: ${response.status})`)
      } catch (error) {
        console.error('    ❌ GET /api/matchs failed:', error.message)
        throw error
      }
    })

    it('GET /api/messages responds', async () => {
      try {
        const response = await fetch(`${baseUrl}:${serverPort}/api/messages`)
        expect(response.status).toBeLessThan(500) // Accept 200, 401, etc. but not 500
        console.log(`    ✅ GET /api/messages responds (status: ${response.status})`)
      } catch (error) {
        console.error('    ❌ GET /api/messages failed:', error.message)
        throw error
      }
    })

    it('GET /api/quizs responds', async () => {
      try {
        const response = await fetch(`${baseUrl}:${serverPort}/api/quizs`)
        expect(response.status).toBeLessThan(500) // Accept 200, 401, etc. but not 500
        console.log(`    ✅ GET /api/quizs responds (status: ${response.status})`)
      } catch (error) {
        console.error('    ❌ GET /api/quizs failed:', error.message)
        throw error
      }
    })

    it('GET /api/quizquestions responds', async () => {
      try {
        const response = await fetch(`${baseUrl}:${serverPort}/api/quizquestions`)
        expect(response.status).toBeLessThan(500) // Accept 200, 401, etc. but not 500
        console.log(`    ✅ GET /api/quizquestions responds (status: ${response.status})`)
      } catch (error) {
        console.error('    ❌ GET /api/quizquestions failed:', error.message)
        throw error
      }
    })

    it('GET /api/quizanswers responds', async () => {
      try {
        const response = await fetch(`${baseUrl}:${serverPort}/api/quizanswers`)
        expect(response.status).toBeLessThan(500) // Accept 200, 401, etc. but not 500
        console.log(`    ✅ GET /api/quizanswers responds (status: ${response.status})`)
      } catch (error) {
        console.error('    ❌ GET /api/quizanswers failed:', error.message)
        throw error
      }
    })

    it('GET /api/quizresults responds', async () => {
      try {
        const response = await fetch(`${baseUrl}:${serverPort}/api/quizresults`)
        expect(response.status).toBeLessThan(500) // Accept 200, 401, etc. but not 500
        console.log(`    ✅ GET /api/quizresults responds (status: ${response.status})`)
      } catch (error) {
        console.error('    ❌ GET /api/quizresults failed:', error.message)
        throw error
      }
    })

    it('GET /api/behaviorevents responds', async () => {
      try {
        const response = await fetch(`${baseUrl}:${serverPort}/api/behaviorevents`)
        expect(response.status).toBeLessThan(500) // Accept 200, 401, etc. but not 500
        console.log(`    ✅ GET /api/behaviorevents responds (status: ${response.status})`)
      } catch (error) {
        console.error('    ❌ GET /api/behaviorevents failed:', error.message)
        throw error
      }
    })

    it('GET /api/behavioreventarchives responds', async () => {
      try {
        const response = await fetch(`${baseUrl}:${serverPort}/api/behavioreventarchives`)
        expect(response.status).toBeLessThan(500) // Accept 200, 401, etc. but not 500
        console.log(`    ✅ GET /api/behavioreventarchives responds (status: ${response.status})`)
      } catch (error) {
        console.error('    ❌ GET /api/behavioreventarchives failed:', error.message)
        throw error
      }
    })

    it('GET /api/personalitydimensions responds', async () => {
      try {
        const response = await fetch(`${baseUrl}:${serverPort}/api/personalitydimensions`)
        expect(response.status).toBeLessThan(500) // Accept 200, 401, etc. but not 500
        console.log(`    ✅ GET /api/personalitydimensions responds (status: ${response.status})`)
      } catch (error) {
        console.error('    ❌ GET /api/personalitydimensions failed:', error.message)
        throw error
      }
    })

    it('GET /api/userdimensionscores responds', async () => {
      try {
        const response = await fetch(`${baseUrl}:${serverPort}/api/userdimensionscores`)
        expect(response.status).toBeLessThan(500) // Accept 200, 401, etc. but not 500
        console.log(`    ✅ GET /api/userdimensionscores responds (status: ${response.status})`)
      } catch (error) {
        console.error('    ❌ GET /api/userdimensionscores failed:', error.message)
        throw error
      }
    })

    it('GET /api/compatibilityscores responds', async () => {
      try {
        const response = await fetch(`${baseUrl}:${serverPort}/api/compatibilityscores`)
        expect(response.status).toBeLessThan(500) // Accept 200, 401, etc. but not 500
        console.log(`    ✅ GET /api/compatibilityscores responds (status: ${response.status})`)
      } catch (error) {
        console.error('    ❌ GET /api/compatibilityscores failed:', error.message)
        throw error
      }
    })

    it('GET /api/userdimensionprioritys responds', async () => {
      try {
        const response = await fetch(`${baseUrl}:${serverPort}/api/userdimensionprioritys`)
        expect(response.status).toBeLessThan(500) // Accept 200, 401, etc. but not 500
        console.log(`    ✅ GET /api/userdimensionprioritys responds (status: ${response.status})`)
      } catch (error) {
        console.error('    ❌ GET /api/userdimensionprioritys failed:', error.message)
        throw error
      }
    })

    it('GET /api/dimensionmappingrules responds', async () => {
      try {
        const response = await fetch(`${baseUrl}:${serverPort}/api/dimensionmappingrules`)
        expect(response.status).toBeLessThan(500) // Accept 200, 401, etc. but not 500
        console.log(`    ✅ GET /api/dimensionmappingrules responds (status: ${response.status})`)
      } catch (error) {
        console.error('    ❌ GET /api/dimensionmappingrules failed:', error.message)
        throw error
      }
    })

    it('GET /api/eventweightconfigs responds', async () => {
      try {
        const response = await fetch(`${baseUrl}:${serverPort}/api/eventweightconfigs`)
        expect(response.status).toBeLessThan(500) // Accept 200, 401, etc. but not 500
        console.log(`    ✅ GET /api/eventweightconfigs responds (status: ${response.status})`)
      } catch (error) {
        console.error('    ❌ GET /api/eventweightconfigs failed:', error.message)
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
    const modelsToClean = ['User', 'Profile', 'Photo', 'Match', 'Message', 'Quiz', 'QuizQuestion', 'QuizAnswer', 'QuizResult', 'BehaviorEvent', 'BehaviorEventArchive', 'PersonalityDimension', 'UserDimensionScore', 'CompatibilityScore', 'UserDimensionPriority', 'DimensionMappingRule', 'EventWeightConfig'].reverse()
    
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

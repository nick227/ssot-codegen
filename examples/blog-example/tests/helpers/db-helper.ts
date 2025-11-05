/**
 * Database Test Helpers
 * Utilities for managing test database state
 */

import { PrismaClient } from '@prisma/client'

let prismaInstance: PrismaClient | null = null

/**
 * Get or create Prisma test instance
 */
export function getTestPrisma(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || process.env.TEST_DATABASE_URL
        }
      }
    })
  }
  return prismaInstance
}

/**
 * Clean all tables in order (respects foreign keys)
 */
export async function cleanDatabase(prisma: PrismaClient): Promise<void> {
  // Order matters - delete children before parents
  await prisma.comment.deleteMany()
  await prisma.postTag.deleteMany()
  await prisma.postCategory.deleteMany()
  await prisma.post.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.category.deleteMany()
  await prisma.author.deleteMany()
}

/**
 * Disconnect from database
 */
export async function disconnectDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$disconnect()
  prismaInstance = null
}

/**
 * Seed minimal test data
 */
export async function seedTestData(prisma: PrismaClient) {
  const author = await prisma.author.create({
    data: {
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
      role: 'AUTHOR'
    }
  })

  const category = await prisma.category.create({
    data: {
      name: 'Test Category',
      slug: 'test-category',
      description: 'Test category for integration tests'
    }
  })

  const tag = await prisma.tag.create({
    data: {
      name: 'Test Tag',
      slug: 'test-tag'
    }
  })

  const post = await prisma.post.create({
    data: {
      title: 'Test Post',
      slug: 'test-post',
      content: 'Test content',
      excerpt: 'Test excerpt',
      published: true,
      authorId: author.id
    }
  })

  return { author, category, tag, post }
}

/**
 * Create test transaction wrapper
 */
export async function withTransaction<T>(
  prisma: PrismaClient,
  callback: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    return await callback(tx as PrismaClient)
  })
}

/**
 * Reset auto-increment counters (for consistent test IDs)
 */
export async function resetSequences(prisma: PrismaClient): Promise<void> {
  // PostgreSQL
  if (process.env.DATABASE_URL?.includes('postgresql')) {
    await prisma.$executeRawUnsafe(`
      SELECT setval(pg_get_serial_sequence('"Author"', 'id'), 1, false);
      SELECT setval(pg_get_serial_sequence('"Post"', 'id'), 1, false);
      SELECT setval(pg_get_serial_sequence('"Comment"', 'id'), 1, false);
      SELECT setval(pg_get_serial_sequence('"Category"', 'id'), 1, false);
      SELECT setval(pg_get_serial_sequence('"Tag"', 'id'), 1, false);
    `)
  }
  
  // MySQL
  if (process.env.DATABASE_URL?.includes('mysql')) {
    await prisma.$executeRawUnsafe('ALTER TABLE Author AUTO_INCREMENT = 1')
    await prisma.$executeRawUnsafe('ALTER TABLE Post AUTO_INCREMENT = 1')
    await prisma.$executeRawUnsafe('ALTER TABLE Comment AUTO_INCREMENT = 1')
    await prisma.$executeRawUnsafe('ALTER TABLE Category AUTO_INCREMENT = 1')
    await prisma.$executeRawUnsafe('ALTER TABLE Tag AUTO_INCREMENT = 1')
  }
}


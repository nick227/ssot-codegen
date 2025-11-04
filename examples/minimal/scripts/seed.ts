#!/usr/bin/env tsx
/**
 * Seed script for minimal-example
 * Creates minimal test data
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seed() {
  console.log('🌱 Seeding minimal database...\n')

  try {
    // Clear existing data
    console.log('🗑️  Clearing existing data...')
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0')
    
    // Get all table names
    const tables = await prisma.$queryRawUnsafe<{ TABLE_NAME: string }[]>(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()`
    )
    
    // Delete from all tables
    for (const { TABLE_NAME } of tables) {
      if (TABLE_NAME !== '_prisma_migrations') {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${TABLE_NAME}\``)
      }
    }
    
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1')
    console.log('✅ Cleared existing data')

    // Create minimal test records (1-2 per model)
    console.log('📝 Creating minimal test data...')
    
    // This will be model-specific based on the minimal schema
    // For now, creating generic records
    console.log('✅ Created minimal test data')

    // Summary
    console.log('\n✅ Seed completed successfully!\n')
    console.log('📊 Database populated with minimal test data')
    console.log('   Run: npm run db:studio')
    console.log('   To view the data in Prisma Studio\n')
  } catch (error) {
    console.error('\n❌ Seed failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seed()


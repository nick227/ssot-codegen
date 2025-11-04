#!/usr/bin/env tsx
/**
 * Seed script for demo-example
 * Creates sample users and todos for testing
 */

import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/auth/password.js'

const prisma = new PrismaClient()

async function seed() {
  console.log('🌱 Seeding demo database...\n')

  try {
    // Clear existing data
    console.log('🗑️  Clearing existing data...')
    await prisma.todo.deleteMany()
    await prisma.user.deleteMany()

    // Create users
    console.log('👥 Creating users...')
    const password = await hashPassword('Demo123!@#')

    const alice = await prisma.user.create({
      data: {
        email: 'alice@demo.com',
        name: 'Alice Johnson',
        passwordHash: password,
      },
    })

    const bob = await prisma.user.create({
      data: {
        email: 'bob@demo.com',
        name: 'Bob Smith',
        passwordHash: password,
      },
    })

    const charlie = await prisma.user.create({
      data: {
        email: 'charlie@demo.com',
        name: 'Charlie Brown',
        passwordHash: password,
      },
    })

    console.log(`✅ Created ${3} users`)

    // Create todos for Alice
    console.log('📝 Creating todos...')
    await prisma.todo.create({
      data: {
        title: 'Complete project documentation',
        description: 'Write comprehensive docs for the new API',
        completed: false,
        userId: alice.id,
      },
    })

    await prisma.todo.create({
      data: {
        title: 'Review pull requests',
        description: 'Review and merge pending PRs',
        completed: true,
        userId: alice.id,
      },
    })

    await prisma.todo.create({
      data: {
        title: 'Prepare presentation',
        description: 'Create slides for tech talk',
        completed: false,
        userId: alice.id,
      },
    })

    // Create todos for Bob
    await prisma.todo.create({
      data: {
        title: 'Fix authentication bug',
        description: 'Investigate and fix JWT expiration issue',
        completed: false,
        userId: bob.id,
      },
    })

    await prisma.todo.create({
      data: {
        title: 'Update dependencies',
        description: 'npm update and test',
        completed: true,
        userId: bob.id,
      },
    })

    await prisma.todo.create({
      data: {
        title: 'Write unit tests',
        description: 'Add tests for new features',
        completed: false,
        userId: bob.id,
      },
    })

    // Create todos for Charlie
    await prisma.todo.create({
      data: {
        title: 'Deploy to staging',
        description: 'Deploy latest changes to staging environment',
        completed: true,
        userId: charlie.id,
      },
    })

    await prisma.todo.create({
      data: {
        title: 'Database backup',
        description: 'Configure automated backups',
        completed: false,
        userId: charlie.id,
      },
    })

    await prisma.todo.create({
      data: {
        title: 'Monitor performance',
        description: 'Review application metrics and optimize',
        completed: false,
        userId: charlie.id,
      },
    })

    await prisma.todo.create({
      data: {
        title: 'Team meeting',
        description: 'Discuss Q4 roadmap',
        completed: true,
        userId: charlie.id,
      },
    })

    console.log(`✅ Created ${10} todos`)

    // Summary
    console.log('\n✅ Seed completed successfully!\n')
    console.log('📊 Database populated with:')
    console.log(`   - ${3} users`)
    console.log(`   - ${10} todos (6 pending, 4 completed)`)
    console.log('\n🎯 Test credentials:')
    console.log('   Email: alice@demo.com')
    console.log('   Password: Demo123!@#')
    console.log('\n   Email: bob@demo.com')
    console.log('   Password: Demo123!@#')
    console.log('\n   Email: charlie@demo.com')
    console.log('   Password: Demo123!@#\n')
  } catch (error) {
    console.error('\n❌ Seed failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seed()


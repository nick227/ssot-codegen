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
    // Check which models exist in schema
    const modelNames = Object.keys(prisma).filter(key => 
      typeof (prisma as any)[key] === 'object' && 
      (prisma as any)[key].deleteMany
    )
    
    // Try both Todo and todo
    if ('todo' in prisma) {
      await (prisma as any).todo.deleteMany()
    }
    if ('user' in prisma) {
      await (prisma as any).user.deleteMany()
    }
    if ('Todo' in prisma) {
      await (prisma as any).Todo.deleteMany()
    }
    if ('User' in prisma) {
      await (prisma as any).User.deleteMany()
    }

    // Create users
    console.log('👥 Creating users...')
    const password = await hashPassword('Demo123!@#')

    // Use correct model name (User or user)
    const userModel = 'user' in prisma ? (prisma as any).user : (prisma as any).User

    const alice = await userModel.create({
      data: {
        email: 'alice@demo.com',
        name: 'Alice Johnson',
        passwordHash: password,
      },
    })

    const bob = await userModel.create({
      data: {
        email: 'bob@demo.com',
        name: 'Bob Smith',
        passwordHash: password,
      },
    })

    const charlie = await userModel.create({
      data: {
        email: 'charlie@demo.com',
        name: 'Charlie Brown',
        passwordHash: password,
      },
    })

    console.log(`✅ Created ${3} users`)

    // Create todos for Alice
    console.log('📝 Creating todos...')
    const todoModel = 'todo' in prisma ? (prisma as any).todo : (prisma as any).Todo

    await todoModel.create({
      data: {
        title: 'Complete project documentation',
        description: 'Write comprehensive docs for the new API',
        completed: false,
        userId: alice.id,
      },
    })

    await todoModel.create({
      data: {
        title: 'Review pull requests',
        description: 'Review and merge pending PRs',
        completed: true,
        userId: alice.id,
      },
    })

    await todoModel.create({
      data: {
        title: 'Prepare presentation',
        description: 'Create slides for tech talk',
        completed: false,
        userId: alice.id,
      },
    })

    // Create todos for Bob
    await todoModel.create({
      data: {
        title: 'Fix authentication bug',
        description: 'Investigate and fix JWT expiration issue',
        completed: false,
        userId: bob.id,
      },
    })

    await todoModel.create({
      data: {
        title: 'Update dependencies',
        description: 'npm update and test',
        completed: true,
        userId: bob.id,
      },
    })

    await todoModel.create({
      data: {
        title: 'Write unit tests',
        description: 'Add tests for new features',
        completed: false,
        userId: bob.id,
      },
    })

    // Create todos for Charlie
    await todoModel.create({
      data: {
        title: 'Deploy to staging',
        description: 'Deploy latest changes to staging environment',
        completed: true,
        userId: charlie.id,
      },
    })

    await todoModel.create({
      data: {
        title: 'Database backup',
        description: 'Configure automated backups',
        completed: false,
        userId: charlie.id,
      },
    })

    await todoModel.create({
      data: {
        title: 'Monitor performance',
        description: 'Review application metrics and optimize',
        completed: false,
        userId: charlie.id,
      },
    })

    await todoModel.create({
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


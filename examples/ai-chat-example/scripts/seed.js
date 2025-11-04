#!/usr/bin/env node
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/auth/password.js'

const prisma = new PrismaClient()

async function seed() {
  console.log('[ai-chat-example] 🌱 Seeding database...')
  
  try {
    // Clear existing data
    await prisma.$transaction([
      prisma.usageLog.deleteMany(),
      prisma.aiResponse.deleteMany(),
      prisma.aiPrompt.deleteMany(),
      prisma.message.deleteMany(),
      prisma.conversation.deleteMany(),
      prisma.user.deleteMany(),
      prisma.aiModelConfig.deleteMany(),
    ])
    
    console.log('✅ Cleared existing data')
    
    // Create test users
    const password = await hashPassword('Test123!@#')
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@ai-chat.com',
        username: 'admin',
        passwordHash: password,
        credits: 1000,
        role: 'ADMIN',
        isActive: true
      }
    })
    
    const premiumUser = await prisma.user.create({
      data: {
        email: 'premium@ai-chat.com',
        username: 'premium_user',
        passwordHash: password,
        credits: 500,
        role: 'PREMIUM',
        isActive: true
      }
    })
    
    const regularUser = await prisma.user.create({
      data: {
        email: 'user@ai-chat.com',
        username: 'regular_user',
        passwordHash: password,
        credits: 100,
        role: 'USER',
        isActive: true
      }
    })
    
    console.log('✅ Created test users:')
    console.log(`  - admin@ai-chat.com (ADMIN, 1000 credits)`)
    console.log(`  - premium@ai-chat.com (PREMIUM, 500 credits)`)
    console.log(`  - user@ai-chat.com (USER, 100 credits)`)
    console.log(`  - Password for all: Test123!@#`)
    
    // Create AI model configurations
    await prisma.aiModelConfig.createMany({
      data: [
        {
          modelName: 'gpt-4',
          provider: 'openai',
          isActive: true,
          costPer1kPromptTokens: 0.03,
          costPer1kCompletionTokens: 0.06,
          maxTokens: 8192,
          supportsStreaming: true
        },
        {
          modelName: 'gpt-4-turbo',
          provider: 'openai',
          isActive: true,
          costPer1kPromptTokens: 0.01,
          costPer1kCompletionTokens: 0.03,
          maxTokens: 128000,
          supportsStreaming: true
        },
        {
          modelName: 'gpt-3.5-turbo',
          provider: 'openai',
          isActive: true,
          costPer1kPromptTokens: 0.0005,
          costPer1kCompletionTokens: 0.0015,
          maxTokens: 16384,
          supportsStreaming: true
        }
      ]
    })
    
    console.log('✅ Created AI model configurations (gpt-4, gpt-4-turbo, gpt-3.5-turbo)')
    
    // Create sample conversation for demo
    const conversation = await prisma.conversation.create({
      data: {
        userId: regularUser.id,
        title: 'Getting Started with AI',
        model: 'gpt-3.5-turbo',
        systemPrompt: 'You are a helpful AI assistant.'
      }
    })
    
    await prisma.message.createMany({
      data: [
        {
          conversationId: conversation.id,
          userId: regularUser.id,
          role: 'SYSTEM',
          content: 'You are a helpful AI assistant.'
        },
        {
          conversationId: conversation.id,
          userId: regularUser.id,
          role: 'USER',
          content: 'Hello! Can you explain what you can do?'
        },
        {
          conversationId: conversation.id,
          userId: regularUser.id,
          role: 'ASSISTANT',
          content: 'Hello! I can help you with a variety of tasks including answering questions, providing explanations, helping with writing, coding assistance, and general conversation.',
          tokens: 35
        }
      ]
    })
    
    console.log('✅ Created sample conversation')
    
    console.log('\n✅ Seeding complete!')
    console.log('\n📝 Test credentials:')
    console.log('  Email: user@ai-chat.com')
    console.log('  Password: Test123!@#')
    console.log('  Credits: 100')
    
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seed()


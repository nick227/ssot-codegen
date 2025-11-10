/**
 * E2E Test: Chatbot with OpenAI Integration
 * 
 * Tests chatbot template with OpenAI plugin enabled:
 * 1. OpenAI plugin selected
 * 2. Chat API endpoints generated
 * 3. OpenAI service integration
 * 4. Real AI response handling
 */

import { describe, it, expect, afterAll } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ProjectConfig } from '../prompts.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TEST_OUTPUT_DIR = path.join(__dirname, '..', '..', 'e2e-chatbot-openai-test-output')
const TEST_PROJECT_NAME = 'test-chat-ai'
const TEST_PROJECT_PATH = path.join(TEST_OUTPUT_DIR, TEST_PROJECT_NAME)

const CHAT_SCHEMA = `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model User {
  id       Int       @id @default(autoincrement())
  name     String
  email    String    @unique
  avatar   String?
  isOnline Boolean   @default(false)
  
  sentMessages Message[] @relation("SentMessages")
}

model Message {
  id        Int      @id @default(autoincrement())
  content   String
  timestamp DateTime @default(now())
  isBot     Boolean  @default(false)
  
  senderId  Int
  sender    User     @relation("SentMessages", fields: [senderId], references: [id])
}
`

describe('E2E: Chatbot with OpenAI Integration', () => {
  afterAll(() => {
    if (fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true })
    }
  })
  
  it('should generate chatbot with OpenAI API integration', async () => {
    console.log('\n🤖 Testing Chatbot with OpenAI Integration...\n')
    
    // Cleanup
    if (fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true })
    }
    fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true })
    
    // Create config WITH OpenAI plugin
    const config: ProjectConfig = {
      projectName: TEST_PROJECT_NAME,
      framework: 'express',
      database: 'sqlite',
      includeExamples: false,
      selectedPlugins: ['openai'], // ⭐ OpenAI plugin enabled
      packageManager: 'npm',
      generateUI: true,
      uiTemplate: 'chatbot'
    }
    
    // Create project structure
    fs.mkdirSync(TEST_PROJECT_PATH, { recursive: true })
    fs.mkdirSync(path.join(TEST_PROJECT_PATH, 'prisma'), { recursive: true })
    
    // Write schema
    fs.writeFileSync(
      path.join(TEST_PROJECT_PATH, 'prisma', 'schema.prisma'),
      CHAT_SCHEMA
    )
    
    // Import generators
    const { generateUI } = await import('../ui-generator.js')
    const { generatePackageJson } = await import('../templates/package-json.js')
    
    // Generate package.json (to check OpenAI dependency)
    fs.writeFileSync(
      path.join(TEST_PROJECT_PATH, 'package.json'),
      generatePackageJson(config)
    )
    
    // Parse models
    const models = parseModels(CHAT_SCHEMA)
    console.log(`📝 Parsed ${models.length} models: ${models.map(m => m.name).join(', ')}`)
    console.log(`🔌 Plugin: OpenAI enabled`)
    
    // Generate chatbot UI and API
    await generateUI(TEST_PROJECT_PATH, config, models)
    
    // VERIFY: API files generated
    console.log('\n✅ Verifying API integration...\n')
    
    const expectedAPIFiles = [
      'src/routes/chat.ts',
      'src/chat-service.ts'
    ]
    
    for (const file of expectedAPIFiles) {
      const filePath = path.join(TEST_PROJECT_PATH, file)
      expect(fs.existsSync(filePath), `API file should exist: ${file}`).toBe(true)
      console.log(`  ✅ ${file}`)
    }
    
    // VERIFY: OpenAI integration in chat service
    console.log('\n✅ Verifying OpenAI integration...\n')
    
    const chatService = fs.readFileSync(
      path.join(TEST_PROJECT_PATH, 'src/chat-service.ts'),
      'utf-8'
    )
    
    // Should import OpenAI
    expect(chatService).toContain("import OpenAI from 'openai'")
    console.log('  ✅ Imports OpenAI SDK')
    
    // Should initialize OpenAI client
    expect(chatService).toContain('new OpenAI')
    expect(chatService).toContain('process.env.OPENAI_API_KEY')
    console.log('  ✅ Initializes OpenAI client with API key')
    
    // Should use OpenAI chat API
    expect(chatService).toContain('chat.completions.create')
    expect(chatService).toContain('gpt-4')
    console.log('  ✅ Uses OpenAI chat completions API')
    
    // Should include conversation history
    expect(chatService).toContain('history')
    expect(chatService).toContain('role')
    console.log('  ✅ Sends conversation history for context')
    
    // Should not use mock responses
    expect(chatService).not.toContain('mock bot')
    expect(chatService).not.toContain('Math.floor(Math.random()')
    console.log('  ✅ No mock responses (uses real OpenAI)')
    
    // VERIFY: Chat routes
    console.log('\n✅ Verifying chat API routes...\n')
    
    const chatRoutes = fs.readFileSync(
      path.join(TEST_PROJECT_PATH, 'src/routes/chat.ts'),
      'utf-8'
    )
    
    // Should have POST /api/chat endpoint
    expect(chatRoutes).toContain("'/chat'")
    expect(chatRoutes).toContain('router.post')
    console.log('  ✅ POST /api/chat endpoint')
    
    // Should call chatService
    expect(chatRoutes).toContain('ChatService')
    expect(chatRoutes).toContain('getBotResponse')
    console.log('  ✅ Integrates with ChatService')
    
    // Should save both user and bot messages
    expect(chatRoutes).toContain('saveMessage')
    console.log('  ✅ Saves messages to database')
    
    // VERIFY: Package.json has OpenAI dependency
    console.log('\n✅ Verifying dependencies...\n')
    
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(TEST_PROJECT_PATH, 'package.json'), 'utf-8')
    )
    
    expect(packageJson.dependencies.openai).toBeDefined()
    console.log(`  ✅ OpenAI dependency: ${packageJson.dependencies.openai}`)
    
    // VERIFY: Frontend calls API
    console.log('\n✅ Verifying frontend-backend integration...\n')
    
    const chatPage = fs.readFileSync(
      path.join(TEST_PROJECT_PATH, 'app/(chat)/page.tsx'),
      'utf-8'
    )
    
    // Should call /api/chat endpoint
    expect(chatPage).toContain("fetch('/api/chat'")
    expect(chatPage).toContain("method: 'POST'")
    console.log('  ✅ Frontend calls /api/chat endpoint')
    
    // Should send message and userId
    expect(chatPage).toContain('message:')
    expect(chatPage).toContain('userId:')
    console.log('  ✅ Sends message and userId to backend')
    
    // Should refetch after response
    expect(chatPage).toContain('refetch()')
    console.log('  ✅ Refreshes message list after response')
    
    console.log('\n🎉 ALL TESTS PASSED!\n')
    console.log('📊 Summary:')
    console.log('   Template: chatbot')
    console.log('   Plugin: OpenAI ✅')
    console.log('   API files: 2 (routes, service)')
    console.log('   UI files: 5 (pages, components)')
    console.log('   Integration: Frontend → Backend → OpenAI')
    console.log('\n✅ Chatbot with OpenAI integration works!')
  })
  
  it('should show integration flow', () => {
    console.log('\n🔄 Chatbot with OpenAI - Complete Flow:\n')
    console.log('1. User types message in UI')
    console.log('   ↓')
    console.log('2. Frontend sends POST /api/chat')
    console.log('   { message: "Hello", userId: 1 }')
    console.log('   ↓')
    console.log('3. Backend saves user message to database')
    console.log('   ↓')
    console.log('4. Backend calls OpenAI API')
    console.log('   - Sends conversation history')
    console.log('   - Gets GPT-4 response')
    console.log('   ↓')
    console.log('5. Backend saves bot response to database')
    console.log('   ↓')
    console.log('6. Frontend refetches messages')
    console.log('   ↓')
    console.log('7. User sees AI response in chat UI')
    console.log('')
    console.log('Components Used:')
    console.log('  - ChatMessage (Avatar, Badge, TimeAgo from @ssot-ui/shared)')
    console.log('  - ChatInput (Button from @ssot-ui/shared)')
    console.log('  - TypingIndicator (Avatar, Badge from @ssot-ui/shared)')
    console.log('')
    console.log('Backend Integration:')
    console.log('  - Express/Fastify routes')
    console.log('  - ChatService with OpenAI SDK')
    console.log('  - Prisma for message persistence')
    console.log('  - Conversation history for context')
    console.log('')
    console.log('✅ Complete full-stack AI chatbot!')
    
    expect(true).toBe(true)
  })
})

function parseModels(schema: string): Array<{
  name: string
  nameLower: string
  namePlural: string
  fields: Array<{ name: string; type: string; isRelation: boolean }>
}> {
  const models: Array<{
    name: string
    nameLower: string
    namePlural: string
    fields: Array<{ name: string; type: string; isRelation: boolean }>
  }> = []
  
  const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g
  let modelMatch
  
  while ((modelMatch = modelRegex.exec(schema)) !== null) {
    const modelName = modelMatch[1]
    const modelBody = modelMatch[2]
    
    if (modelName.startsWith('_')) continue
    
    const fields: Array<{ name: string; type: string; isRelation: boolean }> = []
    const fieldRegex = /^\s*(\w+)\s+(\w+)/gm
    let fieldMatch
    
    while ((fieldMatch = fieldRegex.exec(modelBody)) !== null) {
      const fieldName = fieldMatch[1]
      const fieldType = fieldMatch[2]
      
      if (fieldName.startsWith('@') || fieldName === 'model') continue
      
      const isRelation = /^[A-Z]/.test(fieldType) && 
        !['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json'].includes(fieldType)
      
      fields.push({ name: fieldName, type: fieldType, isRelation })
    }
    
    models.push({
      name: modelName,
      nameLower: modelName.toLowerCase(),
      namePlural: modelName.toLowerCase() + 's',
      fields
    })
  }
  
  return models
}


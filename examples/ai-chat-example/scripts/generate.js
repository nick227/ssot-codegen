#!/usr/bin/env node
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { generateFromSchema } from '../../../packages/gen/dist/index-new.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')

console.log('[ai-chat-example] Generating code from Prisma schema...')
console.log('[ai-chat-example] 🤖 AI Service Integration Pattern Showcase')

await generateFromSchema({
  schemaPath: resolve(projectRoot, 'prisma/schema.prisma'),
  output: resolve(projectRoot, 'gen'),
  framework: 'express',
})

console.log('[ai-chat-example] ✅ Generation complete!')
console.log('[ai-chat-example] 📦 Generated files include:')
console.log('  - Standard CRUD for User, Conversation, Message, UsageLog, AIModelConfig')
console.log('  - Service Integration for AIPrompt (@service ai-agent)')
console.log('  - AI Agent Controller & Routes (wired to src/services/ai-agent.service.ts)')


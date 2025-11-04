#!/usr/bin/env node
/**
 * Generate WORKING code (not stubs!) from Prisma schema
 * 
 * This uses the new enhanced generator that:
 * - Parses real DMMF from Prisma
 * - Generates actual DTOs with fields
 * - Generates working Zod validators
 * - Generates Services with Prisma queries
 * - Generates Controllers with CRUD operations
 * - Generates Express routes
 */

import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { generateFromSchema } from '../../../packages/gen/dist/index-new.js'
import { scaffoldProject } from '../../../packages/gen/dist/project-scaffold.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')

console.log('\n🚀 [demo-example] Generating WORKING code from Prisma schema...\n')

// Generate code from real Prisma schema
await generateFromSchema({
  schemaPath: resolve(projectRoot, 'prisma', 'schema.prisma'),
  output: resolve(projectRoot, 'gen'),
  framework: 'express'
})

// Generate project scaffolding
console.log('\n📦 [demo-example] Generating project scaffolding...\n')

scaffoldProject({
  projectName: 'demo-example',
  projectRoot,
  description: 'Ultra-light demo with WORKING generated code',
  models: ['Todo'],
  framework: 'express',
  useTypeScript: true,
  dependencies: {
    profile: 'production',
    features: ['logging', 'testing'],
    framework: {
      name: 'express',
      plugins: ['core', 'security']
    }
  }
})

console.log('\n✨ [demo-example] ✅ COMPLETE! Generated WORKING code!')
console.log('\n📋 What you got:')
console.log('  ✅ Real DTOs with actual fields from Prisma schema')
console.log('  ✅ Working Zod validators with type checking')
console.log('  ✅ Service layer with real Prisma queries')
console.log('  ✅ Controllers with full CRUD operations')
console.log('  ✅ Express routes with proper handlers')
console.log('  ✅ Error handling and validation')
console.log('  ✅ Production-ready setup')
console.log('\n📦 Next steps:')
console.log('  1. pnpm install')
console.log('  2. npm run db:push')
console.log('  3. npm run dev')
console.log('\n🎯 Test the API:')
console.log('  GET    http://localhost:3000/api/todos')
console.log('  POST   http://localhost:3000/api/todos')
console.log('  GET    http://localhost:3000/api/todos/:id')
console.log('  PUT    http://localhost:3000/api/todos/:id')
console.log('  DELETE http://localhost:3000/api/todos/:id')
console.log('\n🔥 This is REAL working code, not stubs!')


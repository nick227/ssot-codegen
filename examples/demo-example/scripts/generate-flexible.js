#!/usr/bin/env node
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { runGenerator } from '../../../packages/gen/dist/index.js'
import { scaffoldProject } from '../../../packages/gen/dist/project-scaffold.js'
import { QUICK_CONFIGS } from '../../../packages/gen/dist/dependencies/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')

console.log('[demo-example] Generating with FLEXIBLE dependency system...\n')

// POC: Create stub DMMF
const stubDMMF = {
  models: [
    { name: 'Todo', fields: [] }
  ]
}

// Generate code artifacts
await runGenerator({
  dmmf: stubDMMF,
  config: {
    output: resolve(projectRoot, 'gen'),
    schemaText: 'model Todo { id Int @id }',
  }
})

console.log('\n[demo-example] Choose your dependency setup:\n')

// Option 1: Minimal
console.log('📦 Option 1: MINIMAL (bare essentials)')
console.log('   - @prisma/client, dotenv')
console.log('   - typescript, tsx, prisma\n')

// Option 2: Standard (RECOMMENDED)
console.log('📦 Option 2: STANDARD (recommended)')
console.log('   - Minimal + zod, cors, helmet, compression')
console.log('   - Perfect for most projects\n')

// Option 3: Production
console.log('📦 Option 3: PRODUCTION (prod-ready)')
console.log('   - Standard + pino logging, rate-limit, http-errors')
console.log('   - Ready for deployment\n')

// Option 4: Full
console.log('📦 Option 4: FULL (everything)')
console.log('   - Production + vitest, eslint, prettier')
console.log('   - Complete development setup\n')

// Option 5: Quick Config
console.log('📦 Option 5: QUICK CONFIG (pre-configured)')
console.log('   - Use QUICK_CONFIGS.productionApi')
console.log('   - Optimized for production APIs\n')

// For this demo, let's use PRODUCTION profile with logging and testing
console.log('✨ Generating with PRODUCTION profile + logging + testing...\n')

scaffoldProject({
  projectName: 'demo-example',
  projectRoot,
  description: 'Ultra-light demo with flexible dependencies',
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

console.log('\n[demo-example] ✅ Project generated with flexible dependencies!')
console.log('\n📋 What you got:')
console.log('  ✓ Production profile (pino, rate-limit, http-errors)')
console.log('  ✓ Logging feature (structured JSON logging)')
console.log('  ✓ Testing feature (vitest + supertest)')
console.log('  ✓ Express with core + security plugins')
console.log('\n📦 Next steps:')
console.log('  1. pnpm install')
console.log('  2. npm run generate')
console.log('  3. npm run dev')
console.log('\n🔧 To customize:')
console.log('  - Edit dependencies config in generate-flexible.js')
console.log('  - Choose different profile: minimal, standard, production, full')
console.log('  - Add/remove features: logging, testing, linting, etc.')
console.log('  - Use QUICK_CONFIGS for common scenarios')


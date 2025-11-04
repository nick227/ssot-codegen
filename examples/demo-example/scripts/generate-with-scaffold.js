#!/usr/bin/env node
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { runGenerator, scaffoldProject } from '@ssot-codegen/gen'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')

console.log('[demo-example] Generating complete project with scaffolding...')

// POC: Create stub DMMF with just model names
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
    projectName: 'demo-example',
    description: 'Ultra-light demo: Single table Todo with one API route',
    framework: 'express',
    scaffold: true
  }
})

// Generate project scaffolding
scaffoldProject({
  projectName: 'demo-example',
  projectRoot,
  description: 'Ultra-light demo: Single table Todo with one API route',
  models: ['Todo'],
  framework: 'express',
  useTypeScript: true
})

console.log('\n[demo-example] ✅ Complete project generated!')
console.log('\n📦 Next steps:')
console.log('  1. npm install')
console.log('  2. cp .env.example .env')
console.log('  3. Edit .env with your DATABASE_URL')
console.log('  4. npm run db:push')
console.log('  5. npm run dev')
console.log('\n🚀 Your API will be ready at http://localhost:3000')


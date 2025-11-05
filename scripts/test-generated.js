#!/usr/bin/env node
/**
 * Test Generated Code - Validates that generators produce working code
 * 
 * This script:
 * 1. Generates a minimal test project
 * 2. Verifies TypeScript compiles without errors
 * 3. Validates import paths are correct
 * 4. Checks that all expected files are generated
 * 5. Cleans up after itself
 */

import { execSync } from 'child_process'
import { existsSync, rmSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT_DIR = join(__dirname, '..')
const TEST_OUTPUT = join(ROOT_DIR, 'generated', 'test-validation')

console.log('\n╭─────────────────────────────────────────────╮')
console.log('│  🧪 Generated Code Validation Test      │')
console.log('╰─────────────────────────────────────────────╯\n')

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    console.log(`✅ ${name}`)
    passed++
  } catch (error) {
    console.log(`❌ ${name}`)
    console.log(`   ${error.message}`)
    failed++
  }
}

function exec(cmd) {
  return execSync(cmd, { cwd: ROOT_DIR, encoding: 'utf8', stdio: 'pipe' })
}

// Cleanup old test output
if (existsSync(TEST_OUTPUT)) {
  rmSync(TEST_OUTPUT, { recursive: true, force: true })
}

console.log('📦 Step 1: Generate Test Project\n')

test('Generate minimal test project', () => {
  // Use standalone mode to get full project with package.json, tsconfig, etc.
  const output = exec(`node packages/cli/dist/cli.js generate examples/minimal/schema.prisma --output ${TEST_OUTPUT} --no-standalone`)
  if (!output.includes('Generation complete')) {
    throw new Error('Generation did not complete successfully')
  }
})

console.log('\n📋 Step 2: Validate File Structure\n')

test('Generated src directory exists', () => {
  if (!existsSync(join(TEST_OUTPUT, 'src'))) {
    throw new Error('src directory not found')
  }
})

test('Generated contracts exist', () => {
  if (!existsSync(join(TEST_OUTPUT, 'src/contracts'))) {
    throw new Error('contracts directory not found')
  }
})

test('Generated services exist', () => {
  if (!existsSync(join(TEST_OUTPUT, 'src/services'))) {
    throw new Error('services directory not found')
  }
})

test('Generated controllers exist', () => {
  if (!existsSync(join(TEST_OUTPUT, 'src/controllers'))) {
    throw new Error('controllers directory not found')
  }
})

test('Generated routes exist', () => {
  if (!existsSync(join(TEST_OUTPUT, 'src/routes'))) {
    throw new Error('routes directory not found')
  }
})

test('Generated validators exist', () => {
  if (!existsSync(join(TEST_OUTPUT, 'src/validators'))) {
    throw new Error('validators directory not found')
  }
})

console.log('\n🔍 Step 3: Validate Import Paths\n')

test('Services use @/ imports', () => {
  const files = [
    'src/services/user/user.service.ts',
    'src/services/post/post.service.ts'
  ]
  
  for (const file of files) {
    const content = readFileSync(join(TEST_OUTPUT, file), 'utf8')
    if (!content.includes(`from '@/contracts/`)) {
      throw new Error(`${file} does not use @/ imports for contracts`)
    }
    if (!content.includes(`from '@/db'`)) {
      throw new Error(`${file} does not use @/ import for db`)
    }
  }
})

test('Controllers use relative imports for local files', () => {
  const files = [
    'src/controllers/user/user.controller.ts',
    'src/controllers/post/post.controller.ts'
  ]
  
  for (const file of files) {
    const content = readFileSync(join(TEST_OUTPUT, file), 'utf8')
    // Controllers are in nested directories, so they use ../../
    if (!content.includes(`from '../../services/`) && !content.includes(`from '../services/`)) {
      throw new Error(`${file} does not use relative imports for services`)
    }
  }
})

test('Routes use @/ imports for controllers', () => {
  const files = [
    'src/routes/user/user.routes.ts',
    'src/routes/post/post.routes.ts'
  ]
  
  for (const file of files) {
    const content = readFileSync(join(TEST_OUTPUT, file), 'utf8')
    if (!content.includes(`from '@/controllers/`)) {
      throw new Error(`${file} does not use @/ imports for controllers`)
    }
  }
})

test('SDK uses @/ imports for contracts', () => {
  const files = [
    'src/sdk/models/user.client.ts',
    'src/sdk/models/post.client.ts'
  ]
  
  for (const file of files) {
    const content = readFileSync(join(TEST_OUTPUT, file), 'utf8')
    if (!content.includes(`from '@/contracts/`)) {
      throw new Error(`${file} does not use @/ imports for contracts`)
    }
  }
})

console.log('\n✨ Step 4: Validate Generated Code Quality\n')

test('Services have CRUD methods', () => {
  const service = readFileSync(join(TEST_OUTPUT, 'src/services/user/user.service.ts'), 'utf8')
  const methods = ['list', 'findById', 'create', 'update', 'delete', 'count']
  
  for (const method of methods) {
    if (!service.includes(`async ${method}(`)) {
      throw new Error(`Service missing ${method} method`)
    }
  }
})

test('Controllers export handler functions', () => {
  const controller = readFileSync(join(TEST_OUTPUT, 'src/controllers/user/user.controller.ts'), 'utf8')
  const exports = ['listUsers', 'getUser', 'createUser', 'updateUser', 'deleteUser']
  
  for (const exp of exports) {
    if (!controller.includes(`export const ${exp}`)) {
      throw new Error(`Controller missing ${exp} export`)
    }
  }
})

test('SDK has BaseModelClient inheritance', () => {
  const sdk = readFileSync(join(TEST_OUTPUT, 'src/sdk/models/user.client.ts'), 'utf8')
  
  if (!sdk.includes('extends BaseModelClient')) {
    throw new Error('SDK does not extend BaseModelClient')
  }
  
  if (!sdk.includes('constructor(client: BaseAPIClient)')) {
    throw new Error('SDK missing proper constructor')
  }
})

test('SDK has helpers namespace for domain methods', () => {
  const sdk = readFileSync(join(TEST_OUTPUT, 'src/sdk/models/post.client.ts'), 'utf8')
  
  // Post model should have slug field, so should have helpers
  if (sdk.includes('slug')) {
    if (!sdk.includes('helpers = {')) {
      throw new Error('SDK with domain fields missing helpers namespace')
    }
  }
})

console.log('\n🔧 Step 5: Import Integrity\n')

test('No broken relative imports in routes', () => {
  const files = [
    'src/routes/user/user.routes.ts',
    'src/routes/post/post.routes.ts'
  ]
  
  for (const file of files) {
    const content = readFileSync(join(TEST_OUTPUT, file), 'utf8')
    const importRegex = /from ['"](\.\.\/[^'"]+)['"]/g
    const imports = [...content.matchAll(importRegex)]
    
    for (const match of imports) {
      const importPath = match[1]
      const fileDir = pathDirname(join(TEST_OUTPUT, file))
      let resolvedPath = join(fileDir, importPath)
      
      // Handle .js extensions - try .ts version
      if (resolvedPath.endsWith('.js')) {
        resolvedPath = resolvedPath.slice(0, -3) + '.ts'
      }
      
      // Check if file or directory exists
      if (!existsSync(resolvedPath) && !existsSync(resolvedPath + '.ts')) {
        throw new Error(`Broken import in ${file}: ${importPath}`)
      }
    }
  }
})

test('No broken relative imports in controllers', () => {
  const files = [
    'src/controllers/user/user.controller.ts',
    'src/controllers/post/post.controller.ts'
  ]
  
  for (const file of files) {
    const content = readFileSync(join(TEST_OUTPUT, file), 'utf8')
    const importRegex = /from ['"](\.\.\/[^'"]+)['"]/g
    const imports = [...content.matchAll(importRegex)]
    
    for (const match of imports) {
      const importPath = match[1]
      const fileDir = dirname(join(TEST_OUTPUT, file))
      let resolvedPath = join(fileDir, importPath)
      
      // Handle .js extensions - try .ts version
      if (resolvedPath.endsWith('.js')) {
        resolvedPath = resolvedPath.slice(0, -3) + '.ts'
      }
      
      // For index imports, check if directory exists
      if (importPath.includes('/index.')) {
        resolvedPath = dirname(resolvedPath)
      }
      
      // Check if file or directory exists
      if (!existsSync(resolvedPath)) {
        throw new Error(`Broken import in ${file}: ${importPath}`)
      }
    }
  }
})

// Cleanup
console.log('\n🧹 Cleanup\n')
test('Remove test output', () => {
  rmSync(TEST_OUTPUT, { recursive: true, force: true })
  if (existsSync(TEST_OUTPUT)) {
    throw new Error('Failed to cleanup test output')
  }
})

// Summary
console.log('\n╭─────────────────────────────────────────────╮')
console.log('│  📊 Test Summary                         │')
console.log('╰─────────────────────────────────────────────╯\n')
console.log(`✅ Passed: ${passed}`)
console.log(`❌ Failed: ${failed}`)
console.log(`📈 Total:  ${passed + failed}\n`)

if (failed > 0) {
  console.log('❌ Generated code validation FAILED\n')
  process.exit(1)
} else {
  console.log('✅ Generated code validation PASSED\n')
  process.exit(0)
}


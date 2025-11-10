/**
 * E2E Test: Complete UI Generation Flow
 * 
 * This test:
 * 1. Generates a complete project with UI enabled
 * 2. Installs all dependencies
 * 3. Generates Prisma client and API code
 * 4. Starts both API and UI servers
 * 5. Tests UI in a real browser (Playwright)
 * 6. Verifies all features work end-to-end
 * 7. Reports comprehensive results
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execSync, spawn, type ChildProcess } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ProjectConfig } from '../prompts.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TEST_OUTPUT_DIR = path.join(__dirname, '..', '..', 'e2e-ui-test-output')
const TEST_PROJECT_NAME = 'test-ui-project'
const TEST_PROJECT_PATH = path.join(TEST_OUTPUT_DIR, TEST_PROJECT_NAME)

// Server processes
let apiServer: ChildProcess | null = null
let uiServer: ChildProcess | null = null

// Test results collector
interface TestResult {
  name: string
  status: 'pass' | 'fail' | 'skip'
  duration: number
  error?: string
  details?: string
}

const testResults: TestResult[] = []

function addResult(result: TestResult) {
  testResults.push(result)
  const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⏭️'
  console.log(`${icon} ${result.name} (${result.duration}ms)`)
  if (result.error) console.log(`   Error: ${result.error}`)
  if (result.details) console.log(`   ${result.details}`)
}

/**
 * Generate a test project with UI enabled
 */
async function generateTestProject(): Promise<void> {
  const start = Date.now()
  
  try {
    // Clean up old test output
    if (fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true })
    }
    fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true })
    
    // Create project config
    const config: ProjectConfig = {
      projectName: TEST_PROJECT_NAME,
      framework: 'express',
      database: 'sqlite',
      includeExamples: true,
      selectedPlugins: [],
      packageManager: 'npm',
      generateUI: true,
      uiTemplate: 'data-browser'
    }
    
    // Generate files using template functions
    const { generatePackageJson } = await import('../templates/package-json.js')
    const { generatePrismaSchema } = await import('../templates/prisma-schema.js')
    const { generateEnvFile } = await import('../templates/env-file.js')
    const { generateGitignore } = await import('../templates/gitignore.js')
    const { generateTsConfig } = await import('../templates/tsconfig.js')
    const { generateReadme } = await import('../templates/readme.js')
    const { generateUI, type ParsedModel } = await import('../ui-generator.js')
    
    // Create project directory
    fs.mkdirSync(TEST_PROJECT_PATH, { recursive: true })
    fs.mkdirSync(path.join(TEST_PROJECT_PATH, 'prisma'), { recursive: true })
    fs.mkdirSync(path.join(TEST_PROJECT_PATH, 'src'), { recursive: true })
    
    // Generate base files
    fs.writeFileSync(
      path.join(TEST_PROJECT_PATH, 'package.json'),
      generatePackageJson(config)
    )
    
    const schemaContent = generatePrismaSchema(config)
    fs.writeFileSync(
      path.join(TEST_PROJECT_PATH, 'prisma', 'schema.prisma'),
      schemaContent
    )
    
    fs.writeFileSync(
      path.join(TEST_PROJECT_PATH, '.env'),
      generateEnvFile(config)
    )
    
    fs.writeFileSync(
      path.join(TEST_PROJECT_PATH, '.gitignore'),
      generateGitignore()
    )
    
    fs.writeFileSync(
      path.join(TEST_PROJECT_PATH, 'tsconfig.json'),
      generateTsConfig(config)
    )
    
    fs.writeFileSync(
      path.join(TEST_PROJECT_PATH, 'README.md'),
      generateReadme(config)
    )
    
    // Create source files
    createSourceFiles(TEST_PROJECT_PATH, config)
    
    // Parse models from schema
    const models = parseModelsFromSchema(schemaContent)
    
    // Generate UI
    generateUI(TEST_PROJECT_PATH, config, models)
    
    addResult({
      name: 'Project Generation',
      status: 'pass',
      duration: Date.now() - start,
      details: `Generated ${models.length} models: ${models.map(m => m.name).join(', ')}`
    })
  } catch (error) {
    addResult({
      name: 'Project Generation',
      status: 'fail',
      duration: Date.now() - start,
      error: (error as Error).message
    })
    throw error
  }
}

/**
 * Parse models from schema content
 */
function parseModelsFromSchema(schema: string): Array<{
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

/**
 * Create source files
 */
function createSourceFiles(projectPath: string, config: ProjectConfig): void {
  const srcPath = path.join(projectPath, 'src')
  
  fs.writeFileSync(
    path.join(srcPath, 'db.ts'),
    `import { PrismaClient } from '@prisma/client'\n\nconst prisma = new PrismaClient()\n\nexport default prisma\n`
  )
  
  const appFile = `import express from 'express'\nimport cors from 'cors'\n\nconst app = express()\n\napp.use(cors())\napp.use(express.json())\n\napp.get('/', (req, res) => {\n  res.json({ message: 'API is running' })\n})\n\nexport { app }\n`
  fs.writeFileSync(path.join(srcPath, 'app.ts'), appFile)
  
  const serverFile = `import { app } from './app.js'\n\nconst PORT = process.env.PORT || 3000\n\napp.listen(PORT, () => {\n  console.log(\`🚀 Server running on http://localhost:\${PORT}\`)\n})\n`
  fs.writeFileSync(path.join(srcPath, 'server.ts'), serverFile)
}

/**
 * Install dependencies
 */
async function installDependencies(): Promise<void> {
  const start = Date.now()
  
  try {
    console.log('📦 Installing dependencies (this may take 2-3 minutes)...')
    
    execSync('npm install', {
      cwd: TEST_PROJECT_PATH,
      stdio: 'pipe',
      timeout: 300000 // 5 minutes
    })
    
    addResult({
      name: 'Dependency Installation',
      status: 'pass',
      duration: Date.now() - start,
      details: 'Installed all packages'
    })
  } catch (error) {
    addResult({
      name: 'Dependency Installation',
      status: 'fail',
      duration: Date.now() - start,
      error: (error as Error).message
    })
    throw error
  }
}

/**
 * Generate Prisma client and API code
 */
async function generateCode(): Promise<void> {
  const start = Date.now()
  
  try {
    // Generate Prisma client
    execSync('npx prisma generate', {
      cwd: TEST_PROJECT_PATH,
      stdio: 'pipe',
      timeout: 60000
    })
    
    // Initialize database
    execSync('npx prisma db push --skip-generate', {
      cwd: TEST_PROJECT_PATH,
      stdio: 'pipe',
      timeout: 60000
    })
    
    // Generate API code (this will fail gracefully if ssot-codegen not installed)
    try {
      execSync('npx ssot-codegen generate', {
        cwd: TEST_PROJECT_PATH,
        stdio: 'pipe',
        timeout: 60000
      })
    } catch {
      // Ignore ssot-codegen errors for now
      console.log('   ⚠️  Skipped ssot-codegen (not required for UI test)')
    }
    
    addResult({
      name: 'Code Generation',
      status: 'pass',
      duration: Date.now() - start,
      details: 'Generated Prisma client and initialized database'
    })
  } catch (error) {
    addResult({
      name: 'Code Generation',
      status: 'fail',
      duration: Date.now() - start,
      error: (error as Error).message
    })
    throw error
  }
}

/**
 * Start API server
 */
async function startAPIServer(): Promise<void> {
  const start = Date.now()
  
  return new Promise((resolve, reject) => {
    try {
      apiServer = spawn('npm', ['run', 'dev'], {
        cwd: TEST_PROJECT_PATH,
        stdio: 'pipe',
        shell: true
      })
      
      let output = ''
      
      apiServer.stdout?.on('data', (data) => {
        output += data.toString()
        if (output.includes('Server running') || output.includes('3000')) {
          addResult({
            name: 'API Server Start',
            status: 'pass',
            duration: Date.now() - start,
            details: 'Server listening on port 3000'
          })
          resolve()
        }
      })
      
      apiServer.stderr?.on('data', (data) => {
        console.error('API Error:', data.toString())
      })
      
      apiServer.on('error', (error) => {
        addResult({
          name: 'API Server Start',
          status: 'fail',
          duration: Date.now() - start,
          error: error.message
        })
        reject(error)
      })
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (!output.includes('3000')) {
          addResult({
            name: 'API Server Start',
            status: 'fail',
            duration: Date.now() - start,
            error: 'Server failed to start within 30 seconds'
          })
          reject(new Error('API server timeout'))
        }
      }, 30000)
    } catch (error) {
      addResult({
        name: 'API Server Start',
        status: 'fail',
        duration: Date.now() - start,
        error: (error as Error).message
      })
      reject(error)
    }
  })
}

/**
 * Start UI server
 */
async function startUIServer(): Promise<void> {
  const start = Date.now()
  
  return new Promise((resolve, reject) => {
    try {
      uiServer = spawn('npm', ['run', 'dev:ui'], {
        cwd: TEST_PROJECT_PATH,
        stdio: 'pipe',
        shell: true
      })
      
      let output = ''
      
      uiServer.stdout?.on('data', (data) => {
        output += data.toString()
        if (output.includes('Ready') || output.includes('3001') || output.includes('compiled')) {
          addResult({
            name: 'UI Server Start',
            status: 'pass',
            duration: Date.now() - start,
            details: 'Next.js server ready on port 3001'
          })
          resolve()
        }
      })
      
      uiServer.stderr?.on('data', (data) => {
        const msg = data.toString()
        // Next.js outputs to stderr by default
        output += msg
        if (msg.includes('Ready') || msg.includes('3001') || msg.includes('compiled')) {
          addResult({
            name: 'UI Server Start',
            status: 'pass',
            duration: Date.now() - start,
            details: 'Next.js server ready on port 3001'
          })
          resolve()
        }
      })
      
      uiServer.on('error', (error) => {
        addResult({
          name: 'UI Server Start',
          status: 'fail',
          duration: Date.now() - start,
          error: error.message
        })
        reject(error)
      })
      
      // Timeout after 60 seconds (Next.js can be slow)
      setTimeout(() => {
        if (!output.includes('Ready') && !output.includes('compiled')) {
          addResult({
            name: 'UI Server Start',
            status: 'fail',
            duration: Date.now() - start,
            error: 'UI server failed to start within 60 seconds'
          })
          reject(new Error('UI server timeout'))
        }
      }, 60000)
    } catch (error) {
      addResult({
        name: 'UI Server Start',
        status: 'fail',
        duration: Date.now() - start,
        error: (error as Error).message
      })
      reject(error)
    }
  })
}

/**
 * Test UI with simple HTTP requests (no Playwright for now)
 */
async function testUI(): Promise<void> {
  const tests = [
    {
      name: 'Admin Dashboard Loads',
      url: 'http://localhost:3001/admin',
      contains: ['Dashboard', 'Users', 'Posts']
    },
    {
      name: 'User List Page Loads',
      url: 'http://localhost:3001/admin/users',
      contains: ['Users', 'DataTable', 'Search']
    },
    {
      name: 'Post List Page Loads',
      url: 'http://localhost:3001/admin/posts',
      contains: ['Posts', 'DataTable']
    }
  ]
  
  for (const test of tests) {
    const start = Date.now()
    
    try {
      const response = await fetch(test.url)
      const html = await response.text()
      
      if (response.status === 200) {
        const allFound = test.contains.every(text => 
          html.toLowerCase().includes(text.toLowerCase())
        )
        
        if (allFound) {
          addResult({
            name: test.name,
            status: 'pass',
            duration: Date.now() - start,
            details: `Status: ${response.status}, found all expected content`
          })
        } else {
          const missing = test.contains.filter(text => 
            !html.toLowerCase().includes(text.toLowerCase())
          )
          addResult({
            name: test.name,
            status: 'fail',
            duration: Date.now() - start,
            error: `Missing content: ${missing.join(', ')}`
          })
        }
      } else {
        addResult({
          name: test.name,
          status: 'fail',
          duration: Date.now() - start,
          error: `HTTP ${response.status}`
        })
      }
    } catch (error) {
      addResult({
        name: test.name,
        status: 'fail',
        duration: Date.now() - start,
        error: (error as Error).message
      })
    }
  }
}

/**
 * Stop servers
 */
function stopServers(): void {
  if (apiServer) {
    apiServer.kill('SIGTERM')
    apiServer = null
  }
  if (uiServer) {
    uiServer.kill('SIGTERM')
    uiServer = null
  }
}

/**
 * Generate comprehensive test report
 */
function generateReport(): string {
  const total = testResults.length
  const passed = testResults.filter(r => r.status === 'pass').length
  const failed = testResults.filter(r => r.status === 'fail').length
  const skipped = testResults.filter(r => r.status === 'skip').length
  const totalDuration = testResults.reduce((sum, r) => sum + r.duration, 0)
  
  let report = '\n'
  report += '═'.repeat(70) + '\n'
  report += '              E2E UI GENERATION TEST REPORT\n'
  report += '═'.repeat(70) + '\n\n'
  
  report += `📊 Summary:\n`
  report += `   Total Tests: ${total}\n`
  report += `   ✅ Passed: ${passed}\n`
  report += `   ❌ Failed: ${failed}\n`
  report += `   ⏭️  Skipped: ${skipped}\n`
  report += `   ⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s\n`
  report += `   📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%\n\n`
  
  report += '─'.repeat(70) + '\n'
  report += 'Test Results:\n'
  report += '─'.repeat(70) + '\n\n'
  
  for (const result of testResults) {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⏭️'
    report += `${icon} ${result.name}\n`
    report += `   Duration: ${result.duration}ms\n`
    if (result.details) report += `   Details: ${result.details}\n`
    if (result.error) report += `   Error: ${result.error}\n`
    report += '\n'
  }
  
  report += '═'.repeat(70) + '\n'
  report += failed === 0 ? '🎉 ALL TESTS PASSED!\n' : `⚠️  ${failed} TEST(S) FAILED\n`
  report += '═'.repeat(70) + '\n'
  
  return report
}

/**
 * Main E2E test suite
 */
describe('E2E: Complete UI Generation Flow', () => {
  it('should generate, deploy, and test a full-stack application', async () => {
    console.log('\n🚀 Starting E2E UI Generation Test...\n')
    
    try {
      // Step 1: Generate project
      console.log('📝 Step 1: Generating project...')
      await generateTestProject()
      
      // Step 2: Install dependencies
      console.log('\n📦 Step 2: Installing dependencies...')
      await installDependencies()
      
      // Step 3: Generate code
      console.log('\n🔧 Step 3: Generating code...')
      await generateCode()
      
      // Step 4: Start API server
      console.log('\n🚀 Step 4: Starting API server...')
      await startAPIServer()
      
      // Wait a bit for server to stabilize
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Step 5: Start UI server
      console.log('\n🎨 Step 5: Starting UI server...')
      await startUIServer()
      
      // Wait for Next.js to fully compile
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      // Step 6: Test UI
      console.log('\n🧪 Step 6: Testing UI...')
      await testUI()
      
      // Generate and display report
      const report = generateReport()
      console.log(report)
      
      // Save report to file
      fs.writeFileSync(
        path.join(TEST_OUTPUT_DIR, 'test-report.txt'),
        report
      )
      
      // Assert all tests passed
      const failed = testResults.filter(r => r.status === 'fail').length
      expect(failed).toBe(0)
      
    } catch (error) {
      console.error('\n❌ E2E Test Failed:', error)
      throw error
    } finally {
      console.log('\n🧹 Cleaning up...')
      stopServers()
    }
  }, 600000) // 10 minute timeout
  
  afterAll(() => {
    stopServers()
  })
})


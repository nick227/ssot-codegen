/**
 * E2E Test for V3 JSON Runtime
 * 
 * Validates complete V3 flow:
 * 1. Generate project with V3 mode
 * 2. Verify JSON templates copied
 * 3. Verify mount point created
 * 4. Verify adapters configured
 * 5. Validate JSON files
 * 6. Test models.json generation
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import type { ProjectConfig } from '../prompts.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TEST_OUTPUT_DIR = path.join(__dirname, '../../e2e-v3-test-output')
const TEST_PROJECT_NAME = 'test-v3-blog'
const TEST_PROJECT_PATH = path.join(TEST_OUTPUT_DIR, TEST_PROJECT_NAME)

interface TestResult {
  name: string
  status: 'pass' | 'fail'
  duration: number
  details?: string
  error?: string
}

const results: TestResult[] = []

function addResult(result: TestResult) {
  results.push(result)
  const icon = result.status === 'pass' ? '✅' : '❌'
  console.log(`${icon} ${result.name} (${result.duration}ms)`)
  if (result.details) console.log(`   ${result.details}`)
  if (result.error) console.log(`   Error: ${result.error}`)
}

describe('V3 JSON Runtime E2E', () => {
  beforeAll(async () => {
    // Clean up old test output
    if (fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true })
    }
    fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true })
  })

  afterAll(() => {
    // Summary
    console.log('\n' + '='.repeat(50))
    console.log('V3 E2E TEST SUMMARY')
    console.log('='.repeat(50))
    
    const passed = results.filter(r => r.status === 'pass').length
    const failed = results.filter(r => r.status === 'fail').length
    const total = results.length
    
    console.log(`Total: ${total}`)
    console.log(`Passed: ${passed}`)
    console.log(`Failed: ${failed}`)
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`)
    console.log('='.repeat(50))
  })

  test('Generate V3 project', async () => {
    const start = Date.now()
    
    try {
      const config: ProjectConfig = {
        projectName: TEST_PROJECT_NAME,
        framework: 'express',
        database: 'sqlite',
        includeExamples: true,
        selectedPlugins: [],
        packageManager: 'npm',
        generateUI: true,
        uiMode: 'v3-runtime',
        uiTemplate: 'blog'
      }
      
      // Import template functions
      const { generatePackageJson } = await import('../templates/package-json.js')
      const { generatePrismaSchema } = await import('../templates/prisma-schema.js')
      const { generateEnvFile } = await import('../templates/env-file.js')
      const { generateGitignore } = await import('../templates/gitignore.js')
      const { generateTsConfig } = await import('../templates/tsconfig.js')
      const { generateReadme } = await import('../templates/readme.js')
      const { generateUI } = await import('../ui-generator.js')
      
      type ParsedModel = {
        name: string
        nameLower: string
        namePlural: string
        fields: Array<{ name: string; type: string; isRelation: boolean }>
      }
      
      // Create project structure
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
        generateTsConfig()
      )
      
      fs.writeFileSync(
        path.join(TEST_PROJECT_PATH, 'README.md'),
        generateReadme(config)
      )
      
      // Parse models from schema
      const models = parseModelsFromSchema(schemaContent)
      
      // Generate V3 UI
      await generateUI(TEST_PROJECT_PATH, config, models)
      
      addResult({
        name: 'Project Generation',
        status: 'pass',
        duration: Date.now() - start,
        details: `Generated V3 project with ${models.length} models`
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
  })

  test('Verify templates directory created', () => {
    const start = Date.now()
    
    const templatesDir = path.join(TEST_PROJECT_PATH, 'templates')
    
    expect(fs.existsSync(templatesDir)).toBe(true)
    
    addResult({
      name: 'Templates Directory',
      status: 'pass',
      duration: Date.now() - start
    })
  })

  test('Verify all JSON files exist', () => {
    const start = Date.now()
    
    const requiredFiles = [
      'template.json',
      'data-contract.json',
      'capabilities.json',
      'mappings.json',
      'models.json',
      'theme.json',
      'i18n.json'
    ]
    
    const templatesDir = path.join(TEST_PROJECT_PATH, 'templates')
    
    for (const file of requiredFiles) {
      const filePath = path.join(templatesDir, file)
      expect(fs.existsSync(filePath), `${file} should exist`).toBe(true)
    }
    
    addResult({
      name: 'JSON Files Exist',
      status: 'pass',
      duration: Date.now() - start,
      details: `All ${requiredFiles.length} JSON files present`
    })
  })

  test('Verify mount point created', () => {
    const start = Date.now()
    
    const mountPoint = path.join(TEST_PROJECT_PATH, 'app', '[[...slug]]', 'page.tsx')
    
    expect(fs.existsSync(mountPoint)).toBe(true)
    
    const content = fs.readFileSync(mountPoint, 'utf-8')
    expect(content).toContain('TemplateRuntime')
    expect(content).toContain('from \'@ssot-ui/runtime\'')
    expect(content).toContain('from \'@/lib/adapters\'')
    
    addResult({
      name: 'Mount Point',
      status: 'pass',
      duration: Date.now() - start,
      details: 'Mount point created with correct imports'
    })
  })

  test('Verify adapter configuration', () => {
    const start = Date.now()
    
    const adaptersFile = path.join(TEST_PROJECT_PATH, 'lib', 'adapters', 'index.ts')
    
    expect(fs.existsSync(adaptersFile)).toBe(true)
    
    const content = fs.readFileSync(adaptersFile, 'utf-8')
    expect(content).toContain('PrismaDataAdapter')
    expect(content).toContain('InternalUIAdapter')
    expect(content).toContain('NextAuthAdapter')
    expect(content).toContain('NextRouterAdapter')
    expect(content).toContain('IntlFormatAdapter')
    
    addResult({
      name: 'Adapter Configuration',
      status: 'pass',
      duration: Date.now() - start,
      details: 'All 5 adapters configured'
    })
  })

  test('Verify V3 dependencies in package.json', () => {
    const start = Date.now()
    
    const pkgJsonPath = path.join(TEST_PROJECT_PATH, 'package.json')
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'))
    
    const requiredDeps = [
      '@ssot-ui/runtime',
      '@ssot-ui/adapter-data-prisma',
      '@ssot-ui/adapter-ui-internal',
      '@ssot-ui/adapter-auth-nextauth',
      '@ssot-ui/adapter-router-next',
      '@ssot-ui/adapter-format-intl'
    ]
    
    for (const dep of requiredDeps) {
      expect(pkgJson.dependencies[dep]).toBeDefined()
    }
    
    expect(pkgJson.devDependencies['@ssot-ui/prisma-to-models']).toBeDefined()
    expect(pkgJson.devDependencies['@ssot-ui/schemas']).toBeDefined()
    
    addResult({
      name: 'V3 Dependencies',
      status: 'pass',
      duration: Date.now() - start,
      details: `${requiredDeps.length} runtime deps + 2 dev deps`
    })
  })

  test('Verify V3 scripts in package.json', () => {
    const start = Date.now()
    
    const pkgJsonPath = path.join(TEST_PROJECT_PATH, 'package.json')
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'))
    
    expect(pkgJson.scripts['gen:models']).toBeDefined()
    expect(pkgJson.scripts['gen:models:watch']).toBeDefined()
    expect(pkgJson.scripts['validate:templates']).toBeDefined()
    expect(pkgJson.scripts['plan:templates']).toBeDefined()
    
    addResult({
      name: 'V3 Scripts',
      status: 'pass',
      duration: Date.now() - start,
      details: '4 V3-specific scripts added'
    })
  })

  test('Verify templates/README.md exists', () => {
    const start = Date.now()
    
    const readmePath = path.join(TEST_PROJECT_PATH, 'templates', 'README.md')
    
    expect(fs.existsSync(readmePath)).toBe(true)
    
    const content = fs.readFileSync(readmePath, 'utf-8')
    expect(content).toContain('JSON Runtime (V3)')
    expect(content).toContain('ZERO')
    expect(content).toContain('Hot Reload')
    
    addResult({
      name: 'Templates README',
      status: 'pass',
      duration: Date.now() - start
    })
  })

  test('Verify JSON files are valid', () => {
    const start = Date.now()
    
    const templatesDir = path.join(TEST_PROJECT_PATH, 'templates')
    const jsonFiles = [
      'template.json',
      'data-contract.json',
      'capabilities.json',
      'mappings.json',
      'models.json',
      'theme.json',
      'i18n.json'
    ]
    
    for (const file of jsonFiles) {
      const filePath = path.join(templatesDir, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      
      // Should parse without error
      expect(() => JSON.parse(content)).not.toThrow()
      
      // Should have version field
      const json = JSON.parse(content)
      expect(json.version).toBeDefined()
    }
    
    addResult({
      name: 'JSON Validation',
      status: 'pass',
      duration: Date.now() - start,
      details: 'All JSON files are valid and versioned'
    })
  })

  test('Verify no V2 generated files exist', () => {
    const start = Date.now()
    
    // V3 should NOT generate these
    const v2Files = [
      path.join(TEST_PROJECT_PATH, 'app', 'admin'),
      path.join(TEST_PROJECT_PATH, 'components', 'ui'),
      path.join(TEST_PROJECT_PATH, 'UI_README.md')
    ]
    
    for (const file of v2Files) {
      expect(fs.existsSync(file), `${file} should NOT exist in V3`).toBe(false)
    }
    
    addResult({
      name: 'No V2 Files',
      status: 'pass',
      duration: Date.now() - start,
      details: 'Confirmed zero code generation'
    })
  })

  test('Verify Next.js configuration files', () => {
    const start = Date.now()
    
    // next.config.js
    const nextConfig = path.join(TEST_PROJECT_PATH, 'next.config.js')
    expect(fs.existsSync(nextConfig), 'next.config.js should exist').toBe(true)
    
    const configContent = fs.readFileSync(nextConfig, 'utf-8')
    expect(configContent).toContain('transpilePackages')
    expect(configContent).toContain('@ssot-ui/runtime')
    expect(configContent).toContain('serverComponentsExternalPackages')
    expect(configContent).toContain('@prisma/client')
    
    // app/layout.tsx
    const layout = path.join(TEST_PROJECT_PATH, 'app', 'layout.tsx')
    expect(fs.existsSync(layout), 'app/layout.tsx should exist').toBe(true)
    
    const layoutContent = fs.readFileSync(layout, 'utf-8')
    expect(layoutContent).toContain('export const metadata')
    expect(layoutContent).toContain('RootLayout')
    
    addResult({
      name: 'Next.js Configuration',
      status: 'pass',
      duration: Date.now() - start,
      details: 'next.config.js + app/layout.tsx present'
    })
  })

  test('Verify Next.js dev scripts', () => {
    const start = Date.now()
    
    const pkgJsonPath = path.join(TEST_PROJECT_PATH, 'package.json')
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'))
    
    expect(pkgJson.scripts.dev).toBe('next dev')
    expect(pkgJson.scripts.build).toBe('next build')
    expect(pkgJson.scripts.start).toBe('next start')
    expect(pkgJson.scripts['dev:api']).toBe('tsx watch src/server.ts')
    
    addResult({
      name: 'Next.js Scripts',
      status: 'pass',
      duration: Date.now() - start,
      details: 'Correct Next.js scripts (dev/build/start)'
    })
  })

  test('Count total lines of code (should be minimal)', () => {
    const start = Date.now()
    
    let totalLines = 0
    
    // Count mount point
    const mountPoint = path.join(TEST_PROJECT_PATH, 'app', '[[...slug]]', 'page.tsx')
    if (fs.existsSync(mountPoint)) {
      totalLines += fs.readFileSync(mountPoint, 'utf-8').split('\n').length
    }
    
    // Count adapters
    const adaptersFile = path.join(TEST_PROJECT_PATH, 'lib', 'adapters', 'index.ts')
    if (fs.existsSync(adaptersFile)) {
      totalLines += fs.readFileSync(adaptersFile, 'utf-8').split('\n').length
    }
    
    // Count root layout
    const layout = path.join(TEST_PROJECT_PATH, 'app', 'layout.tsx')
    if (fs.existsSync(layout)) {
      totalLines += fs.readFileSync(layout, 'utf-8').split('\n').length
    }
    
    // Should be under 120 lines (mount + adapters + layout)
    expect(totalLines).toBeLessThan(120)
    
    addResult({
      name: 'Code Line Count',
      status: 'pass',
      duration: Date.now() - start,
      details: `Total: ${totalLines} lines (target: < 120)`
    })
  })
})

/**
 * Parse models from Prisma schema
 */
function parseModelsFromSchema(schema: string): Array<{
  name: string
  nameLower: string
  namePlural: string
  fields: Array<{ name: string; type: string; isRelation: boolean }>
}> {
  const modelRegex = /model\s+(\w+)\s*{([^}]*)}/g
  const models: any[] = []
  
  let match
  while ((match = modelRegex.exec(schema)) !== null) {
    const name = match[1]
    const body = match[2]
    
    const fields = body
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//') && !line.startsWith('@@'))
      .map(line => {
        const parts = line.split(/\s+/)
        return {
          name: parts[0],
          type: parts[1]?.replace('?', '').replace('[]', '') || 'String',
          isRelation: /^[A-Z]/.test(parts[1] || '')
        }
      })
    
    models.push({
      name,
      nameLower: name.toLowerCase(),
      namePlural: name.toLowerCase() + 's',
      fields
    })
  }
  
  return models
}


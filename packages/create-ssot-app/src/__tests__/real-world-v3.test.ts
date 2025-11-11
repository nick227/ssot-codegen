/**
 * Real-World V3 Test
 * 
 * Creates an actual V3 project and tests the complete workflow.
 * This is NOT a unit test - it's a full integration validation.
 */

import { describe, test, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import type { ProjectConfig } from '../prompts.js'
import { createProject } from '../create-project.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REAL_WORLD_TEST_DIR = path.join(__dirname, '../../real-world-v3-test')
const TEST_PROJECT_NAME = 'v3-blog-demo'
const TEST_PROJECT_PATH = path.join(REAL_WORLD_TEST_DIR, TEST_PROJECT_NAME)

interface TestStep {
  name: string
  status: 'pending' | 'running' | 'pass' | 'fail'
  duration?: number
  details?: string
  error?: string
}

const steps: TestStep[] = []

function logStep(step: TestStep) {
  steps.push(step)
  const icon = step.status === 'pass' ? '✅' : step.status === 'fail' ? '❌' : '⏳'
  console.log(`${icon} ${step.name}${step.duration ? ` (${step.duration}ms)` : ''}`)
  if (step.details) console.log(`   ${step.details}`)
  if (step.error) console.log(`   Error: ${step.error}`)
}

describe('Real-World V3 Integration Test', () => {
  test('Complete V3 workflow validation', async () => {
    console.log('\n' + '='.repeat(60))
    console.log('REAL-WORLD V3 INTEGRATION TEST')
    console.log('='.repeat(60) + '\n')
    
    // Clean up
    if (fs.existsSync(REAL_WORLD_TEST_DIR)) {
      fs.rmSync(REAL_WORLD_TEST_DIR, { recursive: true, force: true })
    }
    fs.mkdirSync(REAL_WORLD_TEST_DIR, { recursive: true })
    
    // Step 1: Create project via createProject function
    const step1Start = Date.now()
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
      
      // Change to test directory
      const originalCwd = process.cwd()
      process.chdir(REAL_WORLD_TEST_DIR)
      
      await createProject(config)
      
      process.chdir(originalCwd)
      
      logStep({
        name: 'Project Generation',
        status: 'pass',
        duration: Date.now() - step1Start,
        details: `Created ${TEST_PROJECT_NAME} in V3 mode`
      })
    } catch (error) {
      logStep({
        name: 'Project Generation',
        status: 'fail',
        duration: Date.now() - step1Start,
        error: (error as Error).message
      })
      throw error
    }
    
    // Step 2: Verify critical files exist
    const step2Start = Date.now()
    const criticalFiles = [
      'package.json',
      'tsconfig.json',
      'next.config.js',
      'tailwind.config.js',
      'postcss.config.js',
      'app/layout.tsx',
      'app/[[...slug]]/page.tsx',
      'app/globals.css',
      'app/api/data/route.ts',
      'lib/adapters/index.ts',
      'templates/template.json',
      'templates/models.json',
      '.env',
      '.env.local'
    ]
    
    const missingFiles = criticalFiles.filter(f => !fs.existsSync(path.join(TEST_PROJECT_PATH, f)))
    
    if (missingFiles.length > 0) {
      logStep({
        name: 'File Structure Validation',
        status: 'fail',
        duration: Date.now() - step2Start,
        error: `Missing files: ${missingFiles.join(', ')}`
      })
      throw new Error(`Missing critical files: ${missingFiles.join(', ')}`)
    }
    
    logStep({
      name: 'File Structure Validation',
      status: 'pass',
      duration: Date.now() - step2Start,
      details: `All ${criticalFiles.length} critical files present`
    })
    
    // Step 3: Verify package.json content
    const step3Start = Date.now()
    const pkgJson = JSON.parse(fs.readFileSync(path.join(TEST_PROJECT_PATH, 'package.json'), 'utf-8'))
    
    const requiredDeps = ['next', 'react', 'react-dom', '@ssot-ui/runtime', 'tailwindcss']
    const missingDeps = requiredDeps.filter(d => !pkgJson.dependencies[d])
    
    if (missingDeps.length > 0) {
      logStep({
        name: 'Dependencies Validation',
        status: 'fail',
        duration: Date.now() - step3Start,
        error: `Missing dependencies: ${missingDeps.join(', ')}`
      })
      throw new Error(`Missing dependencies: ${missingDeps.join(', ')}`)
    }
    
    expect(pkgJson.scripts.dev).toBe('next dev')
    expect(pkgJson.scripts.build).toBe('next build')
    
    logStep({
      name: 'Dependencies Validation',
      status: 'pass',
      duration: Date.now() - step3Start,
      details: 'All required dependencies present + correct scripts'
    })
    
    // Step 4: Verify mount point has 'use client'
    const step4Start = Date.now()
    const mountPoint = fs.readFileSync(path.join(TEST_PROJECT_PATH, 'app/[[...slug]]/page.tsx'), 'utf-8')
    
    if (!mountPoint.startsWith("'use client'")) {
      logStep({
        name: 'Client Boundary Validation',
        status: 'fail',
        duration: Date.now() - step4Start,
        error: 'Mount point missing \'use client\' directive'
      })
      throw new Error('Mount point missing \'use client\' directive')
    }
    
    expect(mountPoint).toContain('TemplateRuntime')
    expect(mountPoint).toContain('from \'@ssot-ui/runtime\'')
    
    logStep({
      name: 'Client Boundary Validation',
      status: 'pass',
      duration: Date.now() - step4Start,
      details: '\'use client\' directive present'
    })
    
    // Step 5: Verify JSON templates are valid
    const step5Start = Date.now()
    const templateFiles = [
      'template.json',
      'data-contract.json',
      'capabilities.json',
      'mappings.json',
      'models.json',
      'theme.json',
      'i18n.json'
    ]
    
    for (const file of templateFiles) {
      const filePath = path.join(TEST_PROJECT_PATH, 'templates', file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const json = JSON.parse(content)
      expect(json.version).toBeDefined()
    }
    
    logStep({
      name: 'JSON Templates Validation',
      status: 'pass',
      duration: Date.now() - step5Start,
      details: `All ${templateFiles.length} JSON files valid and versioned`
    })
    
    // Step 6: Count generated code
    const step6Start = Date.now()
    let totalLines = 0
    
    const codeFiles = [
      'app/[[...slug]]/page.tsx',
      'app/layout.tsx',
      'lib/adapters/index.ts',
      'app/api/data/route.ts'
    ]
    
    for (const file of codeFiles) {
      const filePath = path.join(TEST_PROJECT_PATH, file)
      if (fs.existsSync(filePath)) {
        totalLines += fs.readFileSync(filePath, 'utf-8').split('\n').length
      }
    }
    
    expect(totalLines).toBeLessThan(150)
    
    logStep({
      name: 'Code Minimalism Validation',
      status: 'pass',
      duration: Date.now() - step6Start,
      details: `Total code: ${totalLines} lines (target: < 150)`
    })
    
    // Final summary
    console.log('\n' + '='.repeat(60))
    console.log('REAL-WORLD TEST SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ All ${steps.length} validation steps passed`)
    console.log(`📁 Project: ${TEST_PROJECT_PATH}`)
    console.log(`💻 Code: ${totalLines} lines`)
    console.log(`📄 JSON: ${templateFiles.length} files`)
    console.log('='.repeat(60) + '\n')
  }, { timeout: 30000 })
})


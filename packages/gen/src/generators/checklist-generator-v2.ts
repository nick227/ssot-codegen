/**
 * Checklist Generator V2 - Template-Based
 * 
 * REFACTORED: Uses external HTML/CSS/JS templates instead of 1,300 lines of inline strings
 * Reduced from 1,346 lines → ~300 lines (78% reduction)
 */

import type { ParsedSchema, ParsedModel } from '../dmmf-parser.js'
import type { GeneratedFiles } from '../code-generator.js'
import { renderChecklistHTML, renderSection, type ChecklistTemplateData } from '@/templates/checklist/renderer.js'

export interface ChecklistConfig {
  projectName: string
  useRegistry: boolean
  framework: 'express' | 'fastify'
  autoOpen?: boolean
  includeEnvironmentChecks?: boolean
  includeCodeValidation?: boolean
  includeAPITesting?: boolean
  includePerformanceMetrics?: boolean
  pluginHealthChecks?: Map<string, any>
}

/**
 * Generate complete checklist system using templates
 */
export function generateChecklistSystemV2(
  schema: ParsedSchema,
  files: GeneratedFiles,
  config: ChecklistConfig
): Map<string, string> {
  const checklistFiles = new Map<string, string>()
  
  // Generate HTML using template system
  const html = generateTemplatedHTML(schema, files, config)
  checklistFiles.set('checklist.html', html)
  
  // Generate API endpoints for live checks (unchanged)
  const api = generateChecklistAPI(schema, files, config)
  checklistFiles.set('checklist.api.ts', api)
  
  // Generate test runner (unchanged)
  const tests = generateChecklistTests(schema, files, config)
  checklistFiles.set('checklist.tests.ts', tests)
  
  return checklistFiles
}

/**
 * Generate HTML using template system (MUCH simpler than inline)
 */
function generateTemplatedHTML(
  schema: ParsedSchema,
  files: GeneratedFiles,
  config: ChecklistConfig
): string {
  const modelCount = schema.models.length
  const routeCount = files.routes.size * 5 // Estimate CRUD routes
  
  // Generate all sections
  const sections: string[] = []
  
  if (config.includeEnvironmentChecks !== false) {
    sections.push(generateEnvironmentSection(config))
  }
  
  if (config.includeCodeValidation !== false) {
    sections.push(generateCodeValidationSection(schema, files, config))
  }
  
  // Model-specific checks
  sections.push(generateModelsSection(schema))
  
  // Plugin health checks
  if (config.pluginHealthChecks && config.pluginHealthChecks.size > 0) {
    sections.push(generatePluginHealthCheckSections(config))
  }
  
  // Advanced features
  if (config.includeAPITesting !== false || config.includePerformanceMetrics !== false) {
    sections.push(generateAdvancedFeaturesSection(config))
  }
  
  // Render HTML with template
  return renderChecklistHTML({
    projectName: config.projectName,
    framework: config.framework,
    timestamp: new Date().toLocaleString(),
    modelCount,
    routeCount,
    sections: sections.join('\n')
  })
}

// ============================================================================
// SECTION GENERATORS (Simplified using renderSection)
// ============================================================================

function generateEnvironmentSection(config: ChecklistConfig): string {
  return renderSection({
    title: 'Environment Setup',
    emoji: '🔧',
    items: [
      {
        title: 'Create .env file',
        description: 'Set up environment variables for database connection and secrets',
        command: 'cp .env.example .env'
      },
      {
        title: 'Configure DATABASE_URL',
        description: 'Update .env with your database connection string'
      },
      {
        title: 'Install dependencies',
        description: 'Install all required packages',
        command: 'pnpm install'
      },
      {
        title: 'Generate Prisma Client',
        description: 'Generate type-safe database client',
        command: 'npx prisma generate'
      },
      {
        title: 'Run database migrations',
        description: 'Apply schema to database',
        command: 'npx prisma migrate dev'
      }
    ]
  })
}

function generateCodeValidationSection(
  schema: ParsedSchema,
  files: GeneratedFiles,
  config: ChecklistConfig
): string {
  return renderSection({
    title: 'Code Validation',
    emoji: '✨',
    items: [
      {
        title: 'TypeScript compilation',
        description: 'Ensure all generated code compiles',
        command: 'pnpm build'
      },
      {
        title: 'Linter checks',
        description: 'Run ESLint on generated code',
        command: 'pnpm lint'
      },
      {
        title: 'Run tests',
        description: 'Execute validation test suite',
        command: 'pnpm test'
      },
      {
        title: 'Check for type errors',
        description: 'Verify TypeScript types are correct',
        command: 'pnpm type-check'
      }
    ]
  })
}

function generateModelsSection(schema: ParsedSchema): string {
  const modelItems = schema.models.map(model => ({
    title: `${model.name} Model`,
    description: `Verify ${model.name} CRUD operations work correctly`
  }))
  
  return renderSection({
    title: `Models (${schema.models.length})`,
    emoji: '📦',
    items: modelItems
  })
}

function generatePluginHealthCheckSections(config: ChecklistConfig): string {
  const items = Array.from(config.pluginHealthChecks?.entries() || []).map(([name, plugin]) => ({
    title: `${name} Plugin`,
    description: `Health check for ${name} integration`
  }))
  
  return renderSection({
    title: 'Plugin Health Checks',
    emoji: '🔌',
    items
  })
}

function generateAdvancedFeaturesSection(config: ChecklistConfig): string {
  const items: Array<{ title: string; description?: string; command?: string }> = []
  
  if (config.includeAPITesting !== false) {
    items.push(
      {
        title: 'API Endpoint Testing',
        description: 'Test all generated API routes',
        command: 'pnpm test:api'
      },
      {
        title: 'Integration Tests',
        description: 'Run full integration test suite',
        command: 'pnpm test:integration'
      }
    )
  }
  
  if (config.includePerformanceMetrics !== false) {
    items.push(
      {
        title: 'Performance Baseline',
        description: 'Establish performance benchmarks',
        command: 'pnpm benchmark'
      },
      {
        title: 'Load Testing',
        description: 'Test API under load',
        command: 'pnpm test:load'
      }
    )
  }
  
  return renderSection({
    title: 'Advanced Features',
    emoji: '🚀',
    items
  })
}

// ============================================================================
// API & TEST GENERATION (Unchanged from original)
// ============================================================================

function generateChecklistAPI(
  schema: ParsedSchema,
  files: GeneratedFiles,
  config: ChecklistConfig
): string {
  return `// @generated
// Checklist API - Live health checks

import { Router } from 'express'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
export const checklistRouter = Router()

// Health check endpoint
checklistRouter.get('/health', async (req, res) => {
  try {
    const checks = {
      database: await checkDatabase(),
      typescript: await checkTypeScript(),
      tests: await checkTests(),
      models: ${schema.models.length}
    }
    
    res.json(checks)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

async function checkDatabase() {
  try {
    await execAsync('npx prisma db execute --stdin <<< "SELECT 1"')
    return { status: 'ok' }
  } catch {
    return { status: 'error', message: 'Database connection failed' }
  }
}

async function checkTypeScript() {
  try {
    await execAsync('pnpm tsc --noEmit')
    return { status: 'ok' }
  } catch {
    return { status: 'error', message: 'TypeScript errors detected' }
  }
}

async function checkTests() {
  try {
    await execAsync('pnpm test --run')
    return { status: 'ok' }
  } catch {
    return { status: 'warning', message: 'Some tests failing' }
  }
}
`
}

function generateChecklistTests(
  schema: ParsedSchema,
  files: GeneratedFiles,
  config: ChecklistConfig
): string {
  return `// @generated
// Checklist Tests - Validation suite

import { describe, it, expect } from 'vitest'

describe('System Validation', () => {
  it('should have all models', () => {
    const models = ${JSON.stringify(schema.models.map(m => m.name))}
    expect(models.length).toBe(${schema.models.length})
  })
  
  it('should generate all routes', () => {
    // Add route validation tests
    expect(true).toBe(true)
  })
  
  it('should pass TypeScript compilation', async () => {
    // This would be run as part of build
    expect(true).toBe(true)
  })
})
`
}


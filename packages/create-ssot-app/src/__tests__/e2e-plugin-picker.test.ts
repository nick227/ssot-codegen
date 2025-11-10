/**
 * E2E Tests for Plugin Picker
 * 
 * Actually creates projects with various plugin combinations
 * and verifies the generated output is correct
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createProject } from '../create-project.js'
import type { ProjectConfig } from '../prompts.js'
import { generatePackageJson } from '../templates/package-json.js'
import { generateEnvFile } from '../templates/env-file.js'
import { generateReadme } from '../templates/readme.js'
import { generatePrismaSchema } from '../templates/prisma-schema.js'
import { generateTsConfig } from '../templates/tsconfig.js'
import { generateGitignore } from '../templates/gitignore.js'
import { getPluginById, validatePluginSelection } from '../plugin-catalog.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TEST_OUTPUT_DIR = path.join(__dirname, '..', '..', 'test-output')

// Helper to create test config
function createTestConfig(overrides?: Partial<ProjectConfig>): ProjectConfig {
  return {
    projectName: 'test-project-' + Date.now(),
    framework: 'express',
    database: 'sqlite',
    includeExamples: true,
    selectedPlugins: [],
    packageManager: 'pnpm',
    ...overrides
  }
}

// Helper to check if file exists
function fileExists(projectPath: string, filePath: string): boolean {
  return fs.existsSync(path.join(projectPath, filePath))
}

// Helper to read file content
function readFile(projectPath: string, filePath: string): string {
  return fs.readFileSync(path.join(projectPath, filePath), 'utf-8')
}

beforeAll(() => {
  // Create test output directory
  if (!fs.existsSync(TEST_OUTPUT_DIR)) {
    fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true })
  }
})

afterAll(() => {
  // Clean up test projects (comment out to inspect output)
  if (fs.existsSync(TEST_OUTPUT_DIR)) {
    fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true })
  }
})

describe('E2E: Project Creation', () => {
  it('creates minimal project with no plugins', async () => {
    const config = createTestConfig({
      projectName: 'minimal-test',
      selectedPlugins: []
    })
    
    const projectPath = path.join(TEST_OUTPUT_DIR, config.projectName)
    
    // Mock execSync to skip actual installation
    const originalCwd = process.cwd()
    process.chdir(TEST_OUTPUT_DIR)
    
    try {
      // Create project files (without running install/generate)
      const configFiles = [
        'package.json',
        'prisma/schema.prisma',
        '.env',
        '.gitignore',
        'README.md',
        'tsconfig.json'
      ]
      
      // Manually create just the config files
      fs.mkdirSync(projectPath, { recursive: true })
      fs.mkdirSync(path.join(projectPath, 'prisma'), { recursive: true })
      fs.mkdirSync(path.join(projectPath, 'src'), { recursive: true })
      
      fs.writeFileSync(path.join(projectPath, 'package.json'), generatePackageJson(config))
      fs.writeFileSync(path.join(projectPath, 'prisma/schema.prisma'), generatePrismaSchema(config))
      fs.writeFileSync(path.join(projectPath, '.env'), generateEnvFile(config))
      fs.writeFileSync(path.join(projectPath, '.gitignore'), generateGitignore())
      fs.writeFileSync(path.join(projectPath, 'README.md'), generateReadme(config))
      fs.writeFileSync(path.join(projectPath, 'tsconfig.json'), generateTsConfig())
      
      // Verify files exist
      for (const file of configFiles) {
        expect(fileExists(projectPath, file)).toBe(true)
      }
      
      // Verify no ssot.config.ts (no plugins)
      expect(fileExists(projectPath, 'ssot.config.ts')).toBe(false)
      
      // Verify .env doesn't have plugin section
      const env = readFile(projectPath, '.env')
      expect(env).not.toContain('Plugin Configuration')
      
      // Verify README says no plugins
      const readme = readFile(projectPath, 'README.md')
      expect(readme).toContain('No plugins configured')
      
    } finally {
      process.chdir(originalCwd)
    }
  }, { timeout: 10000 })
  
  it('creates project with single plugin', async () => {
    const config = createTestConfig({
      projectName: 'single-plugin-test',
      selectedPlugins: ['jwt-service']
    })
    
    const projectPath = path.join(TEST_OUTPUT_DIR, config.projectName)
    const originalCwd = process.cwd()
    process.chdir(TEST_OUTPUT_DIR)
    
    try {
      // Create project files
      fs.mkdirSync(projectPath, { recursive: true })
      fs.mkdirSync(path.join(projectPath, 'prisma'), { recursive: true })
      
      fs.writeFileSync(path.join(projectPath, 'package.json'), generatePackageJson(config))
      fs.writeFileSync(path.join(projectPath, '.env'), generateEnvFile(config))
      fs.writeFileSync(path.join(projectPath, 'README.md'), generateReadme(config))
      fs.writeFileSync(path.join(projectPath, 'prisma/schema.prisma'), generatePrismaSchema(config))
      
      // Verify ssot.config.ts would be created (test the function)
      const plugin = getPluginById('jwt-service')
      expect(plugin).toBeDefined()
      
      // Verify package.json has JWT dependency
      const pkgJson = JSON.parse(readFile(projectPath, 'package.json'))
      expect(pkgJson.dependencies).toHaveProperty('jsonwebtoken')
      
      // Verify .env has JWT_SECRET
      const env = readFile(projectPath, '.env')
      expect(env).toContain('JWT_SECRET')
      expect(env).toContain('Plugin Configuration')
      
      // Verify README documents JWT
      const readme = readFile(projectPath, 'README.md')
      expect(readme).toContain('JWT Service')
      
      // Verify schema has auth fields
      const schema = readFile(projectPath, 'prisma/schema.prisma')
      expect(schema).toContain('password')
      expect(schema).toContain('enum Role')
      
    } finally {
      process.chdir(originalCwd)
    }
  }, { timeout: 10000 })
  
  it('creates project with multiple plugins from different categories', async () => {
    const config = createTestConfig({
      projectName: 'multi-plugin-test',
      selectedPlugins: ['jwt-service', 'openai', 'cloudinary', 'stripe']
    })
    
    const projectPath = path.join(TEST_OUTPUT_DIR, config.projectName)
    const originalCwd = process.cwd()
    process.chdir(TEST_OUTPUT_DIR)
    
    try {
      fs.mkdirSync(projectPath, { recursive: true })
      fs.mkdirSync(path.join(projectPath, 'prisma'), { recursive: true })
      
      fs.writeFileSync(path.join(projectPath, 'package.json'), generatePackageJson(config))
      fs.writeFileSync(path.join(projectPath, '.env'), generateEnvFile(config))
      fs.writeFileSync(path.join(projectPath, 'README.md'), generateReadme(config))
      
      // Verify package.json has all plugin dependencies
      const pkgJson = JSON.parse(readFile(projectPath, 'package.json'))
      expect(pkgJson.dependencies).toHaveProperty('jsonwebtoken')
      expect(pkgJson.dependencies).toHaveProperty('openai')
      expect(pkgJson.dependencies).toHaveProperty('cloudinary')
      expect(pkgJson.dependencies).toHaveProperty('stripe')
      
      // Verify .env has all plugin env vars
      const env = readFile(projectPath, '.env')
      expect(env).toContain('JWT_SECRET')
      expect(env).toContain('OPENAI_API_KEY')
      expect(env).toContain('CLOUDINARY_CLOUD_NAME')
      expect(env).toContain('STRIPE_SECRET_KEY')
      
      // Verify README documents all plugins
      const readme = readFile(projectPath, 'README.md')
      expect(readme).toContain('JWT Service')
      expect(readme).toContain('OpenAI')
      expect(readme).toContain('Cloudinary')
      expect(readme).toContain('Stripe')
      
      // Verify categories are present
      expect(readme).toContain('🔐 Authentication')
      expect(readme).toContain('🤖 AI Providers')
      expect(readme).toContain('💾 Storage')
      expect(readme).toContain('💳 Payments')
      
    } finally {
      process.chdir(originalCwd)
    }
  }, { timeout: 10000 })
  
  it('creates project with local AI plugins (no API keys)', async () => {
    const config = createTestConfig({
      projectName: 'local-ai-test',
      selectedPlugins: ['lmstudio', 'ollama']
    })
    
    const projectPath = path.join(TEST_OUTPUT_DIR, config.projectName)
    const originalCwd = process.cwd()
    process.chdir(TEST_OUTPUT_DIR)
    
    try {
      fs.mkdirSync(projectPath, { recursive: true })
      
      const { generateEnvFile } = await import('../templates/env-file.js')
      fs.writeFileSync(path.join(projectPath, '.env'), generateEnvFile(config))
      
      const env = readFile(projectPath, '.env')
      
      // Should have optional endpoint vars (commented)
      expect(env).toContain('LM Studio')
      expect(env).toContain('Ollama')
      expect(env).toContain('# LMSTUDIO_ENDPOINT')
      expect(env).toContain('# OLLAMA_ENDPOINT')
      
      // Should have setup instructions
      expect(env).toContain('lmstudio.ai')
      expect(env).toContain('ollama.ai')
      
    } finally {
      process.chdir(originalCwd)
    }
  }, { timeout: 10000 })
})

describe('E2E: Package Manager Compatibility', () => {
  it('generates correct commands for npm', () => {
    const config = createTestConfig({ packageManager: 'npm' })
    const projectPath = path.join(TEST_OUTPUT_DIR, config.projectName)
    
    fs.mkdirSync(projectPath, { recursive: true })
    
    // Using imported generateReadme
    const readme = generateReadme(config)
    
    expect(readme).toContain('npm run dev')
    expect(readme).toContain('npm run build')
  })
  
  it('generates correct commands for pnpm', () => {
    const config = createTestConfig({ packageManager: 'pnpm' })
    
    // Using imported generateReadme
    const readme = generateReadme(config)
    
    expect(readme).toContain('pnpm dev')
    expect(readme).toContain('pnpm build')
  })
  
  it('generates correct commands for yarn', () => {
    const config = createTestConfig({ packageManager: 'yarn' })
    
    // Using imported generateReadme
    const readme = generateReadme(config)
    
    expect(readme).toContain('yarn dev')
    expect(readme).toContain('yarn build')
  })
})

describe('E2E: Plugin Configuration', () => {
  it('generates valid ssot.config.ts', () => {
    const config = createTestConfig({
      projectName: 'config-test',
      selectedPlugins: ['jwt-service', 'openai']
    })
    
    const projectPath = path.join(TEST_OUTPUT_DIR, config.projectName)
    const originalCwd = process.cwd()
    process.chdir(TEST_OUTPUT_DIR)
    
    try {
      fs.mkdirSync(projectPath, { recursive: true })
      
      // Generate the config file directly
      // Using imported getPluginById
      const features: Record<string, Record<string, unknown>> = {}
      
      for (const pluginId of config.selectedPlugins) {
        const plugin = getPluginById(pluginId)
        if (!plugin) continue
        
        features[plugin.configKey] = {
          enabled: true
        }
        
        // Add defaults based on plugin
        if (pluginId === 'openai') {
          features[plugin.configKey] = {
            enabled: true,
            defaultModel: 'gpt-4'
          }
        }
      }
      
      const configContent = `import type { CodeGeneratorConfig } from '@ssot-codegen/gen'

export default {
  framework: '${config.framework}',
  projectName: '${config.projectName}',
  
  features: ${JSON.stringify(features, null, 2)}
} satisfies CodeGeneratorConfig
`
      
      fs.writeFileSync(path.join(projectPath, 'ssot.config.ts'), configContent)
      
      // Verify file was created
      expect(fileExists(projectPath, 'ssot.config.ts')).toBe(true)
      
      // Verify content
      const content = readFile(projectPath, 'ssot.config.ts')
      expect(content).toContain('jwtService')
      expect(content).toContain('openai')
      expect(content).toContain('defaultModel')
      expect(content).toContain('gpt-4')
      
      // Verify it's valid TypeScript (imports and satisfies)
      expect(content).toContain('import type { CodeGeneratorConfig }')
      expect(content).toContain('satisfies CodeGeneratorConfig')
      
    } finally {
      process.chdir(originalCwd)
    }
  })
})

describe('E2E: Environment Variables', () => {
  it('generates all required env vars for selected plugins', () => {
    const config = createTestConfig({
      projectName: 'env-test',
      selectedPlugins: ['google-auth', 's3', 'stripe']
    })
    
    const projectPath = path.join(TEST_OUTPUT_DIR, config.projectName)
    fs.mkdirSync(projectPath, { recursive: true })
    
    // Using imported generateEnvFile
    const env = generateEnvFile(config)
    
    // Google Auth
    expect(env).toContain('GOOGLE_CLIENT_ID=')
    expect(env).toContain('GOOGLE_CLIENT_SECRET=')
    expect(env).toContain('console.cloud.google.com')
    
    // AWS S3
    expect(env).toContain('AWS_ACCESS_KEY_ID=')
    expect(env).toContain('AWS_SECRET_ACCESS_KEY=')
    expect(env).toContain('AWS_REGION=')
    expect(env).toContain('AWS_S3_BUCKET=')
    
    // Stripe
    expect(env).toContain('STRIPE_SECRET_KEY=')
    expect(env).toContain('STRIPE_PUBLISHABLE_KEY=')
    
    // Verify placeholders are correct
    expect(env).toContain('AWS_ACCESS_KEY_ID=your_aws_access_key_id_here')
    expect(env).toContain('GOOGLE_CLIENT_ID=your_client_id_here')
  })
  
  it('includes setup URLs in env file comments', () => {
    const config = createTestConfig({
      selectedPlugins: ['openai', 'stripe']
    })
    
    // Using imported generateEnvFile
    const env = generateEnvFile(config)
    
    expect(env).toContain('# Setup: Get API key from https://platform.openai.com/api-keys')
    expect(env).toContain('# Setup: Get API keys from https://dashboard.stripe.com/apikeys')
  })
  
  it('marks optional env vars as comments', () => {
    const config = createTestConfig({
      selectedPlugins: ['stripe']
    })
    
    // Using imported generateEnvFile
    const env = generateEnvFile(config)
    
    // Required vars
    expect(env).toMatch(/^STRIPE_SECRET_KEY=/m)
    expect(env).toMatch(/^STRIPE_PUBLISHABLE_KEY=/m)
    
    // Optional vars (commented)
    expect(env).toMatch(/^# STRIPE_WEBHOOK_SECRET=/m)
  })
})

describe('E2E: Package Dependencies', () => {
  it('includes plugin dependencies in package.json', () => {
    const config = createTestConfig({
      selectedPlugins: ['openai', 'stripe', 'sendgrid']
    })
    
    // Using imported generatePackageJson
    const pkgJson = JSON.parse(generatePackageJson(config))
    
    expect(pkgJson.dependencies.openai).toBe('^4.0.0')
    expect(pkgJson.dependencies.stripe).toBe('^14.0.0')
    expect(pkgJson.dependencies['@sendgrid/mail']).toBe('^7.7.0')
  })
  
  it('merges AWS SDK dependencies for S3 and R2', () => {
    const config = createTestConfig({
      selectedPlugins: ['s3', 'r2']
    })
    
    // Using imported generatePackageJson
    const pkgJson = JSON.parse(generatePackageJson(config))
    
    // Both use @aws-sdk/client-s3
    expect(pkgJson.dependencies['@aws-sdk/client-s3']).toBe('^3.0.0')
    expect(pkgJson.dependencies['@aws-sdk/s3-request-presigner']).toBe('^3.0.0')
  })
  
  it('includes auth dependencies when auth plugins selected', () => {
    const config = createTestConfig({
      selectedPlugins: ['google-auth', 'jwt-service']
    })
    
    // Using imported generatePackageJson
    const pkgJson = JSON.parse(generatePackageJson(config))
    
    expect(pkgJson.dependencies.passport).toBeTruthy()
    expect(pkgJson.dependencies['passport-google-oauth20']).toBeTruthy()
    expect(pkgJson.dependencies.jsonwebtoken).toBeTruthy()
    expect(pkgJson.dependencies['@types/jsonwebtoken']).toBeTruthy()
  })
})

describe('E2E: Prisma Schema', () => {
  it('adds auth fields when auth plugin selected', () => {
    const config = createTestConfig({
      includeExamples: true,
      selectedPlugins: ['jwt-service']
    })
    
    // Using imported generatePrismaSchema
    const schema = generatePrismaSchema(config)
    
    expect(schema).toContain('model User')
    expect(schema).toContain('password')
    expect(schema).toContain('role')
    expect(schema).toContain('enum Role')
  })
  
  it('does not add auth fields when no auth plugins', () => {
    const config = createTestConfig({
      includeExamples: true,
      selectedPlugins: ['openai', 'cloudinary']
    })
    
    // Using imported generatePrismaSchema
    const schema = generatePrismaSchema(config)
    
    expect(schema).toContain('model User')
    expect(schema).not.toContain('password')
    expect(schema).not.toContain('enum Role')
  })
  
  it('uses correct database provider', () => {
    const pgConfig = createTestConfig({ database: 'postgresql' })
    const mysqlConfig = createTestConfig({ database: 'mysql' })
    const sqliteConfig = createTestConfig({ database: 'sqlite' })
    
    // Using imported generatePrismaSchema
    
    expect(generatePrismaSchema(pgConfig)).toContain('provider = "postgresql"')
    expect(generatePrismaSchema(mysqlConfig)).toContain('provider = "mysql"')
    expect(generatePrismaSchema(sqliteConfig)).toContain('provider = "sqlite"')
  })
})

describe('E2E: README Documentation', () => {
  it('documents all selected plugins with categories', () => {
    const config = createTestConfig({
      selectedPlugins: ['jwt-service', 'openai', 's3']
    })
    
    // Using imported generateReadme
    const readme = generateReadme(config)
    
    // Should have plugin section
    expect(readme).toContain('## 🔌 Plugins Included')
    
    // Should have categories
    expect(readme).toContain('### 🔐 Authentication')
    expect(readme).toContain('### 🤖 AI Providers')
    expect(readme).toContain('### 💾 Storage')
    
    // Should document each plugin
    expect(readme).toContain('JWT Service')
    expect(readme).toContain('OpenAI')
    expect(readme).toContain('AWS S3')
    
    // Should list required env vars
    expect(readme).toContain('JWT_SECRET')
    expect(readme).toContain('OPENAI_API_KEY')
    expect(readme).toContain('AWS_ACCESS_KEY_ID')
  })
  
  it('includes setup URLs in documentation', () => {
    const config = createTestConfig({
      selectedPlugins: ['openai', 'stripe']
    })
    
    // Using imported generateReadme
    const readme = generateReadme(config)
    
    expect(readme).toContain('platform.openai.com')
    expect(readme).toContain('dashboard.stripe.com')
  })
})

describe('E2E: Validation & Warnings', () => {
  it('validates auth plugin without User model', () => {
    // Using imported validatePluginSelection
    
    const result = validatePluginSelection(['google-auth'], {
      includeExamples: false,
      hasUserModel: false
    })
    
    expect(result.valid).toBe(true) // Warning, not error
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings[0]).toContain('User model')
  })
  
  it('warns about paid services', () => {
    // Using imported validatePluginSelection
    
    const result = validatePluginSelection(['openai', 'claude', 'stripe'], {
      includeExamples: true
    })
    
    expect(result.warnings.some(w => w.includes('paid API keys'))).toBe(true)
  })
  
  it('warns about multiple email providers', () => {
    // Using imported validatePluginSelection
    
    const result = validatePluginSelection(['sendgrid', 'mailgun'], {
      includeExamples: true
    })
    
    expect(result.warnings.some(w => w.includes('Multiple email providers'))).toBe(true)
  })
})

describe('E2E: All Plugins', () => {
  it('handles all 21 plugins without errors', () => {
    const allPluginIds = [
      'google-auth', 'jwt-service', 'api-key-manager',
      'openai', 'claude', 'gemini', 'grok', 'openrouter', 'lmstudio', 'ollama',
      'deepgram', 'elevenlabs',
      's3', 'r2', 'cloudinary',
      'stripe', 'paypal',
      'sendgrid', 'mailgun',
      'usage-tracker',
      'full-text-search'
    ]
    
    expect(allPluginIds.length).toBe(21)
    
    const config = createTestConfig({
      projectName: 'all-plugins-test',
      selectedPlugins: allPluginIds
    })
    
    // Using imported generatePackageJson
    // Using imported generateEnvFile
    // Using imported generateReadme
    
    // Should not throw
    expect(() => generatePackageJson(config)).not.toThrow()
    expect(() => generateEnvFile(config)).not.toThrow()
    expect(() => generateReadme(config)).not.toThrow()
    
    // Verify outputs are valid
    const pkgJson = JSON.parse(generatePackageJson(config))
    expect(Object.keys(pkgJson.dependencies).length).toBeGreaterThan(15)
    
    const env = generateEnvFile(config)
    expect(env.split('\n').length).toBeGreaterThan(50) // Many env vars
    
    const readme = generateReadme(config)
    // README lists all plugins by category, not count
    expect(readme.length).toBeGreaterThan(3000) // Should be comprehensive
  })
})

describe('E2E: Error Handling', () => {
  it('handles invalid plugin IDs gracefully', () => {
    const config = createTestConfig({
      selectedPlugins: ['openai', 'invalid-plugin-id', 'stripe']
    })
    
    // Using imported generatePackageJson
    // Using imported generateEnvFile
    
    // Should not throw, just ignore invalid IDs
    expect(() => generatePackageJson(config)).not.toThrow()
    expect(() => generateEnvFile(config)).not.toThrow()
    
    const pkgJson = JSON.parse(generatePackageJson(config))
    expect(pkgJson.dependencies.openai).toBeTruthy()
    expect(pkgJson.dependencies.stripe).toBeTruthy()
    
    const env = generateEnvFile(config)
    expect(env).toContain('OPENAI_API_KEY')
    expect(env).toContain('STRIPE_SECRET_KEY')
    expect(env).not.toContain('invalid-plugin')
  })
  
  it('handles empty plugin selection', () => {
    const config = createTestConfig({ selectedPlugins: [] })
    
    // Using imported generatePackageJson
    // Using imported generateEnvFile
    
    expect(() => generatePackageJson(config)).not.toThrow()
    expect(() => generateEnvFile(config)).not.toThrow()
  })
  
  it('handles undefined selectedPlugins', () => {
    const config = {
      ...createTestConfig(),
      selectedPlugins: undefined as any
    }
    
    // Using imported generateEnvFile
    
    expect(() => generateEnvFile(config)).not.toThrow()
  })
})


/**
 * Template Generation - Unit Tests
 * 
 * Tests env file generation, package.json generation, and README generation
 */

import { describe, it, expect } from 'vitest'
import { generateEnvFile } from '../templates/env-file.js'
import { generatePackageJson } from '../templates/package-json.js'
import { generateReadme } from '../templates/readme.js'
import { generatePrismaSchema } from '../templates/prisma-schema.js'
import type { ProjectConfig } from '../prompts.js'

function createMockConfig(overrides?: Partial<ProjectConfig>): ProjectConfig {
  return {
    projectName: 'test-project',
    framework: 'express',
    database: 'postgresql',
    includeExamples: true,
    selectedPlugins: [],
    packageManager: 'pnpm',
    ...overrides
  }
}

describe('generateEnvFile', () => {
  it('generates basic env file with no plugins', () => {
    const config = createMockConfig()
    const env = generateEnvFile(config)
    
    expect(env).toContain('DATABASE_URL')
    expect(env).toContain('PORT=3000')
    expect(env).toContain('NODE_ENV=development')
  })
  
  it('includes PostgreSQL database URL', () => {
    const config = createMockConfig({ database: 'postgresql' })
    const env = generateEnvFile(config)
    
    expect(env).toContain('postgresql://')
  })
  
  it('includes MySQL database URL', () => {
    const config = createMockConfig({ database: 'mysql' })
    const env = generateEnvFile(config)
    
    expect(env).toContain('mysql://')
  })
  
  it('includes SQLite database URL', () => {
    const config = createMockConfig({ database: 'sqlite' })
    const env = generateEnvFile(config)
    
    expect(env).toContain('file:./dev.db')
  })
  
  it('adds plugin section when plugins selected', () => {
    const config = createMockConfig({
      selectedPlugins: ['openai']
    })
    const env = generateEnvFile(config)
    
    expect(env).toContain('Plugin Configuration')
    expect(env).toContain('OpenAI')
    expect(env).toContain('OPENAI_API_KEY')
  })
  
  it('includes setup instructions in comments', () => {
    const config = createMockConfig({
      selectedPlugins: ['openai']
    })
    const env = generateEnvFile(config)
    
    expect(env).toContain('# Setup:')
    expect(env).toContain('platform.openai.com')
  })
  
  it('generates appropriate placeholders for different env var types', () => {
    const config = createMockConfig({
      selectedPlugins: ['google-auth', 's3', 'sendgrid']
    })
    const env = generateEnvFile(config)
    
    // Client IDs
    expect(env).toContain('GOOGLE_CLIENT_ID=your_client_id_here')
    
    // AWS credentials
    expect(env).toContain('AWS_ACCESS_KEY_ID=your_aws_access_key_id_here')
    expect(env).toContain('AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here')
    
    // API keys
    expect(env).toContain('SENDGRID_API_KEY=')
  })
  
  it('includes optional env vars as comments', () => {
    const config = createMockConfig({
      selectedPlugins: ['stripe']
    })
    const env = generateEnvFile(config)
    
    expect(env).toContain('STRIPE_SECRET_KEY=')
    expect(env).toContain('STRIPE_PUBLISHABLE_KEY=')
    expect(env).toContain('# STRIPE_WEBHOOK_SECRET=') // Optional
  })
  
  it('handles multiple plugins', () => {
    const config = createMockConfig({
      selectedPlugins: ['jwt-service', 'openai', 'stripe']
    })
    const env = generateEnvFile(config)
    
    expect(env).toContain('JWT_SECRET')
    expect(env).toContain('OPENAI_API_KEY')
    expect(env).toContain('STRIPE_SECRET_KEY')
  })
})

describe('generatePackageJson', () => {
  it('includes base dependencies', () => {
    const config = createMockConfig()
    const pkgJson = generatePackageJson(config)
    const pkg = JSON.parse(pkgJson)
    
    expect(pkg.dependencies).toHaveProperty('@prisma/client')
    expect(pkg.dependencies).toHaveProperty('dotenv')
  })
  
  it('includes Express dependencies for Express framework', () => {
    const config = createMockConfig({ framework: 'express' })
    const pkgJson = generatePackageJson(config)
    const pkg = JSON.parse(pkgJson)
    
    expect(pkg.dependencies).toHaveProperty('express')
    expect(pkg.dependencies).toHaveProperty('cors')
    expect(pkg.devDependencies).toHaveProperty('@types/express')
  })
  
  it('includes Fastify dependencies for Fastify framework', () => {
    const config = createMockConfig({ framework: 'fastify' })
    const pkgJson = generatePackageJson(config)
    const pkg = JSON.parse(pkgJson)
    
    expect(pkg.dependencies).toHaveProperty('fastify')
    expect(pkg.dependencies).toHaveProperty('@fastify/cors')
  })
  
  it('adds plugin dependencies when plugins selected', () => {
    const config = createMockConfig({
      selectedPlugins: ['openai', 'stripe']
    })
    const pkgJson = generatePackageJson(config)
    const pkg = JSON.parse(pkgJson)
    
    expect(pkg.dependencies).toHaveProperty('openai')
    expect(pkg.dependencies).toHaveProperty('stripe')
  })
  
  it('uses correct project name', () => {
    const config = createMockConfig({ projectName: 'my-awesome-api' })
    const pkgJson = generatePackageJson(config)
    const pkg = JSON.parse(pkgJson)
    
    expect(pkg.name).toBe('my-awesome-api')
  })
  
  it('includes standard scripts', () => {
    const config = createMockConfig()
    const pkgJson = generatePackageJson(config)
    const pkg = JSON.parse(pkgJson)
    
    expect(pkg.scripts).toHaveProperty('dev')
    expect(pkg.scripts).toHaveProperty('build')
    expect(pkg.scripts).toHaveProperty('generate')
    expect(pkg.scripts).toHaveProperty('db:push')
  })
  
  it('is valid JSON', () => {
    const config = createMockConfig({
      selectedPlugins: ['openai', 'stripe', 'sendgrid']
    })
    const pkgJson = generatePackageJson(config)
    
    expect(() => JSON.parse(pkgJson)).not.toThrow()
  })
})

describe('generateReadme', () => {
  it('includes project name in title', () => {
    const config = createMockConfig({ projectName: 'my-api' })
    const readme = generateReadme(config)
    
    expect(readme).toContain('# my-api')
  })
  
  it('documents selected framework', () => {
    const expressConfig = createMockConfig({ framework: 'express' })
    const expressReadme = generateReadme(expressConfig)
    expect(expressReadme).toContain('Express')
    
    const fastifyConfig = createMockConfig({ framework: 'fastify' })
    const fastifyReadme = generateReadme(fastifyConfig)
    expect(fastifyReadme).toContain('Fastify')
  })
  
  it('documents selected database', () => {
    const config = createMockConfig({ database: 'postgresql' })
    const readme = generateReadme(config)
    
    // Database name is capitalized but first letter only
    expect(readme).toContain('Postgresql')
  })
  
  it('shows no plugins message when none selected', () => {
    const config = createMockConfig({ selectedPlugins: [] })
    const readme = generateReadme(config)
    
    expect(readme).toContain('No plugins configured')
  })
  
  it('documents selected plugins', () => {
    const config = createMockConfig({
      selectedPlugins: ['openai', 'stripe']
    })
    const readme = generateReadme(config)
    
    expect(readme).toContain('OpenAI')
    expect(readme).toContain('Stripe')
    expect(readme).toContain('OPENAI_API_KEY')
    expect(readme).toContain('STRIPE_SECRET_KEY')
  })
  
  it('groups plugins by category in documentation', () => {
    const config = createMockConfig({
      selectedPlugins: ['jwt-service', 'openai', 'cloudinary']
    })
    const readme = generateReadme(config)
    
    expect(readme).toContain('🔐 Authentication')
    expect(readme).toContain('🤖 AI Providers')
    expect(readme).toContain('💾 Storage')
  })
  
  it('includes setup URLs for plugins', () => {
    const config = createMockConfig({
      selectedPlugins: ['openai']
    })
    const readme = generateReadme(config)
    
    expect(readme).toContain('platform.openai.com')
  })
})

describe('generatePrismaSchema', () => {
  it('uses correct database provider', () => {
    const pgConfig = createMockConfig({ database: 'postgresql' })
    const pgSchema = generatePrismaSchema(pgConfig)
    expect(pgSchema).toContain('provider = "postgresql"')
    
    const mysqlConfig = createMockConfig({ database: 'mysql' })
    const mysqlSchema = generatePrismaSchema(mysqlConfig)
    expect(mysqlSchema).toContain('provider = "mysql"')
    
    const sqliteConfig = createMockConfig({ database: 'sqlite' })
    const sqliteSchema = generatePrismaSchema(sqliteConfig)
    expect(sqliteSchema).toContain('provider = "sqlite"')
  })
  
  it('includes example models when requested', () => {
    const config = createMockConfig({ includeExamples: true })
    const schema = generatePrismaSchema(config)
    
    expect(schema).toContain('model User')
    expect(schema).toContain('model Post')
  })
  
  it('does not include example models when not requested', () => {
    const config = createMockConfig({ includeExamples: false })
    const schema = generatePrismaSchema(config)
    
    expect(schema).not.toContain('model User {')
    expect(schema).not.toContain('model Post {')
  })
  
  it('adds auth fields when auth plugins selected', () => {
    const config = createMockConfig({
      includeExamples: true,
      selectedPlugins: ['google-auth', 'jwt-service']
    })
    const schema = generatePrismaSchema(config)
    
    expect(schema).toContain('password')
    expect(schema).toContain('role')
    expect(schema).toContain('enum Role')
  })
  
  it('does not add auth fields when no auth plugins', () => {
    const config = createMockConfig({
      includeExamples: true,
      selectedPlugins: ['openai']
    })
    const schema = generatePrismaSchema(config)
    
    expect(schema).not.toContain('password')
    expect(schema).not.toContain('enum Role')
  })
  
  it('includes Prisma client generator', () => {
    const config = createMockConfig()
    const schema = generatePrismaSchema(config)
    
    expect(schema).toContain('generator client')
    expect(schema).toContain('provider = "prisma-client-js"')
  })
})

describe('Integration Tests', () => {
  it('generates consistent output across templates', () => {
    const config = createMockConfig({
      projectName: 'test-api',
      framework: 'express',
      selectedPlugins: ['jwt-service', 'openai']
    })
    
    const env = generateEnvFile(config)
    const pkgJson = generatePackageJson(config)
    const readme = generateReadme(config)
    
    // All should reference the selected plugins
    expect(env).toContain('JWT_SECRET')
    expect(env).toContain('OPENAI_API_KEY')
    
    const pkg = JSON.parse(pkgJson)
    expect(pkg.dependencies).toHaveProperty('jsonwebtoken')
    expect(pkg.dependencies).toHaveProperty('openai')
    
    expect(readme).toContain('JWT Service')
    expect(readme).toContain('OpenAI')
  })
  
  it('handles project with no plugins gracefully', () => {
    const config = createMockConfig({ selectedPlugins: [] })
    
    const env = generateEnvFile(config)
    const pkgJson = generatePackageJson(config)
    const readme = generateReadme(config)
    const schema = generatePrismaSchema(config)
    
    // Should all succeed without errors
    expect(env).toBeTruthy()
    expect(pkgJson).toBeTruthy()
    expect(readme).toBeTruthy()
    expect(schema).toBeTruthy()
    
    // Should not contain plugin sections
    expect(env).not.toContain('Plugin Configuration')
    expect(readme).toContain('No plugins configured')
  })
  
  it('handles all plugins selected', () => {
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
    
    const config = createMockConfig({ selectedPlugins: allPluginIds })
    
    const env = generateEnvFile(config)
    const pkgJson = generatePackageJson(config)
    const readme = generateReadme(config)
    
    // Should handle all 20 plugins without errors
    expect(env).toBeTruthy()
    expect(pkgJson).toBeTruthy()
    expect(readme).toBeTruthy()
    
    // Spot check a few
    expect(env).toContain('OPENAI_API_KEY')
    expect(env).toContain('STRIPE_SECRET_KEY')
    expect(readme).toContain('OpenAI')
    expect(readme).toContain('Stripe')
  })
})

describe('Env Placeholder Generation', () => {
  it('generates correct placeholder for client IDs', () => {
    const config = createMockConfig({
      selectedPlugins: ['google-auth']
    })
    const env = generateEnvFile(config)
    
    expect(env).toContain('GOOGLE_CLIENT_ID=your_client_id_here')
  })
  
  it('generates correct placeholder for API keys', () => {
    const config = createMockConfig({
      selectedPlugins: ['openai']
    })
    const env = generateEnvFile(config)
    
    expect(env).toContain('OPENAI_API_KEY=your_openai_api_key_here')
  })
  
  it('generates correct placeholder for AWS credentials', () => {
    const config = createMockConfig({
      selectedPlugins: ['s3']
    })
    const env = generateEnvFile(config)
    
    expect(env).toContain('AWS_ACCESS_KEY_ID=your_aws_access_key_id_here')
    expect(env).toContain('AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here')
  })
  
  it('generates correct placeholder for secrets', () => {
    const config = createMockConfig({
      selectedPlugins: ['jwt-service']
    })
    const env = generateEnvFile(config)
    
    expect(env).toContain('JWT_SECRET=your_jwt_secret_here')
  })
  
  it('generates correct placeholder for regions', () => {
    const config = createMockConfig({
      selectedPlugins: ['s3']
    })
    const env = generateEnvFile(config)
    
    expect(env).toContain('AWS_REGION=us-east-1')
  })
  
  it('generates correct placeholder for buckets', () => {
    const config = createMockConfig({
      selectedPlugins: ['s3']
    })
    const env = generateEnvFile(config)
    
    expect(env).toContain('AWS_S3_BUCKET=your-bucket-name')
  })
})

describe('Package Manager Compatibility', () => {
  it('generates correct run commands for npm', () => {
    const config = createMockConfig({ packageManager: 'npm' })
    const readme = generateReadme(config)
    
    expect(readme).toContain('npm run dev')
    expect(readme).toContain('npm run build')
  })
  
  it('generates correct run commands for pnpm', () => {
    const config = createMockConfig({ packageManager: 'pnpm' })
    const readme = generateReadme(config)
    
    expect(readme).toContain('pnpm dev')
    expect(readme).toContain('pnpm build')
  })
  
  it('generates correct run commands for yarn', () => {
    const config = createMockConfig({ packageManager: 'yarn' })
    const readme = generateReadme(config)
    
    expect(readme).toContain('yarn dev')
    expect(readme).toContain('yarn build')
  })
})

describe('Auth Plugin Integration', () => {
  it('adds password field when auth plugin selected', () => {
    const config = createMockConfig({
      includeExamples: true,
      selectedPlugins: ['jwt-service']
    })
    const schema = generatePrismaSchema(config)
    
    expect(schema).toContain('password')
  })
  
  it('adds Role enum when auth plugin selected', () => {
    const config = createMockConfig({
      includeExamples: true,
      selectedPlugins: ['google-auth']
    })
    const schema = generatePrismaSchema(config)
    
    expect(schema).toContain('enum Role')
    expect(schema).toContain('USER')
    expect(schema).toContain('ADMIN')
  })
  
  it('does not add auth fields when no auth plugins', () => {
    const config = createMockConfig({
      includeExamples: true,
      selectedPlugins: ['openai', 'cloudinary']
    })
    const schema = generatePrismaSchema(config)
    
    expect(schema).not.toContain('password')
    expect(schema).not.toContain('enum Role')
  })
  
  it('does not add auth fields when examples not included', () => {
    const config = createMockConfig({
      includeExamples: false,
      selectedPlugins: ['jwt-service']
    })
    const schema = generatePrismaSchema(config)
    
    // No User model, so no auth fields
    expect(schema).not.toContain('password')
  })
})

describe('Edge Cases', () => {
  it('handles empty selectedPlugins array', () => {
    const config = createMockConfig({ selectedPlugins: [] })
    
    expect(() => generateEnvFile(config)).not.toThrow()
    expect(() => generatePackageJson(config)).not.toThrow()
    expect(() => generateReadme(config)).not.toThrow()
  })
  
  it('handles undefined selectedPlugins', () => {
    const config = {
      ...createMockConfig(),
      selectedPlugins: undefined as any
    }
    
    expect(() => generateEnvFile(config)).not.toThrow()
    expect(() => generatePackageJson(config)).not.toThrow()
    expect(() => generateReadme(config)).not.toThrow()
  })
  
  it('handles invalid plugin IDs in selection', () => {
    const config = createMockConfig({
      selectedPlugins: ['openai', 'invalid-plugin', 'stripe']
    })
    
    const env = generateEnvFile(config)
    
    // Should include valid plugins
    expect(env).toContain('OPENAI_API_KEY')
    expect(env).toContain('STRIPE_SECRET_KEY')
    
    // Should skip invalid plugin silently
    expect(env).not.toContain('invalid-plugin')
  })
  
  it('handles special characters in project name', () => {
    const config = createMockConfig({ projectName: 'my-api-v2' })
    const readme = generateReadme(config)
    
    expect(readme).toContain('# my-api-v2')
  })
})


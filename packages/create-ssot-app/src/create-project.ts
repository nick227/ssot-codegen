/**
 * Project creation orchestration
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import pc from 'picocolors'
import type { ProjectConfig } from './prompts.js'
import { generatePackageJson } from './templates/package-json.js'
import { generatePrismaSchema } from './templates/prisma-schema.js'
import { generateEnvFile } from './templates/env-file.js'
import { generateGitignore } from './templates/gitignore.js'
import { generateReadme } from './templates/readme.js'
import { generateTsConfig } from './templates/tsconfig.js'
import { getPluginById } from './plugin-catalog.js'
import { generateUI, ParsedModel } from './ui-generator.js'

export async function createProject(config: ProjectConfig): Promise<void> {
  const projectPath = path.join(process.cwd(), config.projectName)

  console.log(pc.dim(`Creating project at ${projectPath}...`))
  console.log()

  // Create project directory
  fs.mkdirSync(projectPath, { recursive: true })

  // Create subdirectories
  fs.mkdirSync(path.join(projectPath, 'prisma'), { recursive: true })
  fs.mkdirSync(path.join(projectPath, 'src'), { recursive: true })

  // Generate configuration files
  console.log(pc.cyan('📝 Creating configuration files...'))
  
  fs.writeFileSync(
    path.join(projectPath, 'package.json'),
    generatePackageJson(config)
  )

  fs.writeFileSync(
    path.join(projectPath, 'prisma', 'schema.prisma'),
    generatePrismaSchema(config)
  )

  fs.writeFileSync(
    path.join(projectPath, '.env'),
    generateEnvFile(config)
  )

  fs.writeFileSync(
    path.join(projectPath, '.gitignore'),
    generateGitignore()
  )

  fs.writeFileSync(
    path.join(projectPath, 'README.md'),
    generateReadme(config)
  )

  fs.writeFileSync(
    path.join(projectPath, 'tsconfig.json'),
    generateTsConfig(config)
  )

  // Create basic source files
  createSourceFiles(projectPath, config)
  
  // Create plugin configuration if plugins selected
  if (config.selectedPlugins && config.selectedPlugins.length > 0) {
    console.log(pc.cyan('🔌 Generating plugin configuration...'))
    
    fs.writeFileSync(
      path.join(projectPath, 'ssot.config.ts'),
      generatePluginConfig(config)
    )
  }

  // Install dependencies
  console.log()
  console.log(pc.cyan('📦 Installing dependencies...'))
  console.log(pc.dim('   This may take a minute...'))
  console.log()

  const installCmd = getInstallCommand(config.packageManager)
  
  try {
    execSync(installCmd, {
      cwd: projectPath,
      stdio: 'inherit'
    })
  } catch (error) {
    throw new Error('Failed to install dependencies')
  }

  // Generate Prisma client
  console.log()
  console.log(pc.cyan('🔧 Generating Prisma client...'))
  
  try {
    execSync(getPrismaCommand(config.packageManager, 'generate'), {
      cwd: projectPath,
      stdio: 'inherit'
    })
  } catch (error) {
    throw new Error('Failed to generate Prisma client')
  }

  // Generate API code (skip for V3 - it uses adapters directly)
  if (!config.generateUI || config.uiMode !== 'v3-runtime') {
    console.log()
    console.log(pc.cyan('🚀 Generating API code...'))
    
    // Show plugin info if any selected
    if (config.selectedPlugins && config.selectedPlugins.length > 0) {
      console.log(pc.dim(`   With plugins: ${config.selectedPlugins.length} enabled`))
    }
    console.log()
    
    try {
      execSync(getPackageCommand(config.packageManager, 'exec ssot-codegen generate'), {
        cwd: projectPath,
        stdio: 'inherit'
      })
    } catch (error) {
      throw new Error('Failed to generate API code')
    }
  } else {
    console.log()
    console.log(pc.dim('⏭️  Skipping API code generation (V3 uses adapters directly)'))
  }
  
  // Generate UI if requested
  if (config.generateUI) {
    console.log()
    console.log(pc.cyan('🎨 Generating UI...'))
    console.log(pc.dim(`   Mode: ${config.uiMode === 'v3-runtime' ? 'JSON Runtime (V3)' : 'Code Generation (V2)'}`))
    console.log(pc.dim(`   Template: ${config.uiTemplate || 'data-browser'}`))
    console.log()
    
    try {
      const models = parseModelsFromSchema(path.join(projectPath, 'prisma', 'schema.prisma'))
      await generateUI(projectPath, config, models)
      
      if (config.uiMode === 'v3-runtime') {
        console.log(pc.green('✓ V3 JSON templates copied'))
        console.log(pc.dim(`   0 lines of code generated!`))
      } else {
        console.log(pc.green('✓ UI generated successfully'))
        console.log(pc.dim(`   ${models.length} models → ${models.length * 2} pages`))
      }
    } catch (error) {
      console.log(pc.yellow('⚠️  UI generation failed (optional):'))
      console.log(pc.dim(`   ${(error as Error).message}`))
    }
  }
  
  // Show plugin setup instructions
  if (config.selectedPlugins && config.selectedPlugins.length > 0) {
    showPluginSetupInstructions(config.selectedPlugins)
  }

  // Initialize git
  console.log()
  console.log(pc.cyan('📚 Initializing git repository...'))
  
  try {
    execSync('git init', {
      cwd: projectPath,
      stdio: 'pipe'
    })
    execSync('git add .', {
      cwd: projectPath,
      stdio: 'pipe'
    })
    execSync('git commit -m "Initial commit from create-ssot-app"', {
      cwd: projectPath,
      stdio: 'pipe'
    })
  } catch {
    // Git init is optional, don't fail if it doesn't work
    console.log(pc.dim('   (Git init skipped)'))
  }
  
  // Show UI instructions if generated
  if (config.generateUI) {
    console.log()
    console.log(pc.green('━'.repeat(50)))
    console.log()
    console.log(pc.bold(pc.green('✨ UI Ready!')))
    console.log()
    
    if (config.uiMode === 'v3-runtime') {
      console.log(pc.bold('JSON Runtime (V3) - Zero Code Generation!'))
      console.log()
      console.log('Your UI is defined in pure JSON at:')
      console.log(pc.cyan(`  templates/`))
      console.log()
      console.log('Edit JSON → Hot reload (instant updates!)')
      console.log()
      console.log('Useful commands:')
      console.log(pc.dim(`  cd ${config.projectName}`))
      console.log(pc.cyan(`  ${config.packageManager} run validate:templates   # Validate JSON`))
      console.log(pc.cyan(`  ${config.packageManager} run gen:models:watch     # Auto-update models.json`))
      console.log(pc.cyan(`  ${config.packageManager} run dev                  # Start dev server`))
      console.log()
      console.log('See templates/README.md for details.')
    } else {
      console.log('Your admin panel is ready at:')
      console.log(pc.cyan(`  http://localhost:3001/admin`))
      console.log()
      console.log('To start the UI dev server:')
      console.log(pc.dim(`  cd ${config.projectName}`))
      console.log(pc.cyan(`  ${config.packageManager} run dev:ui`))
      console.log()
      console.log('See UI_README.md for customization options.')
    }
    
    console.log()
    console.log(pc.green('━'.repeat(50)))
  }
}

/**
 * Parse models from Prisma schema
 */
function parseModelsFromSchema(schemaPath: string): ParsedModel[] {
  const schema = fs.readFileSync(schemaPath, 'utf-8')
  const models: ParsedModel[] = []
  
  // Simple regex-based parsing (good enough for generated schemas)
  const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g
  let modelMatch
  
  while ((modelMatch = modelRegex.exec(schema)) !== null) {
    const modelName = modelMatch[1]
    const modelBody = modelMatch[2]
    
    // Skip internal Prisma models
    if (modelName.startsWith('_')) continue
    
    const fields: Array<{ name: string; type: string; isRelation: boolean; isId?: boolean }> = []
    
    // Parse fields
    const fieldRegex = /^\s*(\w+)\s+(\w+)(.*)$/gm
    let fieldMatch
    
    while ((fieldMatch = fieldRegex.exec(modelBody)) !== null) {
      const fieldName = fieldMatch[1]
      const fieldType = fieldMatch[2]
      const fieldAttributes = fieldMatch[3] || ''
      
      // Skip Prisma directives and attributes
      if (fieldName.startsWith('@') || fieldName === 'model') continue
      
      // Check if it's a relation (type is another model, starts with uppercase)
      const isRelation = /^[A-Z]/.test(fieldType) && !['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'Decimal', 'BigInt', 'Bytes'].includes(fieldType)
      
      // Check if it's an ID field
      const isId = fieldAttributes.includes('@id') || fieldAttributes.includes('@default(autoincrement())') || fieldAttributes.includes('@default(cuid())') || fieldAttributes.includes('@default(uuid())')
      
      fields.push({
        name: fieldName,
        type: fieldType,
        isRelation,
        isId
      })
    }
    
    // Find ID field (default to 'id' if not found)
    const idField = fields.find(f => f.isId) || fields.find(f => f.name === 'id') || { name: 'id', type: 'String' }
    
    models.push({
      name: modelName,
      nameLower: modelName.toLowerCase(),
      namePlural: modelName.toLowerCase() + 's', // Simple pluralization
      idField: {
        name: idField.name,
        type: idField.type
      },
      fields
    })
  }
  
  return models
}

function createSourceFiles(projectPath: string, config: ProjectConfig): void {
  const srcPath = path.join(projectPath, 'src')

  // Create db client
  const dbClient = `import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default prisma
`
  fs.writeFileSync(path.join(srcPath, 'db.ts'), dbClient)

  // Create app entry point based on framework
  if (config.framework === 'express') {
    const appFile = `import express from 'express'
import cors from 'cors'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'API is running' })
})

export { app }
`
    fs.writeFileSync(path.join(srcPath, 'app.ts'), appFile)

    const serverFile = `import { app } from './app.js'

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(\`🚀 Server running on http://localhost:\${PORT}\`)
})
`
    fs.writeFileSync(path.join(srcPath, 'server.ts'), serverFile)
  } else {
    // Fastify
    const appFile = `import Fastify from 'fastify'
import cors from '@fastify/cors'

const fastify = Fastify({ logger: true })

await fastify.register(cors)

fastify.get('/', async () => {
  return { message: 'API is running' }
})

export { fastify }
`
    fs.writeFileSync(path.join(srcPath, 'app.ts'), appFile)

    const serverFile = `import { fastify } from './app.js'

const PORT = Number(process.env.PORT) || 3000

try {
  await fastify.listen({ port: PORT, host: '0.0.0.0' })
  console.log(\`🚀 Server running on http://localhost:\${PORT}\`)
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
`
    fs.writeFileSync(path.join(srcPath, 'server.ts'), serverFile)
  }
}

function getInstallCommand(packageManager: string): string {
  switch (packageManager) {
    case 'pnpm':
      return 'pnpm install'
    case 'yarn':
      return 'yarn install'
    default:
      return 'npm install'
  }
}

/**
 * Get Prisma command for package manager
 * NPM requires npx, others can call prisma directly
 */
function getPrismaCommand(packageManager: string, command: string): string {
  const runner = packageManager === 'npm' ? 'npx' : packageManager
  return `${runner} prisma ${command}`
}

/**
 * Get generic package command (exec, run, etc.)
 */
function getPackageCommand(packageManager: string, command: string): string {
  switch (packageManager) {
    case 'npm':
      return `npm ${command}`
    case 'yarn':
      return `yarn ${command}`
    case 'pnpm':
      return `pnpm ${command}`
    default:
      return `npm ${command}`
  }
}

/**
 * Generate ssot.config.ts with plugin configuration
 */
function generatePluginConfig(config: ProjectConfig): string {
  const features: Record<string, Record<string, unknown>> = {}
  
  for (const pluginId of config.selectedPlugins) {
    const plugin = getPluginById(pluginId)
    if (!plugin) continue
    
    // Build basic enabled config
    features[plugin.configKey] = {
      enabled: true
    }
    
    // Add plugin-specific defaults
    switch (pluginId) {
      case 'google-auth':
        features[plugin.configKey] = {
          enabled: true,
          strategy: 'jwt',
          userModel: 'User'
        }
        break
      case 'openai':
        features[plugin.configKey] = {
          enabled: true,
          defaultModel: 'gpt-4'
        }
        break
      case 'claude':
        features[plugin.configKey] = {
          enabled: true,
          defaultModel: 'claude-3-sonnet-20240229'
        }
        break
      case 'gemini':
        features[plugin.configKey] = {
          enabled: true,
          defaultModel: 'gemini-pro'
        }
        break
      case 'deepgram':
        features[plugin.configKey] = {
          enabled: true,
          defaultModel: 'nova-2'
        }
        break
      case 'elevenlabs':
        features[plugin.configKey] = {
          enabled: true,
          defaultVoice: 'EXAVITQu4vr4xnSDxMaL'
        }
        break
      case 'lmstudio':
        features[plugin.configKey] = {
          enabled: true,
          endpoint: 'http://localhost:1234'
        }
        break
      case 'ollama':
        features[plugin.configKey] = {
          enabled: true,
          endpoint: 'http://localhost:11434',
          models: ['llama2']
        }
        break
      case 's3':
        features[plugin.configKey] = {
          enabled: true,
          region: 'us-east-1'
        }
        break
      case 'r2':
        features[plugin.configKey] = {
          enabled: true,
          region: 'auto'
        }
        break
      case 'paypal':
        features[plugin.configKey] = {
          enabled: true,
          mode: 'sandbox'
        }
        break
    }
  }
  
  return `import type { CodeGeneratorConfig } from '@ssot-codegen/gen'

export default {
  framework: '${config.framework}',
  projectName: '${config.projectName}',
  
  features: ${JSON.stringify(features, null, 2)}
} satisfies CodeGeneratorConfig
`
}

/**
 * Show setup instructions for selected plugins
 */
function showPluginSetupInstructions(pluginIds: string[]): void {
  console.log()
  console.log(pc.bold(pc.cyan('🔧 Plugin Setup Instructions')))
  console.log()
  console.log(pc.dim('Before running your API, configure the following:'))
  console.log()
  
  // Include plugins with env vars OR setup instructions (e.g., LM Studio, Ollama)
  const pluginsWithSetup = pluginIds
    .map(id => getPluginById(id))
    .filter(p => p && (p.envVarsRequired.length > 0 || p.setupInstructions))
  
  if (pluginsWithSetup.length > 0) {
    for (const plugin of pluginsWithSetup) {
      if (!plugin) continue
      
      console.log(pc.yellow(`  ☐ ${plugin.name}`))
      
      if (plugin.setupInstructions) {
        console.log(pc.dim(`     ${plugin.setupInstructions}`))
      }
      
      if (plugin.envVarsRequired.length > 0) {
        console.log(pc.dim(`     Required: ${plugin.envVarsRequired.join(', ')}`))
      }
      
      console.log()
    }
    
    const hasEnvVars = pluginsWithSetup.some(p => p && p.envVarsRequired.length > 0)
    if (hasEnvVars) {
      console.log(pc.dim('  All credentials should be added to the .env file'))
    }
  }
}


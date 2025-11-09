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

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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
    generateTsConfig()
  )

  // Create basic source files
  createSourceFiles(projectPath, config)

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
    execSync(`${config.packageManager} prisma generate`, {
      cwd: projectPath,
      stdio: 'inherit'
    })
  } catch (error) {
    throw new Error('Failed to generate Prisma client')
  }

  // Run ssot-codegen
  console.log()
  console.log(pc.cyan('🚀 Generating API code...'))
  console.log()
  
  try {
    execSync(`${config.packageManager} exec ssot-codegen generate`, {
      cwd: projectPath,
      stdio: 'inherit'
    })
  } catch (error) {
    throw new Error('Failed to generate API code')
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


#!/usr/bin/env node

/**
 * create-ssot-app - Scaffold a complete API project in one command
 * 
 * Features:
 * - Interactive setup with prompts
 * - Installs all dependencies (Prisma, Express/Fastify, etc.)
 * - Creates starter schema with example models
 * - Generates complete API code
 * - Ready to run immediately
 */

import { createProject } from './create-project.js'
import { getProjectConfig } from './prompts.js'
import pc from 'picocolors'

async function main() {
  console.log()
  console.log(pc.bold(pc.blue('🚀 Create SSOT App')))
  console.log(pc.dim('   Generate a full-stack TypeScript API with Prisma'))
  console.log()

  try {
    // Get project configuration from user
    const config = await getProjectConfig()
    
    // Create the project
    await createProject(config)
    
    // Success message
    console.log()
    console.log(pc.green('✅ Project created successfully!'))
    console.log()
    console.log(pc.bold('📦 Next steps:'))
    console.log()
    console.log(pc.cyan(`  cd ${config.projectName}`))
    console.log(pc.cyan('  npm run dev'))
    console.log()
    console.log(pc.dim('  Then visit: http://localhost:3000'))
    console.log()
  } catch (error) {
    console.error()
    console.error(pc.red('❌ Error creating project:'))
    console.error(pc.red(error instanceof Error ? error.message : String(error)))
    console.error()
    process.exit(1)
  }
}

main()


#!/usr/bin/env node

import { Command } from 'commander'
import { generateFromSchema } from '@ssot-codegen/gen'
import { resolve, isAbsolute, extname, normalize } from 'path'
import { existsSync, readdirSync, statSync, writeFileSync, readFileSync } from 'fs'
import { execSync } from 'child_process'
import { createRequire } from 'module'
import chalk from 'chalk'

const require = createRequire(import.meta.url)
const packageJson = require('../package.json')

const program = new Command()

program
  .name('ssot')
  .description('SSOT Codegen - Generate full-stack APIs from Prisma schemas')
  .version(packageJson.version, '-v, --version', 'Display version number')

program
  .command('generate')
  .description('Generate a standalone project from a Prisma schema')
  .argument('[schema]', 'Schema file path or example name (e.g., "minimal", "blog", or path to schema.prisma)')
  .option('-o, --output <dir>', 'Output directory (default: auto-incremental gen-N)')
  .option('-n, --name <name>', 'Project name (default: derived from schema path)')
  .option('-f, --framework <framework>', 'Framework (express or fastify)', 'express')
  .option('--no-standalone', 'Disable standalone mode (use fixed output dir)')
  .option('-c, --concurrency <number>', 'Max concurrent file writes (default: 100)', '100')
  .option('--format', 'Format generated code with Prettier (default: false)')
  .option('--format-concurrency <number>', 'Max concurrent file formats (default: 10)', '10')
  .option('--setup', 'Auto-setup project (install deps, generate prisma, create .env)', true)
  .option('--no-setup', 'Skip automatic project setup')
  .option('--test', 'Run validation tests after setup', false)
  .action(async (schemaArg: string | undefined, options) => {
    try {
      // Resolve schema path
      let schemaPath: string
      
      if (!schemaArg) {
        console.error(chalk.red('❌ Error: Schema path or example name required'))
        console.log(chalk.gray('\nExamples:'))
        console.log(chalk.gray('  ssot generate minimal'))
        console.log(chalk.gray('  ssot generate examples/blog/schema.prisma'))
        console.log(chalk.gray('  ssot generate ./my-schema.prisma'))
        process.exit(1)
      }
      
      // Normalize and resolve the input
      const normalizedArg = normalize(schemaArg)
      
      // Check if it's a file path (absolute, relative, or has .prisma extension)
      const looksLikeFilePath = isAbsolute(normalizedArg) || 
                                 normalizedArg.startsWith('.') ||
                                 extname(normalizedArg) === '.prisma'
      
      if (looksLikeFilePath) {
        // It's a file path - resolve and validate
        schemaPath = resolve(process.cwd(), normalizedArg)
        
        if (!existsSync(schemaPath)) {
          console.error(chalk.red(`❌ Schema file not found: ${schemaPath}`))
          process.exit(1)
        }
        
        if (extname(schemaPath) !== '.prisma') {
          console.error(chalk.red(`❌ Schema file must have .prisma extension: ${schemaPath}`))
          process.exit(1)
        }
      } else {
        // Assume it's an example name (no path separators, no extension)
        const examplePath = resolve(process.cwd(), 'examples', normalizedArg, 'schema.prisma')
        if (existsSync(examplePath)) {
          schemaPath = examplePath
          console.log(chalk.blue(`📁 Using example: ${normalizedArg}`))
        } else {
          // Try with prisma/ subdirectory
          const prismaPath = resolve(process.cwd(), 'examples', normalizedArg, 'prisma', 'schema.prisma')
          if (existsSync(prismaPath)) {
            schemaPath = prismaPath
            console.log(chalk.blue(`📁 Using example: ${normalizedArg}`))
          } else {
            console.error(chalk.red(`❌ Example not found: ${normalizedArg}`))
            console.log(chalk.gray(`   Tried: ${examplePath}`))
            console.log(chalk.gray(`   Tried: ${prismaPath}`))
            console.log(chalk.gray('\nAvailable examples:'))
            
            // List available examples
            const examplesDir = resolve(process.cwd(), 'examples')
            if (existsSync(examplesDir)) {
              const examples = readdirSync(examplesDir)
                .filter(f => statSync(resolve(examplesDir, f)).isDirectory())
                .filter(f => 
                  existsSync(resolve(examplesDir, f, 'schema.prisma')) ||
                  existsSync(resolve(examplesDir, f, 'prisma', 'schema.prisma'))
                )
              
              if (examples.length > 0) {
                examples.forEach(ex => console.log(chalk.gray(`  • ${ex}`)))
              }
            }
            
            process.exit(1)
          }
        }
      }
      
      console.log(chalk.green(`✓ Schema: ${schemaPath}\n`))
      
      // Set environment variables from CLI options
      if (options.concurrency) {
        process.env.SSOT_WRITE_CONCURRENCY = options.concurrency
      }
      if (options.format) {
        process.env.SSOT_FORMAT_CODE = 'true'
      }
      if (options.formatConcurrency) {
        process.env.SSOT_FORMAT_CONCURRENCY = options.formatConcurrency
      }
      
      // Generate project
      const result = await generateFromSchema({
        schemaPath,
        output: options.output,
        framework: options.framework as 'express' | 'fastify',
        standalone: options.standalone,
        projectName: options.name
      })
      
      console.log(chalk.green('\n✅ Generation complete!'))
      
      if (result.outputDir) {
        const relPath = result.outputDir.replace(process.cwd(), '.').replace(/\\/g, '/')
        console.log(chalk.cyan(`\n📦 Project created: ${relPath}`))
        
        // Post-generation automation
        if (options.setup) {
          console.log(chalk.blue('\n🔧 Setting up project...\n'))
          
          try {
            // 1. Create .env file with test-ready values
            const envPath = resolve(result.outputDir, '.env')
            if (!existsSync(envPath)) {
              console.log(chalk.gray('  📝 Creating .env file...'))
              
              // Read schema to detect database provider
              const schemaContent = readFileSync(schemaPath, 'utf-8')
              const providerMatch = schemaContent.match(/provider\s*=\s*"(\w+)"/)
              const provider = providerMatch ? providerMatch[1] : 'postgresql'
              
              // Generate appropriate DATABASE_URL
              let databaseUrl = ''
              switch (provider) {
                case 'mysql':
                  databaseUrl = 'mysql://root@localhost:3306/test_db'
                  break
                case 'postgresql':
                  databaseUrl = 'postgresql://postgres@localhost:5432/test_db'
                  break
                case 'sqlite':
                  databaseUrl = 'file:./dev.db'
                  break
                default:
                  databaseUrl = 'postgresql://postgres@localhost:5432/test_db'
              }
              
              const envContent = `# Auto-generated environment file
# Generated by SSOT Codegen

# Database Configuration
DATABASE_URL="${databaseUrl}"

# Server Configuration
PORT=3000
NODE_ENV=development

# Logging
LOG_LEVEL=info
`
              writeFileSync(envPath, envContent, 'utf-8')
              console.log(chalk.green('  ✓ Created .env with test configuration'))
            }
            
            // 2. Install dependencies
            console.log(chalk.gray('\n  📦 Installing dependencies...'))
            execSync('pnpm install --ignore-workspace', { 
              cwd: result.outputDir, 
              stdio: 'inherit'
            })
            console.log(chalk.green('  ✓ Dependencies installed'))
            
            // 3. Generate Prisma client (use local version)
            console.log(chalk.gray('\n  🔨 Generating Prisma client...'))
            try {
              // Try using workspace prisma first
              execSync('pnpm exec prisma generate --schema=prisma/schema.prisma', { 
                cwd: result.outputDir, 
                stdio: 'inherit'
              })
              console.log(chalk.green('  ✓ Prisma client generated'))
            } catch {
              console.log(chalk.yellow('  ⚠️  Prisma generation failed (install prisma and run: pnpm exec prisma generate)'))
            }
            
            // 4. Run validation tests if requested
            if (options.test) {
              console.log(chalk.gray('\n  🧪 Running validation tests...'))
              try {
                execSync('pnpm test:validate', { 
                  cwd: result.outputDir, 
                  stdio: 'inherit'
                })
                console.log(chalk.green('  ✓ All tests passed!'))
              } catch {
                console.log(chalk.yellow('  ⚠️  Some tests failed (this is OK if database is not set up)'))
              }
            }
            
            console.log(chalk.green('\n✅ Project setup complete!\n'))
            console.log(chalk.cyan('🚀 Ready to use:'))
            console.log(chalk.gray(`  cd ${relPath}`))
            console.log(chalk.gray('  pnpm dev'))
            
          } catch (setupError) {
            const err = setupError as Error
            console.log(chalk.yellow('\n⚠️  Setup failed:'), err.message)
            console.log(chalk.gray('\nYou can set up manually:'))
            console.log(chalk.gray(`  cd ${relPath}`))
            console.log(chalk.gray('  pnpm install'))
            console.log(chalk.gray('  pnpm exec prisma generate'))
            console.log(chalk.gray('  pnpm test:validate'))
          }
        } else {
          // Manual setup instructions
          console.log(chalk.gray('\nNext steps:'))
          console.log(chalk.gray(`  cd ${relPath}`))
          console.log(chalk.gray('  pnpm install'))
          console.log(chalk.gray('  pnpm exec prisma generate'))
          console.log(chalk.gray('  pnpm test:validate'))
        }
      }
      
    } catch (error) {
      const err = error as Error
      console.error(chalk.red('\n❌ Generation failed:'), err.message)
      if (err.stack) {
        console.error(chalk.gray(err.stack))
      }
      process.exit(1)
    }
  })

program
  .command('list')
  .description('List available example schemas')
  .action(() => {
    const examplesDir = resolve(process.cwd(), 'examples')
    if (!existsSync(examplesDir)) {
      console.log(chalk.yellow('⚠️  No examples directory found'))
      return
    }
    
    console.log(chalk.bold('\n📚 Available Examples:\n'))
    
    const examples = readdirSync(examplesDir)
      .filter((f: string) => statSync(resolve(examplesDir, f)).isDirectory())
    
    for (const example of examples) {
      const schemaPath = resolve(examplesDir, example, 'schema.prisma')
      const prismaSchemaPath = resolve(examplesDir, example, 'prisma', 'schema.prisma')
      
      if (existsSync(schemaPath) || existsSync(prismaSchemaPath)) {
        console.log(chalk.green(`  • ${example}`))
        console.log(chalk.gray(`    ssot generate ${example}\n`))
      }
    }
  })

program.parse()


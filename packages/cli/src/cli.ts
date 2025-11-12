#!/usr/bin/env node

import { Command } from 'commander'
import { generateFromSchema } from '@ssot-codegen/gen'
import type { LogLevel } from '@ssot-codegen/gen'
import { resolve } from 'path'
import { existsSync, readdirSync, statSync } from 'fs'
import { createRequire } from 'module'
import chalk from 'chalk'
import { resolveSchemaArg, runPostGenSetup } from './cli-helpers.js'
import { registerUiCommand } from './commands/generate-ui.js'

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
  .option('--verbose', 'Enable verbose logging')
  .option('--debug', 'Enable debug logging (most detailed)')
  .option('--minimal', 'Minimal output (errors only)')
  .option('--silent', 'Suppress all output except errors')
  .option('--no-color', 'Disable colored output')
  .option('--timestamps', 'Show timestamps in log output')
  .action(async (schemaArg: string | undefined, options) => {
    try {
      // Resolve schema path using extracted helper
      const { schemaPath, isExample, exampleName } = resolveSchemaArg(schemaArg)
      
      if (isExample) {
        console.log(chalk.blue(`📁 Using example: ${exampleName}`))
      }
      console.log(chalk.green(`✓ Schema: ${schemaPath}\n`))
      
      // Set environment variables from CLI options (for backwards compatibility)
      if (options.concurrency) {
        process.env.SSOT_WRITE_CONCURRENCY = options.concurrency
      }
      if (options.format) {
        process.env.SSOT_FORMAT_CODE = 'true'
      }
      if (options.formatConcurrency) {
        process.env.SSOT_FORMAT_CONCURRENCY = options.formatConcurrency
      }
      
      // Determine log level from flags
      let verbosity: LogLevel = 'normal'
      if (options.silent) verbosity = 'silent'
      else if (options.minimal) verbosity = 'minimal'
      else if (options.debug) verbosity = 'debug'
      else if (options.verbose) verbosity = 'verbose'
      
      // Generate project with logging configuration
      const result = await generateFromSchema({
        schemaPath,
        output: options.output,
        framework: options.framework as 'express' | 'fastify',
        standalone: options.standalone,
        projectName: options.name,
        verbosity,
        colors: options.color,
        timestamps: options.timestamps
      })
      
      console.log(chalk.green('\n✅ Generation complete!'))
      
      if (result.outputDir) {
        const relPath = result.outputDir.replace(process.cwd(), '.').replace(/\\/g, '/')
        console.log(chalk.cyan(`\n📦 Project created: ${relPath}`))
        
        // Post-generation automation using extracted helper
        if (options.setup) {
          try {
            await runPostGenSetup({
              outputDir: result.outputDir,
              schemaPath,
              runTests: options.test
            })
            
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

// Register UI generation command
registerUiCommand(program)

program.parse()


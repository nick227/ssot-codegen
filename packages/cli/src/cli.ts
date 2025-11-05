#!/usr/bin/env node

import { Command } from 'commander'
import { generateFromSchema } from '@ssot-codegen/gen'
import { resolve } from 'path'
import { existsSync, readdirSync, statSync } from 'fs'
import chalk from 'chalk'

const program = new Command()

program
  .name('ssot')
  .description('SSOT Codegen - Generate full-stack APIs from Prisma schemas')
  .version('0.5.0')

program
  .command('generate')
  .description('Generate a standalone project from a Prisma schema')
  .argument('[schema]', 'Schema file path or example name (e.g., "minimal", "blog", or path to schema.prisma)')
  .option('-o, --output <dir>', 'Output directory (default: auto-incremental gen-N)')
  .option('-n, --name <name>', 'Project name (default: derived from schema path)')
  .option('-f, --framework <framework>', 'Framework (express or fastify)', 'express')
  .option('--no-standalone', 'Disable standalone mode (use fixed output dir)')
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
      
      // Check if it's an example name
      if (!schemaArg.includes('/') && !schemaArg.includes('\\') && !schemaArg.endsWith('.prisma')) {
        // Assume it's an example name
        const examplePath = resolve(process.cwd(), 'examples', schemaArg, 'schema.prisma')
        if (existsSync(examplePath)) {
          schemaPath = examplePath
          console.log(chalk.blue(`📁 Using example: ${schemaArg}`))
        } else {
          // Try with prisma/ subdirectory
          const prismaPath = resolve(process.cwd(), 'examples', schemaArg, 'prisma', 'schema.prisma')
          if (existsSync(prismaPath)) {
            schemaPath = prismaPath
            console.log(chalk.blue(`📁 Using example: ${schemaArg}`))
          } else {
            console.error(chalk.red(`❌ Example not found: ${schemaArg}`))
            console.log(chalk.gray(`   Tried: ${examplePath}`))
            console.log(chalk.gray(`   Tried: ${prismaPath}`))
            process.exit(1)
          }
        }
      } else {
        // It's a file path
        schemaPath = resolve(process.cwd(), schemaArg)
        if (!existsSync(schemaPath)) {
          console.error(chalk.red(`❌ Schema file not found: ${schemaPath}`))
          process.exit(1)
        }
      }
      
      console.log(chalk.green(`✓ Schema: ${schemaPath}\n`))
      
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
        console.log(chalk.gray('\nNext steps:'))
        console.log(chalk.gray(`  cd ${relPath}`))
        console.log(chalk.gray('  pnpm install'))
        console.log(chalk.gray('  pnpm test:validate'))
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


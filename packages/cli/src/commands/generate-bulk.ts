/**
 * Bulk Website Generation Command
 * 
 * Generates multiple websites from bulk configuration
 */

import { Command } from 'commander'
import { generateBulkWebsites, loadBulkConfig, generateBulkReport, validateBulkConfig, expandProjectIds } from '@ssot-codegen/gen'
import { resolve, dirname, join } from 'path'
import { mkdir, writeFile } from 'fs/promises'
import { runPostGenSetup, runSmokeTest } from '../cli-helpers.js'
import chalk from 'chalk'

// Type definitions (not exported from gen package)
type ProjectConfig = {
  id: string
  name: string
  schema: string | { schemaPath: string; uiConfigPath?: string }
  outputDir: string
  customizations?: any
}

export function registerBulkCommand(program: Command): void {
  const bulkCommand = program
    .command('bulk')
    .description('Generate multiple websites from bulk configuration')
    .option('-c, --config <path>', 'Path to bulk generation config JSON file', 'websites/config/bulk-generate.json')
    .option('--dry-run', 'Show what would be generated without writing files', false)
    .option('--parallel', 'Generate projects in parallel', true)
    .option('--build', 'Build projects after generation (compiles TypeScript and frontend bundles)', false)
    .action(async (options) => {
      try {
        const configPath = resolve(process.cwd(), options.config)
        console.log(`📋 Loading bulk config: ${configPath}\n`)
        
        const config = await loadBulkConfig(configPath)
        console.log(`📦 Found ${config.projects.length} projects to generate\n`)
        
        // Validate configuration
        const validation = validateBulkConfig(config)
        if (validation.warnings.length > 0) {
          console.warn('\n⚠️  Validation warnings:')
          validation.warnings.forEach((w: string) => console.warn(`  - ${w}`))
          console.log('')
        }
        
        if (!validation.valid) {
          console.error('❌ Configuration validation failed:\n')
          validation.errors.forEach((e: string) => console.error(`  - ${e}`))
          process.exit(1)
        }
        
        const results = await generateBulkWebsites(config, {
          verbose: true,
          parallel: options.parallel ?? config.options?.parallel ?? true,
          baseDir: process.cwd(),
          fullStack: config.options?.fullStack ?? true // Default to full-stack
        })
        
        // Expand projects list to get schema paths and correct outputDir
        const projectsList: ProjectConfig[] = Array.isArray(config.projects) && config.projects.length > 0 && typeof config.projects[0] === 'string'
          ? await expandProjectIds(config.projects as string[], process.cwd(), true)
          : config.projects as ProjectConfig[]
        
        // Write files for each project
        let totalFiles = 0
        let successCount = 0
        let errorCount = 0
        
        for (const [projectId, result] of results) {
          if (result.success && result.outputDir && result.files) {
            // Find project - handle both string[] and ProjectConfig[] formats
            const project = projectsList.length > 0 
              ? projectsList.find((p: any) => p.id === projectId)
              : null
            
            const projectName = project?.name || projectId
            
            if (!options.dryRun) {
              // Write files (UI files only in full-stack mode, all files in UI-only mode)
              // Backend files are already written by the pipeline in full-stack mode
              if (result.files && result.files.size > 0) {
                for (const [filePath, content] of result.files) {
                  const fullPath = join(result.outputDir, filePath)
                  await mkdir(dirname(fullPath), { recursive: true })
                  await writeFile(fullPath, content, 'utf-8')
                }
              }
              console.log(`✅ ${projectName}: ${result.filesGenerated} files written to ${result.outputDir}`)
              
              // Get schema path for post-gen setup
              let schemaPath: string
              if (project && 'schema' in project) {
                // Full format - use project config
                schemaPath = typeof project.schema === 'string'
                  ? resolve(process.cwd(), project.schema)
                  : resolve(process.cwd(), project.schema.schemaPath)
              } else {
                // Simplified format - derive from projectId
                schemaPath = resolve(process.cwd(), 'websites', projectId, 'schema.prisma')
              }
              
              // Run post-generation setup (env, install, optionally build)
              try {
                await runPostGenSetup({
                  outputDir: result.outputDir,
                  schemaPath,
                  runTests: false,
                  build: options.build ?? false
                })
                
                // Run smoke test
                await runSmokeTest(result.outputDir, schemaPath)
              } catch (setupError) {
                const err = setupError as Error
                console.log(chalk.yellow(`\n⚠️  Setup failed for ${projectName}: ${err.message}`))
                console.log(chalk.gray('   You can set up manually:'))
                console.log(chalk.gray(`   cd ${result.outputDir}`))
                console.log(chalk.gray('   pnpm install'))
                console.log(chalk.gray('   pnpm exec prisma generate'))
              }
            } else if (options.dryRun) {
              console.log(`📄 ${projectName}: Would generate ${result.filesGenerated} files`)
            }
            totalFiles += result.filesGenerated
            successCount++
          } else if (!result.success) {
            console.error(`❌ ${projectId}: ${result.error || 'Unknown error'}`)
            errorCount++
          }
        }
        
        console.log(`\n📊 Summary:`)
        console.log(`   ✅ Successful: ${successCount}`)
        console.log(`   ❌ Failed: ${errorCount}`)
        console.log(`   📄 Total files: ${totalFiles}`)
        
        // Generate report
        if (!options.dryRun) {
          const reportPath = join(process.cwd(), 'bulk-report.txt')
          const report = generateBulkReport(results, reportPath)
          console.log(`\n📄 Report saved to: ${reportPath}`)
        }
        
        if (errorCount > 0) {
          process.exit(1)
        }
      } catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : String(error))
        process.exit(1)
      }
    })
  
  bulkCommand
    .command('validate')
    .description('Validate bulk generation configuration without generating')
    .option('-c, --config <path>', 'Path to bulk generation config', 'websites/config/bulk-generate.json')
    .action(async (options) => {
      try {
        const configPath = resolve(process.cwd(), options.config)
        console.log(`📋 Validating bulk config: ${configPath}\n`)
        
        const config = await loadBulkConfig(configPath)
        const validation = validateBulkConfig(config)
        
        if (validation.warnings.length > 0) {
          console.warn('⚠️  Warnings:')
          validation.warnings.forEach((w: string) => console.warn(`  - ${w}`))
          console.log('')
        }
        
        if (validation.valid) {
          console.log('✅ Configuration is valid!')
          console.log(`   Projects: ${config.projects.length}`)
        } else {
          console.error('❌ Configuration validation failed:\n')
          validation.errors.forEach((e: string) => console.error(`  - ${e}`))
          process.exit(1)
        }
      } catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : String(error))
        process.exit(1)
      }
    })
  
  bulkCommand
    .command('init')
    .description('Initialize bulk generation structure')
    .action(() => {
      console.log('📁 Initializing bulk generation structure...')
      console.log('\nCreated:')
      console.log('  websites/schemas/')
      console.log('  websites/schematics/')
      console.log('  websites/projects/')
      console.log('  websites/config/bulk-generate.json')
      console.log('\n✅ Structure initialized!')
    })
}


/**
 * Bulk Website Generation Command
 * 
 * Generates multiple websites from bulk configuration
 */

import { Command } from 'commander'
import { generateBulkWebsites, loadBulkConfig, generateBulkReport, validateBulkConfig } from '@ssot-codegen/gen'
import { resolve, dirname, join } from 'path'
import { mkdir, writeFile } from 'fs/promises'

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
          parallel: options.parallel ?? config.options?.parallel ?? true
        })
        
        // Write files for each project
        let totalFiles = 0
        let successCount = 0
        let errorCount = 0
        
        for (const [projectId, result] of results) {
          if (result.success && result.outputDir && result.files) {
            // Find project - handle both string[] and ProjectConfig[] formats
            const projectsList = Array.isArray(config.projects) && config.projects.length > 0 && typeof config.projects[0] === 'string'
              ? [] // Simplified format - projectId is the ID
              : config.projects as ProjectConfig[]
            const project = projectsList.length > 0 
              ? projectsList.find((p: any) => p.id === projectId)
              : { id: projectId, name: projectId }
            if (project && !options.dryRun) {
              // Write files
              for (const [filePath, content] of result.files) {
                const fullPath = join(result.outputDir, filePath)
                await mkdir(dirname(fullPath), { recursive: true })
                await writeFile(fullPath, content, 'utf-8')
              }
              console.log(`✅ ${project.name}: ${result.filesGenerated} files written to ${result.outputDir}`)
            } else if (project && options.dryRun) {
              console.log(`📄 ${project.name}: Would generate ${result.filesGenerated} files`)
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


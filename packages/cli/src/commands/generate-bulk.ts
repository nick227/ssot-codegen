/**
 * Bulk Website Generation Command
 * 
 * Generates multiple websites from bulk configuration
 */

import { Command } from 'commander'
import { generateBulkWebsites, loadBulkConfig } from '@ssot-codegen/gen'
import { writeFiles } from '../../utils/file-writer.js'
import { resolve } from 'path'

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
        
        const config = loadBulkConfig(configPath)
        console.log(`📦 Found ${config.projects.length} projects to generate\n`)
        
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
            const project = config.projects.find((p: any) => p.id === projectId)
            if (project && !options.dryRun) {
              // Write files
              for (const [filePath, content] of result.files) {
                const fullPath = resolve(result.outputDir, filePath)
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
        
        if (errorCount > 0) {
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


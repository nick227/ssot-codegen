/**
 * Phase 11: Write Standalone Project Files
 * 
 * Writes standalone project scaffolding (package.json, tsconfig, etc.)
 * Only runs in standalone mode
 */

import path from 'node:path'
import { analyzeModel } from '../../utils/relationship-analyzer.js'
import { GenerationPhase, type PhaseContext, type PhaseResult } from '../phase-runner.js'
import * as standaloneTemplates from '../../templates/standalone-project.template.js'
import { writeFile } from '../phase-utilities.js'

export class WriteStandalonePhase extends GenerationPhase {
  readonly name = 'writeStandalone'
  readonly order = 11
  
  shouldRun(context: PhaseContext): boolean {
    return context.config.standalone ?? true
  }
  
  getDescription(): string {
    return 'Writing standalone project files'
  }
  
  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { schema, schemaContent, outputDir, generatedFiles, config } = context
    
    if (!schema || !schemaContent || !outputDir || !generatedFiles) {
      throw new Error('Required context data not found')
    }
    
    const framework = config.framework || 'express'
    
    // Filter out junction tables
    const nonJunctionModels = schema.models.filter((m: any) => {
      const analysis = analyzeModel(m, schema)
      return !analysis.isJunctionTable
    })
    
    const modelNames = nonJunctionModels.map((m: any) => m.name)
    
    // Detect database provider from schema
    const databaseProvider = schemaContent.includes('provider = "postgresql"') 
      ? 'postgresql' 
      : schemaContent.includes('provider = "mysql"')
      ? 'mysql'
      : 'sqlite'
    
    const standaloneOptions: standaloneTemplates.StandaloneProjectOptions = {
      projectName: config.projectName || path.basename(outputDir),
      framework,
      databaseProvider,
      models: modelNames
    }
    
    const writes: Promise<void>[] = []
    
    // Write package.json
    const packageJsonPath = path.join(outputDir, 'package.json')
    writes.push(writeFile(packageJsonPath, standaloneTemplates.packageJsonTemplate(standaloneOptions)))
    
    // Write tsconfig.json
    const tsconfigPath = path.join(outputDir, 'tsconfig.json')
    writes.push(writeFile(tsconfigPath, standaloneTemplates.tsconfigTemplate(standaloneOptions.projectName)))
    
    // Write .env.example with plugin variables
    const envPath = path.join(outputDir, '.env.example')
    let envContent = standaloneTemplates.envTemplate(databaseProvider)
    
    // Add plugin environment variables if plugins were generated
    if (generatedFiles.plugins && generatedFiles.plugins.size > 0 && generatedFiles.pluginOutputs) {
      const pluginOutputs = generatedFiles.pluginOutputs as Map<string, any>
      
      for (const [pluginName, output] of pluginOutputs) {
        if (output.envVars && Object.keys(output.envVars).length > 0) {
          envContent += `\n\n# ${pluginName.toUpperCase()} Configuration`
          for (const [key, value] of Object.entries(output.envVars)) {
            envContent += `\n${key}="${value}"`
          }
        }
      }
    }
    
    writes.push(writeFile(envPath, envContent))
    
    // Write .gitignore
    const gitignorePath = path.join(outputDir, '.gitignore')
    writes.push(writeFile(gitignorePath, standaloneTemplates.gitignoreTemplate()))
    
    // Write README.md
    const readmePath = path.join(outputDir, 'README.md')
    writes.push(writeFile(readmePath, standaloneTemplates.readmeTemplate(standaloneOptions)))
    
    // Write src/ files
    const srcDir = path.join(outputDir, 'src')
    writes.push(writeFile(path.join(srcDir, 'config.ts'), standaloneTemplates.configTemplate()))
    writes.push(writeFile(path.join(srcDir, 'db.ts'), standaloneTemplates.dbTemplate()))
    writes.push(writeFile(path.join(srcDir, 'logger.ts'), standaloneTemplates.loggerTemplate()))
    writes.push(writeFile(path.join(srcDir, 'middleware.ts'), standaloneTemplates.middlewareTemplate()))
    writes.push(writeFile(path.join(srcDir, 'app.ts'), standaloneTemplates.appTemplate(modelNames)))
    writes.push(writeFile(path.join(srcDir, 'server.ts'), standaloneTemplates.serverTemplate()))
    
    // Copy prisma schema to new project
    if (config.schemaPath) {
      const prismaDir = path.join(outputDir, 'prisma')
      const newSchemaPath = path.join(prismaDir, 'schema.prisma')
      writes.push(writeFile(newSchemaPath, schemaContent))
    }
    
    await Promise.all(writes)
    
    return {
      success: true,
      filesGenerated: writes.length
    }
  }
}


/**
 * Phase 11: Write Standalone Project Files (Strongly-Typed)
 * 
 * Writes standalone project scaffolding (package.json, tsconfig, etc.).
 * Only runs in standalone mode.
 * 
 * MIGRATION STATUS: ✅ Migrated to typed context
 */

import path from 'node:path'
import { analyzeModel } from '../../utils/relationship-analyzer.js'
import { TypedPhaseAdapter } from '../typed-phase-adapter.js'
import * as standaloneTemplates from '../../templates/standalone-project.template.js'
import { writeFile } from '../phase-utilities.js'
import type { 
  ContextAfterPhase10, 
  WriteStandaloneProjectOutput 
} from '../typed-context.js'

export class WriteStandalonePhaseTyped extends TypedPhaseAdapter<
  ContextAfterPhase10,            // Requires: Phase 0-10 outputs
  WriteStandaloneProjectOutput    // Provides: (project files written)
> {
  readonly name = 'writeStandalone'
  readonly order = 11
  
  shouldRunTyped(context: ContextAfterPhase10): boolean {
    return context.config.standalone ?? true
  }
  
  getDescription(): string {
    return 'Writing standalone project files'
  }
  
  /**
   * Strongly-typed execution
   * 
   * TypeScript guarantees:
   * - context.schema exists (from Phase 1)
   * - context.schemaContent exists (from Phase 1)
   * - context.outputDir exists (from Phase 0)
   * - context.generatedFiles exists (from Phase 4)
   * - context.config exists (from BaseContext)
   * 
   * NO RUNTIME CHECKS NEEDED!
   */
  async executeTyped(context: ContextAfterPhase10): Promise<WriteStandaloneProjectOutput> {
    const { schema, schemaContent, outputDir, generatedFiles, config } = context
    
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
    
    // Return empty object (phase doesn't add data to context)
    return {}
  }
  
  /**
   * Count files generated by this phase
   */
  protected override countFiles(): number {
    // Dynamic based on what's written
    return 0
  }
}


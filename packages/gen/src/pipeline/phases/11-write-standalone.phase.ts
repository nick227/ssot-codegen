/**
 * Phase 11: Write Standalone Project Files
 * 
 * Writes standalone project scaffolding (package.json, tsconfig, etc.)
 * Only runs in standalone mode
 */

import path from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'
import { analyzeModel } from '@/utils/relationship-analyzer.js'
import { GenerationPhase, type PhaseContext, type PhaseResult } from '../phase-runner.js'
import * as standaloneTemplates from '@/templates/standalone-project.template.js'
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
    
    // Detect if UI files were generated (check config first, then filesystem)
    // In bulk generation, UI files are written AFTER standalone phase, so we must check config.ui.enabled
    // The bulk generator sets ui: { enabled: true } when generating UI
    const uiConfig = config.ui
    // Debug: Log UI config detection (can be removed after verification)
    if (process.env.DEBUG_UI_DETECTION) {
      console.log('[DEBUG] UI Config:', JSON.stringify(uiConfig))
      console.log('[DEBUG] config.ui?.enabled:', uiConfig?.enabled)
      console.log('[DEBUG] Full config keys:', Object.keys(config))
    }
    const hasUI = uiConfig?.enabled === true ||
                  existsSync(path.join(outputDir, 'app')) ||
                  existsSync(path.join(outputDir, 'src', 'App.tsx')) ||
                  existsSync(path.join(outputDir, 'src', 'main.tsx')) ||
                  existsSync(path.join(outputDir, 'components')) || // Components directory indicates UI
                  existsSync(path.join(outputDir, 'hooks')) // Hooks directory also indicates UI
    const uiFramework = uiConfig?.framework || 'vite'
    
    // Debug: Log hasUI result
    if (process.env.DEBUG_UI_DETECTION) {
      console.log('[DEBUG] hasUI:', hasUI)
      console.log('[DEBUG] uiFramework:', uiFramework)
    }
    
    const standaloneOptions: standaloneTemplates.StandaloneProjectOptions = {
      projectName: config.projectName || path.basename(outputDir),
      framework,
      databaseProvider,
      models: modelNames,
      hasUI,
      uiFramework
    }
    
    const writes: Promise<void>[] = []
    
    // Write package.json
    const packageJsonPath = path.join(outputDir, 'package.json')
    writes.push(writeFile(packageJsonPath, standaloneTemplates.packageJsonTemplate(standaloneOptions)))
    
    // Write tsconfig.json
    const tsconfigPath = path.join(outputDir, 'tsconfig.json')
    writes.push(writeFile(tsconfigPath, standaloneTemplates.tsconfigTemplate(standaloneOptions.projectName, hasUI, uiFramework)))
    
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
    
    // Write ESLint config
    const eslintPath = path.join(outputDir, 'eslint.config.js')
    writes.push(writeFile(eslintPath, standaloneTemplates.eslintConfigTemplate()))
    
    // Write Prettier config
    const prettierPath = path.join(outputDir, '.prettierrc')
    writes.push(writeFile(prettierPath, standaloneTemplates.prettierConfigTemplate()))
    
    // Write Vitest config
    const vitestPath = path.join(outputDir, 'vitest.config.ts')
    writes.push(writeFile(vitestPath, standaloneTemplates.vitestConfigTemplate()))
    
    // Write Husky pre-commit hook
    const huskyDir = path.join(outputDir, '.husky')
    const preCommitPath = path.join(huskyDir, 'pre-commit')
    writes.push(writeFile(preCommitPath, standaloneTemplates.huskyPreCommitTemplate()))
    
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
    
    // Generate framework-specific configuration if UI files exist
    if (hasUI) {
      if (uiFramework === 'nextjs') {
        // next.config.js
        writes.push(writeFile(
          path.join(outputDir, 'next.config.js'),
          standaloneTemplates.nextConfigTemplate()
        ))
        
        // app/layout.tsx (if app directory exists)
        const appDir = path.join(outputDir, 'app')
        if (existsSync(appDir)) {
          const layoutPath = path.join(appDir, 'layout.tsx')
          // Only create if it doesn't exist (UI generator might have created it)
          if (!existsSync(layoutPath)) {
            writes.push(writeFile(layoutPath, standaloneTemplates.nextLayoutTemplate()))
          }
          
          // app/globals.css
          const globalsCssPath = path.join(appDir, 'globals.css')
          if (!existsSync(globalsCssPath)) {
            writes.push(writeFile(globalsCssPath, standaloneTemplates.globalsCssTemplate()))
          }
        }
      } else {
        // vite.config.ts
        writes.push(writeFile(
          path.join(outputDir, 'vite.config.ts'),
          standaloneTemplates.viteConfigTemplate()
        ))
        
        // index.html for Vite
        const indexHtmlPath = path.join(outputDir, 'index.html')
        if (!existsSync(indexHtmlPath)) {
          writes.push(writeFile(indexHtmlPath, standaloneTemplates.viteIndexHtmlTemplate()))
        }
        
        // src/main.tsx for Vite entry point
        const srcDir = path.join(outputDir, 'src')
        if (!existsSync(srcDir)) {
          mkdirSync(srcDir, { recursive: true })
        }
        const mainTsxPath = path.join(srcDir, 'main.tsx')
        if (!existsSync(mainTsxPath)) {
          writes.push(writeFile(mainTsxPath, standaloneTemplates.viteMainTemplate()))
        }
        
        // src/App.tsx for Vite
        const appTsxPath = path.join(srcDir, 'App.tsx')
        if (!existsSync(appTsxPath)) {
          writes.push(writeFile(appTsxPath, standaloneTemplates.viteAppTemplate()))
        }
        
        // src/index.css for Vite
        const indexCssPath = path.join(srcDir, 'index.css')
        if (!existsSync(indexCssPath)) {
          writes.push(writeFile(indexCssPath, standaloneTemplates.globalsCssTemplate()))
        }
      }
      
      // tailwind.config.js (shared)
      writes.push(writeFile(
        path.join(outputDir, 'tailwind.config.js'),
        standaloneTemplates.tailwindConfigTemplate()
      ))
      
      // postcss.config.js (shared)
      writes.push(writeFile(
        path.join(outputDir, 'postcss.config.js'),
        standaloneTemplates.postcssConfigTemplate()
      ))
    }
    
    await Promise.all(writes)
    
    return {
      success: true,
      filesGenerated: writes.length
    }
  }
}


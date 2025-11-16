/**
 * Bulk Website Generator
 * 
 * Generates multiple websites from configuration
 */

import type { ParsedSchema } from '../../dmmf-parser.js'
import type { BulkGenerateConfig, ProjectConfig } from './website-schema-types.js'
import { generateUI } from './ui-generator.js'
import { generateSite } from './site-builder.js'
import { parseDMMF } from '../../dmmf-parser.js'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { dirname, resolve, join } from 'path'
import { fileURLToPath } from 'url'
import { validateBulkConfig, validateModelReferences } from './bulk-validator.js'
import { mergeCustomizations } from './config-merger.js'
import { generateManifest, generateBulkManifest, type ProjectManifest } from './manifest-generator.js'
import { findWorkspaceRoot, getNextProjectFolder, deriveProjectName } from '../../utils/gen-folder.js'
import { generateFromSchemaAPI } from '../../api/implementation.js'
import type { GenerateOptions } from '../../api/types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Expand project IDs to full ProjectConfig objects
 */
export async function expandProjectIds(
  projectIds: string[],
  baseDir: string,
  verbose: boolean
): Promise<ProjectConfig[]> {
  const expanded: ProjectConfig[] = []
  
  // Find workspace root and generated directory
  const workspaceRoot = findWorkspaceRoot(baseDir)
  const generatedDir = resolve(workspaceRoot, 'generated')
  
  for (const projectId of projectIds) {
    const projectDir = resolve(baseDir, 'websites', projectId)
    const starterPath = resolve(projectDir, 'starter.json')
    
    // Derive project name from projectId or schema
    const schemaPath = resolve(projectDir, 'schema.prisma')
    const projectBaseName = deriveProjectName(existsSync(schemaPath) ? schemaPath : undefined) || projectId
    
    // Use root-level generated/ folder with incremental naming
    const projectFolderName = getNextProjectFolder(generatedDir, projectBaseName)
    const outputDir = resolve(generatedDir, projectFolderName)
    
    if (!existsSync(starterPath)) {
      if (verbose) {
        console.warn(`⚠️  No starter.json found for project: ${projectId}`)
      }
      // Fallback to default structure
      expanded.push({
        id: projectId,
        name: projectId,
        schema: {
          schemaPath: resolve(projectDir, 'schema.prisma'),
          uiConfigPath: resolve(projectDir, 'ui.config.ts')
        } as any, // Type assertion: schema can be string | WebsiteSchema | { schemaPath, uiConfigPath }
        outputDir
      })
      continue
    }
    
    try {
      const starter = JSON.parse(readFileSync(starterPath, 'utf-8'))
      expanded.push({
        id: starter.id || projectId,
        name: starter.name || projectId,
        schema: {
          schemaPath: resolve(projectDir, starter.schema || 'schema.prisma'),
          uiConfigPath: resolve(projectDir, starter.uiConfig || 'ui.config.ts')
        } as any, // Type assertion: schema can be string | WebsiteSchema | { schemaPath, uiConfigPath }
        outputDir,
        customizations: starter.customizations
      })
    } catch (error) {
      if (verbose) {
        console.warn(`⚠️  Error loading starter.json for ${projectId}:`, error)
      }
    }
  }
  
  return expanded
}

/**
 * Parse Prisma schema file and return ParsedSchema
 */
async function parseSchemaFile(schemaPath: string): Promise<ParsedSchema> {
  // Use the same pattern as 01-parse-schema.phase.ts
  async function getPrismaDMMF() {
    const prismaInternals = await import('@prisma/internals')
    // Handle both default and named exports
    return prismaInternals.getDMMF || prismaInternals.default?.getDMMF
  }
  
  let getDMMF: any
  try {
    getDMMF = await getPrismaDMMF()
    if (!getDMMF || typeof getDMMF !== 'function') {
      throw new Error('getDMMF is not a function. Check @prisma/internals version.')
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    throw new Error(`@prisma/internals not available: ${errorMsg}. Install it: pnpm add @prisma/internals`)
  }
  
  const schemaContent = readFileSync(schemaPath, 'utf-8')
  const dmmf = await getDMMF({ datamodel: schemaContent })
  return parseDMMF(dmmf)
}

/**
 * Generate multiple websites from bulk configuration
 */
export async function generateBulkWebsites(
  config: BulkGenerateConfig,
  options?: { verbose?: boolean; parallel?: boolean; baseDir?: string; fullStack?: boolean }
): Promise<Map<string, BulkGenerateResult>> {
  const results = new Map<string, BulkGenerateResult>()
  const { projects, options: configOptions } = config
  const { 
    parallel = configOptions?.parallel ?? false, 
    verbose = configOptions?.verbose ?? false, 
    baseDir = process.cwd(),
    fullStack = configOptions?.fullStack ?? true // Default to full-stack (backend + UI)
  } = options || {}
  
  // Handle simplified config format (array of project IDs)
  const projectsList: ProjectConfig[] = Array.isArray(projects) && projects.length > 0 && typeof projects[0] === 'string'
    ? await expandProjectIds(projects as string[], baseDir, verbose)
    : projects as ProjectConfig[]
  
  // Pre-validate all schemas before starting generation (fail fast on validation errors)
  // This prevents wasting time generating projects with invalid schemas
  if (fullStack) {
    if (verbose) {
      console.log('🔍 Pre-validating all schemas...')
    }
    
    const validationErrors: string[] = []
    for (const project of projectsList) {
      try {
        const schemaPath = typeof project.schema === 'string' 
          ? resolve(baseDir, project.schema)
          : resolve(baseDir, project.schema.schemaPath)
        const schemaContent = readFileSync(schemaPath, 'utf-8')
        const schema = await parseSchemaFile(schemaPath)
        
        // Run validation
        const { validateSchemaDetailed } = await import('../../dmmf-parser.js')
        const result = validateSchemaDetailed(schema, false)
        
        // Add MySQL-specific validation
        const { validateMySQLKeyLength } = await import('../../dmmf-parser/validation/mysql-key-length.js')
        const mysqlValidation = validateMySQLKeyLength(schema, schemaContent)
        result.errors.push(...mysqlValidation.errors)
        
        if (result.errors.length > 0) {
          validationErrors.push(`\n❌ ${project.name} (${project.id}):\n${result.errors.map(e => `   ${e}`).join('\n')}`)
        }
      } catch (error) {
        validationErrors.push(`\n❌ ${project.name} (${project.id}): ${error instanceof Error ? error.message : String(error)}`)
      }
    }
    
    if (validationErrors.length > 0) {
      throw new Error(`Schema validation failed for ${validationErrors.length} project(s). Fix these errors before generating:\n${validationErrors.join('\n')}`)
    }
    
    if (verbose && validationErrors.length === 0) {
      console.log('✅ All schemas validated successfully\n')
    }
  }
  
  if (parallel) {
    // Generate in parallel
    const promises = projectsList.map(project => generateProject(project, verbose, baseDir, fullStack))
    const projectResults = await Promise.allSettled(promises)
    
    for (let i = 0; i < projectsList.length; i++) {
      const project = projectsList[i]
      const result = projectResults[i]
      
      if (result.status === 'fulfilled') {
        results.set(project.id, result.value)
      } else {
        results.set(project.id, {
          success: false,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
          filesGenerated: 0
        })
      }
    }
  } else {
    // Generate sequentially
    for (const project of projectsList) {
      try {
        const result = await generateProject(project, verbose, baseDir, fullStack)
        results.set(project.id, {
          success: result.success,
          filesGenerated: result.filesGenerated,
          outputDir: result.outputDir,
          files: result.files,
          manifest: result.manifest
        })
      } catch (error) {
        results.set(project.id, {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          filesGenerated: 0
        })
        
        if (!configOptions?.continueOnError) {
          throw error
        }
      }
    }
  }
  
  return results
}

/**
 * Generate a single project
 * Uses full pipeline by default (fullStack: true) to ensure consistency with single generate command
 */
async function generateProject(
  config: ProjectConfig,
  verbose: boolean,
  baseDir: string = process.cwd(),
  fullStack: boolean = true
): Promise<BulkGenerateResult & { files?: Map<string, string>; manifest?: ProjectManifest }> {
  if (verbose) {
    console.log(`📦 Generating project: ${config.name} (${config.id})`)
  }
  
  // Load schema
  const schemaPath = typeof config.schema === 'string' 
    ? resolve(baseDir, config.schema)
    : resolve(baseDir, config.schema.schemaPath)
  
  const schemaContent = readFileSync(schemaPath, 'utf-8')
  
  if (fullStack) {
    // Use full pipeline (same as single generate command)
    // This ensures identical output to single generate
    try {
      // Load UI config first to get framework preference
      const uiConfigPath = typeof config.schema === 'string'
        ? resolve(dirname(schemaPath), 'ui.config.ts')
        : resolve(baseDir, config.schema.uiConfigPath)
      
      let uiConfig: any = {}
      let configContent = '{}'
      try {
        const uiConfigModule = await import(uiConfigPath)
        uiConfig = uiConfigModule.default || uiConfigModule
      } catch {
        if (verbose) {
          console.warn(`⚠️  UI config not found at ${uiConfigPath}, using defaults`)
        }
      }
      
      const generateOptions: GenerateOptions = {
        schema: schemaPath,
        output: config.outputDir,
        framework: 'express', // Default, could be configurable
        standalone: true,
        projectName: config.name,
        verbosity: verbose ? 'verbose' : 'normal',
        ui: { 
          enabled: true,
          framework: (uiConfig as any)?.framework || 'vite' // Default to vite
        }
      }
      
      const result = await generateFromSchemaAPI(generateOptions)
      
      if (!result.success) {
        throw new Error(result.errors?.[0]?.message || 'Generation failed')
      }
      
      // Apply customizations
      if (config.customizations) {
        uiConfig = mergeCustomizations(uiConfig, config.customizations)
      }
      configContent = JSON.stringify(uiConfig)
      
      // Generate UI files and add to existing project
      const schema = await parseSchemaFile(schemaPath)
      const uiFramework = (uiConfig as any)?.framework || 'vite'
      const uiResult = generateUI(schema, {
        outputDir: config.outputDir,
        generateComponents: true,
        generatePages: true,
        generateHookLinkers: true,
        uiFramework
      })
      
      // Generate site if SiteConfig is available
      let siteFiles = new Map<string, string>()
      if (uiConfig.pages && Array.isArray(uiConfig.pages)) {
        const siteConfig = convertUiConfigToSiteConfig(uiConfig)
        siteFiles = generateSite(siteConfig, schema, config.outputDir)
      }
      
      // Merge UI files (will be written separately)
      const allFiles = new Map<string, string>()
      for (const [path, content] of uiResult.files) {
        allFiles.set(path, content)
      }
      for (const [path, content] of siteFiles) {
        allFiles.set(path, content)
      }
      
      // Generate Vite config files if using Vite framework
      if (uiFramework === 'vite') {
        const { viteConfigTemplate, viteIndexHtmlTemplate, viteMainTemplate, viteAppTemplate, globalsCssTemplate, tailwindConfigTemplate, postcssConfigTemplate } = await import('../../templates/standalone-project.template.js')
        const { existsSync } = await import('node:fs')
        const { resolve } = await import('node:path')
        
        // vite.config.ts
        const viteConfigPath = resolve(config.outputDir, 'vite.config.ts')
        if (!existsSync(viteConfigPath)) {
          allFiles.set('vite.config.ts', viteConfigTemplate())
        }
        
        // index.html
        const indexHtmlPath = resolve(config.outputDir, 'index.html')
        if (!existsSync(indexHtmlPath)) {
          allFiles.set('index.html', viteIndexHtmlTemplate())
        }
        
        // src/main.tsx
        const mainTsxPath = resolve(config.outputDir, 'src', 'main.tsx')
        if (!existsSync(mainTsxPath)) {
          allFiles.set('src/main.tsx', viteMainTemplate())
        }
        
        // src/App.tsx (only if doesn't exist - UI generator may have created routes)
        const appTsxPath = resolve(config.outputDir, 'src', 'App.tsx')
        if (!existsSync(appTsxPath)) {
          allFiles.set('src/App.tsx', viteAppTemplate())
        }
        
        // src/index.css
        const indexCssPath = resolve(config.outputDir, 'src', 'index.css')
        if (!existsSync(indexCssPath)) {
          allFiles.set('src/index.css', globalsCssTemplate())
        }
        
        // tailwind.config.js
        const tailwindConfigPath = resolve(config.outputDir, 'tailwind.config.js')
        if (!existsSync(tailwindConfigPath)) {
          allFiles.set('tailwind.config.js', tailwindConfigTemplate())
        }
        
        // postcss.config.js
        const postcssConfigPath = resolve(config.outputDir, 'postcss.config.js')
        if (!existsSync(postcssConfigPath)) {
          allFiles.set('postcss.config.js', postcssConfigTemplate())
        }
      }
      
      // Update package.json to include React/Vite dependencies
      // The standalone phase generated package.json before UI files existed, so it doesn't have React deps
      const packageJsonPath = resolve(config.outputDir, 'package.json')
      if (existsSync(packageJsonPath)) {
        const { packageJsonTemplate } = await import('../../templates/standalone-project.template.js')
        const { readFileSync } = await import('node:fs')
        const existingPkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
        const projectName = existingPkg.name || config.name
        
        // Regenerate package.json with UI dependencies
        const updatedPkg = packageJsonTemplate({
          projectName,
          framework: 'express',
          databaseProvider: schemaContent.includes('provider = "postgresql"') ? 'postgresql' : schemaContent.includes('provider = "mysql"') ? 'mysql' : 'sqlite',
          models: schema.models.map((m: any) => m.name),
          hasUI: true,
          uiFramework: uiFramework as 'vite' | 'nextjs'
        })
        
        // Parse the template output and merge with existing package.json to preserve any custom fields
        const updatedPkgObj = JSON.parse(updatedPkg)
        const mergedPkg = {
          ...existingPkg,
          ...updatedPkgObj,
          // Merge dependencies (updatedPkgObj has React/Vite deps)
          dependencies: {
            ...existingPkg.dependencies,
            ...updatedPkgObj.dependencies
          },
          // Merge devDependencies (updatedPkgObj has React/Vite dev deps)
          devDependencies: {
            ...existingPkg.devDependencies,
            ...updatedPkgObj.devDependencies
          },
          // Use updated scripts (they include frontend commands)
          scripts: updatedPkgObj.scripts
        }
        
        allFiles.set('package.json', JSON.stringify(mergedPkg, null, 2))
      }
      
      // Generate manifest
      const manifest = generateManifest(config, schemaContent, configContent, result.filesCreated + allFiles.size)
      const manifestPath = '.ssot/manifest.json'
      allFiles.set(manifestPath, JSON.stringify(manifest, null, 2))
      
      if (verbose) {
        console.log(`✅ Generated ${result.filesCreated} backend files + ${allFiles.size} UI files for ${config.name}`)
      }
      
      return {
        success: true,
        filesGenerated: result.filesCreated + allFiles.size,
        outputDir: result.outputDir || config.outputDir,
        files: allFiles, // UI files only (backend already written by pipeline)
        manifest
      }
    } catch (error) {
      throw new Error(`Full-stack generation failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  } else {
    // UI-only mode (legacy behavior)
    const schema = await parseSchemaFile(schemaPath)
    
    // Load UI config
    const uiConfigPath = typeof config.schema === 'string'
      ? resolve(dirname(schemaPath), 'ui.config.ts')
      : resolve(baseDir, config.schema.uiConfigPath)
    
    let uiConfig: any = {}
    let configContent = '{}'
    try {
      const uiConfigModule = await import(uiConfigPath)
      uiConfig = uiConfigModule.default || uiConfigModule
    } catch (error) {
      if (verbose) {
        console.warn(`⚠️  UI config not found at ${uiConfigPath}, using defaults`)
      }
    }
    
    // Validate model references
    const modelValidation = validateModelReferences(uiConfig, schema)
    if (modelValidation.errors.length > 0) {
      throw new Error(`Model validation failed: ${modelValidation.errors.join(', ')}`)
    }
    
    // Apply customizations using deep merge
    if (config.customizations) {
      uiConfig = mergeCustomizations(uiConfig, config.customizations)
    }
    
    // Capture config content for manifest (after customizations)
    configContent = JSON.stringify(uiConfig)
    
    // Generate UI
    const uiResult = generateUI(schema, {
      outputDir: config.outputDir,
      generateComponents: true,
      generatePages: true,
      generateHookLinkers: true
    })
    
    // Generate site if SiteConfig is available
    let siteFiles = new Map<string, string>()
    if (uiConfig.pages && Array.isArray(uiConfig.pages)) {
      const siteConfig = convertUiConfigToSiteConfig(uiConfig)
      siteFiles = generateSite(siteConfig, schema, config.outputDir)
    }
    
    // Merge results
    const allFiles = new Map<string, string>()
    for (const [path, content] of uiResult.files) {
      allFiles.set(path, content)
    }
    for (const [path, content] of siteFiles) {
      allFiles.set(path, content)
    }
    
    // Copy Prisma schema to generated project (required for prisma generate)
    const prismaSchemaPath = 'prisma/schema.prisma'
    allFiles.set(prismaSchemaPath, schemaContent)
    
    // Generate infrastructure files (package.json, tsconfig.json, etc.)
    const projectName = config.name.toLowerCase().replace(/\s+/g, '-')
    const packageJson = generatePackageJson(projectName, schema)
    allFiles.set('package.json', packageJson)
    
    const tsconfig = generateTsConfig()
    allFiles.set('tsconfig.json', tsconfig)
    
    const gitignore = generateGitignore()
    allFiles.set('.gitignore', gitignore)
    
    if (verbose) {
      console.log(`✅ Generated ${allFiles.size} files for ${config.name}`)
    }
    
    // Generate manifest
    const manifest = generateManifest(config, schemaContent, configContent, allFiles.size)
    
    // Add manifest to files
    const manifestPath = '.ssot/manifest.json'
    allFiles.set(manifestPath, JSON.stringify(manifest, null, 2))
    
    return {
      success: true,
      filesGenerated: allFiles.size,
      outputDir: config.outputDir,
      files: allFiles,
      manifest
    }
  }
}


/**
 * Convert UiConfig to SiteConfig
 */
function convertUiConfigToSiteConfig(uiConfig: any): any {
  return {
    name: uiConfig.site?.name || 'Website',
    version: '1.0.0',
    theme: uiConfig.theme,
    navigation: uiConfig.navigation,
    pages: (uiConfig.pages || []).map((page: any) => ({
      path: page.path,
      spec: {
        layout: page.layout,
        sections: page.sections || []
      }
    })),
    features: {
      auth: uiConfig.generation?.crudPages?.enabled || false,
      search: false,
      darkMode: uiConfig.theme?.darkMode || false
    }
  }
}

/**
 * Generate package.json for generated project
 */
function generatePackageJson(projectName: string, schema: ParsedSchema, uiFramework: 'vite' | 'nextjs' = 'vite'): string {
  const scripts = uiFramework === 'nextjs' 
    ? {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        'db:generate': 'prisma generate',
        'db:push': 'prisma db push',
        'db:migrate': 'prisma migrate dev',
        'db:studio': 'prisma studio'
      }
    : {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview',
        'db:generate': 'prisma generate',
        'db:push': 'prisma db push',
        'db:migrate': 'prisma migrate dev',
        'db:studio': 'prisma studio'
      }

  const dependencies = uiFramework === 'nextjs'
    ? {
        '@prisma/client': '^5.22.0',
        'next': '^15.0.0',
        'react': '^18.3.0',
        'react-dom': '^18.3.0'
      }
    : {
        '@prisma/client': '^5.22.0',
        'react': '^18.3.0',
        'react-dom': '^18.3.0',
        'react-router-dom': '^6.26.0'
      }

  const devDependencies = uiFramework === 'nextjs'
    ? {
        '@types/node': '^22.10.0',
        '@types/react': '^18.3.0',
        '@types/react-dom': '^18.3.0',
        'prisma': '^5.22.0',
        'typescript': '^5.9.0'
      }
    : {
        '@types/node': '^22.10.0',
        '@types/react': '^18.3.0',
        '@types/react-dom': '^18.3.0',
        '@vitejs/plugin-react': '^4.3.0',
        'prisma': '^5.22.0',
        'typescript': '^5.9.0',
        'vite': '^5.4.0'
      }

  const pkg = {
    name: projectName,
    version: '1.0.0',
    type: 'module',
    description: 'Generated project from SSOT Codegen',
    scripts,
    dependencies,
    devDependencies,
    engines: {
      node: '>=18.0.0'
    }
  }
  return JSON.stringify(pkg, null, 2) + '\n'
}

/**
 * Generate tsconfig.json for generated project
 */
function generateTsConfig(uiFramework: 'vite' | 'nextjs' = 'vite'): string {
  const baseConfig = {
    target: 'ES2022',
    lib: ['dom', 'dom.iterable', 'esnext'],
    allowJs: true,
    skipLibCheck: true,
    strict: true,
    noEmit: true,
    esModuleInterop: true,
    module: 'esnext',
    moduleResolution: 'bundler',
    resolveJsonModule: true,
    isolatedModules: true,
    jsx: 'preserve' as const,
    paths: {
      '@/*': ['./src/*']
    }
  }

  if (uiFramework === 'nextjs') {
    return JSON.stringify({
      compilerOptions: {
        ...baseConfig,
        incremental: true,
        plugins: [
          {
            name: 'next'
          }
        ]
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
      exclude: ['node_modules']
    }, null, 2) + '\n'
  } else {
    return JSON.stringify({
      compilerOptions: baseConfig,
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['node_modules', 'dist']
    }, null, 2) + '\n'
  }
}

/**
 * Generate .gitignore for generated project
 */
function generateGitignore(): string {
  return `# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Next.js
.next/
out/
build/
dist/

# Production
*.log
*.pid
*.seed
*.pid.lock

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Prisma
prisma/migrations/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Generated
.ssot/
`
}

/**
 * Bulk generation result
 */
export interface BulkGenerateResult {
  success: boolean
  filesGenerated: number
  outputDir?: string
  error?: string
  files?: Map<string, string>
  manifest?: ProjectManifest
}

/**
 * Load bulk generation config from file
 * Supports both JSON and TypeScript config files
 */
export async function loadBulkConfig(configPath: string): Promise<BulkGenerateConfig> {
  const resolvedPath = resolve(configPath)
  
  if (resolvedPath.endsWith('.ts') || resolvedPath.endsWith('.tsx')) {
    // Dynamic import for TypeScript configs
    const configModule = await import(resolvedPath)
    return configModule.default || configModule
  } else {
    // JSON config
    const content = readFileSync(resolvedPath, 'utf-8')
    return JSON.parse(content)
  }
}

/**
 * Generate bulk report
 */
export function generateBulkReport(
  results: Map<string, BulkGenerateResult>,
  outputPath?: string
): string {
  const manifests: ProjectManifest[] = []
  let totalFiles = 0
  let successful = 0
  let failed = 0

  for (const [projectId, result] of results) {
    if (result.success) {
      successful++
      totalFiles += result.filesGenerated
      if (result.manifest) {
        manifests.push(result.manifest)
      }
    } else {
      failed++
    }
  }

  const bulkManifest = generateBulkManifest(manifests, {
    totalFiles,
    successful,
    failed
  })

  const report = `Bulk Generation Report
=====================
Generated: ${bulkManifest.generatedAt}
Projects: ${bulkManifest.summary.totalProjects}
Total Files: ${bulkManifest.summary.totalFiles}
Successful: ${bulkManifest.summary.successful}
Failed: ${bulkManifest.summary.failed}

Projects:
${manifests.map(m => `  ✅ ${m.name} (${m.filesGenerated} files)`).join('\n')}
${Array.from(results.entries())
  .filter(([_, r]) => !r.success)
  .map(([id, r]) => `  ❌ ${id}: ${r.error || 'Unknown error'}`)
  .join('\n')}
`

  if (outputPath) {
    writeFileSync(outputPath, report, 'utf-8')
    // Also write JSON manifest
    const manifestPath = join(dirname(outputPath), 'bulk-manifest.json')
    mkdirSync(dirname(manifestPath), { recursive: true })
    writeFileSync(manifestPath, JSON.stringify(bulkManifest, null, 2), 'utf-8')
  }

  return report
}


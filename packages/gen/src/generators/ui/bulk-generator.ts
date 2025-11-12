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
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { dirname, resolve, join } from 'path'
import { fileURLToPath } from 'url'
import { validateBulkConfig, validateModelReferences } from './bulk-validator.js'
import { mergeCustomizations } from './config-merger.js'
import { generateManifest, generateBulkManifest, type ProjectManifest } from './manifest-generator.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Expand project IDs to full ProjectConfig objects
 */
async function expandProjectIds(
  projectIds: string[],
  baseDir: string,
  verbose: boolean
): Promise<ProjectConfig[]> {
  const expanded: ProjectConfig[] = []
  
  for (const projectId of projectIds) {
    const projectDir = resolve(baseDir, 'websites', projectId)
    const starterPath = resolve(projectDir, 'starter.json')
    
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
        },
        outputDir: resolve(projectDir, 'generated')
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
        },
        outputDir: resolve(projectDir, starter.outputDir || 'generated'),
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
  // Try dynamic import of @prisma/internals
  let getDMMF: any
  try {
    const prismaInternals = await import('@prisma/internals')
    getDMMF = prismaInternals.getDMMF
  } catch (error) {
    throw new Error('@prisma/internals not available. Install it: npm install @prisma/internals')
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
  options?: { verbose?: boolean; parallel?: boolean; baseDir?: string }
): Promise<Map<string, BulkGenerateResult>> {
  const results = new Map<string, BulkGenerateResult>()
  const { projects, options: configOptions } = config
  const { parallel = configOptions?.parallel ?? false, verbose = configOptions?.verbose ?? false, baseDir = process.cwd() } = options || {}
  
  // Handle simplified config format (array of project IDs)
  const projectsList: ProjectConfig[] = Array.isArray(projects) && projects.length > 0 && typeof projects[0] === 'string'
    ? await expandProjectIds(projects as string[], baseDir, verbose)
    : projects as ProjectConfig[]
  
  if (parallel) {
    // Generate in parallel
    const promises = projects.map(project => generateProject(project, verbose, baseDir))
    const projectResults = await Promise.allSettled(promises)
    
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i]
      const result = projectResults[i]
      
      if (result.status === 'fulfilled') {
        results.set(project.id, result.value)
      } else {
        const projectId = typeof project === 'string' ? project : project.id
        results.set(projectId, {
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
        const result = await generateProject(project, verbose, baseDir)
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
 */
async function generateProject(
  config: ProjectConfig,
  verbose: boolean,
  baseDir: string = process.cwd()
): Promise<BulkGenerateResult & { files?: Map<string, string>; manifest?: ProjectManifest }> {
  if (verbose) {
    console.log(`📦 Generating project: ${config.name} (${config.id})`)
  }
  
  // Load schema
  const schemaPath = typeof config.schema === 'string' 
    ? resolve(baseDir, config.schema)
    : resolve(baseDir, config.schema.schemaPath)
  
  const schemaContent = readFileSync(schemaPath, 'utf-8')
  const schema = await parseSchemaFile(schemaPath)
  
  // Load UI config
  const uiConfigPath = typeof config.schema === 'string'
    ? resolve(dirname(schemaPath), 'ui.config.ts')
    : resolve(baseDir, config.schema.uiConfigPath)
  
  let uiConfig: any = {}
  let configContent = '{}'
  try {
    // Try to load UI config (may not exist)
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
    // Convert UiConfig to SiteConfig if needed
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


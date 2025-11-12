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
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

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
  options?: { verbose?: boolean; parallel?: boolean }
): Promise<Map<string, BulkGenerateResult>> {
  const results = new Map<string, BulkGenerateResult>()
  const { projects, options: configOptions } = config
  const { parallel = configOptions?.parallel ?? false, verbose = configOptions?.verbose ?? false } = options || {}
  
  if (parallel) {
    // Generate in parallel
    const promises = projects.map(project => generateProject(project, verbose))
    const projectResults = await Promise.allSettled(promises)
    
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i]
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
    for (const project of projects) {
      try {
        const result = await generateProject(project, verbose)
        results.set(project.id, {
          success: result.success,
          filesGenerated: result.filesGenerated,
          outputDir: result.outputDir,
          files: result.files
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
  verbose: boolean
): Promise<BulkGenerateResult & { files?: Map<string, string> }> {
  if (verbose) {
    console.log(`📦 Generating project: ${config.name} (${config.id})`)
  }
  
  // Load schema
  const schemaPath = typeof config.schema === 'string' 
    ? config.schema 
    : config.schema.schemaPath
  
  const schema = await parseSchemaFile(schemaPath)
  
  // Load UI config
  const uiConfigPath = typeof config.schema === 'string'
    ? resolve(dirname(schemaPath), 'ui.config.ts')
    : config.schema.uiConfigPath
  
  let uiConfig: any = {}
  try {
    // Try to load UI config (may not exist)
    const uiConfigModule = await import(uiConfigPath)
    uiConfig = uiConfigModule.default || uiConfigModule
  } catch (error) {
    if (verbose) {
      console.warn(`⚠️  UI config not found at ${uiConfigPath}, using defaults`)
    }
  }
  
  // Apply customizations
  if (config.customizations) {
    uiConfig = applyCustomizations(uiConfig, config.customizations)
  }
  
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
  
  return {
    success: true,
    filesGenerated: allFiles.size,
    outputDir: config.outputDir,
    files: allFiles
  }
}

/**
 * Apply customizations to UI config
 */
function applyCustomizations(
  baseConfig: any,
  customizations: any
): any {
  const result = { ...baseConfig }
  
  if (customizations.theme) {
    result.theme = { ...result.theme, ...customizations.theme }
  }
  
  if (customizations.site) {
    result.site = { ...result.site, ...customizations.site }
  }
  
  if (customizations.navigation) {
    result.navigation = { ...result.navigation, ...customizations.navigation }
  }
  
  if (customizations.pages) {
    result.pages = [...(result.pages || []), ...customizations.pages]
  }
  
  if (customizations.components) {
    result.components = { ...result.components, ...customizations.components }
  }
  
  return result
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
}

/**
 * Load bulk generation config from file
 */
export function loadBulkConfig(configPath: string): BulkGenerateConfig {
  const content = readFileSync(configPath, 'utf-8')
  return JSON.parse(content)
}


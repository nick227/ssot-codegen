/**
 * UI Generator
 * 
 * Single-responsibility: Generate UI components and pages from Prisma schema
 * Optimized for minimal allocations and single-pass generation
 */

import type { ParsedSchema, ParsedModel } from '../../dmmf-parser.js'
import { generateSmartComponents } from './smart-components.js'
import { generatePageStubs } from './page-stub-generator.js'
import { generateHookLinkers } from './hook-linker-generator.js'

export interface UiGeneratorConfig {
  outputDir: string
  generateComponents: boolean
  generatePages: boolean
  generateHookLinkers?: boolean  // Generate hook adapters (default: true)
  models?: string[]  // If undefined, generate for all models
}

export interface UiGeneratorResult {
  files: Map<string, string>
  componentsGenerated: number
  pagesGenerated: number
  hookAdaptersGenerated: number
}

/**
 * Generate UI components and pages
 * Single pass through schema, minimal allocations
 */
export function generateUI(
  schema: ParsedSchema,
  config: UiGeneratorConfig
): UiGeneratorResult {
  // Pre-allocate result map with known size
  const files = new Map<string, string>()
  let componentsGenerated = 0
  let pagesGenerated = 0
  let hookAdaptersGenerated = 0
  
  // Generate hook linkers (lightweight adapters for connecting components to hooks)
  if (config.generateHookLinkers !== false) {
    const hookLinkerFiles = generateHookLinkers(schema, 'hooks')
    
    // Fuse into main map (single pass)
    for (const [path, content] of hookLinkerFiles) {
      files.set(path, content)
      hookAdaptersGenerated++
    }
  }
  
  // Generate smart component library (once per project)
  if (config.generateComponents) {
    const componentFiles = generateSmartComponents('components/ssot')
    
    // Fuse into main map (single pass)
    for (const [path, content] of componentFiles) {
      files.set(path, content)
      componentsGenerated++
    }
  }
  
  // Filter models (single pass, early return if no models)
  const targetModels = config.models 
    ? schema.models.filter(m => config.models!.includes(m.name))
    : schema.models
  
  if (targetModels.length === 0) {
    return { files, componentsGenerated, pagesGenerated: 0, hookAdaptersGenerated }
  }
  
  // Generate pages per model (single pass, no intermediate arrays)
  if (config.generatePages) {
    for (const model of targetModels) {
      // Skip internal models (convention-based)
      if (isInternalModel(model.name)) continue
      
      const pageFiles = generatePageStubs(model, 'app')
      
      // Fuse into main map
      for (const [path, content] of pageFiles) {
        files.set(path, content)
        pagesGenerated++
      }
    }
  }
  
  return { files, componentsGenerated, pagesGenerated, hookAdaptersGenerated }
}

/**
 * Check if model is internal (skip UI generation)
 * Hot path: inline check, no allocations
 */
function isInternalModel(modelName: string): boolean {
  // Convention: Skip auth tables, migrations, junction tables
  const internalPrefixes = ['_prisma', 'Account', 'Session', 'VerificationToken']
  
  // Early return on exact match
  if (modelName.startsWith('_')) return true
  
  // Check prefixes (no array allocations)
  for (const prefix of internalPrefixes) {
    if (modelName === prefix) return true
  }
  
  return false
}

/**
 * Get model display name
 * Pure function, no side effects
 */
export function getModelDisplayName(modelName: string): string {
  // Simple transform, no regex (faster)
  return modelName
}

/**
 * Get model route path
 * Pure function, convention-based
 */
export function getModelRoutePath(modelName: string): string {
  return modelName.toLowerCase()
}


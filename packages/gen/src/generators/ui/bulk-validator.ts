/**
 * Bulk Generation Validator
 * 
 * Validates bulk generation configuration before execution
 */

import { existsSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import type { BulkGenerateConfig, ProjectConfig } from './website-schema-types.js'
import type { ParsedSchema } from '../../dmmf-parser.js'

export interface BulkValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// Alias for backward compatibility
export type ValidationResult = BulkValidationResult

export interface ProjectValidationResult {
  projectId: string
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate bulk generation configuration
 */
export function validateBulkConfig(
  config: BulkGenerateConfig,
  baseDir: string = process.cwd()
): BulkValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Validate projects array
  if (!config.projects || !Array.isArray(config.projects)) {
    errors.push('Configuration must have a "projects" array')
    return { valid: false, errors, warnings }
  }

  // Handle simplified config format (array of strings)
  // Note: Actual outputDir will be set by expandProjectIds, this is just for validation
  let projectsList: ProjectConfig[]
  if (Array.isArray(config.projects) && config.projects.length > 0 && typeof config.projects[0] === 'string') {
    projectsList = (config.projects as string[]).map((id: string) => ({
      id,
      name: id,
      schema: {
        schemaPath: resolve(baseDir, 'websites', id, 'schema.prisma'),
        uiConfigPath: resolve(baseDir, 'websites', id, 'ui.config.ts')
      } as any, // Type assertion needed because schema can be string | WebsiteSchema | { schemaPath, uiConfigPath }
      outputDir: resolve(baseDir, 'generated', `${id}-1`) // Placeholder - actual will be set by expandProjectIds
    }))
  } else {
    projectsList = config.projects as ProjectConfig[]
  }

  if (projectsList.length === 0) {
    warnings.push('No projects defined in configuration')
  }
  
  // Validate each project
  const projectIds = new Set<string>()
  for (let i = 0; i < projectsList.length; i++) {
    const project = projectsList[i]
    const projectResult = validateProject(project, baseDir, i)
    
    if (!projectResult.valid) {
      errors.push(...projectResult.errors.map(e => `Project ${i + 1} (${project.id || 'unnamed'}): ${e}`))
    }
    
    warnings.push(...projectResult.warnings.map(w => `Project ${i + 1} (${project.id || 'unnamed'}): ${w}`))
    
    // Check for duplicate project IDs
    if (project.id) {
      if (projectIds.has(project.id)) {
        errors.push(`Duplicate project ID: ${project.id}`)
      }
      projectIds.add(project.id)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate a single project configuration
 */
export function validateProject(
  project: ProjectConfig,
  baseDir: string,
  index: number
): ProjectValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Validate required fields
  if (!project.id) {
    errors.push('Project must have an "id"')
  }

  if (!project.name) {
    errors.push('Project must have a "name"')
  }

  if (!project.schema) {
    errors.push('Project must have a "schema" path')
  } else {
    // Validate schema path
    const schemaPath = typeof project.schema === 'string'
      ? resolve(baseDir, project.schema)
      : resolve(baseDir, project.schema.schemaPath)

    if (!existsSync(schemaPath)) {
      errors.push(`Schema file not found: ${schemaPath}`)
    } else {
      // Validate schema file is readable
      try {
        readFileSync(schemaPath, 'utf-8')
      } catch (error) {
        errors.push(`Cannot read schema file: ${schemaPath}`)
      }
    }
  }

  if (!project.outputDir) {
    errors.push('Project must have an "outputDir"')
  } else {
    // Check if output directory parent exists
    const outputPath = resolve(baseDir, project.outputDir)
    const parentDir = dirname(outputPath)
    
    if (!existsSync(parentDir)) {
      warnings.push(`Output directory parent does not exist: ${parentDir} (will be created)`)
    }
  }

  // Validate UI config path if specified
  if (typeof project.schema !== 'string' && project.schema.uiConfigPath) {
    const uiConfigPath = resolve(baseDir, project.schema.uiConfigPath)
    if (!existsSync(uiConfigPath)) {
      warnings.push(`UI config file not found: ${uiConfigPath} (will use defaults)`)
    }
  } else if (project.schema && typeof project.schema === 'string') {
    // Check for default UI config location
    const schemaPath = resolve(baseDir, project.schema)
    const defaultUiConfigPath = resolve(dirname(schemaPath), 'ui.config.ts')
    if (!existsSync(defaultUiConfigPath)) {
      warnings.push(`UI config not found at default location: ${defaultUiConfigPath} (will use defaults)`)
    }
  }

  return {
    projectId: project.id || `project-${index}`,
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate that models referenced in UI config exist in schema
 */
export function validateModelReferences(
  uiConfig: any,
  schema: ParsedSchema
): BulkValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check crudPages.models
  if (uiConfig.generation?.crudPages?.models) {
    const referencedModels = Array.isArray(uiConfig.generation.crudPages.models)
      ? uiConfig.generation.crudPages.models
      : []

    const schemaModelNames = new Set(schema.models.map(m => m.name))

    for (const modelName of referencedModels) {
      if (modelName !== 'all' && !schemaModelNames.has(modelName)) {
        errors.push(`Model "${modelName}" referenced in crudPages.models does not exist in schema`)
      }
    }
  }

  // Check dashboard widgets
  if (uiConfig.generation?.dashboard?.widgets) {
    const widgets = uiConfig.generation.dashboard.widgets || []
    const schemaModelNames = new Set(schema.models.map(m => m.name))

    for (const widget of widgets) {
      if (widget.model && !schemaModelNames.has(widget.model)) {
        errors.push(`Model "${widget.model}" referenced in dashboard widget does not exist in schema`)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: []
  }
}


/**
 * Public API Implementation
 * 
 * Bridges the clean public API to the internal generator implementation.
 * Handles configuration mapping, progress callbacks, and result transformation.
 */

import fs from 'node:fs'
import { performance } from 'node:perf_hooks'
import { createRequire } from 'node:module'
import type { DMMF } from '@prisma/generator-helper'
import { parseDMMF, validateSchema as validateSchemaDMMF } from '../dmmf-parser.js'
import { createLogger } from '../utils/cli-logger.js'
import { PhaseRunner } from '../generator/phase-runner.js'
import { createAllTypedPhases } from '../generator/phases/index.typed.js'
import { analyzeRelationships } from '../relationship-analyzer.js'
import { analyzeModelUnified } from '../analyzers/unified-analyzer.js'
import type { GeneratorConfig } from '../generator/types.js'
import type { 
  GenerateOptions, 
  GenerateResult, 
  ProgressEvent,
  GeneratorError 
} from './public-api.js'

const require = createRequire(import.meta.url)
const { getDMMF } = require('@prisma/internals')

/**
 * Generate code from schema (public API implementation)
 */
export async function generateFromSchemaAPI(options: GenerateOptions): Promise<GenerateResult> {
  const startTime = performance.now()
  const errors: Error[] = []
  const warnings: string[] = []
  
  try {
    // Determine if schema is a file path or inline text
    const isFilePath = !options.schema.includes('\n') && !options.schema.includes('model ')
    
    // Map public API options to internal GeneratorConfig
    const config: GeneratorConfig = {
      schemaPath: isFilePath ? options.schema : undefined,
      schemaText: isFilePath ? undefined : options.schema,
      output: options.output,
      projectName: options.projectName,
      framework: options.framework || 'express',
      standalone: options.standalone ?? true,
      paths: options.paths,
      verbosity: options.verbosity || 'normal',
      colors: false,  // API mode - no colors
      timestamps: false,  // API mode - no timestamps
      features: options.features
    }
    
    // Set environment variables for internal features
    if (options.format) {
      process.env.SSOT_FORMAT_CODE = 'true'
    }
    if (options.concurrency) {
      process.env.SSOT_WRITE_CONCURRENCY = String(options.concurrency)
    }
    
    // Create logger (progress events handled by phases directly)
    const logger = createLogger({
      level: config.verbosity || 'normal',
      useColors: false,
      showTimestamps: false
    })
    
    // TODO: Wire up onProgress callback to phase events
    // For now, progress tracking will be added in a future iteration
    
    // Create and run phase runner with typed phases
    const runner = new PhaseRunner(config, logger)
    runner.registerPhases(createAllTypedPhases())
    
    const result = await runner.run()
    
    const duration = performance.now() - startTime
    
    // Transform internal result to public API result
    return {
      success: true,
      models: result.models,
      filesCreated: result.files,
      relationships: result.relationships,
      breakdown: result.breakdown,
      outputDir: result.outputDir,
      duration: Math.round(duration),
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    }
    
  } catch (error) {
    const duration = performance.now() - startTime
    
    // Transform error to GeneratorError
    const genError = error instanceof Error 
      ? error 
      : new Error(String(error))
    
    errors.push(genError)
    
    return {
      success: false,
      models: [],
      filesCreated: 0,
      relationships: 0,
      breakdown: [],
      duration: Math.round(duration),
      errors
    }
  }
}

/**
 * Validate schema (public API implementation)
 */
export async function validateSchemaAPI(schemaPathOrText: string): Promise<{
  valid: boolean
  errors: string[]
  warnings: string[]
}> {
  try {
    // Determine if input is a file path or inline text
    const isFilePath = !schemaPathOrText.includes('\n') && !schemaPathOrText.includes('model ')
    
    // Get DMMF
    const dmmf: DMMF.Document = isFilePath
      ? await getDMMF({ datamodelPath: schemaPathOrText })
      : await getDMMF({ datamodel: schemaPathOrText })
    
    // Parse and validate
    const schema = parseDMMF(dmmf)
    const errors = validateSchemaDMMF(schema)
    
    return {
      valid: errors.length === 0,
      errors,
      warnings: []  // Future: add schema warnings
    }
    
  } catch (error) {
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : String(error)],
      warnings: []
    }
  }
}

/**
 * Analyze schema (public API implementation)
 */
export async function analyzeSchemaAPI(schemaPathOrText: string): Promise<{
  models: string[]
  enums: string[]
  relationships: number
  junctionTables: string[]
}> {
  try {
    // Determine if input is a file path or inline text
    const isFilePath = !schemaPathOrText.includes('\n') && !schemaPathOrText.includes('model ')
    
    // Get DMMF
    const dmmf: DMMF.Document = isFilePath
      ? await getDMMF({ datamodelPath: schemaPathOrText })
      : await getDMMF({ datamodel: schemaPathOrText })
    
    // Parse schema
    const schema = parseDMMF(dmmf)
    
    // Analyze relationships
    const relationships = analyzeRelationships(schema)
    
    // Find junction tables
    const junctionTables: string[] = []
    for (const model of schema.models) {
      const analysis = analyzeModelUnified(model, schema)
      if (analysis.isJunctionTable) {
        junctionTables.push(model.name)
      }
    }
    
    return {
      models: schema.models.map(m => m.name),
      enums: schema.enums.map(e => e.name),
      relationships: relationships.length,
      junctionTables
    }
    
  } catch (error) {
    throw new Error(`Failed to analyze schema: ${error instanceof Error ? error.message : String(error)}`)
  }
}


/**
 * SSOT Codegen - Main Generator (v2.0 - Unified Pipeline)
 * 
 * Uses CodeGenerationPipeline (canonical implementation) via adapter.
 * This provides PhaseRunner-compatible interface while using the unified pipeline.
 * 
 * MIGRATION: This file now uses UnifiedPipelineAdapter which wraps CodeGenerationPipeline.
 * Eventually, callers should migrate to use CodeGenerationPipeline directly.
 */

import { createLogger } from './utils/cli-logger.js'
import { createUnifiedPipeline } from '@/pipeline/unified-pipeline-adapter.js'
import type { GeneratorConfig, GeneratorResult } from '@/pipeline/types.js'
import { ConfigValidationError, GeneratorError } from './errors/generator-errors.js'

export * from './project-scaffold.js'
export * from './dependencies/index.js'
export * from '@/pipeline/types.js'
export * from './errors/generator-errors.js'

/**
 * Validate generator configuration
 * 
 * Provides immediate feedback on invalid configuration
 * @throws {ConfigValidationError} if configuration is invalid
 */
function validateConfig(config: GeneratorConfig): void {
  // Must provide either schemaPath or schemaText
  if (!config.schemaPath && !config.schemaText) {
    throw new ConfigValidationError(
      'Must provide either schemaPath or schemaText',
      ['schemaPath', 'schemaText']
    )
  }
  
  // Cannot provide both schemaPath and schemaText
  if (config.schemaPath && config.schemaText) {
    throw new ConfigValidationError(
      'Cannot provide both schemaPath and schemaText - choose one',
      ['schemaPath', 'schemaText']
    )
  }
  
  // Validate framework if provided
  if (config.framework && !['express', 'fastify'].includes(config.framework)) {
    throw new ConfigValidationError(
      `Invalid framework: ${config.framework}. Must be 'express' or 'fastify'`,
      ['framework']
    )
  }
}

/**
 * Main generator function using Unified Pipeline (v2.0)
 * 
 * Now uses CodeGenerationPipeline (canonical implementation) via adapter.
 * This maintains backward compatibility while consolidating pipeline logic.
 * 
 * @throws {ConfigValidationError} if configuration is invalid
 * @throws {GeneratorError} if generation fails with phase information
 */
export async function generateFromSchema(config: GeneratorConfig): Promise<GeneratorResult> {
  // Early validation for immediate feedback
  validateConfig(config)
  
  // Create logger
  const isCI = !!process.env.CI
  const logger = createLogger({
    level: config.verbosity || (isCI ? 'minimal' : 'normal'),
    useColors: config.colors ?? (!isCI && !!process.stdout.isTTY),
    showTimestamps: config.timestamps ?? false
  })
  
  try {
    // Create unified pipeline (wraps CodeGenerationPipeline)
    const pipeline = createUnifiedPipeline(config, logger)
    
    // Execute pipeline (returns PhaseRunner-compatible result)
    const result = await pipeline.run()
    
    return result
  } catch (error) {
    // Wrap unknown errors in GeneratorError for consistent handling
    if (error instanceof GeneratorError) {
      throw error
    }
    
    // Add context to unexpected errors
    const err = error as Error
    throw new GeneratorError(
      `Generation failed: ${err.message}`,
      undefined,
      { originalError: err }
    )
  }
}

// Backwards compatibility exports
export interface GeneratorInput {
  dmmf: unknown
  config: GeneratorConfig & {
    projectName?: string
    description?: string
    framework?: 'express' | 'fastify'
    scaffold?: boolean
  }
}


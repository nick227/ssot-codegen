/**
 * SSOT Codegen - Main Generator (Refactored with PhaseRunner)
 * 
 * Uses discrete phase classes for better maintainability and testability
 */

import { createLogger } from './utils/cli-logger.js'
import { PhaseRunner } from '@/pipeline/phase-runner.js'
import { createAllPhases } from '@/pipeline/phases/index.js'
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
 * Main generator function using PhaseRunner
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
    // Create and configure phase runner
    const runner = new PhaseRunner(config, logger)
    
    // Register all standard phases
    const phases = createAllPhases()
    runner.registerPhases(phases)
    
    // Execute all phases
    const result = await runner.run()
    
    // Log next steps for standalone projects
    if (config.standalone ?? true) {
      const context = runner.getContext()
      console.log(`\n✅ Standalone project created at: ${context.outputDir}`)
      console.log(`\nNext steps:`)
      console.log(`  cd ${context.outputDir}`)
      console.log(`  pnpm install`)
      console.log(`  pnpm dev`)
    }
    
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


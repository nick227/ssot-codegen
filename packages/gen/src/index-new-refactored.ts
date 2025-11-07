/**
 * SSOT Codegen - Main Generator (Refactored with PhaseRunner)
 * 
 * Uses discrete phase classes for better maintainability and testability
 */

import { createLogger } from './utils/cli-logger.js'
import { PhaseRunner } from './generator/phase-runner.js'
import { createAllPhases } from './generator/phases/index.js'
import type { GeneratorConfig, GeneratorResult } from './generator/types.js'

export * from './project-scaffold.js'
export * from './dependencies/index.js'
export * from './generator/types.js'

/**
 * Main generator function using PhaseRunner
 */
export async function generateFromSchema(config: GeneratorConfig): Promise<GeneratorResult> {
  // Create logger
  const isCI = !!process.env.CI
  const logger = createLogger({
    level: config.verbosity || (isCI ? 'minimal' : 'normal'),
    useColors: config.colors ?? (!isCI && !!process.stdout.isTTY),
    showTimestamps: config.timestamps ?? false
  })
  
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

export const runGenerator = generateFromSchema


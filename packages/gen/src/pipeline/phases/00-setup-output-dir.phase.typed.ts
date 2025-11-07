/**
 * Phase 0: Setup Output Directory (Strongly-Typed)
 * 
 * Example of migrated phase using strongly-typed context.
 * This phase requires only BaseContext and provides SetupOutputDirOutput.
 * 
 * MIGRATION STATUS: ✅ Migrated to typed context
 * 
 * @example
 * ```ts
 * // Type safety in action:
 * const phase = new SetupOutputDirPhaseTyped()
 * 
 * // TypeScript error: BaseContext doesn't have 'schema'
 * // phase.executeTyped({ config, logger, schema: ... })
 * 
 * // TypeScript success: BaseContext only needs config + logger
 * await phase.executeTyped({ config, logger })
 * // Returns: { outputDir: string }
 * ```
 */

import path from 'node:path'
import { findWorkspaceRoot, getNextProjectFolder, deriveProjectName } from '@/utils/gen-folder.js'
import { TypedPhaseAdapter } from '../typed-phase-adapter.js'
import type { BaseContext, SetupOutputDirOutput } from '../typed-context.js'

export class SetupOutputDirPhaseTyped extends TypedPhaseAdapter<
  BaseContext,  // Requires: just config + logger
  SetupOutputDirOutput  // Provides: outputDir
> {
  readonly name = 'setupOutputDir'
  readonly order = 0
  
  getDescription(): string {
    return 'Setting up output directory'
  }
  
  /**
   * Strongly-typed execution
   * 
   * TypeScript guarantees:
   * - context.config exists
   * - context.logger exists
   * - Must return { outputDir: string }
   */
  async executeTyped(context: BaseContext): Promise<SetupOutputDirOutput> {
    const { config, logger } = context
    const standalone = config.standalone ?? true
    
    let outputDir: string
    
    if (standalone) {
      // Generate to root-level generated/ folder
      const workspaceRoot = findWorkspaceRoot(process.cwd())
      const generatedDir = path.join(workspaceRoot, 'generated')
      
      // Derive project name from schema path or config
      const projectBaseName = config.projectName || deriveProjectName(config.schemaPath)
      
      // Find next incremental number for this project
      const projectFolderName = getNextProjectFolder(generatedDir, projectBaseName)
      outputDir = path.join(generatedDir, projectFolderName)
      
      logger.logProgress(`📁 Generating standalone project: ${projectFolderName}`)
      logger.logProgress(`📂 Output: generated/${projectFolderName}`)
    } else {
      // Use specified output or default
      outputDir = config.output ? path.resolve(config.output) : path.join(process.cwd(), 'gen')
      logger.logProgress(`📁 Generating to: ${outputDir}`)
    }
    
    // Return strongly-typed output
    // TypeScript enforces we return the exact shape
    return { outputDir }
  }
}


/**
 * Phase 0: Setup Output Directory
 * 
 * Determines and creates the output directory
 */

import path from 'node:path'
import fs from 'node:fs/promises'
import { findWorkspaceRoot, getNextProjectFolder, deriveProjectName } from '@/utils/gen-folder.js'
import { GenerationPhase, type PhaseContext, type PhaseResult } from '../phase-runner.js'

export class SetupOutputDirPhase extends GenerationPhase {
  readonly name = 'setupOutputDir'
  readonly order = 0
  
  getDescription(): string {
    return 'Setting up output directory'
  }
  
  async execute(context: PhaseContext): Promise<PhaseResult> {
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
    
    // Create output directory to prevent race conditions in later phases
    await fs.mkdir(outputDir, { recursive: true })
    
    context.outputDir = outputDir
    
    return {
      success: true,
      data: outputDir
    }
  }
}


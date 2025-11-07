/**
 * Phase 7: Generate Barrels
 * 
 * Generates barrel export files for all layers
 */

import { GenerationPhase, type PhaseContext, type PhaseResult } from '../phase-runner.js'
import { writeFile, trackPath, generateEsmPath } from '../phase-utilities.js'
import { determineBarrelWrites } from '../../utils/barrel-orchestrator.js'

export class GenerateBarrelsPhase extends GenerationPhase {
  readonly name = 'generateBarrels'
  readonly order = 7
  
  getDescription(): string {
    return 'Generating barrel exports'
  }
  
  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { generatedFiles, pathsConfig: cfg, modelNames } = context
    
    if (!generatedFiles || !cfg || !modelNames) {
      throw new Error('Required context data not found')
    }
    
    // Determine all barrel writes using centralized orchestrator
    const barrelWrites = determineBarrelWrites(
      cfg,
      modelNames,
      generatedFiles,
      (layer, model) => generateEsmPath(cfg, layer, model)
    )
    
    // Execute all writes in parallel and track paths
    const writes = barrelWrites.map(barrel => {
      trackPath(barrel.trackId, barrel.path, barrel.esmPath)
      return writeFile(barrel.path, barrel.content)
    })
    
    await Promise.all(writes)
    
    return {
      success: true,
      filesGenerated: writes.length
    }
  }
}


/**
 * Phase 9: Write Manifest
 * 
 * Writes generation manifest with metadata
 */

import path from 'node:path'
import crypto from 'node:crypto'
import { GenerationPhase, type PhaseContext, type PhaseResult } from '../phase-runner.js'
import { writeFile, getTrackedPaths } from '../phase-utilities.js'
import { getGeneratorVersion } from '@/utils/version.js'
import { stringifyWithCache } from '../json-cache.js'

const hash = (text: string) => crypto.createHash('sha256').update(text).digest('hex')

export class WriteManifestPhase extends GenerationPhase {
  readonly name = 'writeManifest'
  readonly order = 9
  
  getDescription(): string {
    return 'Writing manifest'
  }
  
  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { schemaContent, pathsConfig: cfg, modelNames, config, totalFiles, breakdown, phaseMetrics } = context
    
    if (!schemaContent || !cfg || !modelNames) {
      throw new Error('Required context data not found')
    }
    
    const schemaHash = hash(config.schemaText || schemaContent || '')
    const version = await getGeneratorVersion()
    const pathMap = getTrackedPaths()
    
    // Build outputs array from pathMap
    const outputs = Object.entries(pathMap).map(([id, paths]) => ({
      id,
      fsPath: paths.fs,
      esmPath: paths.esm
    }))
    
    const manifest = {
      schemaHash,
      models: modelNames,
      version,
      generatedAt: new Date().toISOString(),
      totalFiles: totalFiles || 0,
      breakdown: breakdown || [],
      pathMap,
      outputs,
      // Performance metrics (timing per phase)
      performance: phaseMetrics || []
    }
    
    const manifestPath = path.join(cfg.rootDir, 'manifests', 'generation.json')
    // OPTIMIZATION: Use cached stringification
    // If manifest is logged/reused elsewhere, subsequent stringify is instant
    await writeFile(manifestPath, stringifyWithCache(manifest, { indent: 2 }))
    
    return {
      success: true,
      filesGenerated: 1
    }
  }
}


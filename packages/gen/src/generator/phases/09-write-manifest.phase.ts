/**
 * Phase 9: Write Manifest
 * 
 * Writes generation manifest with metadata
 */

import path from 'node:path'
import { readFile } from 'node:fs/promises'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { GenerationPhase, type PhaseContext, type PhaseResult } from '../phase-runner.js'
import { writeFile, getTrackedPaths } from '../phase-utilities.js'

const hash = (text: string) => crypto.createHash('sha256').update(text).digest('hex')

/**
 * Read generator version from package.json
 */
async function getGeneratorVersion(): Promise<string> {
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const packagePath = path.join(__dirname, '../../package.json')
    const packageJson = JSON.parse(await readFile(packagePath, 'utf8'))
    return packageJson.version || '0.4.0'
  } catch {
    return '0.4.0' // Fallback version
  }
}

export class WriteManifestPhase extends GenerationPhase {
  readonly name = 'writeManifest'
  readonly order = 9
  
  getDescription(): string {
    return 'Writing manifest'
  }
  
  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { schemaContent, pathsConfig: cfg, modelNames, config, totalFiles, breakdown } = context
    
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
      outputs
    }
    
    const manifestPath = path.join(cfg.rootDir, 'manifests', 'generation.json')
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2))
    
    return {
      success: true,
      filesGenerated: 1
    }
  }
}


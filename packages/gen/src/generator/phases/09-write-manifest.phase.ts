/**
 * Phase 9: Write Manifest
 * 
 * Writes generation manifest with metadata
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { GenerationPhase, type PhaseContext, type PhaseResult } from '../phase-runner.js'

const ensureDir = async (p: string) => fs.promises.mkdir(p, { recursive: true })
const write = async (file: string, content: string) => { 
  await ensureDir(path.dirname(file))
  await fs.promises.writeFile(file, content, 'utf8')
}

const hash = (text: string) => crypto.createHash('sha256').update(text).digest('hex')

export class WriteManifestPhase extends GenerationPhase {
  readonly name = 'writeManifest'
  readonly order = 9
  
  getDescription(): string {
    return 'Writing manifest'
  }
  
  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { schemaContent, pathsConfig: cfg, modelNames, config } = context as any
    
    if (!schemaContent || !cfg || !modelNames) {
      throw new Error('Required context data not found')
    }
    
    const schemaHash = hash(config.schemaText || schemaContent || '')
    
    const manifest = {
      schemaHash,
      models: modelNames,
      version: '0.5.0',
      generatedAt: new Date().toISOString()
    }
    
    const manifestPath = path.join(cfg.rootDir, 'manifests', 'generation.json')
    await write(manifestPath, JSON.stringify(manifest, null, 2))
    
    return {
      success: true,
      filesGenerated: 1
    }
  }
}


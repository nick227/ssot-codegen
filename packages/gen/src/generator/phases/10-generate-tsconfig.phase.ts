/**
 * Phase 10: Generate TypeScript Config
 * 
 * Generates TypeScript path mappings
 */

import fs from 'node:fs'
import path from 'node:path'
import { GenerationPhase, type PhaseContext, type PhaseResult } from '../phase-runner.js'

const ensureDir = async (p: string) => fs.promises.mkdir(p, { recursive: true })
const write = async (file: string, content: string) => { 
  await ensureDir(path.dirname(file))
  await fs.promises.writeFile(file, content, 'utf8')
}

export class GenerateTsConfigPhase extends GenerationPhase {
  readonly name = 'generateTsConfig'
  readonly order = 10
  
  getDescription(): string {
    return 'Generating TypeScript config'
  }
  
  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { pathsConfig: cfg } = context as any
    
    if (!cfg) {
      throw new Error('Paths config not found in context')
    }
    
    const tsconfigPathsContent = {
      compilerOptions: {
        baseUrl: '.',
        paths: {
          [`${cfg.alias}/*`]: [`${cfg.rootDir}/*`]
        }
      }
    }
    
    const tsconfigPath = path.join(path.resolve('.'), 'tsconfig.paths.json')
    await write(tsconfigPath, JSON.stringify(tsconfigPathsContent, null, 2))
    
    return {
      success: true,
      filesGenerated: 1
    }
  }
}


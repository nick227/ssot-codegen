/**
 * Phase 12: Write Tests
 * 
 * Writes self-validation test suite
 * Only runs in standalone mode
 */

import fs from 'node:fs'
import path from 'node:path'
import { GenerationPhase, type PhaseContext, type PhaseResult } from '../phase-runner.js'
import { 
  generateSelfValidationTests, 
  generateVitestConfig, 
  generateTestSetup 
} from '../../generators/test-generator.js'

const ensureDir = async (p: string) => fs.promises.mkdir(p, { recursive: true })
const write = async (file: string, content: string) => { 
  await ensureDir(path.dirname(file))
  await fs.promises.writeFile(file, content, 'utf8')
}

export class WriteTestsPhase extends GenerationPhase {
  readonly name = 'writeTests'
  readonly order = 12
  
  shouldRun(context: PhaseContext): boolean {
    return context.config.standalone ?? true
  }
  
  getDescription(): string {
    return 'Generating self-validation tests'
  }
  
  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { schema, outputDir, config } = context as any
    
    if (!schema || !outputDir) {
      throw new Error('Required context data not found')
    }
    
    const framework = config.framework || 'express'
    const writes: Promise<void>[] = []
    
    // Generate self-validation test
    const testContent = generateSelfValidationTests({ models: schema.models, framework })
    const testPath = path.join(outputDir, 'tests', 'self-validation.test.ts')
    writes.push(write(testPath, testContent))
    
    // Generate vitest config
    const vitestConfigContent = generateVitestConfig()
    const vitestConfigPath = path.join(outputDir, 'vitest.config.ts')
    writes.push(write(vitestConfigPath, vitestConfigContent))
    
    // Generate test setup
    const setupContent = generateTestSetup()
    const setupPath = path.join(outputDir, 'tests', 'setup.ts')
    writes.push(write(setupPath, setupContent))
    
    await Promise.all(writes)
    
    return {
      success: true,
      filesGenerated: 3
    }
  }
}


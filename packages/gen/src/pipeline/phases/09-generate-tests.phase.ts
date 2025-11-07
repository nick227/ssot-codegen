/**
 * Phase 9: Generate Tests
 * 
 * Generates Vitest test scaffolding with Supertest integration tests
 */

import path from 'node:path'
import { GenerationPhase, type PhaseContext, type PhaseResult } from '../phase-runner.js'
import { writeFile } from '../phase-utilities.js'
import { 
  generateVitestConfig, 
  generateTestSetup, 
  generateModelTests,
  generateTestReadme
} from '@/templates/test.template.js'

export class GenerateTestsPhase extends GenerationPhase {
  readonly name = 'generateTests'
  readonly order = 9
  
  getDescription(): string {
    return 'Generating test scaffolding'
  }
  
  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { parsedModels, pathsConfig: cfg, generatorConfig } = context
    
    if (!parsedModels || !cfg) {
      throw new Error('Parsed models or paths config not found in context')
    }
    
    // Skip test generation if explicitly disabled (check if property exists)
    const skipTests = generatorConfig && 'skipTests' in generatorConfig 
      ? (generatorConfig as any).skipTests 
      : false
    
    if (skipTests === true) {
      return {
        success: true,
        filesGenerated: 0
      }
    }
    
    let filesGenerated = 0
    const testsDir = path.join(cfg.rootDir, '..', 'tests')
    
    // Generate vitest.config.ts
    const vitestConfigPath = path.join(cfg.rootDir, '..', 'vitest.config.ts')
    await writeFile(vitestConfigPath, generateVitestConfig())
    filesGenerated++
    
    // Generate test setup
    const setupPath = path.join(testsDir, 'setup.ts')
    await writeFile(setupPath, generateTestSetup())
    filesGenerated++
    
    // Generate tests for each model
    for (const model of parsedModels) {
      const testContent = generateModelTests(model)
      const testPath = path.join(testsDir, `${model.nameLower}.test.ts`)
      await writeFile(testPath, testContent)
      filesGenerated++
    }
    
    // Generate test README
    const readmePath = path.join(testsDir, 'README.md')
    await writeFile(readmePath, generateTestReadme())
    filesGenerated++
    
    return {
      success: true,
      filesGenerated
    }
  }
}


/**
 * Example: Custom Phase Plugin using replacePhase
 * 
 * Shows how to completely replace a phase with custom implementation
 */

import { replacePhase, wrapPhase } from '../phase-hooks.js'
import type { ContextAfterPhase3, GenerateCodeOutput } from '@/pipeline/typed-context.js'
import type { PhaseResult } from '@/pipeline/phase-runner.js'

/**
 * Replace code generation phase with custom implementation
 */
export function registerCustomCodeGeneration() {
  replacePhase<ContextAfterPhase3, GenerateCodeOutput>(
    'generateCode',
    async (context) => {
      const { schema, logger } = context
      
      logger.debug('Using custom code generation...')
      
      // Custom code generation logic here
      const customFiles = generateCustomCode(schema)
      
      return {
        success: true,
        data: {
          pathsConfig: context.config.paths as any,
          generatedFiles: customFiles,
          totalFiles: 42,
          breakdown: [{ layer: 'custom', count: 42 }]
        },
        filesGenerated: 42
      }
    }
  )
}

/**
 * Wrap a phase with custom before/after logic
 */
export function registerPerformanceMonitoring() {
  const startTimes = new Map<string, number>()
  
  // Wrap multiple phases
  const phases = [
    'parseSchema',
    'validateSchema',
    'analyzeRelationships',
    'generateCode',
    'writeFiles'
  ]
  
  for (const phaseName of phases) {
    wrapPhase(phaseName, {
      before: async (context) => {
        startTimes.set(phaseName, performance.now())
        console.log(`⏱️  Starting ${phaseName}...`)
      },
      after: async (context, result) => {
        const duration = performance.now() - (startTimes.get(phaseName) || 0)
        console.log(`✅ ${phaseName} completed in ${Math.round(duration)}ms`)
        
        if (result.filesGenerated) {
          console.log(`   Generated ${result.filesGenerated} files`)
        }
      }
    })
  }
}

// Dummy implementation
function generateCustomCode(schema: any): any {
  return {
    contracts: new Map(),
    validators: new Map(),
    services: new Map(),
    controllers: new Map(),
    routes: new Map(),
    sdk: new Map(),
    hooks: { core: new Map() }
  }
}


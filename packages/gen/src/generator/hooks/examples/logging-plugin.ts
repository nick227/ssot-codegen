/**
 * Example: Logging Plugin using Phase Hooks
 * 
 * Demonstrates how to add comprehensive logging to generation phases
 */

import { beforePhase, afterPhase, onError } from '../phase-hooks.js'
import type { 
  ContextAfterPhase1,
  ContextAfterPhase4 
} from '../../typed-context.js'

/**
 * Register logging hooks for all phases
 */
export function registerLoggingHooks() {
  // Log before parsing
  beforePhase('parseSchema', async (context) => {
    console.log(`\n📖 Parsing schema from: ${context.config.schemaPath || 'inline'}`)
  })
  
  // Log after parsing
  afterPhase('parseSchema', async (context: ContextAfterPhase1, result) => {
    console.log(`✅ Parsed ${context.modelNames.length} models`)
    console.log(`   Models: ${context.modelNames.join(', ')}`)
  })
  
  // Log before code generation
  beforePhase('generateCode', async (context: ContextAfterPhase1) => {
    console.log(`\n🏗️  Generating code for ${context.modelNames.length} models...`)
  })
  
  // Log after code generation
  afterPhase('generateCode', async (context: ContextAfterPhase4, result) => {
    console.log(`✅ Generated ${result.filesGenerated} files`)
    context.breakdown.forEach(({ layer, count }) => {
      console.log(`   ${layer}: ${count} files`)
    })
  })
  
  // Global error handler
  onError(async (phaseName, error, context) => {
    console.error(`\n❌ ERROR in ${phaseName}:`, error.message)
    if (error.stack) {
      console.error(error.stack)
    }
  })
}


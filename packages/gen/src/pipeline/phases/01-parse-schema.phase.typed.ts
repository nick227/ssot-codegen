/**
 * Phase 1: Parse Schema (Strongly-Typed)
 * 
 * Example of phase that requires Phase 0's output.
 * Demonstrates compile-time dependency enforcement.
 * 
 * MIGRATION STATUS: ✅ Migrated to typed context
 * 
 * @example
 * ```ts
 * const phase = new ParseSchemaPhaseTyped()
 * 
 * // TypeScript error: BaseContext missing 'outputDir'
 * // await phase.executeTyped({ config, logger })
 * 
 * // TypeScript success: ContextAfterPhase0 has outputDir
 * await phase.executeTyped({ config, logger, outputDir: '/path' })
 * // Returns: { schema, schemaContent, modelNames }
 * ```
 */

import fs from 'node:fs'
import type { DMMF } from '@prisma/generator-helper'
import { parseDMMF } from '../../dmmf-parser.js'
import { TypedPhaseAdapter, validateContext } from '../typed-phase-adapter.js'
import type { 
  ContextAfterPhase0, 
  ParseSchemaOutput 
} from '../typed-context.js'

// Dynamic import for @prisma/internals
async function getPrismaDMMF() {
  const prismaInternals = await import('@prisma/internals')
  // Handle both default and named exports
  return prismaInternals.getDMMF || prismaInternals.default?.getDMMF
}

export class ParseSchemaPhaseTyped extends TypedPhaseAdapter<
  ContextAfterPhase0,  // Requires: config, logger, outputDir
  ParseSchemaOutput  // Provides: schema, schemaContent, modelNames
> {
  readonly name = 'parseSchema'
  readonly order = 1
  
  getDescription(): string {
    return 'Parsing schema'
  }
  
  /**
   * Strongly-typed execution
   * 
   * TypeScript guarantees:
   * - context.config exists (from BaseContext)
   * - context.logger exists (from BaseContext)
   * - context.outputDir exists (from Phase 0)
   * - Must return { schema, schemaContent, modelNames }
   * 
   * NO RUNTIME CHECKS NEEDED! TypeScript enforces at compile time.
   */
  async executeTyped(context: ContextAfterPhase0): Promise<ParseSchemaOutput> {
    const getDMMF = await getPrismaDMMF()
    const { config, logger } = context
    
    // Optional: Runtime validation during migration
    // Can be removed once all phases are migrated
    validateContext(context, ['config', 'logger', 'outputDir'])
    
    let dmmf: DMMF.Document
    let schemaContent = ''
    
    if (config.schemaPath) {
      logger.debug('Reading schema from file', { path: config.schemaPath })
      dmmf = await getDMMF({ datamodelPath: config.schemaPath })
      schemaContent = await fs.promises.readFile(config.schemaPath, 'utf8')
    } else if (config.schemaText) {
      logger.debug('Parsing inline schema')
      dmmf = await getDMMF({ datamodel: config.schemaText })
      schemaContent = config.schemaText
    } else {
      throw new Error('Either schemaPath or schemaText is required')
    }
    
    const schema = parseDMMF(dmmf)
    const modelNames = schema.models.map(m => m.name)
    
    // Return strongly-typed output
    // TypeScript enforces exact shape
    return {
      schema,
      schemaContent,
      modelNames
    }
  }
}


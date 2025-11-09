/**
 * Phase 1: Parse Schema
 * 
 * Reads and parses the Prisma schema into DMMF format
 */

import fs from 'node:fs'
import type { DMMF } from '@prisma/generator-helper'
import { parseDMMF } from '../../dmmf-parser.js'
import { GenerationPhase, type PhaseContext, type PhaseResult } from '../phase-runner.js'

// Dynamic import for @prisma/internals
async function getPrismaDMMF() {
  const prismaInternals = await import('@prisma/internals')
  // Handle both default and named exports
  return prismaInternals.getDMMF || prismaInternals.default?.getDMMF
}

export class ParseSchemaPhase extends GenerationPhase {
  readonly name = 'parseSchema'
  readonly order = 1
  
  getDescription(): string {
    return 'Parsing schema'
  }
  
  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { config, logger } = context
    
    const getDMMF = await getPrismaDMMF()
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
    
    const parsedSchema = parseDMMF(dmmf)
    
    // Store in context
    context.schema = parsedSchema
    context.schemaContent = schemaContent
    
    return {
      success: true,
      data: { schema: parsedSchema, schemaContent }
    }
  }
}


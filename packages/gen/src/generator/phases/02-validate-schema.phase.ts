/**
 * Phase 2: Validate Schema
 * 
 * Validates the parsed schema for errors
 */

import { validateSchema } from '../../dmmf-parser.js'
import { GenerationPhase, type PhaseContext, type PhaseResult } from '../phase-runner.js'

export class ValidateSchemaPhase extends GenerationPhase {
  readonly name = 'validateSchema'
  readonly order = 2
  
  getDescription(): string {
    return 'Validating schema'
  }
  
  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { schema, logger } = context
    
    if (!schema) {
      throw new Error('Schema not found in context. ParseSchemaPhase must run first.')
    }
    
    const errors = validateSchema(schema)
    
    if (errors.length > 0) {
      errors.forEach(err => logger.error(err))
      throw new Error('Schema validation failed')
    }
    
    return {
      success: true
    }
  }
}


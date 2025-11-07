/**
 * Phase 2: Validate Schema (Strongly-Typed)
 * 
 * Validates the parsed schema for errors.
 * 
 * MIGRATION STATUS: ✅ Migrated to typed context
 */

import { validateSchema } from '../../dmmf-parser.js'
import { TypedPhaseAdapter } from '../typed-phase-adapter.js'
import type { 
  ContextAfterPhase1, 
  ValidateSchemaOutput 
} from '../typed-context.js'

export class ValidateSchemaPhaseTyped extends TypedPhaseAdapter<
  ContextAfterPhase1,      // Requires: config, logger, outputDir, schema, schemaContent, modelNames
  ValidateSchemaOutput     // Provides: (nothing - just validates)
> {
  readonly name = 'validateSchema'
  readonly order = 2
  
  getDescription(): string {
    return 'Validating schema'
  }
  
  /**
   * Strongly-typed execution
   * 
   * TypeScript guarantees:
   * - context.schema exists (from Phase 1)
   * - context.logger exists (from BaseContext)
   * 
   * NO RUNTIME CHECKS NEEDED!
   */
  async executeTyped(context: ContextAfterPhase1): Promise<ValidateSchemaOutput> {
    const { schema, logger } = context
    
    // TypeScript guarantees schema exists - no runtime check needed!
    const errors = validateSchema(schema)
    
    if (errors.length > 0) {
      errors.forEach(err => logger.error(err))
      throw new Error('Schema validation failed')
    }
    
    // Return empty object (phase doesn't add data to context)
    return {}
  }
}


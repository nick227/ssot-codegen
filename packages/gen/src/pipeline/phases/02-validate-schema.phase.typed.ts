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
    const { schema, schemaContent, logger } = context
    
    // TypeScript guarantees schema exists - no runtime check needed!
    // Use validateSchemaDetailed to get structured results (errors vs warnings/infos)
    const { validateSchemaDetailed } = await import('../../dmmf-parser.js')
    const result = validateSchemaDetailed(schema, false) // Don't throw, we'll handle it
    
    // Add MySQL-specific validation (key length limits)
    const { validateMySQLKeyLength } = await import('../../dmmf-parser/validation/mysql-key-length.js')
    const mysqlValidation = validateMySQLKeyLength(schema, schemaContent)
    result.errors.push(...mysqlValidation.errors)
    result.warnings.push(...mysqlValidation.warnings)
    
    // Log all messages with appropriate levels
    result.errors.forEach(err => logger.error(err))
    result.warnings.forEach(warn => logger.warn(warn))
    result.infos.forEach(info => logger.warn(`INFO: ${info}`)) // Use warn for info messages
    
    // Only throw on actual errors, not warnings or infos
    if (result.errors.length > 0) {
      throw new Error(`Schema validation failed:\n${result.errors.join('\n')}`)
    }
    
    // Return empty object (phase doesn't add data to context)
    return {}
  }
}


/**
 * Phase 3: Analyze Relationships (Strongly-Typed)
 * 
 * Analyzes model relationships (one-to-one, one-to-many, many-to-many).
 * 
 * MIGRATION STATUS: ✅ Migrated to typed context
 */

import { analyzeRelationshipsForSchema } from '@/utils/relationship-analyzer.js'
import { TypedPhaseAdapter } from '../typed-phase-adapter.js'
import type { 
  ContextAfterPhase2, 
  AnalyzeRelationshipsOutput 
} from '../typed-context.js'

export class AnalyzeRelationshipsPhaseTyped extends TypedPhaseAdapter<
  ContextAfterPhase2,            // Requires: Phase 0-2 outputs
  AnalyzeRelationshipsOutput     // Provides: relationshipCount
> {
  readonly name = 'analyzeRelationships'
  readonly order = 3
  
  getDescription(): string {
    return 'Analyzing relationships'
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
  async executeTyped(context: ContextAfterPhase2): Promise<AnalyzeRelationshipsOutput> {
    const { schema, logger } = context
    
    // TypeScript guarantees schema exists - no runtime check needed!
    const relationships = analyzeRelationshipsForSchema(schema)
    
    logger.logSchemaParsed(
      schema.models.length,
      schema.enums.length,
      relationships.length
    )
    
    // Return strongly-typed output
    return {
      relationshipCount: relationships.length
    }
  }
}


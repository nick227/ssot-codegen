/**
 * Phase 3: Analyze Relationships
 * 
 * Analyzes model relationships (one-to-one, one-to-many, many-to-many)
 */

import { analyzeRelationships } from '../../relationship-analyzer.js'
import { GenerationPhase, type PhaseContext, type PhaseResult } from '../phase-runner.js'

export class AnalyzeRelationshipsPhase extends GenerationPhase {
  readonly name = 'analyzeRelationships'
  readonly order = 3
  
  getDescription(): string {
    return 'Analyzing relationships'
  }
  
  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { schema, logger } = context
    
    if (!schema) {
      throw new Error('Schema not found in context')
    }
    
    const relationships = analyzeRelationships(schema)
    
    logger.logSchemaParsed(
      schema.models.length,
      schema.enums.length,
      relationships.length
    )
    
    context.relationshipCount = relationships.length
    
    return {
      success: true,
      data: relationships
    }
  }
}


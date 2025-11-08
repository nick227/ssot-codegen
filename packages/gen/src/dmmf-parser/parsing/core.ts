/**
 * Core DMMF parsing orchestrator
 * 
 * Main entry point for parsing Prisma DMMF into normalized format.
 * 
 * Pipeline stages:
 * 1. Validate DMMF structure
 * 2. Parse enums (independent)
 * 3. Parse models (depends on enumMap)
 * 4. Build reverse relations (depends on parsed models)
 * 5. Enhance models (depends on models, modelMap, reverseRelationMap)
 * 6. Validate schema (if throwOnError)
 */

import type { DMMF } from '@prisma/generator-helper'
import type { ParseOptions, ParsedSchema, ParsedModel, ParsedEnum } from '../types.js'
import { createDefaultLogger } from '../utils/logger.js'
import { conditionalFreeze } from '../utils/freezing.js'
import { parseEnums } from './enum-parser.js'
import { parseModels } from './model-parser.js'
import { buildReverseRelationMap } from './reverse-relations.js'
import { enhanceModel } from '../enhancement/model-enhancer.js'
import { validateSchemaDetailed } from '../validation/schema-validator.js'

/**
 * Parse DMMF into our format
 * 
 * IMPORTANT: Parse order dependency
 * 1. Parse enums (independent)
 * 2. Parse models (depends on enumMap)
 * 3. Build reverse relation map (depends on parsed models)
 * 4. Enhance models (depends on models, modelMap, reverseRelationMap)
 * 5. Validate schema (if throwOnError is true)
 * 
 * This order ensures all dependencies are satisfied before enhancement.
 */
export function parseDMMF(dmmf: DMMF.Document, options: ParseOptions = {}): ParsedSchema {
  const logger = options.logger || createDefaultLogger()
  const shouldFreeze = options.freeze !== false  // Default to true
  
  // Guard against malformed DMMF
  validateDMMFStructure(dmmf)
  
  // Parse enums first (independent)
  const enums = parseEnums(dmmf.datamodel.enums, logger, shouldFreeze)
  const enumMap = new Map(enums.map(e => [e.name, e]))
  
  // Parse models (depends on enumMap)
  const models = parseModels(dmmf.datamodel.models, enumMap, logger, shouldFreeze)
  const modelMap = new Map(models.map(m => [m.name, m]))
  
  // Build reverse relation map AFTER models are fully parsed
  const reverseRelationMap = buildReverseRelationMap(models, shouldFreeze)
  
  // Enhance models with derived properties (must be last)
  for (const model of models) {
    enhanceModel(model, modelMap, reverseRelationMap, shouldFreeze)
  }
  
  const schema: ParsedSchema = {
    models: conditionalFreeze(models, shouldFreeze) as readonly ParsedModel[],
    enums: conditionalFreeze(enums, shouldFreeze) as readonly ParsedEnum[],
    modelMap,
    enumMap,
    reverseRelationMap
  }
  
  // Run validation if throwOnError is enabled
  if (options.throwOnError) {
    validateSchemaDetailed(schema, true)
  }
  
  return schema
}

/**
 * Validate DMMF structure
 * Guards against malformed DMMF documents
 */
function validateDMMFStructure(dmmf: DMMF.Document): void {
  if (!dmmf || typeof dmmf !== 'object') {
    throw new Error('Invalid DMMF document: expected object')
  }
  if (!dmmf.datamodel || typeof dmmf.datamodel !== 'object') {
    throw new Error('Invalid DMMF document: missing datamodel')
  }
  if (!Array.isArray(dmmf.datamodel.enums)) {
    throw new Error('Invalid DMMF document: datamodel.enums must be an array')
  }
  if (!Array.isArray(dmmf.datamodel.models)) {
    throw new Error('Invalid DMMF document: datamodel.models must be an array')
  }
}


/**
 * Model parsing logic
 * 
 * Parses DMMF models into normalized ParsedModel format.
 */

import type { DMMF } from '@prisma/generator-helper'
import type { DMMFParserLogger, ParsedModel, ParsedEnum } from '../types.js'
import { isValidDMMFModel } from '../type-guards.js'
import { safeStringify } from '../utils/string-utils.js'
import { sanitizeDocumentation } from '../security/sanitization.js'
import { conditionalFreeze } from '../utils/freezing.js'
import { parseFields } from './field-parser.js'

/**
 * Parse models with type guards
 */
export function parseModels(
  models: readonly DMMF.Model[], 
  enumMap: Map<string, ParsedEnum>, 
  logger: DMMFParserLogger, 
  shouldFreeze: boolean
): ParsedModel[] {
  return models
    .filter(m => {
      if (!isValidDMMFModel(m)) {
        logger.warn(`Skipping invalid DMMF model: ${safeStringify(m)}`)
        return false
      }
      return true
    })
    .map(model => {
      const fields = parseFields(model.fields, enumMap, model.name, logger, shouldFreeze)
    
    // Validate primary key fields are strings and conditionally freeze
    // Normalize empty string names to undefined
    const primaryKey = model.primaryKey ? {
      name: model.primaryKey.name && model.primaryKey.name.trim() ? model.primaryKey.name : undefined,
      fields: conditionalFreeze(validateStringArray(model.primaryKey.fields, `${model.name}.primaryKey.fields`), shouldFreeze) as readonly string[]
    } : undefined
    
    return {
      name: model.name,
      // Use toLowerCase() for consistent ASCII lowercasing
      // Prisma model names are ASCII identifiers, so locale-insensitive casing is appropriate
      // Note: This avoids toLocaleLowerCase() compatibility issues in some environments
      nameLower: model.name.toLowerCase(),
      dbName: model.dbName || undefined,
      fields,
      primaryKey,
      uniqueFields: conditionalFreeze(
        model.uniqueFields.map((uf, i) => 
          conditionalFreeze(validateStringArray(uf, `${model.name}.uniqueFields[${i}]`), shouldFreeze) as readonly string[]
        ), 
        shouldFreeze
      ) as readonly (readonly string[])[],
      documentation: sanitizeDocumentation(model.documentation),
      // These will be filled by enhanceModel
      scalarFields: [],
      relationFields: [],
      createFields: [],
      updateFields: [],
      readFields: [],
      reverseRelations: [],
      hasSelfRelation: false
    }
  })
}

/**
 * Validate array contains only strings
 */
function validateStringArray(arr: readonly unknown[], context: string): string[] {
  if (!Array.isArray(arr)) {
    throw new Error(`${context} is not an array`)
  }
  
  for (let i = 0; i < arr.length; i++) {
    if (typeof arr[i] !== 'string') {
      throw new Error(`${context}[${i}] is not a string (got ${typeof arr[i]})`)
    }
  }
  
  return arr as string[]
}


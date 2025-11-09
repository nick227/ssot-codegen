/**
 * Enum parsing logic
 */

import type { DMMF } from '@prisma/generator-helper'
import type { DMMFParserLogger, ParsedEnum } from '../types.js'
import { isValidDMMFEnum } from '../type-guards.js'
import { sanitizeDocumentation } from '../security/sanitization.js'
import { safeStringify } from '../utils/string-utils.js'
import { conditionalFreeze } from '../utils/freezing.js'

/**
 * Parse enums with type guards
 */
export function parseEnums(enums: readonly DMMF.DatamodelEnum[], logger: DMMFParserLogger, shouldFreeze: boolean): ParsedEnum[] {
  return enums
    .filter(e => {
      if (!isValidDMMFEnum(e)) {
        logger.warn(`Skipping invalid DMMF enum: ${safeStringify(e)}`)
        return false
      }
      return true
    })
    .map(e => {
      // Filter out any malformed value objects and extract names
      // Guard against non-objects or objects missing 'name' property
      const values = e.values
        .filter(v => {
          if (!v || typeof v !== 'object' || typeof (v as any).name !== 'string') {
            logger.warn(`Skipping invalid enum value in ${e.name}: ${safeStringify(v)}`)
            return false
          }
          return true
        })
        .map(v => v.name)
      
      return {
        name: e.name,
        values: conditionalFreeze(values, shouldFreeze) as readonly string[],
        documentation: sanitizeDocumentation(e.documentation)
      }
    })
}



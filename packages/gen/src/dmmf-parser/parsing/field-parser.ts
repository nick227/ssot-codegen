/**
 * Field parsing logic
 * 
 * Parses DMMF fields into normalized ParsedField format with:
 * - Type detection and validation
 * - Optionality and nullability logic
 * - Default value handling
 * - Relation metadata
 */

import type { DMMF } from '@prisma/generator-helper'
import type { DMMFParserLogger, ParsedField, ParsedEnum, PrismaDefaultValue } from '../types.js'
import { DB_MANAGED_DEFAULTS, CLIENT_MANAGED_DEFAULTS, SYSTEM_TIMESTAMP_FIELDS } from '../constants.js'
import { isValidDMMFField } from '../type-guards.js'
import { safeStringify } from '../utils/string-utils.js'
import { sanitizeDocumentation } from '../security/sanitization.js'
import { conditionalFreeze, conditionalDeepFreeze } from '../utils/freezing.js'

/**
 * Parse fields with type guards
 */
export function parseFields(
  fields: readonly DMMF.Field[], 
  enumMap: Map<string, ParsedEnum>, 
  modelName: string, 
  logger: DMMFParserLogger, 
  shouldFreeze: boolean
): ParsedField[] {
  return fields
    .filter(f => {
      if (!isValidDMMFField(f)) {
        logger.warn(`Skipping invalid DMMF field in model ${modelName}: ${safeStringify(f)}`)
        return false
      }
      return true
    })
    .map(field => {
      const isEnum = enumMap.has(field.type)
    
    // Warn if enum type not found
    if (field.kind === 'enum' && !isEnum) {
      logger.warn(`Field ${modelName}.${field.name} references enum ${field.type} which was not found in parsed enums`)
    }
    
    const kind = isEnum ? 'enum' : determineFieldKind(field)
    const hasDbDefault = isDbManagedDefault(field.default)
    const isReadOnly = determineReadOnly(field)
    const isSelfRelation = field.kind === 'object' && field.type === modelName
    
    // isNullable: Type system allows null (String? in schema)
    // In Prisma: isRequired=true means field cannot be null
    // For relation fields, this is more nuanced (see below)
    const isNullable = !field.isRequired
    
    // isOptional: Field can be omitted in create operations
    // This is more nuanced than isNullable and varies by field kind:
    // 
    // List fields:
    //   Optional if nullable OR has default OR is implicit relation list
    //   Note: In Prisma, lists can be required (isRequired: true) and non-nullable
    //   Required scalar/enum lists without defaults are NOT optional (rare but valid)
    // 
    // Scalar/enum fields:
    //   Optional if nullable OR has any default value (DB or client-managed)
    //   Note: Even DB-managed defaults (autoincrement) make field optional in create
    // 
    // Relation fields:
    //   Optional if nullable OR implicit (no relationFromFields)
    //   Implicit relations are managed by the other side of the relationship
    //   and don't need to be specified when creating this model
    let isOptional: boolean
    if (field.isList) {
      // List fields need explicit checks based on kind:
      if (field.kind === 'object') {
        // Relation list - optional if nullable or implicit (no FK ownership)
        const isImplicitRelation = !field.relationFromFields || field.relationFromFields.length === 0
        isOptional = isNullable || isImplicitRelation
      } else {
        // Scalar/enum list - optional if nullable OR has default
        // Required non-nullable scalar lists WITHOUT defaults are NOT optional
        // Example: tags String[] (required, no default) - user must provide at least empty array
        isOptional = isNullable || field.hasDefaultValue
      }
    } else if (field.kind === 'object') {
      // Relation field is optional if:
      // 1. It's nullable (can pass null/undefined), OR
      // 2. It's an implicit relation (no relationFromFields - managed by other side)
      // 
      // A relation WITH relationFromFields (owns the FK) is REQUIRED unless nullable
      // because you must provide the foreign key value(s) when creating
      const isImplicitRelation = !field.relationFromFields || field.relationFromFields.length === 0
      isOptional = isNullable || isImplicitRelation
    } else {
      // Scalar/enum field is optional if nullable OR has any default
      // Client-managed defaults (now()) still make field optional since Prisma handles it
      isOptional = isNullable || field.hasDefaultValue
    }
    
    // Deep-copy and conditionally deep-freeze default if it's an object to prevent external mutations
    // Deep freezing ensures nested objects/arrays are also immutable (if freeze option enabled)
    const safeDefault: PrismaDefaultValue | undefined = field.default && typeof field.default === 'object'
      ? conditionalDeepFreeze({ ...field.default as object }, shouldFreeze) as PrismaDefaultValue
      : field.default
    
    return {
      name: field.name,
      type: field.type,
      kind,
      isList: field.isList,
      isRequired: field.isRequired,
      isNullable,
      isOptional,
      isUnique: field.isUnique || false,
      isId: field.isId,
      isReadOnly,
      isUpdatedAt: field.isUpdatedAt || false,
      hasDefaultValue: field.hasDefaultValue,
      hasDbDefault,
      default: safeDefault,  // Conditionally frozen copy to prevent mutations
      isPartOfCompositePrimaryKey: false,  // Set by enhanceModel
      isSelfRelation,
      relationName: field.relationName,
      // Preserve relation metadata with proper array copying and conditional freezing
      // Arrays are copied from DMMF and conditionally frozen to prevent mutations
      relationFromFields: field.relationFromFields ? conditionalFreeze([...field.relationFromFields], shouldFreeze) as readonly string[] : undefined,
      relationToFields: field.relationToFields ? conditionalFreeze([...field.relationToFields], shouldFreeze) as readonly string[] : undefined,
      documentation: sanitizeDocumentation(field.documentation)
    }
  })
}

/**
 * Determine field kind
 */
function determineFieldKind(field: DMMF.Field): 'scalar' | 'object' | 'enum' | 'unsupported' {
  if (field.kind === 'scalar') return 'scalar'
  if (field.kind === 'object') return 'object'
  if (field.kind === 'enum') return 'enum'
  return 'unsupported'
}

/**
 * Check if default value is DB-managed (not client-side)
 * 
 * DB-managed defaults (autoincrement, uuid, cuid, dbgenerated):
 * - Handled entirely by the database
 * - Should NOT be included in INSERT statements
 * - Should NOT be in create DTOs
 * - Field marked as read-only if it's an ID or system timestamp
 * 
 * IMPORTANT: 'now()' is CLIENT-managed and returns false here
 * This ensures consistency with getDefaultValueString() which returns 'new Date()' for now()
 * 
 * @param defaultValue - The default value from DMMF field
 * @returns true if DB-managed, false if client-managed or not a function default
 */
function isDbManagedDefault(defaultValue: unknown): boolean {
  if (!defaultValue || typeof defaultValue !== 'object') return false
  
  const def = defaultValue as Record<string, unknown>
  if (!('name' in def) || typeof def.name !== 'string') return false
  
  // Explicitly check it's NOT a client-managed default
  if (CLIENT_MANAGED_DEFAULTS.includes(def.name as typeof CLIENT_MANAGED_DEFAULTS[number])) {
    return false
  }
  
  // Check if it's a known DB-managed default
  // Note: dbgenerated can have args (validated via 'args' property), but we still treat it as DB-managed
  return DB_MANAGED_DEFAULTS.includes(def.name as typeof DB_MANAGED_DEFAULTS[number])
}

/**
 * Determine if field is read-only
 * 
 * Uses SYSTEM_TIMESTAMP_FIELDS consistently instead of hardcoding names.
 * 
 * Important: createdAt/updatedAt with client-managed defaults (now()) are NOT read-only
 * to allow user-provided values during creation. Only DB-managed defaults make them read-only.
 * 
 * CRITICAL ALIGNMENT with DTO inclusion logic in enhanceModel():
 * - This function determines isReadOnly flag
 * - enhanceModel() uses isReadOnly to decide CreateDTO inclusion
 * - Both must agree on createdAt behavior:
 *   * createdAt with now() → isReadOnly=false → INCLUDED in DTO ✅
 *   * createdAt with dbgenerated() → isReadOnly=true → EXCLUDED from DTO ✅
 * 
 * If you change this logic, ensure enhanceModel() DTO inclusion stays aligned.
 */
function determineReadOnly(field: DMMF.Field): boolean {
  // Explicitly marked as read-only
  if (field.isReadOnly) return true
  
  // ID fields with DB-managed defaults (autoincrement, uuid, etc)
  if (field.isId && field.hasDefaultValue && isDbManagedDefault(field.default)) return true
  
  // @updatedAt fields are always read-only (Prisma manages them automatically)
  if (field.isUpdatedAt) return true
  
  // System timestamp fields are read-only ONLY if they have DB-managed defaults
  // Client-managed defaults (like now()) should allow user-provided values
  // This ensures createdAt with now() remains writable for custom timestamps
  const isSystemTimestamp = SYSTEM_TIMESTAMP_FIELDS.includes(field.name as typeof SYSTEM_TIMESTAMP_FIELDS[number])
  if (isSystemTimestamp && field.hasDefaultValue && isDbManagedDefault(field.default)) {
    return true
  }
  
  return false
}


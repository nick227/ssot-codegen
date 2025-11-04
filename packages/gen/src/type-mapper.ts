/**
 * Type Mapper - Maps Prisma types to TypeScript and Zod types
 */

import type { ParsedField } from './dmmf-parser.js'

/**
 * Map Prisma type to TypeScript type
 */
export function mapPrismaToTypeScript(field: ParsedField): string {
  let baseType: string
  
  switch (field.kind) {
    case 'scalar':
      baseType = mapScalarType(field.type)
      break
    case 'enum':
      baseType = field.type // Use enum name directly
      break
    case 'object':
      baseType = field.type // Use model name directly
      break
    default:
      baseType = 'unknown'
  }
  
  // Handle arrays
  if (field.isList) {
    baseType = `${baseType}[]`
  }
  
  // Handle nullable (but not for arrays or required fields)
  if (!field.isRequired && !field.isList) {
    baseType = `${baseType} | null`
  }
  
  return baseType
}

/**
 * Map scalar Prisma type to TypeScript
 */
function mapScalarType(prismaType: string): string {
  switch (prismaType) {
    case 'String':
      return 'string'
    case 'Int':
    case 'BigInt':
    case 'Float':
    case 'Decimal':
      return 'number'
    case 'Boolean':
      return 'boolean'
    case 'DateTime':
      return 'Date'
    case 'Json':
      return 'Record<string, any>'
    case 'Bytes':
      return 'Buffer'
    default:
      return 'unknown'
  }
}

/**
 * Map Prisma type to Zod schema
 */
export function mapPrismaToZod(field: ParsedField): string {
  let baseSchema: string
  
  switch (field.kind) {
    case 'scalar':
      baseSchema = mapScalarToZod(field.type)
      break
    case 'enum':
      baseSchema = `z.nativeEnum(${field.type})`
      break
    case 'object':
      // Relations are not validated in input DTOs
      return 'z.unknown()'
    default:
      baseSchema = 'z.unknown()'
  }
  
  // Add constraints based on type
  baseSchema = addZodConstraints(baseSchema, field)
  
  // Handle arrays
  if (field.isList) {
    baseSchema = `z.array(${baseSchema})`
  }
  
  // Handle optional/nullable/defaults
  // IMPORTANT: Fields with defaults should be optional in CREATE input (even if Prisma marks them required)
  if (field.hasDefaultValue) {
    const defaultVal = getZodDefault(field)
    if (defaultVal) {
      baseSchema = `${baseSchema}.optional().default(${defaultVal})`
    } else {
      baseSchema = `${baseSchema}.optional()`
    }
  } else if (!field.isRequired) {
    // No default, but nullable/optional
    baseSchema = `${baseSchema}.nullable().optional()`
  }
  
  return baseSchema
}

/**
 * Map scalar type to Zod
 */
function mapScalarToZod(prismaType: string): string {
  switch (prismaType) {
    case 'String':
      return 'z.string()'
    case 'Int':
      return 'z.number().int()'
    case 'BigInt':
      return 'z.bigint()'
    case 'Float':
    case 'Decimal':
      return 'z.number()'
    case 'Boolean':
      return 'z.boolean()'
    case 'DateTime':
      return 'z.coerce.date()'
    case 'Json':
      return 'z.record(z.any())'
    case 'Bytes':
      return 'z.instanceof(Buffer)'
    default:
      return 'z.unknown()'
  }
}

/**
 * Add Zod constraints based on field
 */
function addZodConstraints(schema: string, field: ParsedField): string {
  let result = schema
  
  // String constraints
  if (field.type === 'String') {
    if (field.isRequired) {
      result += `.min(1, '${field.name} is required')`
    }
    // Could add max length if we parse @db.VarChar(n)
  }
  
  // Number constraints
  if (field.type === 'Int' || field.type === 'Float') {
    // Could add min/max if we parse validation comments
  }
  
  return result
}

/**
 * Get Zod default value
 */
function getZodDefault(field: ParsedField): string | undefined {
  if (!field.hasDefaultValue || !field.default) return undefined
  
  const def = field.default
  
  if (typeof def === 'string') return `"${def}"`
  if (typeof def === 'number') return String(def)
  if (typeof def === 'boolean') return String(def)
  
  // Handle Prisma functions
  if (typeof def === 'object' && 'name' in def) {
    switch (def.name) {
      case 'now': return 'new Date()'
      case 'uuid': return undefined // Can't generate client-side
      case 'cuid': return undefined
      case 'autoincrement': return undefined
      default: return undefined
    }
  }
  
  return undefined
}

/**
 * Get field type for DTO
 */
export function getFieldTypeForDTO(field: ParsedField, optional: boolean = false): string {
  const tsType = mapPrismaToTypeScript(field)
  const optionalMarker = optional || (!field.isRequired || field.hasDefaultValue) ? '?' : ''
  
  return `${field.name}${optionalMarker}: ${tsType}`
}

/**
 * Get import statements for field types
 */
export function getTypeImports(fields: ParsedField[]): string[] {
  const imports: Set<string> = new Set()
  
  for (const field of fields) {
    // Import enums
    if (field.kind === 'enum') {
      imports.add(`import { ${field.type} } from '@prisma/client'`)
    }
    
    // Import related models (for relation fields)
    if (field.kind === 'object') {
      // We generally don't import relations in DTOs
      // but might need for include/select types
    }
  }
  
  return Array.from(imports)
}


/**
 * MySQL Index Key Length Validation
 * 
 * Validates that indexed String fields in MySQL schemas don't exceed key length limits.
 * 
 * MySQL with utf8mb4 (4 bytes per character) has index key length limits:
 * - Default: 767 bytes (older MySQL) or 1000 bytes (newer MySQL)
 * - VARCHAR(255) with utf8mb4 = 255 × 4 = 1020 bytes ❌ Exceeds limit
 * - VARCHAR(191) with utf8mb4 = 191 × 4 = 764 bytes ✅ Safe
 * 
 * This validator checks for:
 * - String fields with @unique (creates index)
 * - String fields in @@index (creates index)
 * - Missing @db.VarChar(length) constraint on indexed String fields
 */

import type { ParsedSchema, ParsedModel, ParsedField } from '../types.js'

/**
 * Detect database provider from schema content
 */
function detectDatabaseProvider(schemaContent: string): 'mysql' | 'postgresql' | 'sqlite' | null {
  if (schemaContent.includes('provider = "mysql"')) {
    return 'mysql'
  }
  if (schemaContent.includes('provider = "postgresql"')) {
    return 'postgresql'
  }
  if (schemaContent.includes('provider = "sqlite"')) {
    return 'sqlite'
  }
  return null
}

/**
 * Check if a field is indexed (has @unique or is in @@index)
 */
function isFieldIndexed(field: ParsedField, model: ParsedModel): boolean {
  // Check if field has @unique
  const isUnique = model.uniqueFields.some(uniqueConstraint => 
    uniqueConstraint.length === 1 && uniqueConstraint[0] === field.name
  )
  
  if (isUnique) {
    return true
  }
  
  // Check if field is in any @@index
  // Note: We'd need to parse indexes from schema content for full check
  // For now, we check if field is String type and has @unique (most common case)
  return false
}

/**
 * Extract field definition from schema content
 */
function getFieldDefinition(modelName: string, fieldName: string, schemaContent: string): string | null {
  // Find the model block
  const modelRegex = new RegExp(`model\\s+${modelName}\\s*\\{([^}]+)\\}`, 's')
  const modelMatch = schemaContent.match(modelRegex)
  if (!modelMatch) return null
  
  // Find the field definition within the model
  const fieldRegex = new RegExp(`\\s+${fieldName}\\s+[^\\n]+(?:\\s+@[^\\n]+)*`, 'g')
  const fieldMatch = modelMatch[1].match(fieldRegex)
  if (!fieldMatch || fieldMatch.length === 0) return null
  
  return fieldMatch[0].trim()
}

/**
 * Check if field has explicit length constraint from schema content
 */
function hasLengthConstraint(fieldDef: string | null): boolean {
  if (!fieldDef) return false
  // Check for @db.VarChar(length) or @db.Char(length)
  return /@db\.VarChar\(\d+\)|@db\.Char\(\d+\)/.test(fieldDef)
}

/**
 * Extract length from @db.VarChar(length) annotation
 */
function extractLength(fieldDef: string | null): number | null {
  if (!fieldDef) return null
  
  const match = fieldDef.match(/@db\.VarChar\((\d+)\)|@db\.Char\((\d+)\)/)
  if (match) {
    return parseInt(match[1] || match[2], 10)
  }
  return null
}

/**
 * Estimate index key length for a String field
 */
function estimateKeyLength(fieldDef: string | null, provider: 'mysql' | 'postgresql' | 'sqlite'): number {
  if (provider !== 'mysql') {
    return 0 // No limit for other providers
  }
  
  // Check if field has explicit length constraint
  const length = extractLength(fieldDef)
  if (length !== null) {
    return length * 4 // utf8mb4 = 4 bytes per character
  }
  
  // Default: Prisma uses VARCHAR(191) for String fields, but can be VARCHAR(255) in some cases
  // Assume worst case: VARCHAR(255) = 1020 bytes (exceeds limit)
  return 1020 // Exceeds limit
}

/**
 * Validate MySQL index key length constraints
 * 
 * @param schema - Parsed schema
 * @param schemaContent - Original schema content (to detect provider)
 * @returns Array of validation errors/warnings
 */
export function validateMySQLKeyLength(
  schema: ParsedSchema,
  schemaContent: string
): { errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  
  const provider = detectDatabaseProvider(schemaContent)
  
  if (provider !== 'mysql') {
    return { errors, warnings } // Only validate MySQL
  }
  
  // MySQL key length limit
  // Older MySQL: 767 bytes, Newer MySQL: 1000 bytes
  // Use 1000 bytes as the limit to match newer MySQL versions
  const MAX_KEY_LENGTH = 1000
  
  for (const model of schema.models) {
    // Check all String fields
    for (const field of model.fields) {
      if (field.kind !== 'scalar' || field.type !== 'String') {
        continue
      }
      
      // Get field definition from schema content to check for @db annotations
      const fieldDef = getFieldDefinition(model.name, field.name, schemaContent)
      
      // Check if field is indexed (has @unique)
      const isUnique = model.uniqueFields.some(uniqueConstraint => 
        uniqueConstraint.length === 1 && uniqueConstraint[0] === field.name
      )
      
      // Check if field is in any composite unique constraint
      const isInCompositeUnique = model.uniqueFields.some(uniqueConstraint => 
        uniqueConstraint.length > 1 && uniqueConstraint.includes(field.name)
      )
      
      // Check if field appears in @@index (parse from schema content)
      // Look for @@index([fieldName]) or @@index([otherField, fieldName]) patterns
      const modelBlockMatch = schemaContent.match(new RegExp(`model\\s+${model.name}\\s*\\{([^}]+)\\}`, 's'))
      const isInIndex = modelBlockMatch 
        ? new RegExp(`@@index\\(\\[[^\\]]*\\b${field.name}\\b[^\\]]*\\]\\)`, 's').test(modelBlockMatch[1])
        : false
      
      // Check if field is a primary key (@id) - primary keys are always indexed
      const isPrimaryKey = field.isId || model.idField?.name === field.name
      
      // Check if field is a foreign key (foreign keys automatically create indexes in MySQL)
      const isForeignKey = field.relationFromFields && field.relationFromFields.length > 0
      const isForeignKeyField = model.fields.some(f => 
        f.relationFromFields && f.relationFromFields.includes(field.name)
      )
      
      // Check if field is likely indexed
      // Note: Primary keys and foreign keys automatically create indexes in MySQL, so they need length constraints too
      if (isPrimaryKey || isUnique || isInCompositeUnique || isInIndex || isForeignKeyField) {
        const estimatedLength = estimateKeyLength(fieldDef, provider)
        
        if (estimatedLength > MAX_KEY_LENGTH) {
          const hasExplicitLength = hasLengthConstraint(fieldDef)
          
          if (!hasExplicitLength) {
            const fieldType = isPrimaryKey ? '@id (primary key)' : isForeignKeyField ? 'foreign key' : '@unique or @@index'
            const fixExample = isPrimaryKey 
              ? `${field.name} String @id @default(cuid()) @db.VarChar(191)`
              : isForeignKeyField
              ? `${field.name} String? @db.VarChar(191) // Foreign key (auto-indexed)`
              : `${field.name} String @unique @db.VarChar(191)`
            errors.push(
              `Model ${model.name}.${field.name} is indexed (${fieldType}) but has no explicit length constraint. ` +
              `With MySQL utf8mb4, VARCHAR(255) = 1020 bytes exceeds the ${MAX_KEY_LENGTH} byte limit. ` +
              `Fix: Add @db.VarChar(191) to limit length: ${fixExample}`
            )
          } else {
            // Field has length constraint, but might still be too long
            const length = extractLength(fieldDef)
            if (length && length * 4 > MAX_KEY_LENGTH) {
              const fieldType = isPrimaryKey ? '@id (primary key)' : isForeignKeyField ? 'foreign key' : '@unique or @@index'
              const fixExample = isPrimaryKey 
                ? `${field.name} String @id @default(cuid()) @db.VarChar(191)`
                : isForeignKeyField
                ? `${field.name} String? @db.VarChar(191) // Foreign key (auto-indexed)`
                : `${field.name} String @unique @db.VarChar(191)`
              errors.push(
                `Model ${model.name}.${field.name} index key length (${length * 4} bytes) exceeds MySQL limit (${MAX_KEY_LENGTH} bytes). ` +
                `Field is indexed (${fieldType}). Fix: Reduce length to @db.VarChar(191) or less: ${fixExample}`
              )
            }
          }
        }
      }
    }
    
    // Validate composite indexes and composite unique constraints (check total key length)
    // Use brace counting to handle nested structures (JSON fields, comments, etc.)
    const modelStartPattern = new RegExp(`model\\s+${model.name}\\s*\\{`, 's')
    const modelStartMatch = schemaContent.match(modelStartPattern)
    if (!modelStartMatch) continue
    
    const startPos = modelStartMatch.index! + modelStartMatch[0].length - 1 // Position of opening brace
    let braceCount = 1
    let endPos = startPos + 1
    while (braceCount > 0 && endPos < schemaContent.length) {
      if (schemaContent[endPos] === '{') braceCount++
      else if (schemaContent[endPos] === '}') braceCount--
      endPos++
    }
    const modelBody = schemaContent.substring(startPos + 1, endPos - 1)
    
    if (modelBody) {
      
      // Find all @@index directives
      const indexMatches = modelBody.matchAll(/@@index\s*\(\s*\[([^\]]+)\]\s*\)/g)
      
      // Find all @@unique directives (composite unique constraints)
      const uniqueMatches = Array.from(modelBody.matchAll(/@@unique\s*\(\s*\[([^\]]+)\]\s*\)/g))
      
      // Create a map of unique constraints from schema content (preserves prefix index syntax)
      const schemaUniqueConstraints = new Map<string, string>()
      for (const match of uniqueMatches) {
        const fields = match[1]
        // Create a key from field names (without prefix syntax) for matching
        const key = fields.split(',').map(f => f.trim().replace(/\(.*\)$/, '').trim()).join(', ')
        schemaUniqueConstraints.set(key, fields)
      }
      
      // Combine both types of composite indexes
      const allCompositeIndexes = [
        ...Array.from(indexMatches).map(m => ({ type: 'index', fields: m[1] })),
        ...uniqueMatches.map(m => ({ type: 'unique', fields: m[1] }))
      ]
      
      // Also check model.uniqueFields for composite unique constraints
      // But prefer the ones parsed from schema content (which preserve prefix index syntax)
      for (const uniqueConstraint of model.uniqueFields) {
        if (uniqueConstraint.length > 1) {
          const key = uniqueConstraint.join(', ')
          // If we have a schema-parsed version with prefix indexes, use that instead
          if (schemaUniqueConstraints.has(key)) {
            // Already added from schema content, skip
            continue
          }
          // Otherwise add the parsed version (without prefix syntax)
          allCompositeIndexes.push({
            type: 'unique',
            fields: key
          })
        }
      }
      
      for (const compositeIndex of allCompositeIndexes) {
        const indexFields = compositeIndex.fields.split(',').map(f => f.trim())
        let totalKeyLength = 0
        const stringFields: string[] = []
        const originalIndexDef = compositeIndex.fields // Keep original to check for prefix indexes
        let prefixIndexesDetected = false
        
        for (const fieldName of indexFields) {
          // Extract field name (remove prefix index syntax like "fieldName(191)")
          const cleanFieldName = fieldName.replace(/\(.*\)$/, '').trim()
          const field = model.fields.find(f => f.name === cleanFieldName)
          if (!field) continue
          
          // Check if prefix index is used (e.g., "fieldName(length: 191)")
          const prefixMatch = fieldName.match(/\(length:\s*(\d+)\)/)
          const prefixLength = prefixMatch ? parseInt(prefixMatch[1], 10) : null
          
          if (field.kind === 'scalar' && field.type === 'String') {
            if (prefixLength !== null) {
              // Prefix index is used - use that length
              totalKeyLength += prefixLength * 4
              prefixIndexesDetected = true
            } else {
              // No prefix index - use full field length
              const fieldDef = getFieldDefinition(model.name, field.name, schemaContent)
              const length = estimateKeyLength(fieldDef, provider)
              totalKeyLength += length
            }
            stringFields.push(field.name)
          } else if (field.type === 'DateTime' || field.type === 'Int' || field.type === 'BigInt') {
            // DateTime = 8 bytes, Int = 4 bytes, BigInt = 8 bytes
            totalKeyLength += field.type === 'Int' ? 4 : 8
          } else if (field.type === 'Boolean') {
            totalKeyLength += 1
          } else if (field.type === 'Decimal' || field.type === 'Float') {
            // Approximate - Decimal/Float vary, but typically 8-16 bytes
            totalKeyLength += 8
          }
        }
        
        if (totalKeyLength > MAX_KEY_LENGTH && stringFields.length > 0) {
          const indexType = compositeIndex.type === 'unique' ? 'composite unique constraint' : 'composite index'
          // Check if prefix indexes are already used in the original index definition
          const hasPrefixIndexes = originalIndexDef.includes('(length:')
          
          // Only report error if prefix indexes are NOT detected AND NOT present in original definition
          if (!hasPrefixIndexes && !prefixIndexesDetected) {
            errors.push(
              `Model ${model.name} has ${indexType} [${indexFields.join(', ')}] with total key length ${totalKeyLength} bytes, ` +
              `exceeding MySQL limit (${MAX_KEY_LENGTH} bytes). ` +
              `String fields: ${stringFields.join(', ')}. ` +
              `Fix: Use prefix indexes for String fields: @@${compositeIndex.type}([${indexFields.map(f => {
                const cleanFieldName = f.replace(/\(.*\)$/, '').trim()
                const field = model.fields.find(ff => ff.name === cleanFieldName)
                if (field && field.kind === 'scalar' && field.type === 'String') {
                  // Use 191 for single String field, or reduce if multiple String fields
                  const prefixLength = stringFields.length > 1 ? 125 : 191
                  return `${cleanFieldName}(length: ${prefixLength})`
                }
                return f.trim()
              }).join(', ')}])`
            )
          }
        }
      }
    }
  }
  
  return { errors, warnings }
}


#!/usr/bin/env node
/**
 * Exhaustive MySQL Key Length Validator
 * Finds ALL potential key length issues before Prisma db push
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const MAX_KEY_LENGTH = 1000 // MySQL limit (newer versions)
const BYTES_PER_CHAR_UTF8MB4 = 4

// Find all schema files recursively
function findSchemaFiles(dir, baseDir = dir, files = []) {
  const entries = readdirSync(dir)
  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      // Skip node_modules and generated directories
      if (entry !== 'node_modules' && entry !== 'generated') {
        findSchemaFiles(fullPath, baseDir, files)
      }
    } else if (entry === 'schema.prisma') {
      files.push(fullPath.replace(baseDir + '\\', '').replace(baseDir + '/', ''))
    }
  }
  return files
}

const rootDir = join(__dirname, '..')
const schemaFiles = findSchemaFiles(rootDir, rootDir)

console.log(`\n🔍 Validating ${schemaFiles.length} schema file(s)...\n`)

// Check MySQL storage engine
console.log(`\n⚠️  IMPORTANT: MySQL Storage Engine Check`)
console.log(`   MySQL default_storage_engine should be 'InnoDB' (not 'MyISAM')`)
console.log(`   MyISAM has a 1000-byte key length limit`)
console.log(`   InnoDB supports up to 3072 bytes with innodb_large_prefix\n`)

let totalErrors = 0
let totalWarnings = 0

for (const schemaFile of schemaFiles) {
  const fullPath = join(__dirname, '..', schemaFile)
  const content = readFileSync(fullPath, 'utf-8')
  
  // Check if MySQL
  if (!content.includes('provider = "mysql"')) {
    continue
  }
  
  console.log(`\n📄 ${schemaFile}`)
  console.log('─'.repeat(60))
  
  const errors = []
  const warnings = []
  
  // Extract all models
  const modelMatches = content.matchAll(/model\s+(\w+)\s*\{([^}]+)\}/gs)
  
  for (const modelMatch of modelMatches) {
    const modelName = modelMatch[1]
    const modelBody = modelMatch[2]
    
    // Extract all field definitions
    const fieldMatches = modelBody.matchAll(/(\w+)\s+(\w+[?]?)\s+([^\n]+)/g)
    const fields = []
    
    for (const fieldMatch of fieldMatches) {
      const fieldName = fieldMatch[1]
      const fieldType = fieldMatch[2]
      const fieldAttrs = fieldMatch[3]
      
      fields.push({
        name: fieldName,
        type: fieldType,
        attrs: fieldAttrs,
        isId: fieldAttrs.includes('@id'),
        isUnique: fieldAttrs.includes('@unique') || modelBody.includes(`@@unique([${fieldName}`),
        isIndexed: modelBody.includes(`@@index([${fieldName}`),
        isForeignKey: fieldAttrs.includes('@relation') && fieldAttrs.includes('references'),
        hasLength: fieldAttrs.match(/@db\.VarChar\((\d+)\)/),
        length: fieldAttrs.match(/@db\.VarChar\((\d+)\)/)?.[1] ? parseInt(fieldAttrs.match(/@db\.VarChar\((\d+)\)/)[1]) : null,
        prefixLength: modelBody.match(new RegExp(`@@unique\\(\\[${fieldName}\\(length:\\s*(\\d+)\\)\\]\\)`))?.[1] 
          || modelBody.match(new RegExp(`@@index\\(\\[${fieldName}\\(length:\\s*(\\d+)\\)\\]\\)`))?.[1]
          ? parseInt(modelBody.match(new RegExp(`@@unique\\(\\[${fieldName}\\(length:\\s*(\\d+)\\)\\]\\)`))?.[1] 
            || modelBody.match(new RegExp(`@@index\\(\\[${fieldName}\\(length:\\s*(\\d+)\\)\\]\\)`))?.[1]) 
          : null
      })
    }
    
    // Check primary keys
    for (const field of fields) {
      if (field.isId && field.type === 'String') {
        const effectiveLength = field.prefixLength || field.length || 255
        const keyLength = effectiveLength * BYTES_PER_CHAR_UTF8MB4
        
        if (keyLength > MAX_KEY_LENGTH) {
          errors.push(`❌ ${modelName}.${field.name} (PRIMARY KEY): ${effectiveLength} chars × 4 bytes = ${keyLength} bytes > ${MAX_KEY_LENGTH} bytes`)
        } else if (!field.length || field.length > 191) {
          warnings.push(`⚠️  ${modelName}.${field.name} (PRIMARY KEY): No explicit length constraint or length > 191. Current: ${field.length || 'VARCHAR(255)'}`)
        }
      }
    }
    
    // Check unique constraints
    const uniqueMatches = modelBody.matchAll(/@@unique\s*\(\s*\[([^\]]+)\]\s*\)/g)
    for (const uniqueMatch of uniqueMatches) {
      const fieldsStr = uniqueMatch[1]
      const fieldNames = fieldsStr.split(',').map(f => f.trim().replace(/\(length:\s*\d+\)/, '').trim())
      
      let totalLength = 0
      const issues = []
      
      for (const fieldName of fieldNames) {
        const field = fields.find(f => f.name === fieldName)
        if (!field) continue
        
        if (field.type === 'String') {
          const prefixMatch = fieldsStr.match(new RegExp(`${fieldName}\\(length:\\s*(\\d+)\\)`))
          const prefixLength = prefixMatch ? parseInt(prefixMatch[1]) : null
          const effectiveLength = prefixLength || field.length || 255
          const keyLength = effectiveLength * BYTES_PER_CHAR_UTF8MB4
          totalLength += keyLength
          
          if (!prefixLength && (!field.length || field.length > 191)) {
            issues.push(`${fieldName} (no prefix index, length: ${field.length || 255})`)
          }
        } else if (field.type === 'DateTime') {
          totalLength += 8
        } else if (field.type === 'Int' || field.type === 'BigInt') {
          totalLength += field.type === 'Int' ? 4 : 8
        } else if (field.type === 'Boolean') {
          totalLength += 1
        }
      }
      
      if (totalLength > MAX_KEY_LENGTH) {
        errors.push(`❌ ${modelName} @@unique([${fieldNames.join(', ')}]): Total key length ${totalLength} bytes > ${MAX_KEY_LENGTH} bytes`)
        if (issues.length > 0) {
          errors.push(`   Missing prefix indexes: ${issues.join(', ')}`)
        }
      }
    }
    
    // Check @unique on fields
    for (const field of fields) {
      if (field.isUnique && field.type === 'String' && !modelBody.includes(`@@unique([${field.name}`)) {
        const effectiveLength = field.length || 255
        const keyLength = effectiveLength * BYTES_PER_CHAR_UTF8MB4
        
        if (keyLength > MAX_KEY_LENGTH) {
          errors.push(`❌ ${modelName}.${field.name} (@unique): ${effectiveLength} chars × 4 bytes = ${keyLength} bytes > ${MAX_KEY_LENGTH} bytes`)
        } else if (!field.length || field.length > 191) {
          warnings.push(`⚠️  ${modelName}.${field.name} (@unique): No explicit length constraint or length > 191. Current: ${field.length || 'VARCHAR(255)'}`)
        }
      }
    }
    
    // Check indexes
    const indexMatches = modelBody.matchAll(/@@index\s*\(\s*\[([^\]]+)\]\s*\)/g)
    for (const indexMatch of indexMatches) {
      const fieldsStr = indexMatch[1]
      const fieldNames = fieldsStr.split(',').map(f => f.trim().replace(/\(length:\s*\d+\)/, '').trim())
      
      let totalLength = 0
      const issues = []
      
      for (const fieldName of fieldNames) {
        const field = fields.find(f => f.name === fieldName)
        if (!field) continue
        
        if (field.type === 'String') {
          const prefixMatch = fieldsStr.match(new RegExp(`${fieldName}\\(length:\\s*(\\d+)\\)`))
          const prefixLength = prefixMatch ? parseInt(prefixMatch[1]) : null
          const effectiveLength = prefixLength || field.length || 255
          const keyLength = effectiveLength * BYTES_PER_CHAR_UTF8MB4
          totalLength += keyLength
          
          if (!prefixMatch && (!field.length || field.length > 191)) {
            issues.push(`${fieldName} (no prefix index, length: ${field.length || 255})`)
          }
        } else if (field.type === 'DateTime') {
          totalLength += 8
        } else if (field.type === 'Int' || field.type === 'BigInt') {
          totalLength += field.type === 'Int' ? 4 : 8
        } else if (field.type === 'Boolean') {
          totalLength += 1
        }
      }
      
      if (totalLength > MAX_KEY_LENGTH) {
        errors.push(`❌ ${modelName} @@index([${fieldNames.join(', ')}]): Total key length ${totalLength} bytes > ${MAX_KEY_LENGTH} bytes`)
        if (issues.length > 0) {
          errors.push(`   Missing prefix indexes: ${issues.join(', ')}`)
        }
      }
    }
    
    // Check foreign keys (auto-indexed)
    for (const field of fields) {
      if (field.isForeignKey && field.type === 'String') {
        // Check if there's an explicit index with prefix
        const hasExplicitIndex = modelBody.includes(`@@index([${field.name}(length:`)
        
        if (!hasExplicitIndex) {
          const effectiveLength = field.length || 255
          const keyLength = effectiveLength * BYTES_PER_CHAR_UTF8MB4
          
          if (keyLength > MAX_KEY_LENGTH) {
            errors.push(`❌ ${modelName}.${field.name} (FOREIGN KEY auto-index): ${effectiveLength} chars × 4 bytes = ${keyLength} bytes > ${MAX_KEY_LENGTH} bytes`)
            errors.push(`   Fix: Add @@index([${field.name}(length: 191)])`)
          } else if (!field.length || field.length > 191) {
            warnings.push(`⚠️  ${modelName}.${field.name} (FOREIGN KEY auto-index): No explicit prefix index. Length: ${field.length || 'VARCHAR(255)'}`)
            warnings.push(`   Fix: Add @@index([${field.name}(length: 191)])`)
          }
        }
      }
    }
  }
  
  if (errors.length > 0) {
    console.log(`\n❌ ERRORS (${errors.length}):`)
    errors.forEach(err => console.log(`   ${err}`))
    totalErrors += errors.length
  }
  
  if (warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${warnings.length}):`)
    warnings.forEach(warn => console.log(`   ${warn}`))
    totalWarnings += warnings.length
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ No issues found')
  }
}

console.log(`\n${'='.repeat(60)}`)
console.log(`\n📊 Summary:`)
console.log(`   Errors: ${totalErrors}`)
console.log(`   Warnings: ${totalWarnings}`)

if (totalErrors > 0) {
  console.log(`\n❌ Validation FAILED - Fix errors before running prisma db push`)
  process.exit(1)
} else {
  console.log(`\n✅ Validation PASSED`)
  process.exit(0)
}


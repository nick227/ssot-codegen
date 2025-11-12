#!/usr/bin/env node
/**
 * SSOT UI CLI
 * 
 * Commands:
 * - validate <dir>  - Validate all JSON files
 * - plan <dir>      - Show resolved plan
 * - serve <dir>     - Dev server (future)
 */

import fs from 'node:fs'
import path from 'node:path'
import {
  validateTemplateFile,
  validateDataContractFile,
  validateCapabilitiesFile,
  validateMappingsFile,
  validateModelsFile,
  validateThemeFile,
  validateI18nFile,
  validateCrossSchema,
  formatValidationErrors,
  formatValidationWarnings,
  type AllSchemas
} from './validator.js'

const RUNTIME_VERSION = '3.0.0' // Current runtime version

// ============================================================================
// Helpers
// ============================================================================

function readJSON(filePath: string): unknown {
  if (!fs.existsSync(filePath)) {
    return null
  }
  
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch (error) {
    console.error(`❌ Failed to parse ${path.basename(filePath)}:`, (error as Error).message)
    process.exit(1)
  }
}

function loadAllSchemas(dir: string): AllSchemas | null {
  const template = readJSON(path.join(dir, 'template.json'))
  const dataContract = readJSON(path.join(dir, 'data-contract.json'))
  const capabilities = readJSON(path.join(dir, 'capabilities.json'))
  const mappings = readJSON(path.join(dir, 'mappings.json'))
  const models = readJSON(path.join(dir, 'models.json'))
  const theme = readJSON(path.join(dir, 'theme.json'))
  const i18n = readJSON(path.join(dir, 'i18n.json'))
  
  if (!template || !dataContract || !capabilities || !mappings || !models || !theme || !i18n) {
    const missing = []
    if (!template) missing.push('template.json')
    if (!dataContract) missing.push('data-contract.json')
    if (!capabilities) missing.push('capabilities.json')
    if (!mappings) missing.push('mappings.json')
    if (!models) missing.push('models.json')
    if (!theme) missing.push('theme.json')
    if (!i18n) missing.push('i18n.json')
    
    console.error(`\n❌ Missing required files:\n  ${missing.join('\n  ')}\n`)
    return null
  }
  
  return { template, dataContract, capabilities, mappings, models, theme, i18n } as any
}

// ============================================================================
// Command: validate
// ============================================================================

function validateCommand(dir: string) {
  console.log(`\n🔍 Validating templates in: ${dir}\n`)
  
  const schemas = loadAllSchemas(dir)
  if (!schemas) {
    process.exit(1)
  }
  
  let hasErrors = false
  const allWarnings: string[] = []
  
  // Validate each file
  const validations = [
    { name: 'template.json', fn: () => validateTemplateFile(schemas.template) },
    { name: 'data-contract.json', fn: () => validateDataContractFile(schemas.dataContract) },
    { name: 'capabilities.json', fn: () => validateCapabilitiesFile(schemas.capabilities) },
    { name: 'mappings.json', fn: () => validateMappingsFile(schemas.mappings) },
    { name: 'models.json', fn: () => validateModelsFile(schemas.models) },
    { name: 'theme.json', fn: () => validateThemeFile(schemas.theme) },
    { name: 'i18n.json', fn: () => validateI18nFile(schemas.i18n) }
  ]
  
  for (const { name, fn } of validations) {
    const result = fn()
    
    if (!result.valid) {
      hasErrors = true
      console.log(formatValidationErrors(result.errors))
    } else {
      console.log(`✅ ${name}`)
      allWarnings.push(...result.warnings)
    }
  }
  
  // Cross-schema validation
  console.log('\n🔗 Cross-schema validation...\n')
  const crossResult = validateCrossSchema(schemas, RUNTIME_VERSION)
  
  if (!crossResult.valid) {
    hasErrors = true
    console.log(formatValidationErrors(crossResult.errors))
  } else {
    console.log('✅ Cross-schema validation passed')
    allWarnings.push(...crossResult.warnings)
  }
  
  // Show warnings
  if (allWarnings.length > 0) {
    console.log(formatValidationWarnings(allWarnings))
  }
  
  // Exit
  if (hasErrors) {
    console.log('❌ Validation failed\n')
    process.exit(1)
  } else {
    console.log('\n✅ All validations passed!\n')
    process.exit(0)
  }
}

// ============================================================================
// Command: plan
// ============================================================================

function planCommand(dir: string, outputFile?: string) {
  console.log(`\n📋 Planning templates in: ${dir}\n`)
  
  const schemas = loadAllSchemas(dir)
  if (!schemas) {
    process.exit(1)
  }
  
  // Validate first
  const crossResult = validateCrossSchema(schemas, RUNTIME_VERSION)
  if (!crossResult.valid) {
    console.log(formatValidationErrors(crossResult.errors))
    console.log('❌ Cannot plan - fix validation errors first\n')
    process.exit(1)
  }
  
  // Generate plan
  const plan = {
    routes: schemas.template.pages.map(p => ({
      route: p.route,
      type: p.type,
      runtime: p.runtime,
      model: p.type !== 'custom' ? p.model : undefined,
      guard: schemas.template.guards?.[p.route]
    })),
    models: Object.keys(schemas.dataContract.models),
    guards: Object.entries(schemas.template.guards || {}).map(([route, guard]) => ({
      route,
      ...guard
    }))
  }
  
  if (outputFile) {
    fs.writeFileSync(outputFile, JSON.stringify(plan, null, 2))
    console.log(`✅ Plan written to: ${outputFile}\n`)
  } else {
    console.log(JSON.stringify(plan, null, 2))
    console.log()
  }
}

// ============================================================================
// Command: serve
// ============================================================================

function serveCommand(dir: string) {
  console.log(`\n🚀 Dev server not yet implemented.\n`)
  console.log(`   This will provide hot JSON reload + diagnostics overlay.\n`)
  process.exit(0)
}

// ============================================================================
// Main CLI
// ============================================================================

const args = process.argv.slice(2)
const command = args[0]

if (!command) {
  console.log(`
SSOT UI CLI

Commands:
  validate <dir>              Validate all JSON files
  plan <dir> [--out file]     Show resolved plan
  serve <dir>                 Dev server with hot reload (coming soon)

Examples:
  ssot validate ./templates
  ssot plan ./templates --out plan.json
`)
  process.exit(0)
}

switch (command) {
  case 'validate': {
    const dir = args[1] || './templates'
    validateCommand(dir)
    break
  }
  
  case 'plan': {
    const dir = args[1] || './templates'
    const outputIndex = args.indexOf('--out')
    const outputFile = outputIndex >= 0 ? args[outputIndex + 1] : undefined
    planCommand(dir, outputFile)
    break
  }
  
  case 'serve': {
    const dir = args[1] || './templates'
    serveCommand(dir)
    break
  }
  
  default:
    console.error(`\n❌ Unknown command: ${command}\n`)
    process.exit(1)
}


#!/usr/bin/env node
/**
 * Verify Knip Findings - Check if "unused" files are actually used in templates
 * 
 * Usage: node scripts/verify-knip-findings.js
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Files knip flagged as potentially unused
const filesToCheck = [
  'packages/gen/src/generators/business-workflow-generator.ts',
  'packages/gen/src/generators/business-logic-analyzer.ts',
  'packages/gen/src/generators/dev-script-generator.ts',
  'packages/gen/src/utils/code-templates.ts',
  'packages/gen/src/utils/errors.ts',
  'packages/gen/src/utils/prisma-errors.ts',
  'packages/gen/src/utils/string-utils.ts',
  'packages/gen/src/plugins/core/plugin-integration.ts',
  'packages/gen/src/plugins/index.ts',
  'packages/gen/src/plugins/ai/ai.types.ts',
  'packages/gen/src/plugins/ai/ai-provider.interface.ts'
]

// Exports that knip flagged as unused
const exportsToCheck = [
  { file: 'packages/gen/src/dmmf-parser.ts', exports: ['getField', 'getRelationTarget', 'getDefaultValueString'] },
  { file: 'packages/gen/src/utils/naming.ts', exports: ['toKebabCase', 'toPascalCase', 'toSnakeCase', 'pluralize', 'singularize'] },
  { file: 'packages/gen/src/utils/gen-folder.ts', exports: ['getNextGenFolder', 'cleanupOldGenFolders'] }
]

console.log('🔍 Verifying Knip Findings\n')
console.log('=' .repeat(80))

// Check file imports
console.log('\n📁 Checking file usage...\n')

filesToCheck.forEach(file => {
  const basename = path.basename(file, '.ts')
  const filename = basename.replace(/\./g, '\\.')
  
  // Search for imports of this file
  try {
    const result = execSync(
      `git grep -l "from.*${filename}" packages/gen/src`,
      { encoding: 'utf8', stdio: 'pipe' }
    ).trim()
    
    if (result) {
      const importers = result.split('\n').filter(f => f !== file)
      if (importers.length > 0) {
        console.log(`✅ ${basename}`)
        console.log(`   Used by: ${importers.join(', ')}`)
      } else {
        console.log(`⚠️  ${basename}`)
        console.log(`   Not imported (may be used in templates)`)
      }
    } else {
      console.log(`❌ ${basename}`)
      console.log(`   No imports found`)
    }
  } catch (error) {
    console.log(`❌ ${basename}`)
    console.log(`   No imports found`)
  }
})

// Check export usage
console.log('\n' + '='.repeat(80))
console.log('\n📤 Checking export usage...\n')

exportsToCheck.forEach(({ file, exports }) => {
  const basename = path.basename(file)
  console.log(`File: ${basename}`)
  
  exports.forEach(exp => {
    try {
      const result = execSync(
        `git grep -l "\\b${exp}\\b" packages/gen/src`,
        { encoding: 'utf8', stdio: 'pipe' }
      ).trim()
      
      if (result) {
        const users = result.split('\n').filter(f => f !== file)
        if (users.length > 0) {
          console.log(`  ✅ ${exp} - used by ${users.length} file(s)`)
        } else {
          console.log(`  ❌ ${exp} - only defined, never used`)
        }
      } else {
        console.log(`  ❌ ${exp} - never referenced`)
      }
    } catch (error) {
      console.log(`  ❌ ${exp} - never referenced`)
    }
  })
  console.log()
})

// Check template usage
console.log('='.repeat(80))
console.log('\n📝 Checking template string usage...\n')

const templateFiles = execSync(
  'git ls-files "packages/gen/src/**/*.template.ts"',
  { encoding: 'utf8' }
).trim().split('\n')

console.log(`Found ${templateFiles.length} template files`)

// Check for references to flagged exports in template strings
const criticalExports = [
  'generatePluginImports',
  'generatePluginRoutes',
  'ai.types',
  'ai-provider.interface'
]

criticalExports.forEach(exp => {
  let found = false
  templateFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8')
      if (content.includes(exp)) {
        if (!found) {
          console.log(`\n✅ ${exp}`)
          found = true
        }
        console.log(`   Referenced in: ${path.basename(file)}`)
      }
    } catch (error) {
      // Ignore read errors
    }
  })
  
  if (!found) {
    console.log(`\n⚠️  ${exp} - not found in templates`)
  }
})

// Summary
console.log('\n' + '='.repeat(80))
console.log('\n📊 SUMMARY\n')
console.log('Safe to remove:')
console.log('  - Files with ❌ and no template usage')
console.log('  - Exports with ❌ and not in templates')
console.log('')
console.log('Keep (false positives):')
console.log('  - packages/sdk-runtime/** (used by generated code)')
console.log('  - Files with ✅ (actively imported)')
console.log('  - Exports found in templates')
console.log('')
console.log('Review carefully:')
console.log('  - Files with ⚠️  (might be legacy or planned features)')
console.log('')
console.log('For detailed analysis, see: KNIP_SAFETY_ANALYSIS.md')
console.log('=' .repeat(80))



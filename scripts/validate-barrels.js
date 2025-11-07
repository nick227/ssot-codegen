#!/usr/bin/env node

/**
 * Barrel Validation Script
 * 
 * Ensures all model folders have index.ts barrels that export symbols.
 * Run as part of CI to catch missing barrels or empty exports.
 */

import { readdirSync, statSync, readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')

// Layers that should have barrel exports
const LAYERS = [
  'contracts',
  'validators',
  'services',
  'controllers',
  'routes'
]

let errors = 0
let warnings = 0

console.log('🔍 Validating barrel exports...\n')

/**
 * Check if a directory has an index.ts barrel
 */
function hasBarrel(dir) {
  return existsSync(join(dir, 'index.ts'))
}

/**
 * Check if barrel exports at least one symbol
 */
function barrelExportsSymbols(barrelPath) {
  try {
    const content = readFileSync(barrelPath, 'utf8')
    
    // Check for export statements
    const hasExports = /export\s+(\*|{|const|class|function|interface|type)/.test(content)
    
    if (!hasExports) {
      return { valid: false, reason: 'No export statements found' }
    }
    
    // Check it's not just comments
    const nonCommentLines = content
      .split('\n')
      .filter(line => !line.trim().startsWith('//') && !line.trim().startsWith('/*'))
      .join('\n')
    
    if (nonCommentLines.trim().length < 10) {
      return { valid: false, reason: 'Barrel appears empty or only has comments' }
    }
    
    return { valid: true }
  } catch (error) {
    return { valid: false, reason: error.message }
  }
}

/**
 * Find all generated projects to validate
 */
function findGeneratedProjects() {
  const generatedDir = join(projectRoot, 'generated')
  
  if (!existsSync(generatedDir)) {
    console.log('⚠️  No generated/ directory found - skipping validation')
    return []
  }
  
  return readdirSync(generatedDir)
    .map(name => join(generatedDir, name))
    .filter(path => statSync(path).isDirectory())
}

/**
 * Validate a single project
 */
function validateProject(projectPath) {
  const projectName = projectPath.split(/[/\\]/).pop()
  console.log(`📦 Validating: ${projectName}`)
  
  const srcDir = join(projectPath, 'src')
  if (!existsSync(srcDir)) {
    console.log(`  ⚠️  No src/ directory found - skipping\n`)
    warnings++
    return
  }
  
  for (const layer of LAYERS) {
    const layerDir = join(srcDir, layer)
    
    if (!existsSync(layerDir)) {
      continue // Layer doesn't exist (fine, not all projects have all layers)
    }
    
    // Get all subdirectories (model folders)
    const modelDirs = readdirSync(layerDir)
      .map(name => join(layerDir, name))
      .filter(path => statSync(path).isDirectory())
    
    for (const modelDir of modelDirs) {
      const modelName = modelDir.split(/[/\\]/).pop()
      
      // Check if barrel exists
      if (!hasBarrel(modelDir)) {
        console.log(`  ❌ Missing barrel: ${layer}/${modelName}/index.ts`)
        errors++
        continue
      }
      
      // Check if barrel exports symbols
      const barrelPath = join(modelDir, 'index.ts')
      const validation = barrelExportsSymbols(barrelPath)
      
      if (!validation.valid) {
        console.log(`  ❌ Invalid barrel: ${layer}/${modelName}/index.ts - ${validation.reason}`)
        errors++
      }
    }
    
    // Check layer-level barrel
    if (modelDirs.length > 0 && !hasBarrel(layerDir)) {
      console.log(`  ⚠️  Missing layer barrel: ${layer}/index.ts`)
      warnings++
    }
  }
  
  console.log(`  ✅ Validation complete\n`)
}

// Main execution
const projects = findGeneratedProjects()

if (projects.length === 0) {
  console.log('✅ No projects to validate\n')
  process.exit(0)
}

for (const project of projects) {
  validateProject(project)
}

// Summary
console.log('─'.repeat(50))
console.log(`\n📊 Summary:`)
console.log(`  Projects validated: ${projects.length}`)
console.log(`  Errors: ${errors}`)
console.log(`  Warnings: ${warnings}\n`)

if (errors > 0) {
  console.log('❌ Barrel validation failed!')
  process.exit(1)
} else if (warnings > 0) {
  console.log('⚠️  Barrel validation passed with warnings')
  process.exit(0)
} else {
  console.log('✅ All barrels valid!')
  process.exit(0)
}


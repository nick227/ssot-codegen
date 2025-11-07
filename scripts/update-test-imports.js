#!/usr/bin/env node

/**
 * Update test file imports to use aliases where appropriate
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.join(__dirname, '../packages/gen/src')

const replacements = [
  // From pipeline/hooks/__tests__/ or pipeline/__tests__/ importing pipeline files
  { pattern: /from ['"]\.\.\/\.\.\/typed-context\.js['"]/g, replacement: "from '@/pipeline/typed-context.js'" },
  { pattern: /from ['"]\.\.\/\.\.\/phase-runner\.js['"]/g, replacement: "from '@/pipeline/phase-runner.js'" },
  { pattern: /from ['"]\.\.\/\.\.\/types\.js['"]/g, replacement: "from '@/pipeline/types.js'" },
]

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  let modified = false
  
  for (const { pattern, replacement } of replacements) {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement)
      modified = true
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8')
    return true
  }
  
  return false
}

function processDirectory(dir) {
  let updatedCount = 0
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '__snapshots__') {
        continue
      }
      updatedCount += processDirectory(fullPath)
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      if (updateFile(fullPath)) {
        console.log(`✓ Updated: ${path.relative(srcDir, fullPath)}`)
        updatedCount++
      }
    }
  }
  
  return updatedCount
}

console.log('🔄 Updating test imports to use aliases...\n')
const count = processDirectory(srcDir)
console.log(`\n✅ Updated ${count} files`)


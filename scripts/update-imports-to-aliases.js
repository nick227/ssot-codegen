#!/usr/bin/env node

/**
 * Update relative imports to use TypeScript path aliases
 * 
 * Converts:
 *   from '../utils/naming.js'     → from '@/utils/naming.js'
 *   from '../../analyzers/...'    → from '@/analyzers/...'
 *   from '../generators/...'      → from '@/generators/...'
 *   etc.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.join(__dirname, '../packages/gen/src')

const replacements = [
  // Cross-module imports (should use aliases)
  { pattern: /from ['"]\.\.\/utils\//g, replacement: "from '@/utils/" },
  { pattern: /from ['"]\.\.\/\.\.\/utils\//g, replacement: "from '@/utils/" },
  { pattern: /from ['"]\.\.\/analyzers\//g, replacement: "from '@/analyzers/" },
  { pattern: /from ['"]\.\.\/\.\.\/analyzers\//g, replacement: "from '@/analyzers/" },
  { pattern: /from ['"]\.\.\/generators\//g, replacement: "from '@/generators/" },
  { pattern: /from ['"]\.\.\/\.\.\/generators\//g, replacement: "from '@/generators/" },
  { pattern: /from ['"]\.\.\/plugins\//g, replacement: "from '@/plugins/" },
  { pattern: /from ['"]\.\.\/\.\.\/plugins\//g, replacement: "from '@/plugins/" },
  { pattern: /from ['"]\.\.\/templates\//g, replacement: "from '@/templates/" },
  { pattern: /from ['"]\.\.\/\.\.\/templates\//g, replacement: "from '@/templates/" },
  { pattern: /from ['"]\.\.\/pipeline\//g, replacement: "from '@/pipeline/" },
  { pattern: /from ['"]\.\.\/\.\.\/pipeline\//g, replacement: "from '@/pipeline/" },
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
      // Skip node_modules, dist, __snapshots__
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

console.log('🔄 Updating imports to use TypeScript path aliases...\n')
const count = processDirectory(srcDir)
console.log(`\n✅ Updated ${count} files`)


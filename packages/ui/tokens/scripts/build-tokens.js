/**
 * Build script to generate platform-specific token files
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

// Import compiled functions
import { compileTailwindConfig } from '../dist/compilers/tailwind.js'
import { compileReactNativeTokens } from '../dist/compilers/react-native.js'
import { validateTokenConsistency } from '../dist/validators/consistency.js'

// Load tokens
const tokensPath = join(rootDir, 'tokens.json')
const tokens = JSON.parse(readFileSync(tokensPath, 'utf-8'))

console.log('🎨 Building SSOT tokens...')

// Validate consistency
console.log('  Validating token consistency...')
const validation = validateTokenConsistency(tokens)

if (!validation.valid) {
  console.error('  ❌ Validation failed:')
  validation.errors.forEach(err => {
    console.error(`     ${err.path}: ${err.message}`)
  })
  process.exit(1)
}

if (validation.warnings.length > 0) {
  console.log('  ⚠️  Warnings:')
  validation.warnings.forEach(warn => {
    console.log(`     ${warn.path}: ${warn.message}`)
  })
}

console.log('  ✓ Token consistency validated')

// Compile Tailwind config
console.log('  Compiling Tailwind config...')
const tailwindConfig = compileTailwindConfig(tokens)
const tailwindOutput = `// Generated from tokens.json - DO NOT EDIT
// @ssot-ui/tokens v${tokens.version}

module.exports = ${JSON.stringify(tailwindConfig, null, 2)}
`

writeFileSync(join(rootDir, 'dist', 'tailwind.js'), tailwindOutput)
console.log('  ✓ Tailwind config generated')

// Compile React Native tokens
console.log('  Compiling React Native tokens...')
const rnTokens = compileReactNativeTokens(tokens)
const rnOutput = `// Generated from tokens.json - DO NOT EDIT
// @ssot-ui/tokens v${tokens.version}

export const tokens = ${JSON.stringify(rnTokens, null, 2)} as const

export type Tokens = typeof tokens
`

writeFileSync(join(rootDir, 'dist', 'react-native.js'), rnOutput)
console.log('  ✓ React Native tokens generated')

console.log('✅ Token build complete!')
console.log(`   Version: ${tokens.version}`)
console.log(`   Colors: ${Object.keys(tokens.colors).length}`)
console.log(`   Spacing: ${Object.keys(tokens.spacing).length}`)
console.log(`   Typography: ${Object.keys(tokens.typography.fontSize).length} sizes`)


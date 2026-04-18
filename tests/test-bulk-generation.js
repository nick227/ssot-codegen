#!/usr/bin/env node
/**
 * Automated test for bulk generation with build
 * Tests that generated projects can be built successfully
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { join, resolve } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, '..')
const rootDir = __dirname

console.log('🧪 Starting automated bulk generation test...\n')

// Test configuration
const configPath = join(rootDir, 'websites', 'config', 'bulk-generate.json')
const testProjectId = 'blog' // Test with blog project (smallest)

let errors = []
let warnings = []
let successes = []

try {
  // Step 1: Run bulk generation with build
  console.log('📦 Step 1: Running bulk generation with --build flag...')
  console.log(`   Config: ${configPath}\n`)
  
  const generateCommand = `pnpm ssot bulk --config ${configPath} --build`
  console.log(`   Command: ${generateCommand}\n`)
  
  try {
    const output = execSync(generateCommand, {
      cwd: rootDir,
      encoding: 'utf-8',
      stdio: 'pipe',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    })
    
    console.log('✅ Generation completed\n')
    successes.push('Bulk generation completed successfully')
    
    // Check for warnings in output
    if (output.includes('⚠️')) {
      const warningLines = output.split('\n').filter(line => line.includes('⚠️'))
      warnings.push(...warningLines.map(line => `Generation warning: ${line.trim()}`))
    }
    
  } catch (error) {
    const errorOutput = error.stdout?.toString() || error.stderr?.toString() || error.message
    errors.push(`Generation failed: ${errorOutput}`)
    console.error('❌ Generation failed:', error.message)
    throw error
  }
  
  // Step 2: Find the latest generated project
  console.log('📁 Step 2: Finding generated projects...')
  const generatedDir = join(rootDir, 'generated')
  
  if (!existsSync(generatedDir)) {
    errors.push('Generated directory does not exist')
    throw new Error('Generated directory not found')
  }
  
  // Find blog projects (they have "Blog Website" in the name)
  // Sort by modification time to get the truly latest
  const fs = await import('fs/promises')
  const entries = await fs.readdir(generatedDir, { withFileTypes: true })
  const blogProjects = await Promise.all(
    entries
      .filter(entry => entry.isDirectory() && entry.name.includes('Blog Website'))
      .map(async entry => {
        const stat = await fs.stat(join(generatedDir, entry.name))
        return { name: entry.name, mtime: stat.mtime }
      })
  )
  blogProjects.sort((a, b) => b.mtime - a.mtime) // Sort by modification time, newest first
  
  if (blogProjects.length === 0) {
    errors.push('No Blog Website projects found')
    throw new Error('No generated projects found')
  }
  
  const latestProject = blogProjects[0].name
  const projectPath = join(generatedDir, latestProject)
  console.log(`   Found project: ${latestProject}\n`)
  successes.push(`Found generated project: ${latestProject}`)
  
  // Step 3: Verify package.json exists and has React/Vite dependencies
  console.log('📄 Step 3: Verifying package.json...')
  const packageJsonPath = join(projectPath, 'package.json')
  
  if (!existsSync(packageJsonPath)) {
    errors.push('package.json not found in generated project')
    throw new Error('package.json not found')
  }
  
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
  console.log(`   Project name: ${packageJson.name}`)
  console.log(`   Version: ${packageJson.version}`)
  
  // Check for React dependencies
  const hasReact = 'react' in (packageJson.dependencies || {})
  const hasReactDom = 'react-dom' in (packageJson.dependencies || {})
  const hasVite = 'vite' in (packageJson.devDependencies || {})
  const hasVitePluginReact = '@vitejs/plugin-react' in (packageJson.devDependencies || {})
  
  console.log(`   React: ${hasReact ? '✅' : '❌'}`)
  console.log(`   React-DOM: ${hasReactDom ? '✅' : '❌'}`)
  console.log(`   Vite: ${hasVite ? '✅' : '❌'}`)
  console.log(`   Vite React Plugin: ${hasVitePluginReact ? '✅' : '❌'}\n`)
  
  if (hasReact && hasReactDom && hasVite && hasVitePluginReact) {
    successes.push('All React/Vite dependencies present in package.json')
  } else {
    errors.push(`Missing dependencies: React=${hasReact}, ReactDOM=${hasReactDom}, Vite=${hasVite}, VitePlugin=${hasVitePluginReact}`)
  }
  
  // Check for frontend scripts
  const hasDevFrontend = packageJson.scripts?.['dev:frontend']
  const hasBuildFrontend = packageJson.scripts?.['build:frontend']
  const hasStartFrontend = packageJson.scripts?.['start:frontend']
  
  console.log('📜 Step 4: Verifying scripts...')
  console.log(`   dev:frontend: ${hasDevFrontend ? '✅' : '❌'} ${hasDevFrontend || '(missing)'}`)
  console.log(`   build:frontend: ${hasBuildFrontend ? '✅' : '❌'} ${hasBuildFrontend || '(missing)'}`)
  console.log(`   start:frontend: ${hasStartFrontend ? '✅' : '❌'} ${hasStartFrontend || '(missing)'}\n`)
  
  if (hasDevFrontend && hasBuildFrontend && hasStartFrontend) {
    successes.push('All frontend scripts present')
  } else {
    warnings.push(`Missing scripts: dev:frontend=${!!hasDevFrontend}, build:frontend=${!!hasBuildFrontend}, start:frontend=${!!hasStartFrontend}`)
  }
  
  // Step 5: Verify config files exist
  console.log('⚙️  Step 5: Verifying config files...')
  const viteConfigPath = join(projectPath, 'vite.config.ts')
  const postcssConfigPath = join(projectPath, 'postcss.config.js')
  const tailwindConfigPath = join(projectPath, 'tailwind.config.js')
  const indexHtmlPath = join(projectPath, 'index.html')
  
  const configFiles = [
    { path: viteConfigPath, name: 'vite.config.ts' },
    { path: postcssConfigPath, name: 'postcss.config.js' },
    { path: tailwindConfigPath, name: 'tailwind.config.js' },
    { path: indexHtmlPath, name: 'index.html' }
  ]
  
  for (const file of configFiles) {
    const exists = existsSync(file.path)
    console.log(`   ${file.name}: ${exists ? '✅' : '❌'}`)
    if (exists) {
      successes.push(`${file.name} exists`)
    } else {
      warnings.push(`${file.name} not found`)
    }
  }
  console.log()
  
  // Step 6: Verify PostCSS config uses ES module syntax
  if (existsSync(postcssConfigPath)) {
    console.log('🔍 Step 6: Verifying PostCSS config syntax...')
    const postcssContent = readFileSync(postcssConfigPath, 'utf-8')
    const usesESModules = postcssContent.includes('export default')
    const usesCommonJS = postcssContent.includes('module.exports')
    
    console.log(`   ES Module syntax: ${usesESModules ? '✅' : '❌'}`)
    console.log(`   CommonJS syntax: ${usesCommonJS ? '❌ (should not be present)' : '✅ (correctly absent)'}\n`)
    
    if (usesESModules && !usesCommonJS) {
      successes.push('PostCSS config uses ES module syntax')
    } else if (!usesESModules) {
      errors.push('PostCSS config does not use ES module syntax')
    } else if (usesCommonJS) {
      errors.push('PostCSS config still uses CommonJS syntax')
    }
  }
  
  // Step 7: Verify Tailwind config uses ES module syntax
  if (existsSync(tailwindConfigPath)) {
    console.log('🔍 Step 7: Verifying Tailwind config syntax...')
    const tailwindContent = readFileSync(tailwindConfigPath, 'utf-8')
    const usesESModules = tailwindContent.includes('export default')
    const usesCommonJS = tailwindContent.includes('module.exports')
    
    console.log(`   ES Module syntax: ${usesESModules ? '✅' : '❌'}`)
    console.log(`   CommonJS syntax: ${usesCommonJS ? '❌ (should not be present)' : '✅ (correctly absent)'}\n`)
    
    if (usesESModules && !usesCommonJS) {
      successes.push('Tailwind config uses ES module syntax')
    } else if (!usesESModules) {
      errors.push('Tailwind config does not use ES module syntax')
    } else if (usesCommonJS) {
      errors.push('Tailwind config still uses CommonJS syntax')
    }
  }
  
  // Step 8: Check if build directory exists (indicates successful build)
  console.log('🏗️  Step 8: Verifying build output...')
  const distPath = join(projectPath, 'dist')
  const distExists = existsSync(distPath)
  console.log(`   dist/ directory: ${distExists ? '✅' : '⚠️  (may not exist if build failed)'}\n`)
  
  if (distExists) {
    successes.push('Build output directory exists')
  } else {
    warnings.push('Build output directory not found (build may have failed)')
  }
  
} catch (error) {
  errors.push(`Test failed: ${error.message}`)
  console.error('\n❌ Test error:', error.message)
  if (error.stack) {
    console.error(error.stack)
  }
}

// Print summary
console.log('\n' + '='.repeat(60))
console.log('📊 TEST SUMMARY')
console.log('='.repeat(60))

if (successes.length > 0) {
  console.log(`\n✅ Successes (${successes.length}):`)
  successes.forEach(s => console.log(`   ✓ ${s}`))
}

if (warnings.length > 0) {
  console.log(`\n⚠️  Warnings (${warnings.length}):`)
  warnings.forEach(w => console.log(`   ⚠ ${w}`))
}

if (errors.length > 0) {
  console.log(`\n❌ Errors (${errors.length}):`)
  errors.forEach(e => console.log(`   ✗ ${e}`))
}

console.log('\n' + '='.repeat(60))

// Exit with appropriate code
if (errors.length > 0) {
  console.log('❌ TEST FAILED\n')
  process.exit(1)
} else if (warnings.length > 0) {
  console.log('⚠️  TEST PASSED WITH WARNINGS\n')
  process.exit(0)
} else {
  console.log('✅ TEST PASSED\n')
  process.exit(0)
}


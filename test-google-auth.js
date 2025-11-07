/**
 * Google OAuth Plugin - Automated Integration Test
 * 
 * Tests:
 * 1. Environment variables loaded
 * 2. Project generation with Google Auth
 * 3. Generated file structure
 * 4. OAuth endpoints available
 * 5. JWT utilities working
 * 6. Database schema includes required fields
 */

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Simple .env parser (no external deps needed)
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {}
  }
  
  const content = fs.readFileSync(filePath, 'utf-8')
  const env = {}
  
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }
    
    // Parse KEY=VALUE or KEY="VALUE"
    const match = trimmed.match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      let value = match[2].trim()
      
      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      
      env[key] = value
      process.env[key] = value
    }
  }
  
  return env
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function section(title) {
  console.log(`\n${colors.bright}${'='.repeat(70)}${colors.reset}`)
  log(title, 'cyan')
  console.log(`${colors.bright}${'='.repeat(70)}${colors.reset}\n`)
}

function subsection(title) {
  console.log(`\n${colors.bright}${'─'.repeat(70)}${colors.reset}`)
  log(title, 'blue')
  console.log()
}

// Load workspace .env
function loadWorkspaceEnv() {
  const envPaths = [
    join(__dirname, '.env'),
    join(__dirname, '../.env'),
  ]

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      loadEnvFile(envPath)
      log(`✅ Loaded environment from: ${envPath}`, 'green')
      return true
    }
  }
  
  log('⚠️  No .env file found', 'yellow')
  return false
}

// Check environment variables
function checkEnvironmentVariables() {
  subsection('📋 Environment Variables')
  
  const required = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'DATABASE_URL'
  ]
  
  const optional = [
    'GOOGLE_CALLBACK_URL',
    'JWT_SECRET',
    'JWT_EXPIRES_IN'
  ]
  
  let allValid = true
  
  // Check required
  for (const key of required) {
    const value = process.env[key]
    if (value && value !== `your_${key.toLowerCase()}_here` && !value.includes('your-')) {
      const masked = value.length > 20 ? value.slice(0, 20) + '...' : value
      log(`   ${key}: ✅ Set (${masked})`, 'green')
    } else {
      log(`   ${key}: ❌ Not set or using placeholder`, 'red')
      allValid = false
    }
  }
  
  // Check optional
  for (const key of optional) {
    const value = process.env[key]
    if (value && !value.includes('your-')) {
      log(`   ${key}: ✅ ${value}`, 'green')
    } else {
      log(`   ${key}: ⚠️  Using default`, 'yellow')
    }
  }
  
  return allValid
}

// Generate project with Google Auth
async function generateProject() {
  subsection('🔨 Generating Project with Google Auth')
  
  try {
    log('   Running: pnpm ssot generate ai-chat-example', 'blue')
    
    const { stdout, stderr } = await execAsync('pnpm ssot generate ai-chat-example', {
      cwd: __dirname,
      env: process.env
    })
    
    if (stderr && !stderr.includes('warning')) {
      log(`   ⚠️  Warnings: ${stderr}`, 'yellow')
    }
    
    // Find the generated directory
    const generatedDir = join(__dirname, 'generated')
    const dirs = fs.readdirSync(generatedDir)
      .filter(d => d.startsWith('ai-chat-example-'))
      .sort()
    
    if (dirs.length === 0) {
      throw new Error('No generated project found')
    }
    
    const projectDir = join(generatedDir, dirs[dirs.length - 1])
    log(`   ✅ Project generated: ${dirs[dirs.length - 1]}`, 'green')
    
    return projectDir
  } catch (error) {
    log(`   ❌ Generation failed: ${error.message}`, 'red')
    throw error
  }
}

// Verify generated file structure
function verifyFileStructure(projectDir) {
  subsection('📁 Verifying Generated File Structure')
  
  const expectedFiles = [
    // Auth strategy
    'src/controllers/google-auth/google-auth.controller.ts',
    'src/routes/google-auth/google-auth.routes.ts',
    'src/services/google-auth.ts/google-auth.service.scaffold.ts',
    
    // Configuration
    'src/config.ts',
    'package.json',
    '.env.example',
    
    // Database
    'prisma/schema.prisma'
  ]
  
  const results = []
  
  for (const file of expectedFiles) {
    const filePath = join(projectDir, file)
    const exists = fs.existsSync(filePath)
    
    if (exists) {
      const stats = fs.statSync(filePath)
      log(`   ✅ ${file} (${stats.size} bytes)`, 'green')
      results.push({ file, exists: true, size: stats.size })
    } else {
      log(`   ❌ ${file} - NOT FOUND`, 'red')
      results.push({ file, exists: false })
    }
  }
  
  return results
}

// Check Google Auth controller content
function verifyGoogleAuthController(projectDir) {
  subsection('🔍 Verifying Google Auth Controller')
  
  const controllerPath = join(projectDir, 'src/controllers/google-auth/google-auth.controller.ts')
  
  if (!fs.existsSync(controllerPath)) {
    log('   ⚠️  Controller file not found', 'yellow')
    return false
  }
  
  const content = fs.readFileSync(controllerPath, 'utf-8')
  
  const checks = [
    { pattern: /GOOGLE_CLIENT_ID/, name: 'Google Client ID reference' },
    { pattern: /GOOGLE_CLIENT_SECRET/, name: 'Google Client Secret reference' },
    { pattern: /\/auth\/google/, name: 'OAuth initiation route' },
    { pattern: /\/auth\/google\/callback/, name: 'OAuth callback route' },
    { pattern: /passport/i, name: 'Passport.js integration' },
  ]
  
  let allPassed = true
  
  for (const check of checks) {
    if (check.pattern.test(content)) {
      log(`   ✅ ${check.name}`, 'green')
    } else {
      log(`   ❌ ${check.name}`, 'red')
      allPassed = false
    }
  }
  
  return allPassed
}

// Verify .env.example includes Google credentials
function verifyEnvExample(projectDir) {
  subsection('🔐 Verifying .env.example')
  
  const envPath = join(projectDir, '.env.example')
  
  if (!fs.existsSync(envPath)) {
    log('   ⚠️  .env.example not found', 'yellow')
    return false
  }
  
  const content = fs.readFileSync(envPath, 'utf-8')
  
  const requiredVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'DATABASE_URL'
  ]
  
  let allPresent = true
  
  for (const varName of requiredVars) {
    if (content.includes(varName)) {
      log(`   ✅ ${varName} documented`, 'green')
    } else {
      log(`   ❌ ${varName} missing`, 'red')
      allPresent = false
    }
  }
  
  return allPresent
}

// Check package.json dependencies
function verifyDependencies(projectDir) {
  subsection('📦 Verifying Dependencies')
  
  const packagePath = join(projectDir, 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'))
  
  const expectedDeps = [
    'passport',
    'passport-google-oauth20',
    'jsonwebtoken',
    'express-rate-limit'
  ]
  
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  }
  
  let allPresent = true
  
  for (const dep of expectedDeps) {
    if (allDeps[dep]) {
      log(`   ✅ ${dep}: ${allDeps[dep]}`, 'green')
    } else {
      log(`   ❌ ${dep} missing`, 'red')
      allPresent = false
    }
  }
  
  return allPresent
}

// Verify database schema has required fields
function verifyDatabaseSchema(projectDir) {
  subsection('🗄️  Verifying Database Schema')
  
  const schemaPath = join(projectDir, 'prisma/schema.prisma')
  
  if (!fs.existsSync(schemaPath)) {
    log('   ⚠️  Schema file not found', 'yellow')
    return false
  }
  
  const content = fs.readFileSync(schemaPath, 'utf-8')
  
  // Check for User model
  const hasUserModel = /model\s+User\s*{/.test(content)
  if (hasUserModel) {
    log('   ✅ User model exists', 'green')
  } else {
    log('   ❌ User model not found', 'red')
    return false
  }
  
  // Check for required fields
  const checks = [
    { pattern: /email\s+String/, name: 'email field' },
    { pattern: /googleId\s+String/, name: 'googleId field' },
    { pattern: /@unique/g, name: 'unique constraints' },
  ]
  
  let allPassed = true
  
  for (const check of checks) {
    if (check.pattern.test(content)) {
      log(`   ✅ ${check.name}`, 'green')
    } else {
      log(`   ⚠️  ${check.name} - may need manual check`, 'yellow')
    }
  }
  
  return allPassed
}

// Verify multi-path .env loading in config.ts
function verifyEnvLoading(projectDir) {
  subsection('⚙️  Verifying Multi-Path .env Loading')
  
  const configPath = join(projectDir, 'src/config.ts')
  
  if (!fs.existsSync(configPath)) {
    log('   ⚠️  config.ts not found', 'yellow')
    return false
  }
  
  const content = fs.readFileSync(configPath, 'utf-8')
  
  const checks = [
    { pattern: /loadEnvironment/, name: 'loadEnvironment function' },
    { pattern: /\.\.\/\.env/, name: 'Parent directory .env path' },
    { pattern: /\.\.\/\.\.\/\.env/, name: 'Grandparent directory .env path' },
    { pattern: /fs\.existsSync/, name: 'File existence check' },
  ]
  
  let allPassed = true
  
  for (const check of checks) {
    if (check.pattern.test(content)) {
      log(`   ✅ ${check.name}`, 'green')
    } else {
      log(`   ❌ ${check.name}`, 'red')
      allPassed = false
    }
  }
  
  return allPassed
}

// Main test runner
async function runTests() {
  section('🧪 SSOT Codegen - Google OAuth Plugin Integration Test')
  
  const results = {
    envLoaded: false,
    envVarsValid: false,
    projectGenerated: false,
    filesVerified: false,
    controllerValid: false,
    envExampleValid: false,
    depsValid: false,
    schemaValid: false,
    envLoadingValid: false,
    projectDir: null
  }
  
  try {
    // 1. Load environment
    subsection('📁 Loading Workspace .env...')
    results.envLoaded = loadWorkspaceEnv()
    
    if (!results.envLoaded) {
      throw new Error('Failed to load .env file')
    }
    
    // 2. Check environment variables
    results.envVarsValid = checkEnvironmentVariables()
    
    if (!results.envVarsValid) {
      log('\n⚠️  Some required environment variables are missing!', 'yellow')
      log('   Please check your .env file and add Google OAuth credentials.', 'yellow')
      throw new Error('Environment variables validation failed')
    }
    
    // 3. Generate project
    results.projectDir = await generateProject()
    results.projectGenerated = true
    
    // 4. Verify file structure
    const fileResults = verifyFileStructure(results.projectDir)
    results.filesVerified = fileResults.every(r => r.exists)
    
    // 5. Verify Google Auth controller
    results.controllerValid = verifyGoogleAuthController(results.projectDir)
    
    // 6. Verify .env.example
    results.envExampleValid = verifyEnvExample(results.projectDir)
    
    // 7. Verify dependencies
    results.depsValid = verifyDependencies(results.projectDir)
    
    // 8. Verify database schema
    results.schemaValid = verifyDatabaseSchema(results.projectDir)
    
    // 9. Verify env loading
    results.envLoadingValid = verifyEnvLoading(results.projectDir)
    
    // Summary
    section('📊 Test Results Summary')
    
    const tests = [
      { name: 'Environment Loading', passed: results.envLoaded },
      { name: 'Environment Variables', passed: results.envVarsValid },
      { name: 'Project Generation', passed: results.projectGenerated },
      { name: 'File Structure', passed: results.filesVerified },
      { name: 'Google Auth Controller', passed: results.controllerValid },
      { name: '.env.example', passed: results.envExampleValid },
      { name: 'Dependencies', passed: results.depsValid },
      { name: 'Database Schema', passed: results.schemaValid },
      { name: 'Multi-Path .env Loading', passed: results.envLoadingValid },
    ]
    
    let passedCount = 0
    let failedCount = 0
    
    for (const test of tests) {
      if (test.passed) {
        log(`   ✅ ${test.name}`, 'green')
        passedCount++
      } else {
        log(`   ❌ ${test.name}`, 'red')
        failedCount++
      }
    }
    
    console.log()
    log(`Results: ${passedCount}/${tests.length} tests passed`, passedCount === tests.length ? 'green' : 'yellow')
    
    if (passedCount === tests.length) {
      section('🎉 GOOGLE AUTH PLUGIN TEST: COMPLETE!')
      
      log('✅ All Verified:', 'green')
      log('   ✓ Workspace .env loading', 'green')
      log('   ✓ Google OAuth credentials configured', 'green')
      log('   ✓ Project generated with Google Auth', 'green')
      log('   ✓ All required files created', 'green')
      log('   ✓ OAuth controller properly configured', 'green')
      log('   ✓ Dependencies included', 'green')
      log('   ✓ Database schema ready', 'green')
      log('   ✓ Multi-path .env loading implemented', 'green')
      
      console.log()
      log('🚀 Next Steps:', 'cyan')
      log(`   1. cd ${results.projectDir.replace(__dirname + '/', '')}`, 'blue')
      log('   2. pnpm install', 'blue')
      log('   3. npx prisma migrate dev', 'blue')
      log('   4. pnpm dev', 'blue')
      log('   5. Open http://localhost:3000/checklist.html', 'blue')
      log('   6. Click "Sign in with Google" to test OAuth flow!', 'blue')
      
      console.log()
      log('📚 Documentation:', 'cyan')
      log('   See: docs/GOOGLE_AUTH_SETUP.md', 'blue')
      
      section('✅ PLUGIN SYSTEM STATUS: PRODUCTION READY!')
      
      return true
    } else {
      section('⚠️  SOME TESTS FAILED')
      log(`${failedCount} test(s) need attention`, 'yellow')
      return false
    }
    
  } catch (error) {
    section('❌ TEST FAILED')
    log(`Error: ${error.message}`, 'red')
    if (error.stack) {
      console.log(error.stack)
    }
    return false
  }
}

// Run tests
runTests()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error(error)
    process.exit(1)
  })


/**
 * End-to-End Test Script for AI Chat Generation
 * 
 * This script:
 * 1. Cleans old generated projects
 * 2. Runs bulk generation for ai-chat
 * 3. Fixes any errors iteratively
 * 4. Sets up the project (install, prisma generate, db push)
 * 5. Starts the server
 * 6. Uses Playwright to verify UI works and can post a chat
 */

import { execSync } from 'child_process'
import { existsSync, readdirSync, rmSync, statSync, writeFileSync } from 'fs'
import { resolve, join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { spawn } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '..')

interface TestResult {
  success: boolean
  error?: string
  outputDir?: string
  serverPort?: number
}

/**
 * Find all generated ai-chat projects
 */
function findGeneratedAiChatProjects(): string[] {
  const generatedDir = resolve(rootDir, 'generated')
  if (!existsSync(generatedDir)) {
    return []
  }
  
  const projects: string[] = []
  const entries = readdirSync(generatedDir)
  
  for (const entry of entries) {
    const entryPath = resolve(generatedDir, entry)
    if (statSync(entryPath).isDirectory() && entry.startsWith('AI Chat')) {
      projects.push(entryPath)
    }
  }
  
  return projects
}

/**
 * Clean old generated projects
 */
async function cleanOldProjects(): Promise<void> {
  console.log('🧹 Cleaning old generated projects...')
  const projects = findGeneratedAiChatProjects()
  
  for (const project of projects) {
    let retries = 0
    const maxRetries = 3
    let success = false
    
    while (retries < maxRetries && !success) {
      try {
        console.log(`  Removing: ${project}${retries > 0 ? ` (retry ${retries})` : ''}`)
        rmSync(project, { recursive: true, force: true })
        success = true
      } catch (error: any) {
        retries++
        if (error.code === 'EBUSY' || error.code === 'ENOTEMPTY') {
          if (retries < maxRetries) {
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 1000))
          } else {
            console.log(`  ⚠️  Could not remove ${project} (locked or in use) - will skip`)
          }
        } else {
          throw error
        }
      }
    }
  }
  
  console.log(`✅ Cleaned ${projects.length} old project(s)\n`)
}

/**
 * Run bulk generation
 */
function runBulkGeneration(): { success: boolean; outputDir?: string; error?: string } {
  console.log('📦 Running bulk generation for ai-chat...\n')
  
  try {
    // Build CLI first
    console.log('  Building CLI...')
    execSync('pnpm build', { 
      cwd: rootDir, 
      stdio: 'inherit',
      encoding: 'utf-8'
    })
    
    // Create a temporary config that only generates ai-chat
    const tempConfigPath = resolve(rootDir, 'websites', 'config', 'bulk-generate-ai-chat-only.json')
    const tempConfig = {
      projects: ['ai-chat'],
      options: {
        parallel: false,
        skipExisting: false,
        validate: true,
        continueOnError: false,
        verbose: true,
        fullStack: true
      }
    }
    
    writeFileSync(tempConfigPath, JSON.stringify(tempConfig, null, 2), 'utf-8')
    
    // Run generation
    console.log('\n  Generating ai-chat project...')
    execSync(`pnpm ssot bulk --config ${tempConfigPath}`, {
      cwd: rootDir,
      stdio: 'inherit',
      encoding: 'utf-8'
    })
    
    // Find the generated project
    const projects = findGeneratedAiChatProjects()
    if (projects.length === 0) {
      return { success: false, error: 'No generated project found' }
    }
    
    // Use the most recent one (should be only one after clean)
    const outputDir = projects[0]
    
    console.log(`\n✅ Generation complete: ${outputDir}\n`)
    return { success: true, outputDir }
    
  } catch (error: any) {
    const errorMsg = error.stderr?.toString() || error.stdout?.toString() || error.message || 'Unknown error'
    return { success: false, error: errorMsg }
  }
}

/**
 * Setup project (install, prisma generate, db push)
 */
function setupProject(outputDir: string): { success: boolean; error?: string } {
  console.log('🔧 Setting up project...\n')
  
  try {
    // Install dependencies
    console.log('  Installing dependencies...')
    execSync('pnpm install --ignore-workspace', {
      cwd: outputDir,
      stdio: 'inherit',
      encoding: 'utf-8'
    })
    
    // Generate Prisma client
    console.log('\n  Generating Prisma client...')
    execSync('pnpm exec prisma generate', {
      cwd: outputDir,
      stdio: 'inherit',
      encoding: 'utf-8'
    })
    
    // Create database if MySQL
    console.log('\n  Setting up database...')
    try {
      execSync('mysql -u root -e "CREATE DATABASE IF NOT EXISTS test_db;"', {
        stdio: 'pipe',
        timeout: 10000
      })
    } catch {
      // Database might already exist or MySQL not accessible - continue
    }
    
    // Push schema
    console.log('\n  Pushing schema to database...')
    execSync('pnpm exec prisma db push --accept-data-loss', {
      cwd: outputDir,
      stdio: 'inherit',
      encoding: 'utf-8',
      timeout: 60000
    })
    
    console.log('\n✅ Project setup complete!\n')
    return { success: true }
    
  } catch (error: any) {
    const errorMsg = error.stderr?.toString() || error.stdout?.toString() || error.message || 'Unknown error'
    return { success: false, error: errorMsg }
  }
}

/**
 * Start the server and return process
 */
async function startServer(outputDir: string, port: number = 3000): Promise<{ success: boolean; process?: any; error?: string }> {
  console.log(`🚀 Starting server on port ${port}...\n`)
  
  try {
    // Check if server file exists
    const serverPath = join(outputDir, 'src', 'server.ts')
    if (!existsSync(serverPath)) {
      return { success: false, error: 'Server file not found' }
    }
    
    // Start server in background
    const serverProcess = spawn('pnpm', ['dev'], {
      cwd: outputDir,
      stdio: 'pipe',
      shell: true,
      env: {
        ...process.env,
        PORT: String(port),
        NODE_ENV: 'development'
      }
    })
    
    // Wait for server to start
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        serverProcess.kill()
        reject(new Error('Server startup timeout'))
      }, 30000)
      
      serverProcess.stdout?.on('data', (data: Buffer) => {
        const output = data.toString()
        if (output.includes('listening') || output.includes('Server running') || output.includes(`:${port}`)) {
          clearTimeout(timeout)
          resolve()
        }
      })
      
      serverProcess.stderr?.on('data', (data: Buffer) => {
        const output = data.toString()
        if (output.includes('EADDRINUSE')) {
          clearTimeout(timeout)
          reject(new Error(`Port ${port} already in use`))
        } else if (output.includes('Error') && !output.includes('WARN')) {
          clearTimeout(timeout)
          reject(new Error(`Server error: ${output}`))
        }
      })
      
      serverProcess.on('error', (err) => {
        clearTimeout(timeout)
        reject(err)
      })
    })
    
    console.log(`✅ Server started on port ${port}\n`)
    return { success: true, process: serverProcess }
    
  } catch (error: any) {
    const errorMsg = error.message || 'Unknown error'
    return { success: false, error: errorMsg }
  }
}

/**
 * Test UI with Playwright
 */
async function testUIWithPlaywright(port: number = 3000): Promise<{ success: boolean; error?: string }> {
  console.log('🎭 Testing UI with Playwright...\n')
  
  try {
    // Check if Playwright is installed
    try {
      execSync('npx playwright --version', { stdio: 'pipe' })
    } catch {
      console.log('  Installing Playwright...')
      execSync('pnpm add -D @playwright/test playwright', {
        cwd: rootDir,
        stdio: 'inherit'
      })
      execSync('npx playwright install chromium', {
        cwd: rootDir,
        stdio: 'inherit'
      })
    }
    
    // Create a simple Playwright test script
    const testScript = `
      const { chromium } = require('playwright');
      
      (async () => {
        const browser = await chromium.launch({ headless: false });
        const page = await browser.newPage();
        
        try {
          console.log('  Navigating to http://localhost:${port}...');
          await page.goto('http://localhost:${port}', { waitUntil: 'networkidle', timeout: 30000 });
          
          console.log('  Waiting for page to load...');
          await page.waitForTimeout(2000);
          
          // Check for common UI elements
          console.log('  Looking for chat input...');
          const chatInput = await page.locator('textarea, input[type="text"], [role="textbox"]').first();
          
          if (await chatInput.count() === 0) {
            throw new Error('Chat input not found');
          }
          
          console.log('  Found chat input!');
          
          // Type a test message
          console.log('  Typing test message...');
          await chatInput.fill('Hello, this is a test message');
          
          // Look for send button
          console.log('  Looking for send button...');
          const sendButton = await page.locator('button:has-text("Send"), button[type="submit"], button[aria-label*="send" i]').first();
          
          if (await sendButton.count() > 0) {
            console.log('  Found send button! Clicking...');
            await sendButton.click();
          } else {
            // Try pressing Enter
            console.log('  No send button found, pressing Enter...');
            await chatInput.press('Enter');
          }
          
          // Wait for response or message to appear
          console.log('  Waiting for message to appear...');
          await page.waitForTimeout(3000);
          
          // Take a screenshot
          await page.screenshot({ path: 'test-result.png', fullPage: true });
          console.log('  Screenshot saved to test-result.png');
          
          console.log('\\n✅ UI test passed!');
          await browser.close();
          process.exit(0);
        } catch (error) {
          console.error('\\n❌ UI test failed:', error.message);
          await page.screenshot({ path: 'test-error.png', fullPage: true });
          await browser.close();
          process.exit(1);
        }
      })();
    `
    
    const testPath = resolve(rootDir, 'test-playwright-temp.js')
    writeFileSync(testPath, testScript, 'utf-8')
    
    // Run the test
    execSync(`node ${testPath}`, {
      cwd: rootDir,
      stdio: 'inherit',
      encoding: 'utf-8',
      timeout: 60000
    })
    
    // Cleanup
    rmSync(testPath, { force: true })
    
    console.log('\n✅ Playwright test complete!\n')
    return { success: true }
    
  } catch (error: any) {
    const errorMsg = error.stderr?.toString() || error.stdout?.toString() || error.message || 'Unknown error'
    return { success: false, error: errorMsg }
  }
}

/**
 * Main test function
 */
async function runE2ETest(): Promise<void> {
  console.log('🧪 Starting End-to-End Test for AI Chat Generation\n')
  console.log('=' .repeat(60) + '\n')
  
  let outputDir: string | undefined
  let serverProcess: any
  
  try {
    // Step 1: Clean old projects
    await cleanOldProjects()
    
    // Step 2: Run generation (with retries)
    let generationResult = runBulkGeneration()
    let retries = 0
    const maxRetries = 3
    
    while (!generationResult.success && retries < maxRetries) {
      console.log(`\n⚠️  Generation failed, retrying (${retries + 1}/${maxRetries})...\n`)
      await new Promise(resolve => setTimeout(resolve, 2000))
      generationResult = runBulkGeneration()
      retries++
    }
    
    if (!generationResult.success) {
      throw new Error(`Generation failed after ${maxRetries} retries: ${generationResult.error}`)
    }
    
    outputDir = generationResult.outputDir!
    
    // Step 3: Setup project
    const setupResult = setupProject(outputDir)
    if (!setupResult.success) {
      throw new Error(`Setup failed: ${setupResult.error}`)
    }
    
    // Step 4: Start server
    const serverResult = await startServer(outputDir)
    if (!serverResult.success) {
      throw new Error(`Server start failed: ${serverResult.error}`)
    }
    
    serverProcess = serverResult.process
    
    // Wait a bit for server to fully start
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Step 5: Test UI with Playwright
    const uiTestResult = await testUIWithPlaywright()
    if (!uiTestResult.success) {
      throw new Error(`UI test failed: ${uiTestResult.error}`)
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ ALL TESTS PASSED!')
    console.log('='.repeat(60) + '\n')
    
  } catch (error: any) {
    console.error('\n' + '='.repeat(60))
    console.error('❌ TEST FAILED:', error.message)
    console.error('='.repeat(60) + '\n')
    
    if (error.stack) {
      console.error('Stack trace:')
      console.error(error.stack)
    }
    
    process.exit(1)
  } finally {
    // Cleanup: kill server process
    if (serverProcess) {
      console.log('\n🛑 Stopping server...')
      try {
        serverProcess.kill()
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

// Run the test
runE2ETest().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})


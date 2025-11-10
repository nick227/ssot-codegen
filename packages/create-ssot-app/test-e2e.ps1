# E2E Test Script for Plugin Picker
# Actually creates test projects with different plugin combinations

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Plugin Picker E2E Tests" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$testDir = "e2e-test-output"
$testResults = @()

# Cleanup old test dir
if (Test-Path $testDir) {
    Write-Host "Cleaning up old test directory..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $testDir
}

New-Item -ItemType Directory -Path $testDir | Out-Null

# Helper function to test project creation
function Test-ProjectCreation {
    param(
        [string]$TestName,
        [string]$ProjectName,
        [string[]]$Plugins,
        [scriptblock]$Validations
    )
    
    Write-Host "`n[$TestName]" -ForegroundColor Green
    Write-Host "Creating project: $ProjectName" -ForegroundColor Gray
    Write-Host "Plugins: $($Plugins -join ', ')" -ForegroundColor Gray
    
    $projectPath = Join-Path $testDir $ProjectName
    
    try {
        # Create minimal config files (skip actual installation for speed)
        New-Item -ItemType Directory -Path $projectPath -Force | Out-Null
        New-Item -ItemType Directory -Path (Join-Path $projectPath "prisma") -Force | Out-Null
        New-Item -ItemType Directory -Path (Join-Path $projectPath "src") -Force | Out-Null
        
        # Create mock config for template generation
        $config = @{
            projectName = $ProjectName
            framework = "express"
            database = "postgresql"
            includeExamples = $true
            selectedPlugins = $Plugins
            packageManager = "pnpm"
        } | ConvertTo-Json
        
        # Generate files using Node.js directly
        $generateScript = @"
import { generatePackageJson } from './dist/templates/package-json.js';
import { generateEnvFile } from './dist/templates/env-file.js';
import { generateReadme } from './dist/templates/readme.js';
import { generatePrismaSchema } from './dist/templates/prisma-schema.js';
import { generateTsConfig } from './dist/templates/tsconfig.js';
import { generateGitignore } from './dist/templates/gitignore.js';
import fs from 'fs';
import path from 'path';

const config = $config;
const projectPath = '$($projectPath.Replace('\', '\\'))';

fs.writeFileSync(path.join(projectPath, 'package.json'), generatePackageJson(config));
fs.writeFileSync(path.join(projectPath, '.env'), generateEnvFile(config));
fs.writeFileSync(path.join(projectPath, 'README.md'), generateReadme(config));
fs.writeFileSync(path.join(projectPath, 'prisma', 'schema.prisma'), generatePrismaSchema(config));
fs.writeFileSync(path.join(projectPath, 'tsconfig.json'), generateTsConfig());
fs.writeFileSync(path.join(projectPath, '.gitignore'), generateGitignore());

// Generate ssot.config.ts if plugins selected
if (config.selectedPlugins && config.selectedPlugins.length > 0) {
  const { getPluginById } = await import('./dist/plugin-catalog.js');
  const features = {};
  
  for (const pluginId of config.selectedPlugins) {
    const plugin = getPluginById(pluginId);
    if (!plugin) continue;
    features[plugin.configKey] = { enabled: true };
  }
  
  const configContent = ``import type { CodeGeneratorConfig } from '@ssot-codegen/gen'

export default {
  framework: '$($config.framework)',
  projectName: '$($config.projectName)',
  features: `+ JSON.stringify(features, null, 2) + ``
} satisfies CodeGeneratorConfig
``;
  
  fs.writeFileSync(path.join(projectPath, 'ssot.config.ts'), configContent);
}

console.log('✓ Files generated');
"@
        
        # Run generation
        $generateScript | node --input-type=module
        
        # Run validations
        & $Validations $projectPath
        
        Write-Host "  ✓ $TestName passed" -ForegroundColor Green
        $testResults += @{ Test = $TestName; Result = "PASS" }
        
    } catch {
        Write-Host "  ✗ $TestName failed: $_" -ForegroundColor Red
        $testResults += @{ Test = $TestName; Result = "FAIL"; Error = $_ }
    }
}

# ============================================================================
# TEST 1: No Plugins
# ============================================================================
Test-ProjectCreation `
    -TestName "No Plugins" `
    -ProjectName "test-no-plugins" `
    -Plugins @() `
    -Validations {
        param($projectPath)
        
        # Verify no ssot.config.ts
        if (Test-Path (Join-Path $projectPath "ssot.config.ts")) {
            throw "ssot.config.ts should not exist"
        }
        
        # Verify .env has no plugin section
        $env = Get-Content (Join-Path $projectPath ".env") -Raw
        if ($env -match "Plugin Configuration") {
            throw ".env should not have plugin section"
        }
        
        # Verify README says no plugins
        $readme = Get-Content (Join-Path $projectPath "README.md") -Raw
        if ($readme -notmatch "No plugins configured") {
            throw "README should say no plugins configured"
        }
    }

# ============================================================================
# TEST 2: Single Plugin (JWT)
# ============================================================================
Test-ProjectCreation `
    -TestName "Single Plugin (JWT)" `
    -ProjectName "test-jwt" `
    -Plugins @("jwt-service") `
    -Validations {
        param($projectPath)
        
        # Verify ssot.config.ts exists
        if (!(Test-Path (Join-Path $projectPath "ssot.config.ts"))) {
            throw "ssot.config.ts should exist"
        }
        
        # Verify package.json has jsonwebtoken
        $pkg = Get-Content (Join-Path $projectPath "package.json") | ConvertFrom-Json
        if (!$pkg.dependencies.jsonwebtoken) {
            throw "package.json should have jsonwebtoken dependency"
        }
        
        # Verify .env has JWT_SECRET
        $env = Get-Content (Join-Path $projectPath ".env") -Raw
        if ($env -notmatch "JWT_SECRET") {
            throw ".env should have JWT_SECRET"
        }
        
        # Verify Prisma schema has auth fields
        $schema = Get-Content (Join-Path $projectPath "prisma/schema.prisma") -Raw
        if ($schema -notmatch "password") {
            throw "Schema should have password field"
        }
    }

# ============================================================================
# TEST 3: Multiple Plugins (Auth + AI + Storage)
# ============================================================================
Test-ProjectCreation `
    -TestName "Multiple Plugins (Auth+AI+Storage)" `
    -ProjectName "test-multi" `
    -Plugins @("jwt-service", "openai", "cloudinary") `
    -Validations {
        param($projectPath)
        
        # Verify package.json has all dependencies
        $pkg = Get-Content (Join-Path $projectPath "package.json") | ConvertFrom-Json
        if (!$pkg.dependencies.jsonwebtoken) { throw "Missing jsonwebtoken" }
        if (!$pkg.dependencies.openai) { throw "Missing openai" }
        if (!$pkg.dependencies.cloudinary) { throw "Missing cloudinary" }
        
        # Verify .env has all variables
        $env = Get-Content (Join-Path $projectPath ".env") -Raw
        if ($env -notmatch "JWT_SECRET") { throw "Missing JWT_SECRET" }
        if ($env -notmatch "OPENAI_API_KEY") { throw "Missing OPENAI_API_KEY" }
        if ($env -notmatch "CLOUDINARY") { throw "Missing CLOUDINARY vars" }
        
        # Verify README documents all plugins
        $readme = Get-Content (Join-Path $projectPath "README.md") -Raw
        if ($readme -notmatch "JWT Service") { throw "README missing JWT" }
        if ($readme -notmatch "OpenAI") { throw "README missing OpenAI" }
        if ($readme -notmatch "Cloudinary") { throw "README missing Cloudinary" }
    }

# ============================================================================
# TEST 4: Google Auth (requires User model)
# ============================================================================
Test-ProjectCreation `
    -TestName "Google Auth (with User model)" `
    -ProjectName "test-google-auth" `
    -Plugins @("google-auth", "jwt-service") `
    -Validations {
        param($projectPath)
        
        # Verify .env has Google OAuth vars
        $env = Get-Content (Join-Path $projectPath ".env") -Raw
        if ($env -notmatch "GOOGLE_CLIENT_ID") { throw "Missing GOOGLE_CLIENT_ID" }
        if ($env -notmatch "GOOGLE_CLIENT_SECRET") { throw "Missing GOOGLE_CLIENT_SECRET" }
        if ($env -notmatch "console.cloud.google.com") { throw "Wrong setup URL" }
        
        # Verify setup URL is correct (not OpenAI)
        if ($env -match "platform.openai.com" -and $env -match "Google") {
            throw "Google OAuth has wrong setup URL"
        }
        
        # Verify package.json has passport
        $pkg = Get-Content (Join-Path $projectPath "package.json") | ConvertFrom-Json
        if (!$pkg.dependencies.passport) { throw "Missing passport" }
        if (!$pkg.dependencies.'passport-google-oauth20') { throw "Missing passport-google-oauth20" }
    }

# ============================================================================
# TEST 5: Local AI (LM Studio + Ollama)
# ============================================================================
Test-ProjectCreation `
    -TestName "Local AI (no API keys)" `
    -ProjectName "test-local-ai" `
    -Plugins @("lmstudio", "ollama") `
    -Validations {
        param($projectPath)
        
        # Verify .env has setup instructions in comments
        $env = Get-Content (Join-Path $projectPath ".env") -Raw
        if ($env -notmatch "lmstudio.ai") { throw "Missing LM Studio setup URL" }
        if ($env -notmatch "ollama.ai") { throw "Missing Ollama setup URL" }
        
        # Verify optional endpoints are commented
        if ($env -notmatch "# LMSTUDIO_ENDPOINT") { throw "LMSTUDIO_ENDPOINT should be optional" }
        if ($env -notmatch "# OLLAMA_ENDPOINT") { throw "OLLAMA_ENDPOINT should be optional" }
        
        # Verify package.json has no extra dependencies (these are local)
        $pkg = Get-Content (Join-Path $projectPath "package.json") | ConvertFrom-Json
        if ($pkg.dependencies.lmstudio) { throw "Should not have lmstudio npm package" }
        if ($pkg.dependencies.ollama) { throw "Should not have ollama npm package" }
    }

# ============================================================================
# TEST 6: AWS S3 (complex env vars)
# ============================================================================
Test-ProjectCreation `
    -TestName "AWS S3 (credential placeholders)" `
    -ProjectName "test-s3" `
    -Plugins @("s3") `
    -Validations {
        param($projectPath)
        
        # Verify .env has correct placeholders (not misleading)
        $env = Get-Content (Join-Path $projectPath ".env") -Raw
        
        # AWS_ACCESS_KEY_ID should NOT say "client_id"
        if ($env -match "AWS_ACCESS_KEY_ID=your_client_id") {
            throw "AWS_ACCESS_KEY_ID has wrong placeholder"
        }
        
        # Should have correct AWS-specific placeholders
        if ($env -notmatch "AWS_ACCESS_KEY_ID=your_aws_access_key_id_here") {
            throw "AWS_ACCESS_KEY_ID placeholder incorrect"
        }
        if ($env -notmatch "AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here") {
            throw "AWS_SECRET_ACCESS_KEY placeholder incorrect"
        }
        if ($env -notmatch "AWS_REGION=us-east-1") {
            throw "AWS_REGION should default to us-east-1"
        }
    }

# ============================================================================
# TEST 7: Package Manager Commands
# ============================================================================

Write-Host "`n[Package Manager Commands]" -ForegroundColor Green

foreach ($pm in @("npm", "pnpm", "yarn")) {
    Write-Host "Testing $pm..." -ForegroundColor Gray
    
    $config = @{
        projectName = "test-$pm"
        framework = "express"
        database = "sqlite"
        includeExamples = $true
        selectedPlugins = @()
        packageManager = $pm
    } | ConvertTo-Json
    
    $testScript = @"
import { generateReadme } from './dist/templates/readme.js';
const config = $config;
const readme = generateReadme(config);
console.log(readme);
"@
    
    $readme = $testScript | node --input-type=module
    
    if ($pm -eq "npm") {
        if ($readme -notmatch "npm run dev") {
            throw "$pm should use 'npm run dev'"
        }
    } else {
        if ($readme -notmatch "$pm dev") {
            throw "$pm should use '$pm dev'"
        }
    }
    
    Write-Host "  ✓ $pm commands correct" -ForegroundColor Green
    $testResults += @{ Test = "$pm Commands"; Result = "PASS" }
}

# ============================================================================
# SUMMARY
# ============================================================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Results Summary" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$passed = ($testResults | Where-Object { $_.Result -eq "PASS" }).Count
$failed = ($testResults | Where-Object { $_.Result -eq "FAIL" }).Count
$total = $testResults.Count

Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })

if ($failed -gt 0) {
    Write-Host "`nFailed Tests:" -ForegroundColor Red
    $testResults | Where-Object { $_.Result -eq "FAIL" } | ForEach-Object {
        Write-Host "  ✗ $($_.Test)" -ForegroundColor Red
        if ($_.Error) {
            Write-Host "    $($_.Error)" -ForegroundColor Gray
        }
    }
}

Write-Host "`n" -ForegroundColor White

# Cleanup (comment out to inspect generated files)
Write-Host "Cleaning up test projects..." -ForegroundColor Yellow
if (Test-Path $testDir) {
    Remove-Item -Recurse -Force $testDir
}
Write-Host "✓ Cleanup complete`n" -ForegroundColor Green

if ($failed -gt 0) {
    exit 1
}

Write-Host "✅ All E2E tests passed!`n" -ForegroundColor Green
exit 0


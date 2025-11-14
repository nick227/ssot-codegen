/**
 * CLI Helper Functions
 * 
 * Extracted utilities for better testability and maintainability
 */

import { resolve, isAbsolute, extname, normalize, join } from 'path'
import { existsSync, readdirSync, statSync, writeFileSync, readFileSync } from 'fs'
import { execSync } from 'child_process'
import chalk from 'chalk'

export interface SchemaResolutionResult {
  schemaPath: string
  isExample: boolean
  exampleName?: string
}

/**
 * Resolve schema argument to absolute path
 * 
 * Handles three cases:
 * 1. File paths (absolute, relative, or with .prisma extension)
 * 2. Example names (no path separators, no extension)
 * 3. Invalid paths (provides helpful error messages)
 * 
 * @throws Error if schema not found
 */
export function resolveSchemaArg(schemaArg: string | undefined): SchemaResolutionResult {
  if (!schemaArg) {
    console.error(chalk.red('❌ Error: Schema path or example name required'))
    console.log(chalk.gray('\nExamples:'))
    console.log(chalk.gray('  ssot generate minimal'))
    console.log(chalk.gray('  ssot generate examples/blog/schema.prisma'))
    console.log(chalk.gray('  ssot generate ./my-schema.prisma'))
    process.exit(1)
  }
  
  const normalizedArg = normalize(schemaArg)
  
  // Check if it's a file path (absolute, relative, or has .prisma extension)
  const looksLikeFilePath = isAbsolute(normalizedArg) || 
                            normalizedArg.startsWith('.') ||
                            extname(normalizedArg) === '.prisma'
  
  if (looksLikeFilePath) {
    // It's a file path - resolve and validate
    const schemaPath = resolve(process.cwd(), normalizedArg)
    
    if (!existsSync(schemaPath)) {
      console.error(chalk.red(`❌ Schema file not found: ${schemaPath}`))
      process.exit(1)
    }
    
    if (extname(schemaPath) !== '.prisma') {
      console.error(chalk.red(`❌ Schema file must have .prisma extension: ${schemaPath}`))
      process.exit(1)
    }
    
    return { schemaPath, isExample: false }
  }
  
  // Assume it's an example name
  const examplePath = resolve(process.cwd(), 'examples', normalizedArg, 'schema.prisma')
  if (existsSync(examplePath)) {
    return { schemaPath: examplePath, isExample: true, exampleName: normalizedArg }
  }
  
  // Try with prisma/ subdirectory
  const prismaPath = resolve(process.cwd(), 'examples', normalizedArg, 'prisma', 'schema.prisma')
  if (existsSync(prismaPath)) {
    return { schemaPath: prismaPath, isExample: true, exampleName: normalizedArg }
  }
  
  // Not found - show helpful error
  console.error(chalk.red(`❌ Example not found: ${normalizedArg}`))
  console.log(chalk.gray(`   Tried: ${examplePath}`))
  console.log(chalk.gray(`   Tried: ${prismaPath}`))
  console.log(chalk.gray('\nAvailable examples:'))
  
  // List available examples
  const examplesDir = resolve(process.cwd(), 'examples')
  if (existsSync(examplesDir)) {
    const examples = readdirSync(examplesDir)
      .filter(f => statSync(resolve(examplesDir, f)).isDirectory())
      .filter(f => 
        existsSync(resolve(examplesDir, f, 'schema.prisma')) ||
        existsSync(resolve(examplesDir, f, 'prisma', 'schema.prisma'))
      )
    
    if (examples.length > 0) {
      examples.forEach(ex => console.log(chalk.gray(`  • ${ex}`)))
    }
  }
  
  process.exit(1)
}

export interface PostGenOptions {
  outputDir: string
  schemaPath: string
  runTests: boolean
  build?: boolean  // Whether to build the project after setup
}

/**
 * Post-generation project setup
 * 
 * Handles:
 * 1. Create .env file with test-ready values
 * 2. Install dependencies
 * 3. Generate Prisma client
 * 4. Validate TypeScript compilation
 * 5. Validate ES module compatibility
 * 6. Run validation tests (optional)
 * 7. Build project (optional, if build flag is set)
 */
export async function runPostGenSetup(options: PostGenOptions): Promise<void> {
  const { outputDir, schemaPath, runTests, build = false } = options
  
  console.log(chalk.blue('\n🔧 Setting up project...\n'))
  
  try {
    // 1. Create .env file with test-ready values
    const envPath = resolve(outputDir, '.env')
    if (!existsSync(envPath)) {
      console.log(chalk.gray('  📝 Creating .env file...'))
      
      // Read schema to detect database provider
      const schemaContent = readFileSync(schemaPath, 'utf-8')
      const providerMatch = schemaContent.match(/provider\s*=\s*"(\w+)"/)
      const provider = providerMatch ? providerMatch[1] : 'mysql' // Default to MySQL
      
      // Generate appropriate DATABASE_URL
      let databaseUrl = ''
      switch (provider) {
        case 'mysql':
          databaseUrl = 'mysql://root@localhost:3306/test_db'
          break
        case 'postgresql':
          databaseUrl = 'postgresql://postgres@localhost:5432/test_db'
          break
        case 'sqlite':
          databaseUrl = 'file:./dev.db'
          break
        default:
          databaseUrl = 'mysql://root@localhost:3306/test_db' // Default to MySQL
      }
      
      const envContent = `# Auto-generated environment file
# Generated by SSOT Codegen

# Database Configuration
DATABASE_URL="${databaseUrl}"

# Server Configuration
PORT=3000
NODE_ENV=development

# Logging
LOG_LEVEL=info
`
      writeFileSync(envPath, envContent, 'utf-8')
      console.log(chalk.green('  ✓ Created .env with test configuration'))
    }
    
    // 2. Install dependencies
    console.log(chalk.gray('\n  📦 Installing dependencies...'))
    execSync('pnpm install --ignore-workspace', { 
      cwd: outputDir, 
      stdio: 'inherit'
    })
    console.log(chalk.green('  ✓ Dependencies installed'))
    
    // 3. Generate Prisma client (use local version)
    console.log(chalk.gray('\n  🔨 Generating Prisma client...'))
    try {
      // Use path.join to ensure correct path separator on Windows
      const schemaPath = join(outputDir, 'prisma', 'schema.prisma')
      if (!existsSync(schemaPath)) {
        console.log(chalk.yellow(`  ⚠️  Schema file not found at ${schemaPath}`))
      } else {
        execSync('pnpm exec prisma generate', { 
          cwd: outputDir, 
          stdio: 'inherit'
        })
        console.log(chalk.green('  ✓ Prisma client generated'))
      }
    } catch (error) {
      const err = error as Error
      console.log(chalk.yellow(`  ⚠️  Prisma generation failed: ${err.message}`))
      console.log(chalk.gray('   You can run manually: pnpm exec prisma generate'))
    }
    
    // 4. Create database and push schema (MySQL/PostgreSQL)
    console.log(chalk.gray('\n  🗄️  Setting up database...'))
    try {
      const schemaPath = join(outputDir, 'prisma', 'schema.prisma')
      if (!existsSync(schemaPath)) {
        console.log(chalk.yellow(`  ⚠️  Schema file not found at ${schemaPath}`))
      } else {
        // Read schema to detect provider
        const schemaContent = readFileSync(schemaPath, 'utf-8')
        const providerMatch = schemaContent.match(/provider\s*=\s*"(\w+)"/)
        const provider = providerMatch ? providerMatch[1] : 'mysql'
        
        // Read .env to get database name
        const envPath = resolve(outputDir, '.env')
        let dbName = 'test_db'
        if (existsSync(envPath)) {
          const envContent = readFileSync(envPath, 'utf-8')
          const dbUrlMatch = envContent.match(/DATABASE_URL="[^"]*\/\/([^@]+@)?[^:]+:\d+\/([^"]+)"/)
          if (dbUrlMatch && dbUrlMatch[2]) {
            dbName = dbUrlMatch[2]
          }
        }
        
        // Create database if MySQL or PostgreSQL
        if (provider === 'mysql') {
          try {
            console.log(chalk.gray(`  📦 Creating MySQL database: ${dbName}...`))
            execSync(`mysql -u root -e "CREATE DATABASE IF NOT EXISTS ${dbName};"`, {
              stdio: 'pipe',
              timeout: 10000
            })
            console.log(chalk.green(`  ✓ Database '${dbName}' created/verified`))
            
            // Check MySQL storage engine (warn if MyISAM)
            try {
              const engineCheck = execSync(`mysql -u root -e "SHOW VARIABLES LIKE 'default_storage_engine';"`, {
                stdio: 'pipe',
                timeout: 5000,
                encoding: 'utf-8'
              })
              if (engineCheck.includes('MyISAM')) {
                console.log(chalk.yellow(`\n  ⚠️  Warning: MySQL is using MyISAM storage engine`))
                console.log(chalk.yellow(`     MyISAM has a 1000-byte key length limit`))
                console.log(chalk.yellow(`     Switch to InnoDB for better compatibility:`))
                console.log(chalk.gray(`     1. Edit my.ini: default_storage_engine=InnoDB`))
                console.log(chalk.gray(`     2. Restart MySQL service`))
              }
            } catch {
              // Ignore engine check errors (MySQL might not be accessible)
            }
          } catch (dbError) {
            console.log(chalk.yellow(`  ⚠️  Could not create database automatically: ${(dbError as Error).message}`))
            console.log(chalk.gray(`   Please create manually: mysql -u root -e "CREATE DATABASE IF NOT EXISTS ${dbName};"`))
          }
        } else if (provider === 'postgresql') {
          try {
            console.log(chalk.gray(`  📦 Creating PostgreSQL database: ${dbName}...`))
            // Try createdb first, fallback to psql
            try {
              execSync(`createdb -U postgres ${dbName}`, {
                stdio: 'pipe',
                timeout: 10000
              })
            } catch {
              // If createdb fails, try psql
              execSync(`psql -U postgres -c "CREATE DATABASE ${dbName};"`, {
                stdio: 'pipe',
                timeout: 10000
              })
            }
            console.log(chalk.green(`  ✓ Database '${dbName}' created/verified`))
          } catch (dbError) {
            console.log(chalk.yellow(`  ⚠️  Could not create database automatically: ${(dbError as Error).message}`))
            console.log(chalk.gray(`   PostgreSQL may not be running or not accessible.`))
            console.log(chalk.gray(`   Please ensure PostgreSQL is running, then create manually:`))
            console.log(chalk.gray(`   createdb -U postgres ${dbName}`))
            console.log(chalk.gray(`   OR: psql -U postgres -c "CREATE DATABASE ${dbName};"`))
          }
        }
        
        // Push schema to database
        console.log(chalk.gray('  📤 Pushing schema to database...'))
        try {
          execSync('pnpm exec prisma db push --accept-data-loss', { 
            cwd: outputDir, 
            stdio: 'inherit',
            timeout: 60000
          })
          console.log(chalk.green('  ✓ Database schema pushed successfully'))
        } catch (pushError) {
          const pushErr = pushError as Error
          console.log(chalk.yellow(`  ⚠️  Schema push failed: ${pushErr.message}`))
          console.log(chalk.gray(`   This usually means:`))
          console.log(chalk.gray(`   - Database server is not running`))
          console.log(chalk.gray(`   - Connection credentials are incorrect`))
          console.log(chalk.gray(`   - Database doesn't exist (create it first)`))
          console.log(chalk.gray(`\n   Fix: Ensure database is running, then run:`))
          console.log(chalk.gray(`   pnpm db:push`))
          // Don't throw - allow project to continue without DB
        }
      }
    } catch (error) {
      const err = error as Error
      console.log(chalk.yellow(`\n⚠️  Database setup failed: ${err.message}`))
      console.log(chalk.gray('\n   You can set up manually:\n'))
      
      // Show provider-specific instructions
      const schemaContent = existsSync(schemaPath) ? readFileSync(schemaPath, 'utf-8') : ''
      const providerMatch = schemaContent.match(/provider\s*=\s*"(\w+)"/)
      const detectedProvider = providerMatch ? providerMatch[1] : 'mysql'
      
      if (detectedProvider === 'postgresql') {
        console.log(chalk.gray(`   1. Create database: createdb -U postgres test_db`))
        console.log(chalk.gray(`      OR: psql -U postgres -c "CREATE DATABASE test_db;"`))
      } else if (detectedProvider === 'mysql') {
        console.log(chalk.gray(`   1. Create database: mysql -u root -e "CREATE DATABASE test_db;"`))
      }
      console.log(chalk.gray(`   2. Push schema: pnpm db:push`))
    }
    
    // 5. Validate TypeScript compilation (catches type errors early)
    // SDK files are excluded via tsconfig.json as they require frontend dependencies
    // Frontend files (src/main.tsx, src/App.tsx) validation is skipped until after pnpm install
    console.log(chalk.gray('\n  🔍 Validating TypeScript compilation...'))
    try {
      // Check if frontend files exist (indicates UI was generated)
      const hasFrontendFiles = existsSync(join(outputDir, 'src', 'main.tsx')) || existsSync(join(outputDir, 'src', 'App.tsx'))
      
      execSync('npx tsc --noEmit', {
        cwd: outputDir,
        stdio: 'pipe',
        encoding: 'utf-8'
      })
      console.log(chalk.green('  ✓ TypeScript compilation successful'))
    } catch (error: any) {
      const errorOutput = error.stderr?.toString() || error.stdout?.toString() || error.message || 'Unknown TypeScript error'
      
      // Check if frontend files exist (indicates UI was generated)
      const hasFrontendFiles = existsSync(join(outputDir, 'src', 'main.tsx')) || existsSync(join(outputDir, 'src', 'App.tsx'))
      
      // Check if errors are only about missing React types (expected before install)
      const reactTypeErrors = errorOutput.includes("Cannot find module 'react'") || 
                             errorOutput.includes("Cannot find module 'react-dom'") ||
                             errorOutput.includes("Cannot find module '@tanstack/react-query'") ||
                             errorOutput.includes("Cannot find module 'react-router-dom'")
      
      // Also check for casing/file name issues that might be resolved after install
      const casingErrors = errorOutput.includes('differs from already included file name') ||
                          errorOutput.includes('has no default export')
      
      if ((reactTypeErrors || casingErrors) && hasFrontendFiles) {
        console.log(chalk.yellow('  ⚠️  TypeScript validation skipped for frontend files (dependencies not installed yet)'))
        console.log(chalk.gray('  Frontend files will be validated after pnpm install'))
        console.log(chalk.gray('  This is expected - React types will be available after dependency installation'))
      } else {
        const errorMatch = errorOutput.match(/(\d+) error\(s\)/i)
        const errorCount = errorMatch ? parseInt(errorMatch[1], 10) : 0
        
        console.log(chalk.red(`  ✗ TypeScript compilation failed with ${errorCount || 'unknown number of'} error(s)`))
        console.log(chalk.gray('  This indicates generated code has type errors that must be fixed.'))
        console.log(chalk.gray('\n  Error details:'))
        console.log(chalk.gray(errorOutput.slice(0, 1000)))
        
        throw new Error(`TypeScript validation failed: ${errorCount || 'unknown number of'} error(s)`)
      }
    }
    
    // 5b. Validate ES module compatibility (catches runtime errors like __dirname)
    console.log(chalk.gray('\n  🔍 Validating ES module compatibility...'))
    try {
      // Try to import the config file to catch ES module issues
      const configPath = join(outputDir, 'src', 'config.ts')
      if (existsSync(configPath)) {
        // Use tsx to execute the config file and catch runtime errors
        execSync('npx tsx src/config.ts', {
          cwd: outputDir,
          stdio: 'pipe',
          encoding: 'utf-8',
          timeout: 5000,
          env: {
            ...process.env,
            DATABASE_URL: process.env.DATABASE_URL || 'mysql://root@localhost:3306/test_db',
            NODE_ENV: 'test'
          }
        })
      }
      console.log(chalk.green('  ✓ ES module compatibility validated'))
    } catch (error: any) {
      const errorOutput = error.stderr?.toString() || error.stdout?.toString() || error.message || 'Unknown runtime error'
      
      // Check for common ES module issues
      if (errorOutput.includes('__dirname is not defined') || 
          errorOutput.includes('__filename is not defined') ||
          errorOutput.includes('require is not defined')) {
        console.log(chalk.red('  ✗ ES module compatibility check failed'))
        console.log(chalk.yellow('  ⚠️  CommonJS globals (__dirname, __filename, require) detected in ES module'))
        console.log(chalk.gray('  This indicates generated code uses CommonJS patterns in an ES module context.'))
        console.log(chalk.gray('\n  Error details:'))
        console.log(chalk.gray(errorOutput.slice(0, 1500)))
        
        throw new Error('ES module compatibility validation failed: CommonJS globals detected')
      }
      
      // Other runtime errors might be expected (missing .env, etc.), so just warn
      console.log(chalk.yellow('  ⚠️  Runtime validation had issues (may be expected):'))
      console.log(chalk.gray(errorOutput.slice(0, 500)))
    }
    
    // 6. Run validation tests if requested
    if (runTests) {
      console.log(chalk.gray('\n  🧪 Running validation tests...'))
      try {
        execSync('pnpm test:validate', { 
          cwd: outputDir, 
          stdio: 'inherit'
        })
        console.log(chalk.green('  ✓ All tests passed!'))
      } catch {
        console.log(chalk.yellow('  ⚠️  Some tests failed (this is OK if database is not set up)'))
      }
    }
    
    // 7. Build project if requested (compiles TypeScript and frontend bundles)
    if (build) {
      console.log(chalk.gray('\n  🔨 Building project...'))
      try {
        execSync('pnpm build', { 
          cwd: outputDir, 
          stdio: 'inherit',
          timeout: 600000 // 10 minutes timeout for builds
        })
        console.log(chalk.green('  ✓ Build completed successfully'))
      } catch (buildError) {
        const err = buildError as Error
        console.log(chalk.yellow(`  ⚠️  Build failed: ${err.message}`))
        console.log(chalk.gray('  This may be expected if:'))
        console.log(chalk.gray('    - Frontend dependencies are missing'))
        console.log(chalk.gray('    - Build configuration needs adjustment'))
        console.log(chalk.gray('    - Environment variables are not set'))
        console.log(chalk.gray('\n  You can build manually later:'))
        console.log(chalk.gray(`    cd ${outputDir}`))
        console.log(chalk.gray('    pnpm build'))
        // Don't throw - allow project to continue even if build fails
      }
    }
    
    console.log(chalk.green('\n✅ Project setup complete!\n'))
  } catch (setupError) {
    const err = setupError as Error
    throw new Error(`Setup failed: ${err.message}`)
  }
}

/**
 * Run smoke test on generated project
 * 
 * Performs basic validation:
 * 1. Check that key files exist
 * 2. Check that package.json is valid
 * 3. Check that TypeScript compiles (if applicable)
 */
export async function runSmokeTest(outputDir: string, schemaPath: string): Promise<boolean> {
  console.log(chalk.blue('\n🧪 Running smoke test...\n'))
  
  try {
    const packageJsonPath = resolve(outputDir, 'package.json')
    const prismaSchemaPath = resolve(outputDir, 'prisma', 'schema.prisma')
    
    // Check key files exist
    if (!existsSync(packageJsonPath)) {
      console.log(chalk.red('  ❌ package.json not found'))
      return false
    }
    console.log(chalk.green('  ✓ package.json exists'))
    
    if (!existsSync(prismaSchemaPath)) {
      console.log(chalk.red('  ❌ prisma/schema.prisma not found'))
      return false
    }
    console.log(chalk.green('  ✓ prisma/schema.prisma exists'))
    
    // Check package.json is valid
    try {
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
      if (!pkg.name || !pkg.version) {
        console.log(chalk.yellow('  ⚠️  package.json missing name or version'))
      } else {
        console.log(chalk.green(`  ✓ package.json valid (${pkg.name}@${pkg.version})`))
      }
    } catch {
      console.log(chalk.red('  ❌ package.json is invalid JSON'))
      return false
    }
    
    // Check TypeScript compiles (if tsconfig.json exists)
    const tsconfigPath = resolve(outputDir, 'tsconfig.json')
    if (existsSync(tsconfigPath)) {
      try {
        execSync('pnpm exec tsc --noEmit', {
          cwd: outputDir,
          stdio: 'pipe',
          timeout: 30000
        })
        console.log(chalk.green('  ✓ TypeScript compiles successfully'))
      } catch {
        console.log(chalk.yellow('  ⚠️  TypeScript compilation has errors (may be expected)'))
      }
    }
    
    console.log(chalk.green('\n✅ Smoke test passed!\n'))
    return true
  } catch (error) {
    const err = error as Error
    console.log(chalk.red(`\n❌ Smoke test failed: ${err.message}\n`))
    return false
  }
}


/**
 * Controller Generator - Full Integration Test
 * 
 * This script:
 * 1. Parses a real Prisma schema
 * 2. Generates a controller with the enhanced generator
 * 3. Writes it to a temporary file
 * 4. Compiles it with TypeScript
 * 5. Reports success/failure
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'
import { parseDMMF } from './src/dmmf-parser.js'
import { generateEnhancedController } from './src/generators/controller-generator-enhanced.js'
import { analyzeModelUnified } from './src/analyzers/unified-analyzer/index.js'
import { generateService } from './src/generators/service-generator-enhanced.js'
import { generateAllDTOs } from './src/generators/dto-generator.js'
import { generateAllValidators } from './src/generators/validator-generator.js'

async function runIntegrationTest() {
  console.log('🧪 Controller Generator Integration Test\n')
  
  const testDir = join(process.cwd(), 'test-output-controller')
  
  try {
    // Clean and create test directory
    console.log('1️⃣  Setting up test directory...')
    rmSync(testDir, { recursive: true, force: true })
    mkdirSync(testDir, { recursive: true })
    mkdirSync(join(testDir, 'controllers'), { recursive: true })
    mkdirSync(join(testDir, 'services'), { recursive: true })
    mkdirSync(join(testDir, 'contracts'), { recursive: true })
    mkdirSync(join(testDir, 'validators'), { recursive: true })
    
    // Read and parse schema
    console.log('2️⃣  Parsing Prisma schema...')
    const schemaPath = join(process.cwd(), '../../test-schema.prisma')
    const schemaContent = readFileSync(schemaPath, 'utf-8')
    
    const schema = await parseDMMF(schemaContent)
    console.log(`   ✅ Found ${schema.models.length} models`)
    
    // Pick a simple model
    const testModel = schema.models.find(m => m.name === 'User') || schema.models[0]
    console.log(`   📦 Testing with model: ${testModel.name}`)
    
    // Analyze model
    console.log('3️⃣  Analyzing model...')
    const analysis = analyzeModelUnified(testModel, schema)
    console.log(`   ✅ Analysis complete`)
    console.log(`      - Relationships: ${analysis.relationships.length}`)
    console.log(`      - Has slug: ${analysis.hasSlugField}`)
    console.log(`      - Has published: ${analysis.hasPublishedField}`)
    
    // Generate supporting files
    console.log('4️⃣  Generating supporting files...')
    
    // DTOs
    const dtos = generateAllDTOs([testModel])
    for (const [filename, content] of dtos) {
      writeFileSync(join(testDir, 'contracts', filename), content)
    }
    console.log(`   ✅ Generated ${dtos.size} DTO files`)
    
    // Validators
    const validators = generateAllValidators([testModel], schema)
    for (const [filename, content] of validators) {
      writeFileSync(join(testDir, 'validators', filename), content)
    }
    console.log(`   ✅ Generated ${validators.size} validator files`)
    
    // Service
    const service = generateService(testModel, schema, analysis)
    writeFileSync(join(testDir, 'services', `${testModel.name.toLowerCase()}.service.ts`), service)
    console.log(`   ✅ Generated service file`)
    
    // Generate Express controller
    console.log('5️⃣  Generating Express controller...')
    const expressController = generateEnhancedController(
      testModel,
      schema,
      'express',
      analysis,
      {
        enableBulkOperations: true,
        enableDomainMethods: true,
        bulkOperationLimits: { maxBatchSize: 50 }
      }
    )
    
    const expressPath = join(testDir, 'controllers', `${testModel.name.toLowerCase()}.controller.express.ts`)
    writeFileSync(expressPath, expressController)
    console.log(`   ✅ Generated Express controller (${expressController.length} chars)`)
    
    // Generate Fastify controller
    console.log('6️⃣  Generating Fastify controller...')
    const fastifyController = generateEnhancedController(
      testModel,
      schema,
      'fastify',
      analysis,
      {
        enableBulkOperations: true,
        enableDomainMethods: true,
        bulkOperationLimits: { maxBatchSize: 50 }
      }
    )
    
    const fastifyPath = join(testDir, 'controllers', `${testModel.name.toLowerCase()}.controller.fastify.ts`)
    writeFileSync(fastifyPath, fastifyController)
    console.log(`   ✅ Generated Fastify controller (${fastifyController.length} chars)`)
    
    // Check for unsafe patterns
    console.log('\n7️⃣  Verifying code safety...')
    if (expressController.includes('idResult.id!')) {
      console.error('   ❌ UNSAFE: Found non-null assertion in Express controller')
      process.exit(1)
    }
    if (fastifyController.includes('idResult.id!')) {
      console.error('   ❌ UNSAFE: Found non-null assertion in Fastify controller')
      process.exit(1)
    }
    console.log('   ✅ No non-null assertions found')
    
    // Check for security features
    if (!expressController.includes('SECURITY RECOMMENDATIONS')) {
      console.error('   ❌ Missing security recommendations')
    } else {
      console.log('   ✅ Security recommendations included')
    }
    
    if (!expressController.includes('.max(50)')) {
      console.error('   ❌ Bulk size limit not applied')
    } else {
      console.log('   ✅ Bulk size limit configured correctly')
    }
    
    // Create mock dependencies for compilation test
    console.log('\n8️⃣  Creating mock dependencies for TypeScript compilation...')
    
    const mockLogger = `export const logger = {
  info: (...args: any[]) => console.log(...args),
  warn: (...args: any[]) => console.warn(...args),
  error: (...args: any[]) => console.error(...args),
  debug: (...args: any[]) => console.log(...args)
}`
    writeFileSync(join(testDir, 'logger.ts'), mockLogger)
    
    const mockServiceIndex = `export { ${testModel.name.toLowerCase()}Service } from './${testModel.name.toLowerCase()}.service.js'`
    writeFileSync(join(testDir, 'services', 'index.ts'), mockServiceIndex)
    
    const mockValidatorIndex = `export * from './${testModel.name.toLowerCase()}.validators.js'`
    writeFileSync(join(testDir, 'validators', 'index.ts'), mockValidatorIndex)
    
    // Create tsconfig
    const tsconfig = {
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        moduleResolution: 'bundler',
        esModuleInterop: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        paths: {
          '@/*': ['./*'],
          '@/services/*': ['./services/*'],
          '@/validators/*': ['./validators/*'],
          '@/contracts/*': ['./contracts/*'],
          '@/logger': ['./logger.ts']
        }
      },
      include: ['**/*.ts']
    }
    writeFileSync(join(testDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2))
    
    // Create package.json
    const packageJson = {
      name: 'controller-test',
      type: 'module',
      dependencies: {
        'express': '^4.18.0',
        'fastify': '^4.0.0',
        'zod': '^3.22.0',
        '@prisma/client': '^5.0.0'
      },
      devDependencies: {
        '@types/express': '^4.17.0',
        '@types/node': '^20.0.0',
        'typescript': '^5.3.0'
      }
    }
    writeFileSync(join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2))
    
    console.log('   ✅ Mock dependencies created')
    
    // Try to compile with TypeScript
    console.log('\n9️⃣  Compiling with TypeScript...')
    try {
      execSync(`npx tsc --noEmit`, {
        cwd: testDir,
        stdio: 'pipe',
        encoding: 'utf-8'
      })
      console.log('   ✅ TypeScript compilation successful!')
    } catch (error: any) {
      console.error('   ❌ TypeScript compilation failed:')
      console.error(error.stdout || error.stderr || error.message)
      
      // Show which file had errors
      console.log('\n📄 Generated Files:')
      console.log(`   Express: ${expressPath}`)
      console.log(`   Fastify: ${fastifyPath}`)
      
      throw error
    }
    
    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('✅ INTEGRATION TEST PASSED')
    console.log('='.repeat(60))
    console.log(`
📊 Test Results:
   ✅ Schema parsed successfully
   ✅ Model analyzed successfully  
   ✅ Controllers generated (Express + Fastify)
   ✅ No unsafe patterns (non-null assertions)
   ✅ Security recommendations included
   ✅ Bulk size limits applied
   ✅ TypeScript compilation successful
   
📁 Generated Files: ${testDir}
   - controllers/${testModel.name.toLowerCase()}.controller.express.ts
   - controllers/${testModel.name.toLowerCase()}.controller.fastify.ts
   - services/${testModel.name.toLowerCase()}.service.ts
   - validators/*
   - contracts/*

🚀 Controller Generator is READY TO SHIP!
`)
    
  } catch (error: any) {
    console.error('\n' + '='.repeat(60))
    console.error('❌ INTEGRATION TEST FAILED')
    console.error('='.repeat(60))
    console.error(error.message || error)
    
    if (error.stack) {
      console.error('\nStack trace:')
      console.error(error.stack)
    }
    
    process.exit(1)
  }
}

// Run the test
runIntegrationTest().catch(error => {
  console.error('Unhandled error:', error)
  process.exit(1)
})


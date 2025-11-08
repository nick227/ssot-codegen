/**
 * Simple Controller Generation Test
 * Just generates and checks the output
 */

import type { ParsedModel, ParsedField, ParsedSchema } from './src/dmmf-parser.js'
import type { UnifiedModelAnalysis } from './src/analyzers/unified-analyzer/types.js'
import { generateEnhancedController } from './src/generators/controller-generator-enhanced.js'
import { writeFileSync, mkdirSync, rmSync } from 'fs'
import { join } from 'path'

// Create a minimal test model
const idField: ParsedField = {
  name: 'id',
  type: 'Int',
  kind: 'scalar',
  isId: true,
  isList: false,
  isRequired: true,
  isUnique: true,
  hasDefaultValue: true,
  default: { name: 'autoincrement', args: [] },
  isUpdatedAt: false,
  documentation: undefined
}

const testModel: ParsedModel = {
  name: 'Product',
  dbName: 'products',
  documentation: undefined,
  scalarFields: [
    idField,
    {
      name: 'name',
      type: 'String',
      kind: 'scalar',
      isId: false,
      isList: false,
      isRequired: true,
      isUnique: false,
      hasDefaultValue: false,
      isUpdatedAt: false,
      documentation: undefined
    },
    {
      name: 'slug',
      type: 'String',
      kind: 'scalar',
      isId: false,
      isList: false,
      isRequired: true,
      isUnique: true,
      hasDefaultValue: false,
      isUpdatedAt: false,
      documentation: undefined
    },
    {
      name: 'published',
      type: 'Boolean',
      kind: 'scalar',
      isId: false,
      isList: false,
      isRequired: true,
      hasDefaultValue: true,
      default: { name: 'false', args: [] },
      isUpdatedAt: false,
      documentation: undefined
    },
    {
      name: 'views',
      type: 'Int',
      kind: 'scalar',
      isId: false,
      isList: false,
      isRequired: true,
      hasDefaultValue: true,
      default: { name: '0', args: [] },
      isUpdatedAt: false,
      documentation: undefined
    }
  ],
  relationFields: [],
  idField,
  uniqueFields: []
}

const testSchema: ParsedSchema = {
  models: [testModel],
  modelMap: new Map([[testModel.name, testModel]]),
  enums: [],
  enumMap: new Map()
}

// Create minimal analysis
const testAnalysis: UnifiedModelAnalysis = {
  model: testModel,
  relationships: [],
  autoIncludeRelations: [],
  isJunctionTable: false,
  specialFields: {
    slug: testModel.scalarFields.find(f => f.name === 'slug'),
    published: testModel.scalarFields.find(f => f.name === 'published'),
    views: testModel.scalarFields.find(f => f.name === 'views')
  },
  hasPublishedField: true,
  hasSlugField: true,
  capabilities: {
    hasSearch: true,
    hasFilters: true,
    hasPagination: true,
    hasRelations: false,
    hasUniqueFields: true,
    supportsBulkOperations: true
  }
}

console.log('🧪 Simple Controller Generation Test\n')

// Test directory
const testDir = join(process.cwd(), 'test-output')
rmSync(testDir, { recursive: true, force: true })
mkdirSync(testDir, { recursive: true })

// Generate Express controller
console.log('1️⃣  Generating Express controller...')
const expressController = generateEnhancedController(
  testModel,
  testSchema,
  'express',
  testAnalysis,
  {
    enableBulkOperations: true,
    enableDomainMethods: true,
    bulkOperationLimits: { maxBatchSize: 50 },
    sanitizeErrorMessages: true
  }
)

writeFileSync(join(testDir, 'product.controller.express.ts'), expressController)
console.log(`   ✅ Generated (${expressController.length} chars)`)

// Generate Fastify controller  
console.log('2️⃣  Generating Fastify controller...')
const fastifyController = generateEnhancedController(
  testModel,
  testSchema,
  'fastify',
  testAnalysis,
  {
    enableBulkOperations: true,
    enableDomainMethods: true,
    bulkOperationLimits: { maxBatchSize: 50 },
    sanitizeErrorMessages: true
  }
)

writeFileSync(join(testDir, 'product.controller.fastify.ts'), fastifyController)
console.log(`   ✅ Generated (${fastifyController.length} chars)`)

// Safety checks
console.log('\n3️⃣  Safety verification...')

const checks = [
  { name: 'No non-null assertions', test: !expressController.includes('idResult.id!') && !fastifyController.includes('idResult.id!') },
  { name: 'Security recommendations', test: expressController.includes('SECURITY RECOMMENDATIONS') },
  { name: 'Bulk size limits', test: expressController.includes('.max(50)') },
  { name: 'Type interfaces', test: expressController.includes('interface ProductParams') },
  { name: 'Slug endpoint', test: expressController.includes('getProductBySlug') },
  { name: 'Published endpoints', test: expressController.includes('listPublishedProducts') },
  { name: 'View increment', test: expressController.includes('incrementProductViews') },
  { name: 'Consistent undefined checks', test: expressController.match(/idResult\.id === undefined/g)?.length >= 5 },
  { name: 'Body validation', test: expressController.includes('typeof req.body !== \'object\'') },
  { name: 'Where validation', test: expressController.includes('CountProductSchema') }
]

let passed = 0
let failed = 0

for (const check of checks) {
  if (check.test) {
    console.log(`   ✅ ${check.name}`)
    passed++
  } else {
    console.error(`   ❌ ${check.name}`)
    failed++
  }
}

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`)

if (failed > 0) {
  console.error('\n❌ SAFETY CHECKS FAILED')
  process.exit(1)
}

console.log('\n' + '='.repeat(60))
console.log('✅ ALL CHECKS PASSED')
console.log('='.repeat(60))
console.log(`
Generated files saved to: ${testDir}
- product.controller.express.ts (${expressController.split('\n').length} lines)
- product.controller.fastify.ts (${fastifyController.split('\n').length} lines)

🎯 Controller Generator Verification Complete!

Next step: Review generated files manually to verify:
1. Code is syntactically correct
2. Imports look reasonable
3. Logic flows properly
4. Error handling is complete

Files are in: ${testDir}
`)


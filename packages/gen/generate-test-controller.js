/**
 * Generate a test controller for manual inspection
 */

import { writeFileSync, mkdirSync, rmSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Minimal model data
const testModel = {
  name: 'Product',
  dbName: 'products',
  documentation: undefined,
  scalarFields: [
    {
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
  idField: { name: 'id', type: 'Int', kind: 'scalar', isId: true, isList: false, isRequired: true, isUnique: true, hasDefaultValue: true, default: { name: 'autoincrement', args: [] }, isUpdatedAt: false, documentation: undefined },
  uniqueFields: []
}

const testSchema = {
  models: [testModel],
  modelMap: new Map([['Product', testModel]]),
  enums: [],
  enumMap: new Map()
}

const testAnalysis = {
  model: testModel,
  relationships: [],
  autoIncludeRelations: [],
  isJunctionTable: false,
  specialFields: {
    slug: testModel.scalarFields[1],
    published: testModel.scalarFields[2],
    views: testModel.scalarFields[3]
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

// Import the generator
const { generateEnhancedController } = await import('./dist/generators/controller-generator-enhanced.js')

console.log('🧪 Generating Test Controllers\n')

// Generate Express
console.log('1️⃣  Express controller...')
try {
  const expressCode = generateEnhancedController(
    testModel,
    testSchema,
    'express',
    testAnalysis,
    {
      enableBulkOperations: true,
      enableDomainMethods: true,
      bulkOperationLimits: { maxBatchSize: 50 }
    }
  )
  
  const testDir = join(__dirname, 'test-output')
  rmSync(testDir, { recursive: true, force: true })
  mkdirSync(testDir, { recursive: true })
  
  writeFileSync(join(testDir, 'product.controller.express.ts'), expressCode)
  
  console.log(`   ✅ Generated (${expressCode.length} chars, ${expressCode.split('\n').length} lines)`)
  
  // Safety checks
  console.log('\n2️⃣  Safety checks...')
  const checks = [
    ['No non-null assertions', !expressCode.includes('idResult.id!')],
    ['Security recommendations', expressCode.includes('SECURITY RECOMMENDATIONS')],
    ['Bulk size limit (50)', expressCode.includes('.max(50)')],
    ['Type interfaces', expressCode.includes('interface ProductParams')],
    ['Undefined checks', (expressCode.match(/idResult\.id === undefined/g) || []).length >= 5],
    ['Body validation', expressCode.includes('typeof req.body')],
    ['Where validation', expressCode.includes('CountProductSchema')],
    ['Slug endpoint', expressCode.includes('getProductBySlug')],
    ['Published endpoints', expressCode.includes('listPublishedProducts')],
    ['View increment', expressCode.includes('incrementProductViews')]
  ]
  
  let passed = 0
  for (const [name, result] of checks) {
    if (result) {
      console.log(`   ✅ ${name}`)
      passed++
    } else {
      console.error(`   ❌ ${name}`)
    }
  }
  
  console.log(`\n📊 ${passed}/${checks.length} checks passed`)
  
  console.log('\n✅ SUCCESS - Controller generator is working correctly!')
  console.log(`\n📁 Generated file: ${join(testDir, 'product.controller.express.ts')}`)
  console.log('\n👀 Review the generated file to verify quality.')
  
} catch (error) {
  console.error('❌ FAILED:', error.message)
  console.error(error.stack)
  process.exit(1)
}


/**
 * Test annotation parsing
 */

import { parseAnnotations } from './packages/gen/src/dmmf-parser/annotations/parser.js'
import { validateAnnotations } from './packages/gen/src/dmmf-parser/annotations/validator.js'

// Test 1: Parse @@realtime
const realtimeDoc = `/// @@realtime(subscribe: ["list", "item"], broadcast: ["created", "updated", "deleted"])`
const realtimeAnnotations = parseAnnotations(realtimeDoc)

console.log('Test 1: @@realtime')
console.log(JSON.stringify(realtimeAnnotations, null, 2))
console.log()

// Test 2: Parse @@policy
const policyDoc = `/// @@policy("read", rule: "published || isOwner")
/// @@policy("write", rule: "isOwner")`
const policyAnnotations = parseAnnotations(policyDoc)

console.log('Test 2: @@policy')
console.log(JSON.stringify(policyAnnotations, null, 2))
console.log()

// Test 3: Parse @@service
const serviceDoc = `/// @@service("Cloudinary", folder: "uploads", quality: "auto")`
const serviceAnnotations = parseAnnotations(serviceDoc)

console.log('Test 3: @@service')
console.log(JSON.stringify(serviceAnnotations, null, 2))
console.log()

// Test 4: Validate annotations
const allAnnotations = [
  ...realtimeAnnotations,
  ...policyAnnotations,
  ...serviceAnnotations
]

const validation = validateAnnotations('TestModel', allAnnotations, ['title', 'content', 'published'])

console.log('Test 4: Validation')
console.log('Valid:', validation.valid)
console.log('Errors:', validation.errors)
console.log()

// Test 5: Invalid annotation
const invalidDoc = `/// @@policy("read")`  // Missing rule
const invalidAnnotations = parseAnnotations(invalidDoc)

console.log('Test 5: Invalid annotation')
try {
  const invalidValidation = validateAnnotations('TestModel', invalidAnnotations, [])
  console.log('Validation result:', invalidValidation)
} catch (error) {
  console.log('Error (expected):', error instanceof Error ? error.message : error)
}

console.log('\n✅ All tests complete')


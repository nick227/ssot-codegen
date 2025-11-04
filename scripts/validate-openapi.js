#!/usr/bin/env node
// Step 52: Validate OpenAPI structure
import fs from 'node:fs'

const spec = JSON.parse(fs.readFileSync('./examples/minimal/gen/openapi/openapi.json', 'utf8'))

const required = ['openapi', 'info', 'paths', 'components']
const missing = required.filter(k => !spec[k])

if (missing.length > 0) {
  console.error(`❌ Missing required fields: ${missing.join(', ')}`)
  process.exit(1)
}

if (spec.openapi !== '3.1.0') {
  console.error(`❌ Expected openapi: 3.1.0, got: ${spec.openapi}`)
  process.exit(1)
}

if (!spec.paths['/user'] || !spec.paths['/post']) {
  console.error(`❌ Missing expected model paths`)
  process.exit(1)
}

if (!spec.components.schemas.UserReadDTO || !spec.components.schemas.PostReadDTO) {
  console.error(`❌ Missing expected schemas`)
  process.exit(1)
}

console.log(`✅ OpenAPI validation passed`)
console.log(`   - OpenAPI version: ${spec.openapi}`)
console.log(`   - Paths: ${Object.keys(spec.paths).length}`)
console.log(`   - Schemas: ${Object.keys(spec.components.schemas).length}`)


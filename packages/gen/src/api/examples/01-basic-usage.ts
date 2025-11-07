/**
 * Example 1: Basic Usage
 * 
 * Demonstrates the simplest way to use the public API
 */

import { generate } from '../index.js'

async function basicExample() {
  console.log('🚀 Starting code generation...\n')
  
  const result = await generate({
    schema: './examples/minimal/schema.prisma',
    framework: 'express',
    standalone: true
  })
  
  if (result.success) {
    console.log('✅ Generation successful!\n')
    console.log(`Models generated: ${result.models.join(', ')}`)
    console.log(`Files created: ${result.filesCreated}`)
    console.log(`Relationships: ${result.relationships}`)
    console.log(`Output directory: ${result.outputDir}`)
    console.log(`Duration: ${result.duration}ms`)
    
    console.log('\nBreakdown by layer:')
    result.breakdown.forEach(({ layer, count }) => {
      console.log(`  ${layer}: ${count} files`)
    })
  } else {
    console.error('❌ Generation failed!')
    result.errors?.forEach(err => {
      console.error(`  ${err.message}`)
    })
    process.exit(1)
  }
}

basicExample().catch(console.error)


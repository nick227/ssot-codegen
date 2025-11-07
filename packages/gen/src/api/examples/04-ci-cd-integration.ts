/**
 * Example 4: CI/CD Integration
 * 
 * Shows how to use the API in CI/CD pipelines (GitHub Actions, GitLab CI, etc.)
 */

import { generate, validateSchema, analyzeSchema } from '../index.js'

async function cicdPipeline() {
  console.log('🔍 Step 1: Validating schema...')
  
  // Validate schema first
  const validation = await validateSchema('./prisma/schema.prisma')
  
  if (!validation.valid) {
    console.error('❌ Schema validation failed:')
    validation.errors.forEach(err => console.error(`  - ${err}`))
    process.exit(1)
  }
  
  console.log('✅ Schema is valid\n')
  
  // Analyze schema
  console.log('📊 Step 2: Analyzing schema...')
  const analysis = await analyzeSchema('./prisma/schema.prisma')
  
  console.log(`  Models: ${analysis.models.length}`)
  console.log(`  Enums: ${analysis.enums.length}`)
  console.log(`  Relationships: ${analysis.relationships}`)
  
  if (analysis.junctionTables.length > 0) {
    console.log(`  Junction tables: ${analysis.junctionTables.join(', ')}`)
  }
  
  console.log('\n🏗️  Step 3: Generating code...')
  
  // Generate with minimal logging (CI-friendly)
  const result = await generate({
    schema: './prisma/schema.prisma',
    output: process.env.OUTPUT_DIR || './generated',
    framework: process.env.FRAMEWORK as any || 'express',
    verbosity: 'minimal',
    format: true,  // Ensure consistent formatting
    
    onProgress: (event) => {
      // Only log phase completions in CI
      if (event.type === 'phase:end') {
        console.log(`  ✅ ${event.phase}: ${event.filesGenerated} files`)
      }
    }
  })
  
  if (!result.success) {
    console.error('❌ Generation failed!')
    result.errors?.forEach(err => console.error(err))
    process.exit(1)
  }
  
  console.log(`\n✅ Generation complete in ${result.duration}ms`)
  console.log(`📁 Output: ${result.outputDir}`)
  console.log(`📦 Files: ${result.filesCreated}`)
  
  // Output for GitHub Actions summary
  if (process.env.GITHUB_STEP_SUMMARY) {
    const summary = `
## Code Generation Summary

- **Models:** ${result.models.join(', ')}
- **Files:** ${result.filesCreated}
- **Relationships:** ${result.relationships}
- **Duration:** ${result.duration}ms
- **Output:** ${result.outputDir}
`
    const fs = require('fs')
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary)
  }
}

cicdPipeline().catch((error) => {
  console.error('💥 Pipeline failed:', error)
  process.exit(1)
})


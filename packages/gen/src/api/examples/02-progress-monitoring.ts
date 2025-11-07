/**
 * Example 2: Progress Monitoring
 * 
 * Shows how to monitor generation progress with callbacks
 */

import { generate, type ProgressEvent } from '../index.js'

async function progressExample() {
  let currentPhase = ''
  let modelsProcessed = 0
  let filesCreated = 0
  
  const result = await generate({
    schema: './examples/blog-example/schema.prisma',
    framework: 'express',
    
    onProgress: (event: ProgressEvent) => {
      switch (event.type) {
        case 'phase:start':
          currentPhase = event.phase || ''
          process.stdout.write(`\n⏳ ${event.message}... `)
          break
          
        case 'phase:end':
          process.stdout.write(`✅ (${event.filesGenerated} files)\n`)
          filesCreated += event.filesGenerated || 0
          break
          
        case 'model:start':
          process.stdout.write(`\n  📦 ${event.model}... `)
          break
          
        case 'model:complete':
          process.stdout.write(`✅`)
          modelsProcessed++
          break
          
        case 'warning':
          console.warn(`\n⚠️  ${event.message}`)
          break
          
        case 'error':
          console.error(`\n❌ ${event.message}`)
          break
      }
    }
  })
  
  console.log('\n\n📊 Generation Summary:')
  console.log(`  Models processed: ${modelsProcessed}`)
  console.log(`  Files created: ${filesCreated}`)
  console.log(`  Duration: ${result.duration}ms`)
  console.log(`  Success: ${result.success ? '✅' : '❌'}`)
}

progressExample().catch(console.error)


/**
 * Example 6: Watch Mode
 * 
 * Automatically regenerate when schema changes
 */

import { watch } from 'chokidar'
import { generate } from '../index.js'

async function watchMode(schemaPath: string) {
  console.log(`👀 Watching ${schemaPath} for changes...\n`)
  
  // Initial generation
  await regenerate(schemaPath)
  
  // Watch for changes
  const watcher = watch(schemaPath, {
    persistent: true,
    ignoreInitial: true
  })
  
  let regenerating = false
  
  watcher.on('change', async () => {
    if (regenerating) {
      console.log('⏭️  Generation already in progress, skipping...')
      return
    }
    
    console.log('\n🔄 Schema changed, regenerating...\n')
    regenerating = true
    
    try {
      await regenerate(schemaPath)
    } finally {
      regenerating = false
    }
  })
  
  watcher.on('error', (error) => {
    console.error('❌ Watcher error:', error)
  })
  
  console.log('\n✅ Watch mode active. Press Ctrl+C to stop.\n')
  
  // Keep process alive
  process.stdin.resume()
}

async function regenerate(schemaPath: string) {
  const startTime = Date.now()
  
  const result = await generate({
    schema: schemaPath,
    verbosity: 'minimal',
    
    onProgress: (event) => {
      if (event.type === 'phase:end') {
        console.log(`  ✅ ${event.message}`)
      }
    }
  })
  
  const duration = Date.now() - startTime
  
  if (result.success) {
    console.log(`\n✅ Regenerated in ${duration}ms (${result.filesCreated} files)`)
  } else {
    console.error('\n❌ Regeneration failed:', result.errors)
  }
}

// Usage
const schemaPath = process.argv[2] || './prisma/schema.prisma'
watchMode(schemaPath).catch(console.error)


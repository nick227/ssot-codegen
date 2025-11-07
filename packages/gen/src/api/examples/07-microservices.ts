/**
 * Example 7: Microservices Generator
 * 
 * Generate multiple microservices from different schemas
 */

import { generate, analyzeSchema } from '../index.js'
import { join } from 'path'

interface Service {
  name: string
  schema: string
  framework?: 'express' | 'fastify'
  port?: number
}

async function generateMicroservices(services: Service[]) {
  console.log(`🏗️  Generating ${services.length} microservices...\n`)
  
  const results = []
  
  for (const service of services) {
    console.log(`\n📦 ${service.name}:`)
    console.log(`   Schema: ${service.schema}`)
    
    // Analyze first
    const analysis = await analyzeSchema(service.schema)
    console.log(`   Models: ${analysis.models.join(', ')}`)
    console.log(`   Relationships: ${analysis.relationships}`)
    
    // Generate
    const result = await generate({
      schema: service.schema,
      output: join('./services', service.name, 'generated'),
      projectName: service.name,
      framework: service.framework || 'express',
      standalone: true,
      verbosity: 'minimal',
      
      onProgress: (event) => {
        if (event.type === 'phase:end') {
          console.log(`   ✅ ${event.message}`)
        }
      }
    })
    
    if (!result.success) {
      console.error(`   ❌ Failed: ${result.errors?.[0]?.message}`)
    } else {
      console.log(`   ✅ Generated ${result.filesCreated} files`)
    }
    
    results.push({ service: service.name, result })
  }
  
  // Summary
  console.log('\n\n📊 Generation Summary:\n')
  
  results.forEach(({ service, result }) => {
    const status = result.success ? '✅' : '❌'
    console.log(`  ${status} ${service}: ${result.filesCreated} files`)
  })
  
  const totalFiles = results.reduce((sum, r) => sum + r.result.filesCreated, 0)
  const successful = results.filter(r => r.result.success).length
  
  console.log(`\nTotal: ${successful}/${results.length} services, ${totalFiles} files\n`)
}

// Example: E-commerce microservices
const services: Service[] = [
  {
    name: 'auth-service',
    schema: './services/auth/schema.prisma',
    framework: 'fastify',
    port: 3001
  },
  {
    name: 'product-service',
    schema: './services/products/schema.prisma',
    framework: 'express',
    port: 3002
  },
  {
    name: 'order-service',
    schema: './services/orders/schema.prisma',
    framework: 'express',
    port: 3003
  },
  {
    name: 'user-service',
    schema: './services/users/schema.prisma',
    framework: 'fastify',
    port: 3004
  }
]

generateMicroservices(services).catch(console.error)


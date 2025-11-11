#!/usr/bin/env node
/**
 * CLI for Prisma → models.json generator
 * 
 * Usage:
 *   prisma-to-models generate ./prisma/schema.prisma --out ./templates/models.json
 *   prisma-to-models watch ./prisma/schema.prisma --out ./templates/models.json
 */

import { generateModelsFromPrisma, watchPrismaSchema } from './generator.js'

const args = process.argv.slice(2)
const command = args[0]

if (!command) {
  console.log(`
Prisma to models.json Generator

Commands:
  generate <schema> --out <output>    Generate models.json once
  watch <schema> --out <output>       Watch and regenerate on changes

Examples:
  prisma-to-models generate ./prisma/schema.prisma --out ./templates/models.json
  prisma-to-models watch ./prisma/schema.prisma --out ./templates/models.json
`)
  process.exit(0)
}

const schemaPath = args[1]
const outputIndex = args.indexOf('--out')
const outputPath = outputIndex >= 0 ? args[outputIndex + 1] : undefined

if (!schemaPath) {
  console.error('❌ Error: Schema path required')
  process.exit(1)
}

if (!outputPath) {
  console.error('❌ Error: Output path required (--out)')
  process.exit(1)
}

switch (command) {
  case 'generate':
    generateModelsFromPrisma(schemaPath, outputPath)
      .then(() => process.exit(0))
      .catch(err => {
        console.error('❌ Generation failed:', err.message)
        process.exit(1)
      })
    break
  
  case 'watch':
    watchPrismaSchema(schemaPath, outputPath)
      .catch(err => {
        console.error('❌ Watch failed:', err.message)
        process.exit(1)
      })
    break
  
  default:
    console.error(`❌ Unknown command: ${command}`)
    process.exit(1)
}


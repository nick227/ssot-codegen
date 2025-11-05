#!/usr/bin/env node
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { generateFromSchema } from '../../../packages/gen/dist/index-new.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')

console.log('[minimal] Generating code from Prisma schema...')

await generateFromSchema({
  schemaPath: resolve(projectRoot, 'prisma/schema.prisma'),
  output: resolve(projectRoot, 'gen'),
  framework: 'express',
})

console.log('[minimal] ✅ Generation complete!')

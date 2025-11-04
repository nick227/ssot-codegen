#!/usr/bin/env node
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { generateFromSchema } from '@ssot-codegen/gen'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')

console.log('[demo-example] Generating code from Prisma schema...')

await generateFromSchema({
  schemaPath: resolve(projectRoot, 'prisma/schema.prisma'),
  output: resolve(projectRoot, 'gen'),
  framework: 'express'
})

console.log('[demo-example] ✅ Generation complete!')

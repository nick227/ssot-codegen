#!/usr/bin/env node
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { generateFromSchema } from '../../../packages/gen/dist/index-new.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')

console.log('[minimal] Generating standalone project from Prisma schema...')
console.log('[minimal] Output will be in an incremental gen-N folder')

await generateFromSchema({
  schemaPath: resolve(projectRoot, 'prisma/schema.prisma'),
  framework: 'express',
  standalone: true,
  projectName: 'minimal-generated',
})

console.log('[minimal] ✅ Generation complete!')
console.log('[minimal] Check the newly created gen-N folder for your standalone project')

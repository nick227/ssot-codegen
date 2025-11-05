#!/usr/bin/env node
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { generateFromSchema } from '../../../packages/gen/dist/index-new.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')

console.log('[blog-example] Generating standalone project from Prisma schema...')
console.log('[blog-example] Output will be in an incremental gen-N folder')

await generateFromSchema({
  schemaPath: resolve(projectRoot, 'prisma/schema.prisma'),
  framework: 'express',
  standalone: true,
  projectName: 'blog-generated',
})

console.log('[blog-example] ✅ Generation complete!')
console.log('[blog-example] Check the newly created gen-N folder for your standalone project')

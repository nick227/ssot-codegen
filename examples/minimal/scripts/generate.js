#!/usr/bin/env node
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const cliPath = resolve(__dirname, '../../../packages/gen/dist/cli.js')

execSync(`node "${cliPath}" --out=./gen --models=User,Post`, { stdio: 'inherit' })
console.log('POC generation complete. See ./gen')

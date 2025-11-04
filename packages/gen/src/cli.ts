#!/usr/bin/env node
import { runGenerator } from './index.js'

const args = new Map<string, string>()
for (const arg of process.argv.slice(2)) {
  const parts = arg.split('=')
  if (parts.length === 2) {
    args.set(parts[0], parts[1])
  }
}

const out = args.get('--out') || './gen'
const modelsArg = args.get('--models') || ''
const models = modelsArg ? modelsArg.split(',').map(s => s.trim()).filter(Boolean) : ['User']
const dmmf = { models: models.map((name: string) => ({ name, fields: [] })) }
await runGenerator({ dmmf, config: { output: out, schemaText: models.join(',') } })

#!/usr/bin/env node
import { execSync } from 'node:child_process'
execSync('node ../../packages/gen/dist/cli.js --out=./gen --models=User,Post', { stdio: 'inherit' })
console.log('POC generation complete. See ./gen')

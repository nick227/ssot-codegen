#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { runGenerator } from '@ssot-codegen/gen';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

console.log('[demo-example] Generating code for Todo model...');

await runGenerator({
  outDir: resolve(projectRoot, 'gen'),
  models: ['Todo']
});

console.log('[demo-example] Generation complete!');


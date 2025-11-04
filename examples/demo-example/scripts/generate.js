#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { runGenerator } from '@ssot-codegen/gen';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

console.log('[demo-example] Generating code for Todo model...');

// POC: Create stub DMMF with just model names
const stubDMMF = {
  models: [
    { name: 'Todo', fields: [] }
  ]
};

await runGenerator({
  dmmf: stubDMMF,
  config: {
    output: resolve(projectRoot, 'gen'),
    schemaText: 'model Todo { id Int @id }'
  }
});

console.log('[demo-example] Generation complete!');


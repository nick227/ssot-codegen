#!/usr/bin/env node

import { execSync } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

const PACKAGES = [
  'packages/core',
  'packages/gen',
  'packages/cli',
  'packages/sdk-runtime',
  'packages/templates-default'
];

function run(command, cwd = ROOT_DIR) {
  console.log(`\n📦 ${command}`);
  try {
    execSync(command, { 
      cwd, 
      stdio: 'inherit'
    });
  } catch (error) {
    console.error(`❌ Failed: ${command}`);
    throw error;
  }
}

console.log('='.repeat(60));
console.log('  Linking Packages for Development');
console.log('='.repeat(60));

// Build first
console.log('\n📦 Building all packages...');
run('pnpm run build');

// Link each package globally
console.log('\n📦 Linking packages globally...');
for (const pkg of PACKAGES) {
  const pkgDir = join(ROOT_DIR, pkg);
  console.log(`\nLinking ${pkg}...`);
  run('pnpm link --global', pkgDir);
}

console.log('\n' + '='.repeat(60));
console.log('✨ Packages linked successfully!');
console.log('='.repeat(60));

console.log(`
Now in your test project, run:

  pnpm link --global @ssot-codegen/cli
  pnpm link --global @ssot-codegen/gen
  pnpm link --global @ssot-codegen/sdk-runtime
  pnpm link --global @ssot-codegen/templates-default
  pnpm link --global @ssot-codegen/core

Or install from the linked packages:
  pnpm install

To unlink:
  pnpm unlink --global @ssot-codegen/cli
  (repeat for each package)
`);


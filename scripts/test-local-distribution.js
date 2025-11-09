#!/usr/bin/env node

import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, rmSync, cpSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT_DIR = join(__dirname, '..');
const TEST_DIR = join(ROOT_DIR, '.test-consumer');
const PACKAGES_TO_PACK = [
  'packages/core',
  'packages/gen',
  'packages/cli',
  'packages/sdk-runtime',
  'packages/templates-default'
];

function run(command, cwd = ROOT_DIR) {
  console.log(`\n📦 Running: ${command}`);
  console.log(`   In: ${cwd}`);
  try {
    execSync(command, { 
      cwd, 
      stdio: 'inherit'
    });
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    process.exit(1);
  }
}

function log(message) {
  console.log(`\n✅ ${message}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60));
}

section('STEP 1: Clean and Build All Packages');

// Clean
console.log('\nCleaning previous build...');
try {
  rmSync(join(ROOT_DIR, 'packages/cli/dist'), { recursive: true, force: true });
  rmSync(join(ROOT_DIR, 'packages/gen/dist'), { recursive: true, force: true });
  rmSync(join(ROOT_DIR, 'packages/sdk-runtime/dist'), { recursive: true, force: true });
  rmSync(join(ROOT_DIR, 'packages/templates-default/dist'), { recursive: true, force: true });
  rmSync(join(ROOT_DIR, 'packages/core/dist'), { recursive: true, force: true });
  log('Cleaned previous build');
} catch (e) {
  log('No previous build to clean');
}

// Build
run('pnpm run build');

section('STEP 2: Create Test Consumer Directory');

// Clean and create test directory
try {
  rmSync(TEST_DIR, { recursive: true, force: true });
} catch (e) {
  // Ignore if doesn't exist
}
mkdirSync(TEST_DIR, { recursive: true });
log('Created .test-consumer directory');

section('STEP 3: Pack All Packages');
const tarballs = [];
for (const pkg of PACKAGES_TO_PACK) {
  const pkgDir = join(ROOT_DIR, pkg);
  console.log(`\nPacking ${pkg}...`);
  const output = execSync('pnpm pack --pack-destination ../../.test-consumer', {
    cwd: pkgDir,
    encoding: 'utf-8'
  });
  
  // Extract tarball filename from output
  const match = output.match(/ssot-codegen-[^\s]+\.tgz/);
  if (match) {
    tarballs.push(match[0]);
    log(`Created: ${match[0]}`);
  }
}

section('STEP 4: Create Test Consumer Project Files');

// Create package.json
const packageJson = {
  name: 'test-consumer',
  version: '1.0.0',
  type: 'module',
  private: true,
  description: 'Test consumer for ssot-codegen',
  scripts: {
    generate: 'ssot generate'
  }
};

writeFileSync(
  join(TEST_DIR, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);
log('Created package.json');

// Create a test schema
const testSchema = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

generator ssot {
  provider = "node ../../packages/gen/dist/index.js"
  output   = "./generated"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;

writeFileSync(join(TEST_DIR, 'schema.prisma'), testSchema);
log('Created schema.prisma');

// Create README
const readme = `# Test Consumer for SSOT Codegen

This is a test consumer project to validate the local distribution.

## What was installed

The following packages were installed from local tarballs:
${tarballs.map(t => `- ${t}`).join('\n')}

## Test the installation

1. Check CLI is available:
   \`\`\`bash
   pnpm ssot --version
   \`\`\`

2. Generate code:
   \`\`\`bash
   pnpm generate
   \`\`\`

3. Check the generated files in \`./generated\` directory

## Cleanup

To remove this test:
\`\`\`bash
cd ..
Remove-Item -Recurse -Force .test-consumer
\`\`\`
`;

writeFileSync(join(TEST_DIR, 'README.md'), readme);
log('Created README.md');

section('STEP 5: Install from Local Tarballs');

// Install all tarballs
const installCommands = tarballs.map(tarball => {
  return `pnpm add ./${tarball}`;
});

for (const cmd of installCommands) {
  run(cmd, TEST_DIR);
}

section('STEP 6: Verify Installation');

// Check if CLI is available
try {
  run('pnpm ssot --version', TEST_DIR);
  log('CLI is working!');
} catch (error) {
  console.error('❌ CLI verification failed');
  process.exit(1);
}

section('✨ SUCCESS!');
console.log(`
Test consumer project created at:
  ${TEST_DIR}

Next steps:
  1. cd .test-consumer
  2. pnpm generate
  3. Review generated code

To test in a completely separate directory:
  1. Copy the .tgz files from .test-consumer to your new project
  2. Run: pnpm add ./ssot-codegen-*.tgz
  3. Add a schema.prisma file
  4. Run: pnpm ssot generate
`);


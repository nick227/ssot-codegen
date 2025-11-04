#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');
const genDir = resolve(projectRoot, 'gen');

console.log('[demo-example] Running tests...\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   ${error.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Test 1: Generation completed
test('Generated files exist', () => {
  assert(existsSync(genDir), 'gen/ directory should exist');
  assert(existsSync(resolve(genDir, 'contracts/todo')), 'contracts/todo should exist');
  assert(existsSync(resolve(genDir, 'controllers/todo')), 'controllers/todo should exist');
  assert(existsSync(resolve(genDir, 'routes/todo')), 'routes/todo should exist');
});

// Test 2: DTO file exists and contains correct type
test('Todo DTO generated correctly', () => {
  const dtoPath = resolve(genDir, 'contracts/todo/todo.create.dto.ts');
  assert(existsSync(dtoPath), 'todo.create.dto.ts should exist');
  const content = readFileSync(dtoPath, 'utf-8');
  assert(content.includes('TodoCreateDTO'), 'Should export TodoCreateDTO');
  assert(content.includes('// @generated'), 'Should have @generated marker');
});

// Test 3: Controller uses @gen alias
test('Controller uses @gen alias imports', () => {
  const controllerPath = resolve(genDir, 'controllers/todo/todo.controller.ts');
  assert(existsSync(controllerPath), 'todo.controller.ts should exist');
  const content = readFileSync(controllerPath, 'utf-8');
  assert(content.includes("from '@gen/contracts/todo'"), 'Should use @gen alias');
  assert(!content.includes('../../../'), 'Should not use deep relative imports');
});

// Test 4: Routes file generated
test('Routes file generated', () => {
  const routesPath = resolve(genDir, 'routes/todo/todo.routes.ts');
  assert(existsSync(routesPath), 'todo.routes.ts should exist');
  const content = readFileSync(routesPath, 'utf-8');
  assert(content.includes('todoRoutes'), 'Should export todoRoutes');
});

// Test 5: OpenAPI spec includes Todo
test('OpenAPI includes Todo paths', () => {
  const openapiPath = resolve(genDir, 'openapi/openapi.json');
  assert(existsSync(openapiPath), 'openapi.json should exist');
  const content = JSON.parse(readFileSync(openapiPath, 'utf-8'));
  assert(content.paths, 'Should have paths');
  assert(content.paths['/todo'] || content.paths['/todos'], 'Should have Todo path');
});

// Test 6: Manifest tracking
test('Manifest tracks all generated files', () => {
  const manifestPath = resolve(genDir, 'manifests/build.json');
  assert(existsSync(manifestPath), 'build.json should exist');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  assert(manifest.schemaHash, 'Should have schemaHash');
  assert(manifest.toolVersion === '0.4.0', 'Should have correct toolVersion');
  assert(manifest.outputs && manifest.outputs.length > 0, 'Should track outputs');
});

// Test 7: Barrels exist
test('Barrel exports generated', () => {
  assert(existsSync(resolve(genDir, 'contracts/todo/index.ts')), 'Model barrel should exist');
  assert(existsSync(resolve(genDir, 'contracts/index.ts')), 'Layer barrel should exist');
});

console.log(`\n${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}


#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');
const genDir = resolve(projectRoot, 'gen');

console.log('[blog-example] Running tests...\n');

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

const models = ['Author', 'Post', 'Comment', 'Category', 'Tag', 'PostCategory', 'PostTag'];

// Test 1: All model directories generated
test('All model directories exist', () => {
  models.forEach(model => {
    const modelPath = resolve(genDir, `contracts/${model.toLowerCase()}`);
    assert(existsSync(modelPath), `${model} directory should exist`);
  });
});

// Test 2: Core models have all artifacts
test('Core models have complete artifacts', () => {
  ['Author', 'Post', 'Comment', 'Category', 'Tag'].forEach(model => {
    const lowercaseModel = model.toLowerCase();
    assert(existsSync(resolve(genDir, `contracts/${lowercaseModel}`)), `${model} contracts exist`);
    assert(existsSync(resolve(genDir, `controllers/${lowercaseModel}`)), `${model} controllers exist`);
    assert(existsSync(resolve(genDir, `routes/${lowercaseModel}`)), `${model} routes exist`);
    assert(existsSync(resolve(genDir, `services/${lowercaseModel}`)), `${model} services exist`);
  });
});

// Test 3: Post model has proper structure
test('Post model fully generated', () => {
  const postDto = resolve(genDir, 'contracts/post/post.create.dto.ts');
  assert(existsSync(postDto), 'Post DTO should exist');
  const content = readFileSync(postDto, 'utf-8');
  assert(content.includes('PostCreateDTO'), 'Should export PostCreateDTO');
});

// Test 4: Relationship integrity
test('Models use @gen alias for relationships', () => {
  const postController = resolve(genDir, 'controllers/post/post.controller.ts');
  assert(existsSync(postController), 'Post controller should exist');
  const content = readFileSync(postController, 'utf-8');
  assert(content.includes("@gen/contracts"), 'Should use @gen alias');
});

// Test 5: OpenAPI has all paths
test('OpenAPI includes all model paths', () => {
  const openapiPath = resolve(genDir, 'openapi/openapi.json');
  assert(existsSync(openapiPath), 'openapi.json should exist');
  const spec = JSON.parse(readFileSync(openapiPath, 'utf-8'));
  
  assert(spec.paths, 'Should have paths');
  ['author', 'post', 'comment', 'category', 'tag'].forEach(model => {
    const hasPath = spec.paths[`/${model}`] || spec.paths[`/${model}s`];
    assert(hasPath, `Should have ${model} path`);
  });
});

// Test 6: Manifest tracks everything
test('Manifest tracks all generated files', () => {
  const manifestPath = resolve(genDir, 'manifests/build.json');
  assert(existsSync(manifestPath), 'build.json should exist');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  
  assert(manifest.schemaHash, 'Should have schemaHash');
  assert(manifest.outputs.length >= 70, `Should track 70+ files (got ${manifest.outputs.length})`);
});

// Test 7: Junction tables generated
test('Junction tables (PostCategory, PostTag) generated', () => {
  assert(existsSync(resolve(genDir, 'contracts/postcategory')), 'PostCategory should exist');
  assert(existsSync(resolve(genDir, 'contracts/posttag')), 'PostTag should exist');
});

// Test 8: Barrel exports for all models
test('Barrel exports for all models', () => {
  models.forEach(model => {
    const barrelPath = resolve(genDir, `contracts/${model.toLowerCase()}/index.ts`);
    assert(existsSync(barrelPath), `${model} barrel should exist`);
  });
});

console.log(`\n📊 Blog Example: ${passed} passed, ${failed} failed`);
console.log(`📦 Generated ${models.length} models with full CRUD operations`);

if (failed > 0) {
  process.exit(1);
}


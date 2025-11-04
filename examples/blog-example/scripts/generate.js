#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { runGenerator } from '@ssot-codegen/gen';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

console.log('[blog-example] Generating code for blog platform...');
console.log('[blog-example] Models: Author, Post, Comment, Category, Tag, PostCategory, PostTag');

await runGenerator({
  outDir: resolve(projectRoot, 'gen'),
  models: ['Author', 'Post', 'Comment', 'Category', 'Tag', 'PostCategory', 'PostTag']
});

console.log('[blog-example] Generation complete!');
console.log('[blog-example] Generated structure includes:');
console.log('  - 7 models with full CRUD operations');
console.log('  - Author authentication and roles');
console.log('  - Post with categories, tags, and comments');
console.log('  - Nested comment replies');
console.log('  - OpenAPI spec ready for client SDK generation');


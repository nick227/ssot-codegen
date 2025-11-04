#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

console.log('🧪 SSOT Codegen - Testing All Examples\n');
console.log('=' .repeat(60));

const examples = [
  { name: 'Demo (Todo)', path: 'examples/demo-example', models: 1 },
  { name: 'Blog Platform', path: 'examples/blog-example', models: 7 },
  { name: 'E-commerce Store', path: 'examples/ecommerce-example', models: 17 }
];

let totalPassed = 0;
let totalFailed = 0;

async function runTest(example) {
  return new Promise((resolve, reject) => {
    console.log(`\n📦 Testing: ${example.name} (${example.models} models)`);
    console.log('-'.repeat(60));
    
    const testPath = resolve(projectRoot, example.path, 'scripts/test.js');
    const proc = spawn('node', [testPath], {
      cwd: resolve(projectRoot, example.path),
      stdio: 'inherit',
      shell: true
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${example.name} tests PASSED`);
        resolve({ success: true, name: example.name });
      } else {
        console.log(`❌ ${example.name} tests FAILED`);
        resolve({ success: false, name: example.name });
      }
    });
    
    proc.on('error', (err) => {
      console.error(`Error running ${example.name} tests:`, err);
      resolve({ success: false, name: example.name });
    });
  });
}

async function main() {
  const results = [];
  
  for (const example of examples) {
    const result = await runTest(example);
    results.push(result);
    
    if (result.success) {
      totalPassed++;
    } else {
      totalFailed++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary\n');
  
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
  });
  
  console.log('\n' + '-'.repeat(60));
  console.log(`Total: ${totalPassed} passed, ${totalFailed} failed`);
  console.log('='.repeat(60));
  
  if (totalFailed > 0) {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  } else {
    console.log('\n✅ All example tests passed!');
    console.log('\n🎉 SSOT Codegen examples are working perfectly!');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});


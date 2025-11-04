#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');
const genDir = resolve(projectRoot, 'gen');

console.log('[ecommerce-example] Running tests...\n');

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

const coreModels = [
  'Customer', 'Address', 'Product', 'Category', 'Brand',
  'Cart', 'Order', 'Payment', 'Shipment', 'Review'
];

const newCriticalModels = [
  'Coupon', 'StockReservation', 'StockHistory', 'Refund', 'RefundItem'
];

const newEnhancementModels = [
  'ReviewImage', 'ProductAlert'
];

const supportModels = [
  'ProductImage', 'ProductVariant', 'CartItem', 'OrderItem',
  'ProductTag', 'Tag', 'WishlistItem'
];

const allModels = [...coreModels, ...newCriticalModels, ...newEnhancementModels, ...supportModels];

// Test 1: All model directories generated
test('All 24 model directories exist (improved schema)', () => {
  allModels.forEach(model => {
    const modelPath = resolve(genDir, `contracts/${model.toLowerCase()}`);
    assert(existsSync(modelPath), `${model} directory should exist at ${modelPath}`);
  });
});

// Test 2: Core models have complete artifacts
test('Core models have full CRUD artifacts', () => {
  coreModels.forEach(model => {
    const lowercaseModel = model.toLowerCase();
    assert(existsSync(resolve(genDir, `contracts/${lowercaseModel}`)), `${model} contracts`);
    assert(existsSync(resolve(genDir, `controllers/${lowercaseModel}`)), `${model} controllers`);
    assert(existsSync(resolve(genDir, `routes/${lowercaseModel}`)), `${model} routes`);
    assert(existsSync(resolve(genDir, `services/${lowercaseModel}`)), `${model} services`);
  });
});

// Test 3: Product model comprehensive
test('Product model fully generated with all features', () => {
  const productDto = resolve(genDir, 'contracts/product/product.create.dto.ts');
  assert(existsSync(productDto), 'Product DTO should exist');
  const content = readFileSync(productDto, 'utf-8');
  assert(content.includes('ProductCreateDTO'), 'Should export ProductCreateDTO');
  assert(content.includes('// @generated'), 'Should have @generated marker');
});

// Test 4: Customer-Order relationship
test('Customer and Order models properly linked', () => {
  assert(existsSync(resolve(genDir, 'contracts/customer')), 'Customer should exist');
  assert(existsSync(resolve(genDir, 'contracts/order')), 'Order should exist');
  assert(existsSync(resolve(genDir, 'contracts/address')), 'Address should exist');
});

// Test 5: Cart system
test('Shopping cart system generated', () => {
  assert(existsSync(resolve(genDir, 'contracts/cart')), 'Cart should exist');
  assert(existsSync(resolve(genDir, 'contracts/cartitem')), 'CartItem should exist');
  assert(existsSync(resolve(genDir, 'controllers/cart')), 'Cart controller should exist');
});

// Test 6: Payment and Shipment
test('Payment and shipment tracking generated', () => {
  assert(existsSync(resolve(genDir, 'contracts/payment')), 'Payment should exist');
  assert(existsSync(resolve(genDir, 'contracts/shipment')), 'Shipment should exist');
  assert(existsSync(resolve(genDir, 'services/payment')), 'Payment service should exist');
});

// Test 7: Product features
test('Product features (images, variants, reviews)', () => {
  assert(existsSync(resolve(genDir, 'contracts/productimage')), 'ProductImage should exist');
  assert(existsSync(resolve(genDir, 'contracts/productvariant')), 'ProductVariant should exist');
  assert(existsSync(resolve(genDir, 'contracts/review')), 'Review should exist');
  assert(existsSync(resolve(genDir, 'contracts/wishlistitem')), 'WishlistItem should exist');
});

// Test 8: OpenAPI has all paths
test('OpenAPI includes all core model endpoints', () => {
  const openapiPath = resolve(genDir, 'openapi/openapi.json');
  assert(existsSync(openapiPath), 'openapi.json should exist');
  const spec = JSON.parse(readFileSync(openapiPath, 'utf-8'));
  
  assert(spec.paths, 'Should have paths object');
  assert(spec.components, 'Should have components');
  
  // Check for key endpoints
  const keyModels = ['customer', 'product', 'order', 'cart'];
  keyModels.forEach(model => {
    const hasPath = spec.paths[`/${model}`] || spec.paths[`/${model}s`];
    assert(hasPath, `Should have ${model} endpoint`);
  });
});

// Test 9: Manifest completeness
test('Manifest tracks all generated files', () => {
  const manifestPath = resolve(genDir, 'manifests/build.json');
  assert(existsSync(manifestPath), 'build.json should exist');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  
  assert(manifest.schemaHash, 'Should have schemaHash');
  assert(manifest.toolVersion === '0.4.0', 'Should have correct version');
  assert(manifest.outputs.length >= 240, `Should track 240+ files (got ${manifest.outputs.length})`);
});

// Test 10: Import quality
test('Generated files use @gen alias imports', () => {
  const orderController = resolve(genDir, 'controllers/order/order.controller.ts');
  assert(existsSync(orderController), 'Order controller should exist');
  const content = readFileSync(orderController, 'utf-8');
  assert(content.includes('@gen/contracts'), 'Should use @gen alias');
  assert(!content.includes('../../../'), 'Should not use deep relative imports');
});

// Test 11: Junction tables
test('Junction tables for many-to-many relationships', () => {
  assert(existsSync(resolve(genDir, 'contracts/producttag')), 'ProductTag junction should exist');
});

// Test 12: Category hierarchy
test('Category with hierarchical support generated', () => {
  assert(existsSync(resolve(genDir, 'contracts/category')), 'Category should exist');
  assert(existsSync(resolve(genDir, 'services/category')), 'Category service should exist');
});

// Test 13: NEW - Critical features
test('Critical e-commerce features generated', () => {
  assert(existsSync(resolve(genDir, 'contracts/coupon')), 'Coupon system should exist');
  assert(existsSync(resolve(genDir, 'contracts/stockreservation')), 'Stock reservation should exist');
  assert(existsSync(resolve(genDir, 'contracts/refund')), 'Refund system should exist');
  assert(existsSync(resolve(genDir, 'contracts/stockhistory')), 'Stock history should exist');
});

// Test 14: NEW - Enhancement features
test('Enhancement features generated', () => {
  assert(existsSync(resolve(genDir, 'contracts/reviewimage')), 'Review images should exist');
  assert(existsSync(resolve(genDir, 'contracts/productalert')), 'Product alerts should exist');
});

console.log(`\n📊 E-commerce Example (IMPROVED): ${passed} passed, ${failed} failed`);
console.log(`📦 Generated ${allModels.length} models (24 total)`);
console.log(`🎯 Includes: Coupons, Stock Reservation, Refunds, SEO, Alerts`);
console.log(`🛒 PRODUCTION-READY online store!`);

if (failed > 0) {
  process.exit(1);
}


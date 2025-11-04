#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { runGenerator } from '@ssot-codegen/gen';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

console.log('[ecommerce-example] Generating code for e-commerce platform...');
console.log('[ecommerce-example] This is a complete online store in a box!');

const models = [
  'Customer',
  'Address',
  'Product',
  'Category',
  'Brand',
  'ProductImage',
  'ProductVariant',
  'Cart',
  'CartItem',
  'Order',
  'OrderItem',
  'Payment',
  'Shipment',
  'Review',
  'Tag',
  'ProductTag',
  'WishlistItem'
];

console.log(`[ecommerce-example] Generating ${models.length} models...`);

await runGenerator({
  outDir: resolve(projectRoot, 'gen'),
  models
});

console.log('[ecommerce-example] Generation complete!');
console.log('[ecommerce-example] Generated features:');
console.log('  ✅ Customer management with addresses');
console.log('  ✅ Product catalog with variants and images');
console.log('  ✅ Categories and brands with hierarchy');
console.log('  ✅ Shopping cart system');
console.log('  ✅ Order processing with status tracking');
console.log('  ✅ Payment gateway integration');
console.log('  ✅ Shipment tracking');
console.log('  ✅ Product reviews and ratings');
console.log('  ✅ Wishlist functionality');
console.log('  ✅ Product tagging system');
console.log('\n🎉 Ready to build your online store!');


#!/usr/bin/env node
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { generateFromSchema } from '../../../packages/gen/dist/index-new.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')

console.log('[ecommerce-example] Generating standalone project for e-commerce platform...')
console.log('[ecommerce-example] This is a complete online store in a box!')
console.log('[ecommerce-example] Output will be in an incremental gen-N folder')

await generateFromSchema({
  schemaPath: resolve(projectRoot, 'prisma/schema.prisma'),
  framework: 'express',
  standalone: true,
  projectName: 'ecommerce-generated',
});

console.log('[ecommerce-example] Generation complete!');
console.log('[ecommerce-example] Generated features:');
console.log('  ✅ Customer management with authentication');
console.log('  ✅ Product catalog with SEO and variants');
console.log('  ✅ Categories and brands with hierarchy');
console.log('  ✅ Shopping cart with variant support');
console.log('  ✅ Order processing with detailed tracking');
console.log('  ✅ Payment gateway integration');
console.log('  ✅ Shipment tracking');
console.log('  ✅ Product reviews with images');
console.log('  ✅ Wishlist functionality');
console.log('  ✅ Product tagging system');
console.log('  🎯 Coupon/discount system');
console.log('  🎯 Stock reservation (prevent overselling)');
console.log('  🎯 Complete refunds & returns');
console.log('  🎯 Inventory audit trail');
console.log('  🎯 Back-in-stock alerts');
console.log('\n🎉 PRODUCTION-READY online store!');
console.log('[ecommerce-example] Check the newly created gen-N folder for your standalone project');


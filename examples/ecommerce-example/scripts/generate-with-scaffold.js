#!/usr/bin/env node
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { runGenerator, scaffoldProject } from '@ssot-codegen/gen'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')

console.log('[ecommerce-example] Generating complete project with scaffolding...')

const models = [
  'Customer', 'Address', 'Product', 'ProductVariant', 'Category', 'ProductImage',
  'Cart', 'CartItem', 'Order', 'OrderItem', 'Payment', 'Shipment',
  'Review', 'Wishlist', 'WishlistItem', 'Coupon', 'Refund'
]

// POC: Create stub DMMF
const stubDMMF = {
  models: models.map(name => ({ name, fields: [] }))
}

// Generate code artifacts
await runGenerator({
  dmmf: stubDMMF,
  config: {
    output: resolve(projectRoot, 'gen'),
    schemaText: models.map(m => `model ${m} { id Int @id }`).join('\n'),
    projectName: 'ecommerce-example',
    description: 'Complete e-commerce store with products, orders, payments, and inventory',
    framework: 'express',
    scaffold: true
  }
})

// Generate project scaffolding
scaffoldProject({
  projectName: 'ecommerce-example',
  projectRoot,
  description: 'Complete e-commerce store with products, orders, payments, and inventory',
  models,
  framework: 'express',
  useTypeScript: true
})

console.log('\n[ecommerce-example] ✅ Complete project generated!')
console.log('\n📦 Next steps:')
console.log('  1. npm install')
console.log('  2. cp .env.example .env')
console.log('  3. Edit .env with your DATABASE_URL')
console.log('  4. npm run db:push')
console.log('  5. npm run dev')
console.log('\n🚀 Your e-commerce API will be ready at http://localhost:3000')


/**
 * Test Data Factory - E-commerce
 */

import { PrismaClient } from '@prisma/client'

export async function createCustomer(
  prisma: PrismaClient,
  overrides: {
    email?: string
    firstName?: string
    lastName?: string
  } = {}
) {
  const timestamp = Date.now()
  return await prisma.customer.create({
    data: {
      email: overrides.email || `customer-${timestamp}@test.com`,
      firstName: overrides.firstName || 'Test',
      lastName: overrides.lastName || 'Customer'
    }
  })
}

export async function createCategory(
  prisma: PrismaClient,
  overrides: {
    name?: string
    slug?: string
    description?: string
  } = {}
) {
  const timestamp = Date.now()
  return await prisma.category.create({
    data: {
      name: overrides.name || `Category ${timestamp}`,
      slug: overrides.slug || `category-${timestamp}`,
      description: overrides.description
    }
  })
}

export async function createProduct(
  prisma: PrismaClient,
  overrides: {
    sku?: string
    name?: string
    slug?: string
    price?: number
    stock?: number
    isActive?: boolean
    isFeatured?: boolean
  } = {}
) {
  const timestamp = Date.now()
  return await prisma.product.create({
    data: {
      sku: overrides.sku || `SKU-${timestamp}`,
      name: overrides.name || `Product ${timestamp}`,
      slug: overrides.slug || `product-${timestamp}`,
      description: `Description for ${overrides.name || 'product'}`,
      price: overrides.price ?? 99.99,
      stock: overrides.stock ?? 10,
      isActive: overrides.isActive ?? true,
      isFeatured: overrides.isFeatured ?? false
    }
  })
}

export async function createCart(
  prisma: PrismaClient,
  customerId: number
) {
  return await prisma.cart.create({
    data: {
      customerId,
      status: 'ACTIVE'
    }
  })
}

export async function addProductToCart(
  prisma: PrismaClient,
  cartId: number,
  productId: number,
  quantity = 1
) {
  const product = await prisma.product.findUnique({
    where: { id: productId }
  })

  if (!product) {
    throw new Error('Product not found')
  }

  return await prisma.cartItem.create({
    data: {
      cartId,
      productId,
      quantity,
      price: product.price
    }
  })
}

export async function createOrder(
  prisma: PrismaClient,
  customerId: number,
  productIds: number[]
) {
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } }
  })

  const total = products.reduce((sum, p) => sum + Number(p.price), 0)

  const order = await prisma.order.create({
    data: {
      customerId,
      status: 'PENDING',
      totalAmount: total,
      shippingAddress: '123 Test St'
    }
  })

  await Promise.all(
    products.map((product, index) =>
      prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          quantity: 1,
          price: product.price
        }
      })
    )
  )

  return order
}


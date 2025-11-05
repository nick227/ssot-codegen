/**
 * Database Test Helpers - E-commerce
 */

import { PrismaClient } from '@prisma/client'

let prismaInstance: PrismaClient | null = null

export function getTestPrisma(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || process.env.TEST_DATABASE_URL
        }
      }
    })
  }
  return prismaInstance
}

export async function cleanDatabase(prisma: PrismaClient): Promise<void> {
  // Order matters - delete children before parents
  await prisma.orderItem.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.review.deleteMany()
  await prisma.productImage.deleteMany()
  await prisma.productCategoryRelation.deleteMany()
  await prisma.wishlistItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.cart.deleteMany()
  await prisma.wishlist.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.customer.deleteMany()
}

export async function disconnectDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$disconnect()
  prismaInstance = null
}

export async function seedTestData(prisma: PrismaClient) {
  const category = await prisma.category.create({
    data: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices'
    }
  })

  const product = await prisma.product.create({
    data: {
      sku: 'TEST-001',
      name: 'Test Product',
      slug: 'test-product',
      description: 'A test product',
      price: 99.99,
      stock: 10,
      isActive: true
    }
  })

  const customer = await prisma.customer.create({
    data: {
      email: 'test@customer.com',
      firstName: 'Test',
      lastName: 'Customer'
    }
  })

  return { category, product, customer }
}


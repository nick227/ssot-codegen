#!/usr/bin/env tsx
/**
 * Seed script for ecommerce-example
 * Creates comprehensive e-commerce test data
 */

import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/auth/password.js'

const prisma = new PrismaClient()

async function seed() {
  console.log('🌱 Seeding e-commerce database...\n')

  try {
    // Clear existing data in correct order (respecting foreign keys)
    console.log('🗑️  Clearing existing data...')
    await prisma.orderItem.deleteMany()
    await prisma.payment.deleteMany()
    await prisma.shipment.deleteMany()
    await prisma.order.deleteMany()
    await prisma.cartItem.deleteMany()
    await prisma.cart.deleteMany()
    await prisma.review.deleteMany()
    await prisma.wishlistItem.deleteMany()
    await prisma.productAlert.deleteMany()
    await prisma.productImage.deleteMany()
    await prisma.productCategoryRelation.deleteMany()
    await prisma.product.deleteMany()
    await prisma.category.deleteMany()
    await prisma.coupon.deleteMany()
    await prisma.address.deleteMany()
    await prisma.customer.deleteMany()

    // Create customers
    console.log('👥 Creating customers...')
    const password = await hashPassword('Shop123!@#')

    const customer1 = await prisma.customer.create({
      data: {
        email: 'john@shop.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1-555-0101',
        passwordHash: password,
        emailVerified: true,
        loyaltyPoints: 150,
        marketingOptIn: true,
      },
    })

    const customer2 = await prisma.customer.create({
      data: {
        email: 'jane@shop.com',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1-555-0102',
        passwordHash: password,
        emailVerified: true,
        loyaltyPoints: 320,
        marketingOptIn: true,
      },
    })

    const customer3 = await prisma.customer.create({
      data: {
        email: 'mike@shop.com',
        firstName: 'Mike',
        lastName: 'Johnson',
        phone: '+1-555-0103',
        passwordHash: password,
        emailVerified: false,
      },
    })

    console.log(`✅ Created ${3} customers`)

    // Create addresses
    console.log('📍 Creating addresses...')
    const address1 = await prisma.address.create({
      data: {
        customerId: customer1.id,
        addressType: 'BOTH',
        streetAddress: '123 Main Street',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
        phone: '+1-555-0101',
        isDefault: true,
      },
    })

    const address2 = await prisma.address.create({
      data: {
        customerId: customer2.id,
        addressType: 'BOTH',
        streetAddress: '456 Oak Avenue',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90001',
        country: 'US',
        phone: '+1-555-0102',
        isDefault: true,
      },
    })

    console.log(`✅ Created ${2} addresses`)

    // Create categories
    console.log('📁 Creating categories...')
    const electronics = await prisma.category.create({
      data: {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices and accessories',
        isActive: true,
      },
    })

    const computers = await prisma.category.create({
      data: {
        name: 'Computers',
        slug: 'computers',
        description: 'Laptops, desktops, and computer accessories',
        parentId: electronics.id,
        isActive: true,
      },
    })

    const clothing = await prisma.category.create({
      data: {
        name: 'Clothing',
        slug: 'clothing',
        description: 'Fashion and apparel',
        isActive: true,
      },
    })

    const books = await prisma.category.create({
      data: {
        name: 'Books',
        slug: 'books',
        description: 'Books and e-books',
        isActive: true,
      },
    })

    console.log(`✅ Created ${4} categories`)

    // Create products
    console.log('📦 Creating products...')
    const laptop = await prisma.product.create({
      data: {
        sku: 'LAPTOP-001',
        name: 'Professional Laptop 15"',
        slug: 'professional-laptop-15',
        description: 'High-performance laptop for professionals. 16GB RAM, 512GB SSD, Intel i7 processor.',
        shortDescription: 'Professional-grade laptop with high specs',
        price: 1299.99,
        compareAtPrice: 1499.99,
        costPrice: 950.00,
        stock: 25,
        lowStockThreshold: 5,
        weight: 2.1,
        isActive: true,
        isFeatured: true,
        metaTitle: 'Professional Laptop 15" - High Performance',
        metaDescription: 'Best laptop for professionals with 16GB RAM and 512GB SSD',
        categories: {
          create: [
            { categoryId: electronics.id },
            { categoryId: computers.id },
          ],
        },
        images: {
          create: [
            { url: 'https://example.com/laptop-1.jpg', altText: 'Laptop front view', sortOrder: 0 },
            { url: 'https://example.com/laptop-2.jpg', altText: 'Laptop side view', sortOrder: 1 },
          ],
        },
      },
    })

    const mouse = await prisma.product.create({
      data: {
        sku: 'MOUSE-001',
        name: 'Wireless Gaming Mouse',
        slug: 'wireless-gaming-mouse',
        description: 'Ergonomic wireless mouse with programmable buttons. Perfect for gaming and productivity.',
        shortDescription: 'High-precision wireless mouse',
        price: 79.99,
        compareAtPrice: 99.99,
        costPrice: 35.00,
        stock: 100,
        lowStockThreshold: 20,
        weight: 0.15,
        isActive: true,
        isFeatured: false,
        categories: {
          create: [{ categoryId: electronics.id }],
        },
      },
    })

    const tshirt = await prisma.product.create({
      data: {
        sku: 'SHIRT-001',
        name: 'Classic Cotton T-Shirt',
        slug: 'classic-cotton-tshirt',
        description: '100% organic cotton t-shirt. Comfortable and durable.',
        shortDescription: 'Soft organic cotton tee',
        price: 29.99,
        stock: 200,
        lowStockThreshold: 30,
        weight: 0.2,
        isActive: true,
        categories: {
          create: [{ categoryId: clothing.id }],
        },
      },
    })

    const book = await prisma.product.create({
      data: {
        sku: 'BOOK-001',
        name: 'TypeScript Handbook',
        slug: 'typescript-handbook',
        description: 'Comprehensive guide to TypeScript programming. From basics to advanced patterns.',
        shortDescription: 'Complete TypeScript guide',
        price: 49.99,
        stock: 50,
        lowStockThreshold: 10,
        weight: 0.8,
        isActive: true,
        categories: {
          create: [{ categoryId: books.id }],
        },
      },
    })

    console.log(`✅ Created ${4} products`)

    // Create coupons
    console.log('🎟️  Creating coupons...')
    const welcomeCoupon = await prisma.coupon.create({
      data: {
        code: 'WELCOME10',
        description: 'Welcome discount for new customers',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minPurchase: 50,
        maxDiscount: 20,
        usageLimit: 1000,
        usageCount: 15,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    })

    const freeship = await prisma.coupon.create({
      data: {
        code: 'FREESHIP',
        description: 'Free shipping on orders over $100',
        discountType: 'FREE_SHIPPING',
        discountValue: 0,
        minPurchase: 100,
        usageLimit: 5000,
        usageCount: 234,
        isActive: true,
        validFrom: new Date(),
      },
    })

    console.log(`✅ Created ${2} coupons`)

    // Create orders
    console.log('📦 Creating orders...')
    const order1 = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-1`,
        customerId: customer1.id,
        status: 'DELIVERED',
        totalAmount: 1379.98,
        subtotalAmount: 1379.98,
        discountAmount: 0,
        shippingAmount: 0,
        taxAmount: 110.40,
        shippingAddressId: address1.id,
        billingAddressId: address1.id,
        items: {
          create: [
            {
              productId: laptop.id,
              quantity: 1,
              unitPrice: 1299.99,
              totalPrice: 1299.99,
            },
            {
              productId: mouse.id,
              quantity: 1,
              unitPrice: 79.99,
              totalPrice: 79.99,
            },
          ],
        },
        payments: {
          create: {
            amount: 1490.38,
            method: 'CREDIT_CARD',
            status: 'COMPLETED',
            transactionId: `TXN-${Date.now()}-1`,
          },
        },
        shipments: {
          create: {
            trackingNumber: `TRACK-${Date.now()}-1`,
            carrier: 'UPS',
            status: 'DELIVERED',
            shippedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            deliveredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          },
        },
      },
    })

    const order2 = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-2`,
        customerId: customer2.id,
        status: 'PROCESSING',
        totalAmount: 159.97,
        subtotalAmount: 159.97,
        discountAmount: 17.78,
        shippingAmount: 0,
        taxAmount: 12.80,
        couponCode: 'WELCOME10',
        shippingAddressId: address2.id,
        billingAddressId: address2.id,
        items: {
          create: [
            {
              productId: tshirt.id,
              quantity: 2,
              unitPrice: 29.99,
              totalPrice: 59.98,
            },
            {
              productId: book.id,
              quantity: 2,
              unitPrice: 49.99,
              totalPrice: 99.98,
            },
          ],
        },
        payments: {
          create: {
            amount: 154.99,
            method: 'PAYPAL',
            status: 'COMPLETED',
            transactionId: `TXN-${Date.now()}-2`,
          },
        },
      },
    })

    console.log(`✅ Created ${2} orders`)

    // Create reviews
    console.log('⭐ Creating reviews...')
    await prisma.review.create({
      data: {
        productId: laptop.id,
        customerId: customer1.id,
        rating: 5,
        title: 'Excellent laptop!',
        content: 'Very fast and reliable. Perfect for development work.',
        isVerifiedPurchase: true,
        isApproved: true,
      },
    })

    await prisma.review.create({
      data: {
        productId: mouse.id,
        customerId: customer1.id,
        rating: 4,
        title: 'Good mouse, slight lag',
        content: 'Overall good but occasionally has connection issues.',
        isVerifiedPurchase: true,
        isApproved: true,
      },
    })

    await prisma.review.create({
      data: {
        productId: book.id,
        customerId: customer2.id,
        rating: 5,
        title: 'Best TypeScript book!',
        content: 'Comprehensive and easy to follow. Highly recommended!',
        isVerifiedPurchase: true,
        isApproved: true,
      },
    })

    console.log(`✅ Created ${3} reviews`)

    // Create cart for customer3
    console.log('🛒 Creating shopping cart...')
    const cart = await prisma.cart.create({
      data: {
        customerId: customer3.id,
        items: {
          create: [
            {
              productId: laptop.id,
              quantity: 1,
              priceAtAdd: 1299.99,
            },
            {
              productId: mouse.id,
              quantity: 2,
              priceAtAdd: 79.99,
            },
          ],
        },
      },
    })

    console.log(`✅ Created shopping cart with ${2} items`)

    // Create wishlist items
    console.log('💝 Creating wishlist items...')
    await prisma.wishlistItem.create({
      data: {
        customerId: customer3.id,
        productId: tshirt.id,
      },
    })

    await prisma.wishlistItem.create({
      data: {
        customerId: customer3.id,
        productId: book.id,
      },
    })

    console.log(`✅ Created ${2} wishlist items`)

    // Summary
    const stats = {
      customers: await prisma.customer.count(),
      addresses: await prisma.address.count(),
      products: await prisma.product.count(),
      categories: await prisma.category.count(),
      orders: await prisma.order.count(),
      orderItems: await prisma.orderItem.count(),
      payments: await prisma.payment.count(),
      reviews: await prisma.review.count(),
      coupons: await prisma.coupon.count(),
      cartItems: await prisma.cartItem.count(),
      wishlistItems: await prisma.wishlistItem.count(),
    }

    console.log('\n✅ Seed completed successfully!\n')
    console.log('📊 Database populated with:')
    console.log(`   - ${stats.customers} customers`)
    console.log(`   - ${stats.addresses} addresses`)
    console.log(`   - ${stats.products} products`)
    console.log(`   - ${stats.categories} categories (with hierarchy)`)
    console.log(`   - ${stats.orders} orders (1 delivered, 1 processing)`)
    console.log(`   - ${stats.orderItems} order items`)
    console.log(`   - ${stats.payments} payments`)
    console.log(`   - ${stats.reviews} reviews`)
    console.log(`   - ${stats.coupons} active coupons`)
    console.log(`   - ${stats.cartItems} cart items`)
    console.log(`   - ${stats.wishlistItems} wishlist items`)
    console.log('\n🎯 Test credentials:')
    console.log('   Email: john@shop.com')
    console.log('   Password: Shop123!@#')
    console.log('   (Customer with completed order)')
    console.log('\n   Email: jane@shop.com')
    console.log('   Password: Shop123!@#')
    console.log('   (Customer with processing order)')
    console.log('\n   Email: mike@shop.com')
    console.log('   Password: Shop123!@#')
    console.log('   (Customer with cart and wishlist)')
    console.log('\n🎟️  Test coupons:')
    console.log('   Code: WELCOME10 (10% off, min $50)')
    console.log('   Code: FREESHIP (Free shipping, min $100)\n')
  } catch (error) {
    console.error('\n❌ Seed failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seed()


/**
 * Seed Script - Populate database with sample data for search testing
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')
  
  // Clear existing data
  await prisma.review.deleteMany()
  await prisma.productImage.deleteMany()
  await prisma.product.deleteMany()
  await prisma.blogPost.deleteMany()
  await prisma.user.deleteMany()
  
  // Create users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john.doe@example.com',
        name: 'John Doe',
        username: 'johnd',
        bio: 'Tech enthusiast and blogger',
        role: 'CUSTOMER'
      }
    }),
    prisma.user.create({
      data: {
        email: 'jane.smith@example.com',
        name: 'Jane Smith',
        username: 'janes',
        bio: 'Software engineer passionate about TypeScript',
        role: 'CUSTOMER'
      }
    }),
    prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Admin User',
        username: 'admin',
        role: 'ADMIN'
      }
    })
  ])
  
  console.log(`✅ Created ${users.length} users`)
  
  // Create products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Gaming Laptop',
        slug: 'gaming-laptop',
        description: 'High-performance laptop for gaming and content creation with RTX 4070 GPU',
        price: 1299.99,
        category: 'Electronics',
        tags: ['laptop', 'gaming', 'nvidia', 'rtx'],
        inStock: true,
        viewCount: 450,
        rating: 4.7
      }
    }),
    prisma.product.create({
      data: {
        name: 'Wireless Gaming Mouse',
        slug: 'wireless-gaming-mouse',
        description: 'Ergonomic wireless mouse with RGB lighting and programmable buttons',
        price: 79.99,
        category: 'Accessories',
        tags: ['mouse', 'gaming', 'wireless', 'rgb'],
        inStock: true,
        viewCount: 320,
        rating: 4.5
      }
    }),
    prisma.product.create({
      data: {
        name: 'Mechanical Keyboard',
        slug: 'mechanical-keyboard',
        description: 'Premium mechanical keyboard with Cherry MX switches',
        price: 149.99,
        category: 'Accessories',
        tags: ['keyboard', 'mechanical', 'gaming'],
        inStock: true,
        viewCount: 280,
        rating: 4.8
      }
    }),
    prisma.product.create({
      data: {
        name: 'USB-C Hub',
        slug: 'usb-c-hub',
        description: 'Multi-port USB-C hub for laptops with HDMI, USB-A, and SD card reader',
        price: 39.99,
        category: 'Accessories',
        tags: ['usb', 'hub', 'adapter'],
        inStock: true,
        viewCount: 150,
        rating: 4.3
      }
    }),
    prisma.product.create({
      data: {
        name: 'Laptop Stand',
        slug: 'laptop-stand',
        description: 'Adjustable aluminum laptop stand for better ergonomics',
        price: 49.99,
        category: 'Accessories',
        tags: ['stand', 'laptop', 'ergonomic'],
        inStock: true,
        viewCount: 95,
        rating: 4.6
      }
    }),
    prisma.product.create({
      data: {
        name: 'Gaming Headset',
        slug: 'gaming-headset',
        description: '7.1 surround sound gaming headset with noise-canceling microphone',
        price: 89.99,
        category: 'Accessories',
        tags: ['headset', 'gaming', 'audio'],
        inStock: false,
        viewCount: 410,
        rating: 4.4
      }
    }),
    prisma.product.create({
      data: {
        name: 'Portable SSD',
        slug: 'portable-ssd',
        description: '1TB portable solid-state drive with USB 3.2 Gen 2',
        price: 129.99,
        category: 'Storage',
        tags: ['ssd', 'storage', 'portable'],
        inStock: true,
        viewCount: 220,
        rating: 4.9
      }
    }),
    prisma.product.create({
      data: {
        name: 'Webcam 4K',
        slug: 'webcam-4k',
        description: '4K webcam with auto-focus and dual microphones for streaming',
        price: 159.99,
        category: 'Electronics',
        tags: ['webcam', 'streaming', '4k'],
        inStock: true,
        viewCount: 175,
        rating: 4.2
      }
    })
  ])
  
  console.log(`✅ Created ${products.length} products`)
  
  // Create product images
  const images = await Promise.all([
    prisma.productImage.create({
      data: {
        productId: products[0].id,
        url: 'https://example.com/images/gaming-laptop-1.jpg',
        altText: 'Gaming Laptop - Front View',
        isPrimary: true
      }
    }),
    prisma.productImage.create({
      data: {
        productId: products[0].id,
        url: 'https://example.com/images/gaming-laptop-2.jpg',
        altText: 'Gaming Laptop - Side View'
      }
    })
  ])
  
  console.log(`✅ Created ${images.length} product images`)
  
  // Create blog posts
  const posts = await Promise.all([
    prisma.blogPost.create({
      data: {
        title: 'Best Gaming Laptops 2024',
        slug: 'best-gaming-laptops-2024',
        excerpt: 'Our comprehensive guide to the best gaming laptops this year',
        content: 'Gaming laptops have come a long way. Here are our top picks for 2024...',
        published: true,
        tags: ['gaming', 'laptop', 'review', 'guide'],
        viewCount: 1250
      }
    }),
    prisma.blogPost.create({
      data: {
        title: 'TypeScript Best Practices',
        slug: 'typescript-best-practices',
        excerpt: 'Essential TypeScript patterns every developer should know',
        content: 'TypeScript has become the standard for modern web development...',
        published: true,
        tags: ['typescript', 'programming', 'tutorial'],
        viewCount: 890
      }
    }),
    prisma.blogPost.create({
      data: {
        title: 'Building Ergonomic Workspaces',
        slug: 'ergonomic-workspaces',
        excerpt: 'Tips for creating a comfortable and productive workspace',
        content: 'A good workspace setup is crucial for productivity and health...',
        published: true,
        tags: ['workspace', 'ergonomic', 'productivity'],
        viewCount: 340
      }
    }),
    prisma.blogPost.create({
      data: {
        title: 'Understanding USB Standards',
        slug: 'understanding-usb-standards',
        excerpt: 'A guide to USB-C, USB 3.2, and Thunderbolt',
        content: 'USB standards can be confusing. Here\'s what you need to know...',
        published: true,
        tags: ['usb', 'technology', 'guide'],
        viewCount: 520
      }
    })
  ])
  
  console.log(`✅ Created ${posts.length} blog posts`)
  
  // Create reviews
  const reviews = await Promise.all([
    prisma.review.create({
      data: {
        productId: products[0].id,
        userId: users[0].id,
        rating: 5,
        title: 'Excellent for gaming!',
        content: 'This laptop handles all my games at max settings. The RTX 4070 is a beast!',
        helpful: 42
      }
    }),
    prisma.review.create({
      data: {
        productId: products[0].id,
        userId: users[1].id,
        rating: 4,
        title: 'Great performance',
        content: 'Very powerful but gets a bit hot during long gaming sessions.',
        helpful: 28
      }
    }),
    prisma.review.create({
      data: {
        productId: products[1].id,
        userId: users[0].id,
        rating: 5,
        title: 'Perfect mouse',
        content: 'Best gaming mouse I\'ve ever owned. The wireless is flawless.',
        helpful: 15
      }
    }),
    prisma.review.create({
      data: {
        productId: products[2].id,
        userId: users[1].id,
        rating: 5,
        title: 'Love the feel',
        content: 'The Cherry MX switches feel amazing. Worth every penny.',
        helpful: 22
      }
    })
  ])
  
  console.log(`✅ Created ${reviews.length} reviews`)
  
  console.log('\n🎉 Seeding complete!')
  console.log('\nSample data:')
  console.log(`  - ${users.length} users`)
  console.log(`  - ${products.length} products`)
  console.log(`  - ${images.length} product images`)
  console.log(`  - ${posts.length} blog posts`)
  console.log(`  - ${reviews.length} reviews`)
  console.log('\nTry searching:')
  console.log(`  - GET /api/search?q=laptop&model=product`)
  console.log(`  - GET /api/search?q=gaming&model=blogpost`)
  console.log(`  - GET /api/search?q=john&model=user`)
  console.log(`  - GET /api/search/all?q=gaming`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


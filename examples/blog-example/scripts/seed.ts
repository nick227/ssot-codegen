#!/usr/bin/env tsx
/**
 * Seed script for blog-example
 * Creates sample data for testing
 */

import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/auth/password.js'

const prisma = new PrismaClient()

async function seed() {
  console.log('🌱 Seeding blog database...\n')

  try {
    // Clear existing data
    console.log('🗑️  Clearing existing data...')
    await prisma.postTag.deleteMany()
    await prisma.postCategory.deleteMany()
    await prisma.comment.deleteMany()
    await prisma.post.deleteMany()
    await prisma.tag.deleteMany()
    await prisma.category.deleteMany()
    await prisma.author.deleteMany()

    // Create authors
    console.log('👥 Creating authors...')
    const adminPassword = await hashPassword('Admin123!@#')
    const authorPassword = await hashPassword('Author123!@#')

    const admin = await prisma.author.create({
      data: {
        email: 'admin@blog.com',
        username: 'admin',
        displayName: 'Admin User',
        bio: 'Blog administrator',
        role: 'ADMIN',
        passwordHash: adminPassword,
      },
    })

    const author1 = await prisma.author.create({
      data: {
        email: 'john@blog.com',
        username: 'johndoe',
        displayName: 'John Doe',
        bio: 'Tech enthusiast and writer',
        role: 'AUTHOR',
        passwordHash: authorPassword,
      },
    })

    const author2 = await prisma.author.create({
      data: {
        email: 'jane@blog.com',
        username: 'janesmith',
        displayName: 'Jane Smith',
        bio: 'Developer and blogger',
        role: 'EDITOR',
        passwordHash: authorPassword,
      },
    })

    console.log(`✅ Created ${3} authors`)

    // Create categories
    console.log('📁 Creating categories...')
    const tech = await prisma.category.create({
      data: {
        name: 'Technology',
        slug: 'technology',
        description: 'Latest tech news and tutorials',
      },
    })

    const programming = await prisma.category.create({
      data: {
        name: 'Programming',
        slug: 'programming',
        description: 'Code tutorials and best practices',
      },
    })

    const design = await prisma.category.create({
      data: {
        name: 'Design',
        slug: 'design',
        description: 'UI/UX and design principles',
      },
    })

    console.log(`✅ Created ${3} categories`)

    // Create tags
    console.log('🏷️  Creating tags...')
    const tags = await Promise.all([
      prisma.tag.create({ data: { name: 'TypeScript', slug: 'typescript' } }),
      prisma.tag.create({ data: { name: 'React', slug: 'react' } }),
      prisma.tag.create({ data: { name: 'Node.js', slug: 'nodejs' } }),
      prisma.tag.create({ data: { name: 'Database', slug: 'database' } }),
      prisma.tag.create({ data: { name: 'API', slug: 'api' } }),
    ])

    console.log(`✅ Created ${tags.length} tags`)

    // Create posts
    console.log('📝 Creating posts...')
    const post1 = await prisma.post.create({
      data: {
        title: 'Getting Started with TypeScript',
        slug: 'getting-started-with-typescript',
        excerpt: 'Learn the basics of TypeScript in this comprehensive guide.',
        content: 'TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. In this guide, we will cover the fundamentals...',
        published: true,
        publishedAt: new Date(),
        views: 150,
        likes: 23,
        authorId: author1.id,
        categories: {
          create: [
            { categoryId: tech.id },
            { categoryId: programming.id },
          ],
        },
        tags: {
          create: [
            { tagId: tags[0].id }, // TypeScript
            { tagId: tags[2].id }, // Node.js
          ],
        },
      },
    })

    const post2 = await prisma.post.create({
      data: {
        title: 'Building REST APIs with Express',
        slug: 'building-rest-apis-with-express',
        excerpt: 'A complete guide to building production-ready REST APIs.',
        content: 'Express.js is a minimal and flexible Node.js web application framework. Let\'s build a REST API...',
        published: true,
        publishedAt: new Date(Date.now() - 86400000), // 1 day ago
        views: 320,
        likes: 45,
        authorId: author2.id,
        categories: {
          create: [{ categoryId: programming.id }],
        },
        tags: {
          create: [
            { tagId: tags[2].id }, // Node.js
            { tagId: tags[4].id }, // API
          ],
        },
      },
    })

    const post3 = await prisma.post.create({
      data: {
        title: 'Database Design Best Practices',
        slug: 'database-design-best-practices',
        excerpt: 'Learn how to design scalable and maintainable databases.',
        content: 'Good database design is crucial for application performance. Here are the key principles...',
        published: true,
        publishedAt: new Date(Date.now() - 172800000), // 2 days ago
        views: 280,
        likes: 38,
        authorId: author1.id,
        categories: {
          create: [{ categoryId: tech.id }],
        },
        tags: {
          create: [{ tagId: tags[3].id }], // Database
        },
      },
    })

    // Draft post
    const post4 = await prisma.post.create({
      data: {
        title: 'Modern UI Design Principles',
        slug: 'modern-ui-design-principles',
        excerpt: 'Exploring the latest trends in user interface design.',
        content: 'Draft content about modern UI design...',
        published: false,
        authorId: author2.id,
        categories: {
          create: [{ categoryId: design.id }],
        },
      },
    })

    console.log(`✅ Created ${4} posts`)

    // Create comments
    console.log('💬 Creating comments...')
    const comment1 = await prisma.comment.create({
      data: {
        content: 'Great article! Very helpful for beginners.',
        approved: true,
        postId: post1.id,
        authorId: author2.id,
      },
    })

    const comment2 = await prisma.comment.create({
      data: {
        content: 'Thanks for sharing! Could you elaborate on generics?',
        approved: true,
        postId: post1.id,
        authorId: author1.id,
      },
    })

    // Reply to comment
    const reply1 = await prisma.comment.create({
      data: {
        content: 'Sure! I\'ll write a follow-up article on TypeScript generics.',
        approved: true,
        postId: post1.id,
        authorId: author1.id,
        parentId: comment2.id,
      },
    })

    const comment3 = await prisma.comment.create({
      data: {
        content: 'Excellent explanation of Express middleware!',
        approved: true,
        postId: post2.id,
        authorId: author1.id,
      },
    })

    // Unapproved comment
    const comment4 = await prisma.comment.create({
      data: {
        content: 'This needs moderation',
        approved: false,
        postId: post3.id,
      },
    })

    console.log(`✅ Created ${5} comments`)

    // Summary
    console.log('\n✅ Seed completed successfully!\n')
    console.log('📊 Database populated with:')
    console.log(`   - ${3} authors (admin, johndoe, janesmith)`)
    console.log(`   - ${4} posts (3 published, 1 draft)`)
    console.log(`   - ${3} categories`)
    console.log(`   - ${5} tags`)
    console.log(`   - ${5} comments (4 approved, 1 pending)`)
    console.log('\n🎯 Test credentials:')
    console.log('   Email: admin@blog.com')
    console.log('   Password: Admin123!@#')
    console.log('\n   Email: john@blog.com')
    console.log('   Password: Author123!@#')
  } catch (error) {
    console.error('\n❌ Seed failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seed()


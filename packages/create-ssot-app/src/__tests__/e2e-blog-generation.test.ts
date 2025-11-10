/**
 * E2E Test: Blog Template Generation with Schema Mapping
 * 
 * Tests the blog template generator with:
 * 1. Non-standard schema (Author, BlogPost instead of User, Post)
 * 2. Non-standard field names (fullName, heading, body, writer)
 * 3. Schema mappings to bridge the gap
 * 4. Verification that generated code uses mapped fields
 */

import { describe, it, expect, afterAll } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ProjectConfig } from '../prompts.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TEST_OUTPUT_DIR = path.join(__dirname, '..', '..', 'e2e-blog-test-output')
const TEST_PROJECT_NAME = 'test-blog'
const TEST_PROJECT_PATH = path.join(TEST_OUTPUT_DIR, TEST_PROJECT_NAME)

// Schema mappings matching our blog example
const BLOG_MAPPINGS = {
  models: {
    'user': 'Author',
    'post': 'BlogPost',
    'comment': 'Comment'
  },
  fields: {
    'user.name': 'Author.fullName',
    'user.avatar': 'Author.profileImage',
    'user.bio': 'Author.biography',
    'post.title': 'BlogPost.heading',
    'post.content': 'BlogPost.body',
    'post.excerpt': 'BlogPost.summary',
    'post.author': 'BlogPost.writer',
    'post.authorId': 'BlogPost.writerId',
    'post.coverImage': 'BlogPost.featuredImage',
    'comment.author': 'Comment.user',
    'comment.authorId': 'Comment.userId'
  }
}

// Custom blog schema (non-standard names)
const BLOG_SCHEMA = `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model Author {
  id           Int        @id @default(autoincrement())
  email        String     @unique
  fullName     String
  profileImage String?
  biography    String?
  createdAt    DateTime   @default(now())
  
  blogPosts    BlogPost[] @relation("AuthorPosts")
  comments     Comment[]  @relation("AuthorComments")
}

model BlogPost {
  id             Int       @id @default(autoincrement())
  heading        String
  body           String
  summary        String?
  slug           String    @unique
  published      Boolean   @default(false)
  featuredImage  String?
  tags           String[]
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  
  writerId       Int
  writer         Author    @relation("AuthorPosts", fields: [writerId], references: [id])
  
  comments       Comment[] @relation("PostComments")
}

model Comment {
  id        Int      @id @default(autoincrement())
  content   String
  createdAt DateTime @default(now())
  
  userId    Int
  user      Author   @relation("AuthorComments", fields: [userId], references: [id])
  
  postId    Int
  post      BlogPost @relation("PostComments", fields: [postId], references: [id])
}
`

describe('E2E: Blog Template with Schema Mapping', () => {
  afterAll(() => {
    // Cleanup
    if (fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true })
    }
  })
  
  it('should generate blog UI with schema mappings', async () => {
    console.log('\n🎨 Testing Blog Template Generation with Mappings...\n')
    
    // Clean up
    if (fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true })
    }
    fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true })
    
    // Create config
    const config: ProjectConfig = {
      projectName: TEST_PROJECT_NAME,
      framework: 'express',
      database: 'sqlite',
      includeExamples: false,
      selectedPlugins: [],
      packageManager: 'npm',
      generateUI: true,
      uiTemplate: 'blog'
    }
    
    // Create project structure
    fs.mkdirSync(TEST_PROJECT_PATH, { recursive: true })
    fs.mkdirSync(path.join(TEST_PROJECT_PATH, 'prisma'), { recursive: true })
    
    // Write custom schema
    fs.writeFileSync(
      path.join(TEST_PROJECT_PATH, 'prisma', 'schema.prisma'),
      BLOG_SCHEMA
    )
    
    // Import generators
    const { generateUI } = await import('../ui-generator.js')
    
    // Parse models from custom schema
    const models = parseModels(BLOG_SCHEMA)
    
    console.log(`📝 Parsed ${models.length} models: ${models.map(m => m.name).join(', ')}`)
    
    // Generate blog UI with mappings
    await generateUI(TEST_PROJECT_PATH, config, models, BLOG_MAPPINGS)
    
    // VERIFY: All blog pages generated
    console.log('\n✅ Verifying blog pages...\n')
    
    const expectedFiles = [
      'app/(blog)/layout.tsx',
      'app/(blog)/page.tsx',
      'app/(blog)/posts/page.tsx',
      'app/(blog)/posts/[slug]/page.tsx',
      'app/(blog)/authors/[id]/page.tsx',
      'app/admin/posts/page.tsx',
      'app/admin/posts/new/page.tsx',
      'app/admin/posts/[id]/edit/page.tsx',
      'components/PostCard.tsx',
      'components/CommentSection.tsx'
    ]
    
    for (const file of expectedFiles) {
      const filePath = path.join(TEST_PROJECT_PATH, file)
      expect(fs.existsSync(filePath), `File should exist: ${file}`).toBe(true)
      console.log(`  ✅ ${file}`)
    }
    
    // VERIFY: Generated code uses MAPPED field names
    console.log('\n✅ Verifying schema mappings applied...\n')
    
    const postListPage = fs.readFileSync(
      path.join(TEST_PROJECT_PATH, 'app/(blog)/posts/page.tsx'),
      'utf-8'
    )
    
    // Should use mapped model name 'BlogPost'
    expect(postListPage).toContain('useBlogPostList')
    console.log('  ✅ Uses mapped model: BlogPost (not Post)')
    
    // Should use mapped field 'writer' (not 'author')
    expect(postListPage).toContain('writer: true')
    console.log('  ✅ Uses mapped field: writer (not author)')
    
    // Check PostCard component
    const postCard = fs.readFileSync(
      path.join(TEST_PROJECT_PATH, 'components/PostCard.tsx'),
      'utf-8'
    )
    
    // Should use 'heading' (not 'title')
    expect(postCard).toContain('heading')
    console.log('  ✅ Uses mapped field: heading (not title)')
    
    // Should use 'body' (not 'content')  
    expect(postCard).not.toContain('post.content')
    console.log('  ✅ Avoids template field: content')
    
    // Should use 'fullName' (not 'name')
    expect(postCard).toContain('fullName')
    console.log('  ✅ Uses mapped field: fullName (not name)')
    
    // Check post detail page
    const postDetail = fs.readFileSync(
      path.join(TEST_PROJECT_PATH, 'app/(blog)/posts/[slug]/page.tsx'),
      'utf-8'
    )
    
    // Should use mapped fields
    expect(postDetail).toContain('heading')
    expect(postDetail).toContain('body')
    expect(postDetail).toContain('writer')
    expect(postDetail).toContain('fullName')
    console.log('  ✅ Post detail uses all mapped fields')
    
    // Check admin page
    const adminPage = fs.readFileSync(
      path.join(TEST_PROJECT_PATH, 'app/admin/posts/page.tsx'),
      'utf-8'
    )
    
    expect(adminPage).toContain('heading')
    expect(adminPage).toContain('published')
    console.log('  ✅ Admin page uses mapped fields')
    
    // Check comment section
    const commentSection = fs.readFileSync(
      path.join(TEST_PROJECT_PATH, 'components/CommentSection.tsx'),
      'utf-8'
    )
    
    // Should use mapped 'user' instead of 'author' for comments
    expect(commentSection).toContain('userId')
    console.log('  ✅ Comment section uses mapped fields')
    
    console.log('\n🎉 ALL TESTS PASSED!\n')
    console.log('📊 Summary:')
    console.log(`   Files generated: ${expectedFiles.length}`)
    console.log('   Schema mappings: 11 fields')
    console.log('   Models mapped: 3 (Author, BlogPost, Comment)')
    console.log('   Template: blog')
    console.log('\n✅ Blog template with schema mapping works correctly!')
  })
})

function parseModels(schema: string): Array<{
  name: string
  nameLower: string
  namePlural: string
  fields: Array<{ name: string; type: string; isRelation: boolean }>
}> {
  const models: Array<{
    name: string
    nameLower: string
    namePlural: string
    fields: Array<{ name: string; type: string; isRelation: boolean }>
  }> = []
  
  const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g
  let modelMatch
  
  while ((modelMatch = modelRegex.exec(schema)) !== null) {
    const modelName = modelMatch[1]
    const modelBody = modelMatch[2]
    
    if (modelName.startsWith('_')) continue
    
    const fields: Array<{ name: string; type: string; isRelation: boolean }> = []
    const fieldRegex = /^\s*(\w+)\s+(\w+)/gm
    let fieldMatch
    
    while ((fieldMatch = fieldRegex.exec(modelBody)) !== null) {
      const fieldName = fieldMatch[1]
      const fieldType = fieldMatch[2]
      
      if (fieldName.startsWith('@') || fieldName === 'model') continue
      
      const isRelation = /^[A-Z]/.test(fieldType) && 
        !['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json'].includes(fieldType)
      
      fields.push({ name: fieldName, type: fieldType, isRelation })
    }
    
    models.push({
      name: modelName,
      nameLower: modelName.toLowerCase(),
      namePlural: modelName.toLowerCase() + 's',
      fields
    })
  }
  
  return models
}


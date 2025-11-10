/**
 * Blog Template Generator
 * 
 * Generates a complete blog UI from schema mappings
 * Uses template.json + ssot.config.ts mappings
 */

import type { ProjectConfig } from '../prompts.js'
import type { ParsedModel } from '../ui-generator.js'
import fs from 'node:fs'
import path from 'node:path'

export interface SchemaMapping {
  models: Record<string, string>  // template model → user model
  fields: Record<string, string>  // template.field → user.field
}

/**
 * Generate blog template UI
 */
export function generateBlogTemplate(
  projectPath: string,
  config: ProjectConfig,
  models: ParsedModel[],
  mappings?: SchemaMapping
): void {
  // Default mappings if not provided
  const schemaMappings: SchemaMapping = mappings || {
    models: {
      'user': 'User',
      'post': 'Post',
      'comment': 'Comment'
    },
    fields: {}
  }
  
  // Resolve mapped models
  const userModel = findModel(models, schemaMappings.models['user'])
  const postModel = findModel(models, schemaMappings.models['post'])
  const commentModel = findModel(models, schemaMappings.models['comment']) || null
  
  if (!userModel || !postModel) {
    throw new Error('Blog template requires User and Post models. Check your schema mappings.')
  }
  
  // Get field names using mappings
  const fields = {
    user: {
      id: getField(schemaMappings, 'user.id', 'id'),
      name: getField(schemaMappings, 'user.name', 'name'),
      email: getField(schemaMappings, 'user.email', 'email'),
      avatar: getField(schemaMappings, 'user.avatar', 'avatar'),
      bio: getField(schemaMappings, 'user.bio', 'bio')
    },
    post: {
      id: getField(schemaMappings, 'post.id', 'id'),
      title: getField(schemaMappings, 'post.title', 'title'),
      content: getField(schemaMappings, 'post.content', 'content'),
      excerpt: getField(schemaMappings, 'post.excerpt', 'excerpt'),
      slug: getField(schemaMappings, 'post.slug', 'slug'),
      published: getField(schemaMappings, 'post.published', 'published'),
      coverImage: getField(schemaMappings, 'post.coverImage', 'coverImage'),
      tags: getField(schemaMappings, 'post.tags', 'tags'),
      author: getField(schemaMappings, 'post.author', 'author'),
      authorId: getField(schemaMappings, 'post.authorId', 'authorId'),
      createdAt: getField(schemaMappings, 'post.createdAt', 'createdAt')
    },
    comment: commentModel ? {
      id: getField(schemaMappings, 'comment.id', 'id'),
      content: getField(schemaMappings, 'comment.content', 'content'),
      author: getField(schemaMappings, 'comment.author', 'author'),
      post: getField(schemaMappings, 'comment.post', 'post'),
      createdAt: getField(schemaMappings, 'comment.createdAt', 'createdAt')
    } : null
  }
  
  const appDir = path.join(projectPath, 'app')
  const blogDir = path.join(appDir, '(blog)')
  
  fs.mkdirSync(blogDir, { recursive: true })
  
  // Generate blog layout
  fs.writeFileSync(
    path.join(blogDir, 'layout.tsx'),
    generateBlogLayout(userModel, postModel, fields)
  )
  
  // Generate home page
  fs.writeFileSync(
    path.join(blogDir, 'page.tsx'),
    generateHomePage(postModel, fields)
  )
  
  // Generate posts list page
  const postsDir = path.join(blogDir, 'posts')
  fs.mkdirSync(postsDir, { recursive: true })
  fs.writeFileSync(
    path.join(postsDir, 'page.tsx'),
    generatePostsListPage(postModel, userModel, fields)
  )
  
  // Generate post detail page
  const postSlugDir = path.join(postsDir, '[slug]')
  fs.mkdirSync(postSlugDir, { recursive: true })
  fs.writeFileSync(
    path.join(postSlugDir, 'page.tsx'),
    generatePostDetailPage(postModel, userModel, commentModel, fields)
  )
  
  // Generate author profile page
  const authorsDir = path.join(blogDir, 'authors')
  const authorIdDir = path.join(authorsDir, '[id]')
  fs.mkdirSync(authorIdDir, { recursive: true })
  fs.writeFileSync(
    path.join(authorIdDir, 'page.tsx'),
    generateAuthorPage(userModel, postModel, fields)
  )
  
  // Generate admin pages for post management
  const adminDir = path.join(appDir, 'admin')
  const adminPostsDir = path.join(adminDir, 'posts')
  fs.mkdirSync(adminPostsDir, { recursive: true })
  
  fs.writeFileSync(
    path.join(adminPostsDir, 'page.tsx'),
    generateAdminPostsPage(postModel, userModel, fields)
  )
  
  // Generate new post page
  const newPostDir = path.join(adminPostsDir, 'new')
  fs.mkdirSync(newPostDir, { recursive: true })
  fs.writeFileSync(
    path.join(newPostDir, 'page.tsx'),
    generateNewPostPage(postModel, userModel, fields)
  )
  
  // Generate edit post page
  const editPostDir = path.join(adminPostsDir, '[id]', 'edit')
  fs.mkdirSync(editPostDir, { recursive: true })
  fs.writeFileSync(
    path.join(editPostDir, 'page.tsx'),
    generateEditPostPage(postModel, userModel, fields)
  )
  
  // Generate components
  const componentsDir = path.join(projectPath, 'components')
  fs.mkdirSync(componentsDir, { recursive: true })
  
  fs.writeFileSync(
    path.join(componentsDir, 'PostCard.tsx'),
    generatePostCard(postModel, userModel, fields)
  )
  
  if (commentModel) {
    fs.writeFileSync(
      path.join(componentsDir, 'CommentSection.tsx'),
      generateCommentSection(commentModel, userModel, fields)
    )
  }
}

/**
 * Helper: Find model by name (case-insensitive)
 */
function findModel(models: ParsedModel[], name: string): ParsedModel | undefined {
  return models.find(m => m.name.toLowerCase() === name.toLowerCase())
}

/**
 * Helper: Get mapped field name or default
 */
function getField(mappings: SchemaMapping, templateField: string, defaultField: string): string {
  const mapped = mappings.fields[templateField]
  if (mapped) {
    // Extract just the field name (e.g., 'Author.fullName' → 'fullName')
    const parts = mapped.split('.')
    return parts[parts.length - 1]
  }
  return defaultField
}

/**
 * Generate blog layout
 */
function generateBlogLayout(userModel: ParsedModel, postModel: ParsedModel, fields: any): string {
  return `/**
 * Generated by SSOT CodeGen - Blog Template
 * Blog layout with header and footer
 * 
 * ✨ SAFE TO EDIT - Customize navigation and styling
 */

import Link from 'next/link'

export default function BlogLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-neutral-900">
              My Blog
            </Link>
            
            <nav className="flex items-center gap-6">
              <Link href="/posts" className="text-neutral-600 hover:text-neutral-900">
                Posts
              </Link>
              <Link href="/admin/posts" className="text-neutral-600 hover:text-neutral-900">
                Admin
              </Link>
            </nav>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-neutral-50 mt-12">
        <div className="container mx-auto px-4 py-8 text-center text-neutral-600 text-sm">
          <p>Powered by SSOT CodeGen</p>
        </div>
      </footer>
    </div>
  )
}
`
}

/**
 * Generate home page
 */
function generateHomePage(postModel: ParsedModel, fields: any): string {
  const modelName = postModel.name
  const modelNameLower = postModel.nameLower
  const titleField = fields.post.title
  const excerptField = fields.post.excerpt
  
  return `/**
 * Generated by SSOT CodeGen - Blog Template
 * Home page with featured posts
 */

'use client'

import { use${modelName}List } from '@/generated/sdk/hooks/react/use-${modelNameLower}'
import Link from 'next/link'

export default function HomePage() {
  const { data: posts, isLoading } = use${modelName}List({
    filters: [{ field: '${fields.post.published}', op: 'eq', value: true }],
    sort: [{ field: '${fields.post.createdAt}', dir: 'desc' }],
    pageSize: 6
  })
  
  if (isLoading) {
    return <div className="container mx-auto px-4 py-12">Loading...</div>
  }
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4">Welcome to My Blog</h1>
        <p className="text-xl text-neutral-600">
          Thoughts, stories, and ideas
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts && posts.map((post) => (
          <Link
            key={post.${fields.post.id}}
            href={\`/posts/\${post.${fields.post.slug} || post.${fields.post.id}}\`}
            className="block bg-white rounded-lg border border-neutral-200 overflow-hidden hover:shadow-lg transition-shadow"
          >
            <article className="p-6">
              <h2 className="text-xl font-bold mb-2">{post.${titleField}}</h2>
              {post.${excerptField} && (
                <p className="text-neutral-600 mb-4 line-clamp-3">
                  {post.${excerptField}}
                </p>
              )}
              <span className="text-primary-600 text-sm font-medium">
                Read more →
              </span>
            </article>
          </Link>
        ))}
      </div>
      
      <div className="text-center mt-8">
        <Link
          href="/posts"
          className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          View All Posts
        </Link>
      </div>
    </div>
  )
}
`
}

/**
 * Generate posts list page
 */
function generatePostsListPage(postModel: ParsedModel, userModel: ParsedModel, fields: any): string {
  const modelName = postModel.name
  const modelNameLower = postModel.nameLower
  
  return `/**
 * Generated by SSOT CodeGen - Blog Template
 * Posts list page with search and filters
 */

'use client'

import { use${modelName}List } from '@/generated/sdk/hooks/react/use-${modelNameLower}'
import { PostCard } from '@/components/PostCard'

export default function PostsPage() {
  const { data: posts, isLoading } = use${modelName}List({
    filters: [{ field: '${fields.post.published}', op: 'eq', value: true }],
    sort: [{ field: '${fields.post.createdAt}', dir: 'desc' }],
    include: { ${fields.post.author}: true }
  })
  
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">All Posts</h1>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-neutral-200 p-6 animate-pulse">
              <div className="h-6 bg-neutral-200 rounded mb-4" />
              <div className="h-4 bg-neutral-200 rounded mb-2" />
              <div className="h-4 bg-neutral-200 rounded w-5/6" />
            </div>
          ))}
        </div>
      ) : posts && posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard key={post.${fields.post.id}} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-neutral-600 text-lg">No posts yet. Check back soon!</p>
        </div>
      )}
    </div>
  )
}
`
}

/**
 * Generate post detail page
 */
function generatePostDetailPage(
  postModel: ParsedModel,
  userModel: ParsedModel,
  commentModel: ParsedModel | null,
  fields: any
): string {
  const modelName = postModel.name
  const modelNameLower = postModel.nameLower
  
  return `/**
 * Generated by SSOT CodeGen - Blog Template
 * Post detail page with content and comments
 */

'use client'

import { use${modelName} } from '@/generated/sdk/hooks/react/use-${modelNameLower}'
import Link from 'next/link'
${commentModel ? "import { CommentSection } from '@/components/CommentSection'" : ''}

export default function PostDetailPage({
  params
}: {
  params: { slug: string }
}) {
  // Fetch by slug (you may need to add a find-by-slug endpoint)
  const { data: post, isLoading, error } = use${modelName}({
    filters: [{ field: '${fields.post.slug}', op: 'eq', value: params.slug }],
    include: { ${fields.post.author}: true }
  })
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto animate-pulse">
          <div className="h-10 bg-neutral-200 rounded mb-6 w-3/4" />
          <div className="h-4 bg-neutral-200 rounded mb-4" />
          <div className="h-4 bg-neutral-200 rounded mb-4 w-5/6" />
          <div className="h-4 bg-neutral-200 rounded w-4/6" />
        </div>
      </div>
    )
  }
  
  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto bg-error-light border border-error text-error-dark p-6 rounded-lg">
          <h2 className="font-bold mb-2">Post Not Found</h2>
          <p>The post you're looking for doesn't exist or has been removed.</p>
          <Link href="/posts" className="text-primary-600 hover:underline mt-4 inline-block">
            ← Back to Posts
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <article className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <Link href="/posts" className="text-primary-600 hover:underline mb-6 inline-block">
          ← Back to Posts
        </Link>
        
        {/* Post header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{post.${fields.post.title}}</h1>
          
          <div className="flex items-center gap-4 text-neutral-600">
            <Link 
              href={\`/authors/\${post.${fields.post.authorId}}\`}
              className="hover:text-neutral-900"
            >
              {post.${fields.post.author}?.${fields.user.name}}
            </Link>
            <span>•</span>
            <time dateTime={post.${fields.post.createdAt}.toISOString()}>
              {new Date(post.${fields.post.createdAt}).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
          </div>
        </header>
        
        {/* Cover image */}
        {post.${fields.post.coverImage} && (
          <div className="mb-8">
            <img
              src={post.${fields.post.coverImage}}
              alt={post.${fields.post.title}}
              className="w-full h-96 object-cover rounded-lg"
            />
          </div>
        )}
        
        {/* Post content */}
        <div className="prose prose-lg max-w-none mb-12">
          <div dangerouslySetInnerHTML={{ __html: post.${fields.post.content} }} />
        </div>
        
        {/* Tags */}
        {post.${fields.post.tags} && post.${fields.post.tags}.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-12">
            {post.${fields.post.tags}.map((tag: string) => (
              <span
                key={tag}
                className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Author bio */}
        {post.${fields.post.author}?.${fields.user.bio} && (
          <div className="border-t border-b border-neutral-200 py-8 mb-12">
            <div className="flex items-start gap-4">
              {post.${fields.post.author}.${fields.user.avatar} ? (
                <img
                  src={post.${fields.post.author}.${fields.user.avatar}}
                  alt={post.${fields.post.author}.${fields.user.name}}
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                  {post.${fields.post.author}.${fields.user.name}.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <Link 
                  href={\`/authors/\${post.${fields.post.authorId}}\`}
                  className="font-bold text-lg hover:text-primary-600"
                >
                  {post.${fields.post.author}.${fields.user.name}}
                </Link>
                <p className="text-neutral-600 mt-2">
                  {post.${fields.post.author}.${fields.user.bio}}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Comments section */}
        ${commentModel ? `<CommentSection postId={post.${fields.post.id}} />` : ''}
      </div>
    </article>
  )
}
`
}

/**
 * Generate author profile page
 */
function generateAuthorPage(userModel: ParsedModel, postModel: ParsedModel, fields: any): string {
  const userModelName = userModel.name
  const postModelName = postModel.name
  
  return `/**
 * Generated by SSOT CodeGen - Blog Template
 * Author profile page
 */

'use client'

import { use${userModelName} } from '@/generated/sdk/hooks/react/use-${userModel.nameLower}'
import { use${postModelName}List } from '@/generated/sdk/hooks/react/use-${postModel.nameLower}'
import { PostCard } from '@/components/PostCard'
import Link from 'next/link'

export default function AuthorPage({
  params
}: {
  params: { id: string }
}) {
  const { data: author, isLoading: authorLoading } = use${userModelName}(Number(params.id))
  const { data: posts, isLoading: postsLoading } = use${postModelName}List({
    filters: [
      { field: '${fields.post.authorId}', op: 'eq', value: Number(params.id) },
      { field: '${fields.post.published}', op: 'eq', value: true }
    ],
    sort: [{ field: '${fields.post.createdAt}', dir: 'desc' }]
  })
  
  if (authorLoading) {
    return <div className="container mx-auto px-4 py-12">Loading...</div>
  }
  
  if (!author) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-error">Author not found</p>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Author header */}
      <div className="max-w-3xl mx-auto mb-12 text-center">
        {author.${fields.user.avatar} ? (
          <img
            src={author.${fields.user.avatar}}
            alt={author.${fields.user.name}}
            className="w-32 h-32 rounded-full mx-auto mb-6"
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-5xl font-bold mx-auto mb-6">
            {author.${fields.user.name}.charAt(0).toUpperCase()}
          </div>
        )}
        
        <h1 className="text-4xl font-bold mb-4">{author.${fields.user.name}}</h1>
        
        {author.${fields.user.bio} && (
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            {author.${fields.user.bio}}
          </p>
        )}
      </div>
      
      {/* Author's posts */}
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Posts by {author.${fields.user.name}}</h2>
        
        {postsLoading ? (
          <div>Loading posts...</div>
        ) : posts && posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard key={post.${fields.post.id}} post={post} />
            ))}
          </div>
        ) : (
          <p className="text-neutral-600">No posts yet.</p>
        )}
      </div>
    </div>
  )
}
`
}

/**
 * Generate admin posts page
 */
function generateAdminPostsPage(postModel: ParsedModel, userModel: ParsedModel, fields: any): string {
  return `/**
 * Generated by SSOT CodeGen - Blog Template
 * Admin post management
 */

'use client'

import { DataTable } from '@ssot-ui/data-table'
import '@ssot-ui/data-table/styles.css'
import { use${postModel.name}List } from '@/generated/sdk/hooks/react/use-${postModel.nameLower}'
import Link from 'next/link'

export default function AdminPostsPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Manage Posts</h1>
        <Link
          href="/admin/posts/new"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          + New Post
        </Link>
      </div>
      
      <DataTable
        hook={use${postModel.name}List}
        columns={[
          {
            key: '${fields.post.id}',
            header: 'ID',
            sortable: true
          },
          {
            key: '${fields.post.title}',
            header: 'Title',
            sortable: true,
            cellRender: (value, row) => (
              <Link
                href={\`/admin/posts/\${row.${fields.post.id}}/edit\`}
                className="text-primary-600 hover:underline font-medium"
              >
                {value}
              </Link>
            )
          },
          {
            key: '${fields.post.published}',
            header: 'Status',
            sortable: true,
            cellRender: (value) => (
              <span className={\`px-2 py-1 rounded text-xs \${value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}\`}>
                {value ? 'Published' : 'Draft'}
              </span>
            )
          },
          {
            key: '${fields.post.createdAt}',
            header: 'Created',
            sortable: true,
            cellRender: (value) => new Date(value).toLocaleDateString()
          }
        ]}
        searchable={['${fields.post.title}', '${fields.post.content}']}
        filterable={[
          {
            field: '${fields.post.published}',
            type: 'boolean',
            label: 'Status'
          }
        ]}
        pagination="pages"
        defaultPageSize={20}
      />
    </div>
  )
}
`
}

/**
 * Generate new post page
 */
function generateNewPostPage(postModel: ParsedModel, userModel: ParsedModel, fields: any): string {
  return `/**
 * Generated by SSOT CodeGen - Blog Template
 * Create new post
 */

'use client'

import { useState } from 'react'
import { useCreate${postModel.name} } from '@/generated/sdk/hooks/react/use-${postModel.nameLower}'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewPostPage() {
  const router = useRouter()
  const { mutate: createPost, isPending, error } = useCreate${postModel.name}()
  
  const [formData, setFormData] = useState({
    ${fields.post.title}: '',
    ${fields.post.content}: '',
    ${fields.post.excerpt}: '',
    ${fields.post.slug}: '',
    ${fields.post.published}: false
  })
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    createPost(formData, {
      onSuccess: (post) => {
        router.push(\`/admin/posts/\${post.${fields.post.id}}/edit\`)
      }
    })
  }
  
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">New Post</h1>
          <Link href="/admin/posts" className="text-neutral-600 hover:text-neutral-900">
            Cancel
          </Link>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={formData.${fields.post.title}}
              onChange={(e) => setFormData({ ...formData, ${fields.post.title}: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Slug</label>
            <input
              type="text"
              value={formData.${fields.post.slug}}
              onChange={(e) => setFormData({ ...formData, ${fields.post.slug}: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="url-friendly-slug"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Excerpt</label>
            <textarea
              value={formData.${fields.post.excerpt}}
              onChange={(e) => setFormData({ ...formData, ${fields.post.excerpt}: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 h-24"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Content</label>
            <textarea
              value={formData.${fields.post.content}}
              onChange={(e) => setFormData({ ...formData, ${fields.post.content}: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 min-h-[400px] font-mono"
              required
            />
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="published"
              checked={formData.${fields.post.published}}
              onChange={(e) => setFormData({ ...formData, ${fields.post.published}: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="published" className="text-sm font-medium">
              Publish immediately
            </label>
          </div>
          
          {error && (
            <div className="p-4 bg-error-light border border-error text-error-dark rounded-lg">
              {error.message}
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {isPending ? 'Creating...' : 'Create Post'}
            </button>
            <Link
              href="/admin/posts"
              className="px-6 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
`
}

/**
 * Generate edit post page
 */
function generateEditPostPage(postModel: ParsedModel, userModel: ParsedModel, fields: any): string {
  return `/**
 * Generated by SSOT CodeGen - Blog Template
 * Edit existing post
 */

'use client'

import { useState, useEffect } from 'react'
import { use${postModel.name}, useUpdate${postModel.name} } from '@/generated/sdk/hooks/react/use-${postModel.nameLower}'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EditPostPage({
  params
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const { data: post, isLoading } = use${postModel.name}(Number(params.id))
  const { mutate: updatePost, isPending, error } = useUpdate${postModel.name}()
  
  const [formData, setFormData] = useState({
    ${fields.post.title}: '',
    ${fields.post.content}: '',
    ${fields.post.excerpt}: '',
    ${fields.post.slug}: '',
    ${fields.post.published}: false
  })
  
  useEffect(() => {
    if (post) {
      setFormData({
        ${fields.post.title}: post.${fields.post.title},
        ${fields.post.content}: post.${fields.post.content},
        ${fields.post.excerpt}: post.${fields.post.excerpt} || '',
        ${fields.post.slug}: post.${fields.post.slug} || '',
        ${fields.post.published}: post.${fields.post.published} || false
      })
    }
  }, [post])
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    updatePost({ id: Number(params.id), data: formData }, {
      onSuccess: () => {
        router.push('/admin/posts')
      }
    })
  }
  
  if (isLoading) {
    return <div className="p-8">Loading...</div>
  }
  
  if (!post) {
    return <div className="p-8">Post not found</div>
  }
  
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Edit Post</h1>
          <Link href="/admin/posts" className="text-neutral-600 hover:text-neutral-900">
            Cancel
          </Link>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={formData.${fields.post.title}}
              onChange={(e) => setFormData({ ...formData, ${fields.post.title}: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Slug</label>
            <input
              type="text"
              value={formData.${fields.post.slug}}
              onChange={(e) => setFormData({ ...formData, ${fields.post.slug}: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Excerpt</label>
            <textarea
              value={formData.${fields.post.excerpt}}
              onChange={(e) => setFormData({ ...formData, ${fields.post.excerpt}: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg h-24"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Content</label>
            <textarea
              value={formData.${fields.post.content}}
              onChange={(e) => setFormData({ ...formData, ${fields.post.content}: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg min-h-[400px] font-mono"
              required
            />
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="published"
              checked={formData.${fields.post.published}}
              onChange={(e) => setFormData({ ...formData, ${fields.post.published}: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="published" className="text-sm font-medium">
              Published
            </label>
          </div>
          
          {error && (
            <div className="p-4 bg-error-light border border-error text-error-dark rounded-lg">
              {error.message}
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {isPending ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              href="/admin/posts"
              className="px-6 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
`
}

/**
 * Generate PostCard component
 */
function generatePostCard(postModel: ParsedModel, userModel: ParsedModel, fields: any): string {
  return `/**
 * Generated by SSOT CodeGen - Blog Template
 * Post card component
 * 
 * ✨ SAFE TO EDIT or OVERRIDE in ssot.config.ts:
 *    customization.overrides['components/PostCard'] = './custom/MyPostCard'
 */

import Link from 'next/link'
import type { ${postModel.name} } from '@/generated/sdk/types'

interface PostCardProps {
  post: ${postModel.name} & {
    ${fields.post.author}?: {
      ${fields.user.name}: string
      ${fields.user.avatar}?: string | null
    }
  }
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="bg-white rounded-lg border border-neutral-200 overflow-hidden hover:shadow-lg transition-shadow">
      {post.${fields.post.coverImage} && (
        <Link href={\`/posts/\${post.${fields.post.slug} || post.${fields.post.id}}\`}>
          <img
            src={post.${fields.post.coverImage}}
            alt={post.${fields.post.title}}
            className="w-full h-48 object-cover"
          />
        </Link>
      )}
      
      <div className="p-6">
        {post.${fields.post.tags} && post.${fields.post.tags}.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.${fields.post.tags}.slice(0, 3).map((tag: string) => (
              <span key={tag} className="px-2 py-1 bg-neutral-100 text-neutral-700 rounded text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <Link href={\`/posts/\${post.${fields.post.slug} || post.${fields.post.id}}\`}>
          <h2 className="text-xl font-bold mb-2 hover:text-primary-600">
            {post.${fields.post.title}}
          </h2>
        </Link>
        
        {post.${fields.post.excerpt} && (
          <p className="text-neutral-600 mb-4 line-clamp-2">
            {post.${fields.post.excerpt}}
          </p>
        )}
        
        <div className="flex items-center justify-between text-sm text-neutral-500">
          {post.${fields.post.author} && (
            <span>By {post.${fields.post.author}.${fields.user.name}}</span>
          )}
          <time dateTime={post.${fields.post.createdAt}.toISOString()}>
            {new Date(post.${fields.post.createdAt}).toLocaleDateString()}
          </time>
        </div>
      </div>
    </article>
  )
}
`
}

/**
 * Generate CommentSection component
 */
function generateCommentSection(commentModel: ParsedModel, userModel: ParsedModel, fields: any): string {
  return `/**
 * Generated by SSOT CodeGen - Blog Template
 * Comment section component
 * 
 * ✨ SAFE TO EDIT or OVERRIDE in ssot.config.ts
 */

'use client'

import { useState } from 'react'
import { use${commentModel.name}List, useCreate${commentModel.name} } from '@/generated/sdk/hooks/react/use-${commentModel.nameLower}'

interface CommentSectionProps {
  postId: number
  currentUserId?: number
}

export function CommentSection({ postId, currentUserId }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('')
  
  const { data: comments, refetch } = use${commentModel.name}List({
    filters: [{ field: 'postId', op: 'eq', value: postId }],
    sort: [{ field: '${fields.comment.createdAt}', dir: 'desc' }],
    include: { ${fields.comment.author}: true }
  })
  
  const { mutate: createComment, isPending } = useCreate${commentModel.name}()
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !currentUserId) return
    
    createComment({
      ${fields.comment.content}: newComment,
      postId,
      userId: currentUserId
    }, {
      onSuccess: () => {
        setNewComment('')
        refetch()
      }
    })
  }
  
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold mb-6">
        Comments ({comments?.length || 0})
      </h2>
      
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            className="w-full min-h-[120px] p-4 border rounded-lg"
            disabled={isPending}
          />
          <button
            type="submit"
            disabled={isPending || !newComment.trim()}
            className="mt-3 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {isPending ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-neutral-50 rounded-lg text-center">
          <p className="text-neutral-600">
            Sign in to join the conversation
          </p>
        </div>
      )}
      
      <div className="space-y-6">
        {comments && comments.length > 0 ? (
          comments.map((comment) => (
            <article key={comment.${fields.comment.id}} className="flex gap-4">
              <div className="flex-shrink-0">
                {comment.${fields.comment.author}?.${fields.user.avatar} ? (
                  <img
                    src={comment.${fields.comment.author}.${fields.user.avatar}}
                    alt={comment.${fields.comment.author}.${fields.user.name}}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {comment.${fields.comment.author}?.${fields.user.name}.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-semibold">
                    {comment.${fields.comment.author}?.${fields.user.name}}
                  </span>
                  <span className="text-sm text-neutral-500">
                    {new Date(comment.${fields.comment.createdAt}).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-neutral-700">
                  {comment.${fields.comment.content}}
                </p>
              </div>
            </article>
          ))
        ) : (
          <p className="text-center text-neutral-500 py-8">
            No comments yet. Be the first!
          </p>
        )}
      </div>
    </section>
  )
}
`
}


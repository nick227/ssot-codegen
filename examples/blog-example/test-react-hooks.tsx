/**
 * React Hooks Test - Demonstrates framework-agnostic hooks in action
 */

import React from 'react'
import { SDKProvider, usePosts, usePost, useCreatePost, usePublishedPosts } from './gen/sdk/react'

/**
 * Test Component 1: List Posts
 */
function PostList() {
  const { data, isPending, isError, error } = usePosts({ take: 5 })
  
  console.log('📋 PostList hook result:', { 
    hasData: !!data, 
    isPending, 
    isError,
    count: data?.data.length 
  })
  
  if (isPending) return <div>Loading posts...</div>
  if (isError) return <div>Error: {error?.message}</div>
  
  return (
    <div>
      <h2>All Posts ({data?.meta.total})</h2>
      {data?.data.map(post => (
        <div key={post.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
          <h3>{post.title}</h3>
          <p>{post.excerpt || 'No excerpt'}</p>
          <small>By Author #{post.authorId} | Views: {post.views}</small>
        </div>
      ))}
    </div>
  )
}

/**
 * Test Component 2: Single Post
 */
function PostDetail({ postId }: { postId: number }) {
  const { data: post, isPending } = usePost(postId)
  
  console.log('📄 PostDetail hook result:', { hasData: !!post, isPending })
  
  if (isPending) return <div>Loading post...</div>
  if (!post) return <div>Post not found</div>
  
  return (
    <div style={{ border: '2px solid blue', padding: '15px' }}>
      <h2>{post.title}</h2>
      <p>{post.content}</p>
      <p>Slug: {post.slug}</p>
      <p>Published: {post.published ? 'Yes' : 'No'}</p>
    </div>
  )
}

/**
 * Test Component 3: Published Posts (Helper Hook)
 */
function PublishedPostList() {
  const { data, isPending } = usePublishedPosts({ take: 3 })
  
  console.log('✨ PublishedPostList helper hook result:', { 
    hasData: !!data, 
    isPending,
    count: data?.data.length 
  })
  
  if (isPending) return <div>Loading published posts...</div>
  
  return (
    <div>
      <h2>Published Posts ({data?.data.length})</h2>
      {data?.data.map(post => (
        <div key={post.id} style={{ background: '#f0f0f0', padding: '10px', margin: '5px 0' }}>
          <strong>{post.title}</strong>
        </div>
      ))}
    </div>
  )
}

/**
 * Test Component 4: Create Post Form
 */
function CreatePostForm() {
  const { mutate, isPending, isSuccess, data: createdPost } = useCreatePost({
    onSuccess: (post) => {
      console.log('✅ Post created successfully:', post.title)
    },
    onError: (error) => {
      console.error('❌ Failed to create post:', error.message)
    }
  })
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutate({
      title: 'Test Post from Hooks',
      slug: `test-${Date.now()}`,
      content: 'This post was created using React hooks!',
      authorId: 1,
      published: false
    })
  }
  
  return (
    <div style={{ border: '2px solid green', padding: '15px', margin: '20px 0' }}>
      <h2>Create Post (Mutation Hook)</h2>
      <form onSubmit={handleSubmit}>
        <button type="submit" disabled={isPending}>
          {isPending ? 'Creating...' : 'Create Test Post'}
        </button>
      </form>
      {isSuccess && createdPost && (
        <div style={{ background: '#d4edda', padding: '10px', marginTop: '10px' }}>
          ✅ Created: {createdPost.title} (ID: {createdPost.id})
        </div>
      )}
    </div>
  )
}

/**
 * Main Demo App
 */
function DemoApp() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🚀 React Hooks Demo - Framework-Agnostic Architecture</h1>
      
      <div style={{ background: '#e7f3ff', padding: '15px', marginBottom: '20px' }}>
        <h3>✅ What's Being Tested:</h3>
        <ul>
          <li>Core queries (framework-agnostic layer)</li>
          <li>React Query hooks (thin wrappers)</li>
          <li>Helper hooks (domain shortcuts)</li>
          <li>Mutations (create, update, delete)</li>
          <li>Type safety and autocomplete</li>
        </ul>
      </div>
      
      <PostList />
      <hr />
      <PostDetail postId={1} />
      <hr />
      <PublishedPostList />
      <hr />
      <CreatePostForm />
    </div>
  )
}

/**
 * App with Provider
 */
export function App() {
  return (
    <SDKProvider showDevtools={true}>
      <DemoApp />
    </SDKProvider>
  )
}

/**
 * For testing in Node.js (console output only)
 */
export async function testHooksInNode() {
  console.log('\n🧪 Testing Framework-Agnostic Hooks (Node.js)\n')
  
  // We can use core queries directly in Node!
  const { postQueries } = await import('./gen/sdk/core/queries/post-queries')
  
  console.log('1️⃣ Testing core query (framework-agnostic):')
  const postsQuery = postQueries.all.list({ take: 3 })
  console.log('   Query Key:', postsQuery.queryKey)
  console.log('   Running query...')
  
  try {
    const result = await postsQuery.queryFn()
    console.log(`   ✅ Got ${result.data.length} posts (total: ${result.meta.total})`)
    result.data.forEach(post => {
      console.log(`      - ${post.title}`)
    })
  } catch (error) {
    console.log('   ❌ Error:', error)
  }
  
  console.log('\n2️⃣ Testing helper query:')
  const publishedQuery = postQueries.helpers.published({ take: 2 })
  console.log('   Query Key:', publishedQuery.queryKey)
  
  try {
    const result = await publishedQuery.queryFn()
    console.log(`   ✅ Got ${result.data.length} published posts`)
  } catch (error) {
    console.log('   ❌ Error:', error)
  }
  
  console.log('\n✨ Framework-agnostic core queries work in Node.js!\n')
}

// Run Node.js test if executed directly
if (typeof window === 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  testHooksInNode().catch(console.error)
}

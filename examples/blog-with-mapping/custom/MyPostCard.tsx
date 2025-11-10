/**
 * Custom Post Card Component
 * 
 * This overrides the generated PostCard component
 * from the blog template with custom styling and behavior
 */

import Link from 'next/link'
import Image from 'next/image'
import type { BlogPost } from '@/generated/sdk/types'

interface MyPostCardProps {
  post: BlogPost & {
    writer: {
      fullName: string
      profileImage?: string | null
    }
  }
}

export function MyPostCard({ post }: MyPostCardProps) {
  return (
    <article className="custom-post-card">
      {/* Custom Featured Image with Next.js Image optimization */}
      {post.featuredImage && (
        <Link href={`/posts/${post.slug}`}>
          <div className="relative h-64 w-full overflow-hidden rounded-t-lg">
            <Image
              src={post.featuredImage}
              alt={post.heading}
              fill
              className="object-cover transition-transform hover:scale-105"
            />
          </div>
        </Link>
      )}
      
      <div className="p-6">
        {/* Custom Tags with Pills */}
        {post.tags && post.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Title with custom font */}
        <Link href={`/posts/${post.slug}`}>
          <h2 className="mb-2 font-serif text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
            {post.heading}
          </h2>
        </Link>
        
        {/* Summary with custom truncation */}
        {post.summary && (
          <p className="mb-4 text-gray-600 line-clamp-3">
            {post.summary}
          </p>
        )}
        
        {/* Author with Avatar */}
        <div className="flex items-center justify-between border-t pt-4">
          <Link 
            href={`/authors/${post.writerId}`}
            className="flex items-center gap-3 hover:opacity-75 transition-opacity"
          >
            {post.writer.profileImage ? (
              <Image
                src={post.writer.profileImage}
                alt={post.writer.fullName}
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {post.writer.fullName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">{post.writer.fullName}</p>
              <p className="text-sm text-gray-500">
                {new Date(post.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          </Link>
          
          {/* Custom Read Time Calculation */}
          <span className="text-sm text-gray-500">
            {Math.ceil(post.body.split(' ').length / 200)} min read
          </span>
        </div>
      </div>
    </article>
  )
}

/**
 * CUSTOMIZATION EXAMPLE:
 * 
 * This component demonstrates several customizations:
 * 
 * 1. Schema Mapping Usage:
 *    - Uses 'heading' instead of 'title'
 *    - Uses 'body' instead of 'content'
 *    - Uses 'writer' instead of 'author'
 *    - Uses 'fullName' instead of 'name'
 * 
 * 2. Custom Styling:
 *    - Custom card layout
 *    - Gradient avatars for users without images
 *    - Tag pills with custom colors
 *    - Hover effects and transitions
 * 
 * 3. Additional Features:
 *    - Read time calculation
 *    - Next.js Image optimization
 *    - Line clamping for summaries
 *    - Custom date formatting
 * 
 * 4. Override Configuration:
 *    In ssot.config.ts:
 *    customization: {
 *      overrides: {
 *        'components/PostCard': './custom/MyPostCard'
 *      }
 *    }
 */


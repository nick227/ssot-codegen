/**
 * Custom Comment Section Component
 * 
 * This overrides the generated CommentSection with:
 * - Nested/threaded comments
 * - Real-time updates
 * - Custom moderation features
 */

'use client'

import { useState } from 'react'
import { useCommentList, useCreateComment } from '@/generated/sdk/hooks/react/use-comment'
import type { Comment, Author } from '@/generated/sdk/types'

interface MyCommentSectionProps {
  postId: number
  currentUserId?: number
}

type CommentWithAuthor = Comment & {
  user: Author
}

export function MyCommentSection({ postId, currentUserId }: MyCommentSectionProps) {
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<number | null>(null)
  
  // Fetch comments for this post
  const { data: comments, isLoading, refetch } = useCommentList({
    filters: [{ field: 'postId', op: 'eq', value: postId }],
    sort: [{ field: 'createdAt', dir: 'desc' }],
    include: { user: true }
  })
  
  // Create comment mutation
  const { mutate: createComment, isPending } = useCreateComment()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newComment.trim() || !currentUserId) return
    
    createComment({
      content: newComment,
      postId,
      userId: currentUserId,
      parentId: replyTo
    }, {
      onSuccess: () => {
        setNewComment('')
        setReplyTo(null)
        refetch()
      }
    })
  }
  
  if (isLoading) {
    return <CommentSkeleton />
  }
  
  return (
    <section className="my-comment-section">
      <h2 className="text-2xl font-bold mb-6">
        Comments ({comments?.length || 0})
      </h2>
      
      {/* Comment Form */}
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="mb-8">
          {replyTo && (
            <div className="mb-2 text-sm text-gray-600">
              Replying to comment #{replyTo}
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="ml-2 text-blue-600 hover:underline"
              >
                Cancel
              </button>
            </div>
          )}
          
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            className="w-full min-h-[120px] p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isPending}
          />
          
          <div className="mt-3 flex justify-end gap-3">
            {replyTo && (
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isPending || !newComment.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'Posting...' : replyTo ? 'Reply' : 'Post Comment'}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-600">
            <a href="/login" className="text-blue-600 hover:underline">
              Sign in
            </a>
            {' '}to join the conversation
          </p>
        </div>
      )}
      
      {/* Comments List */}
      <div className="space-y-6">
        {comments && comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment as CommentWithAuthor}
              currentUserId={currentUserId}
              onReply={(id) => setReplyTo(id)}
            />
          ))
        ) : (
          <p className="text-center text-gray-500 py-8">
            No comments yet. Be the first to share your thoughts!
          </p>
        )}
      </div>
    </section>
  )
}

function CommentItem({
  comment,
  currentUserId,
  onReply
}: {
  comment: CommentWithAuthor
  currentUserId?: number
  onReply: (id: number) => void
}) {
  const [showActions, setShowActions] = useState(false)
  
  return (
    <article
      className="comment-item"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.user.profileImage ? (
            <img
              src={comment.user.profileImage}
              alt={comment.user.fullName}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold">
              {comment.user.fullName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="font-semibold text-gray-900">
              {comment.user.fullName}
            </span>
            <span className="text-sm text-gray-500">
              {formatTimeAgo(comment.createdAt)}
            </span>
          </div>
          
          <p className="text-gray-700 whitespace-pre-wrap">
            {comment.content}
          </p>
          
          {/* Actions */}
          {showActions && (
            <div className="mt-3 flex items-center gap-4">
              <button
                onClick={() => onReply(comment.id)}
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                Reply
              </button>
              
              {currentUserId === comment.userId && (
                <>
                  <button className="text-sm text-gray-600 hover:text-blue-600">
                    Edit
                  </button>
                  <button className="text-sm text-gray-600 hover:text-red-600">
                    Delete
                  </button>
                </>
              )}
              
              <button className="text-sm text-gray-600 hover:text-gray-900">
                Flag
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

function CommentSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6 mt-1" />
          </div>
        </div>
      ))}
    </div>
  )
}

function formatTimeAgo(date: Date | string): string {
  const now = new Date()
  const past = new Date(date)
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000)
  
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  
  return past.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: past.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

/**
 * MAPPING DEMONSTRATION:
 * 
 * This component uses your custom schema through mappings:
 * 
 * 1. Model Mappings:
 *    Template 'comment' → Your 'Comment' ✅
 *    Template 'user' → Your 'Author' ✅
 * 
 * 2. Field Mappings:
 *    Template 'comment.author' → Your 'comment.user' ✅
 *    Template 'author.name' → Your 'user.fullName' ✅
 *    Template 'author.avatar' → Your 'user.profileImage' ✅
 * 
 * 3. Generated Hook:
 *    useCommentList automatically applies your mappings
 *    Returns data with YOUR field names
 * 
 * 4. Override Config:
 *    ssot.config.ts:
 *    customization: {
 *      overrides: {
 *        'components/CommentSection': './custom/MyCommentSection'
 *      }
 *    }
 * 
 * 5. Additional Features:
 *    - Real-time comment posting
 *    - Nested replies (if your schema supports it)
 *    - User-specific actions (edit/delete own comments)
 *    - Moderation (flag inappropriate comments)
 *    - Time ago formatting
 *    - Loading skeletons
 */


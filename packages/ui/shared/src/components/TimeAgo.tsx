/**
 * TimeAgo Component - Shared across templates
 * 
 * Used in:
 * - Blog: Post dates, comment timestamps
 * - Chatbot: Message timestamps
 * - Admin: Activity logs, audit trails
 */

import React from 'react'

export interface TimeAgoProps {
  date: Date | string
  className?: string
}

export function TimeAgo({ date, className = '' }: TimeAgoProps) {
  const formatted = formatTimeAgo(date)
  const isoDate = date instanceof Date ? date.toISOString() : new Date(date).toISOString()
  
  return (
    <time dateTime={isoDate} className={className} title={new Date(date).toLocaleString()}>
      {formatted}
    </time>
  )
}

function formatTimeAgo(date: Date | string): string {
  const now = new Date()
  const past = new Date(date)
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000)
  
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`
  
  // For older dates, show formatted date
  return past.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: past.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

/**
 * SHARED COMPONENT
 * 
 * Consistent time formatting across all templates:
 * 
 * 1. Blog:
 *    <TimeAgo date={post.createdAt} />
 *    <TimeAgo date={comment.createdAt} className="text-sm text-neutral-500" />
 * 
 * 2. Chatbot:
 *    <TimeAgo date={message.timestamp} className="text-xs text-neutral-400" />
 * 
 * 3. Admin:
 *    <TimeAgo date={activity.createdAt} />
 * 
 * Features:
 * - Smart formatting (just now, 2m ago, 3h ago, etc.)
 * - Full date tooltip on hover
 * - ISO datetime attribute for accessibility
 */


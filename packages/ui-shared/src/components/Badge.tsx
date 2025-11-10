/**
 * Badge Component - Shared across templates
 * 
 * Used in:
 * - Blog: Post tags, status indicators
 * - Chatbot: Online status, message status, typing indicators
 * - Admin: Status badges, role badges
 */

import React from 'react'

export interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const variantClasses = {
  default: 'bg-neutral-100 text-neutral-800',
  primary: 'bg-primary-100 text-primary-800',
  success: 'bg-success-100 text-success-800',
  warning: 'bg-warning-100 text-warning-800',
  error: 'bg-error-100 text-error-800',
  neutral: 'bg-neutral-100 text-neutral-600'
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base'
}

export function Badge({ 
  children, 
  variant = 'default', 
  size = 'md',
  className = '' 
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  )
}

/**
 * SHARED COMPONENT
 * 
 * Used across templates:
 * 
 * 1. Blog:
 *    <Badge variant="primary">{tag}</Badge>
 *    <Badge variant="success">Published</Badge>
 *    <Badge variant="neutral">Draft</Badge>
 * 
 * 2. Chatbot:
 *    <Badge variant="success">● Online</Badge>
 *    <Badge variant="neutral">Typing...</Badge>
 *    <Badge variant="primary">New</Badge>
 * 
 * 3. Admin:
 *    <Badge variant="warning">Pending</Badge>
 *    <Badge variant="error">Blocked</Badge>
 */


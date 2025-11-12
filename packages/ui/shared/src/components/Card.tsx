/**
 * Card Component - Shared across templates
 * 
 * Used in:
 * - Blog: Post cards, comment containers, author cards
 * - Chatbot: Message bubbles, conversation cards
 * - Admin: Dashboard cards, stat cards
 */

import React from 'react'

export interface CardProps {
  children: React.ReactNode
  variant?: 'default' | 'outlined' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  className?: string
  onClick?: () => void
}

const variantClasses = {
  default: 'bg-white border border-neutral-200',
  outlined: 'bg-transparent border-2 border-neutral-300',
  elevated: 'bg-white shadow-md'
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6'
}

export function Card({ 
  children, 
  variant = 'default',
  padding = 'md',
  hover = false,
  className = '',
  onClick
}: CardProps) {
  const hoverClass = hover ? 'hover:shadow-lg transition-shadow cursor-pointer' : ''
  const clickableClass = onClick ? 'cursor-pointer' : ''
  
  return (
    <div
      className={`rounded-lg ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClass} ${clickableClass} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  )
}

/**
 * SHARED COMPONENT
 * 
 * Flexible card container used across templates:
 * 
 * 1. Blog:
 *    <Card hover onClick={() => navigate(post)}>
 *      <PostContent />
 *    </Card>
 * 
 * 2. Chatbot:
 *    <Card variant="elevated" padding="sm">
 *      <ChatMessage />
 *    </Card>
 * 
 * 3. Admin:
 *    <Card padding="lg">
 *      <StatCard />
 *    </Card>
 */


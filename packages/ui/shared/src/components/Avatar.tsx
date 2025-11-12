/**
 * Avatar Component - Shared across templates
 * 
 * Used in:
 * - Blog: Author avatars in comments, post cards, author profiles
 * - Chatbot: User avatars in messages
 * - Admin: User identification
 */

import React from 'react'

export interface AvatarProps {
  src?: string | null
  alt: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fallbackText?: string
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-16 h-16 text-2xl',
  xl: 'w-24 h-24 text-4xl'
}

export function Avatar({ 
  src, 
  alt, 
  size = 'md', 
  fallbackText,
  className = '' 
}: AvatarProps) {
  const fallback = fallbackText || alt.charAt(0).toUpperCase()
  
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
        onError={(e) => {
          // Fallback to gradient on error
          e.currentTarget.style.display = 'none'
          if (e.currentTarget.nextElementSibling) {
            (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex'
          }
        }}
      />
    )
  }
  
  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold ${className}`}
      aria-label={alt}
    >
      {fallback}
    </div>
  )
}

/**
 * SHARED COMPONENT
 * 
 * This component is used across multiple templates:
 * 
 * 1. Blog Template:
 *    - Author avatar in post cards
 *    - Author avatar in comments
 *    - Author profile page header
 * 
 * 2. Chatbot Template:
 *    - User avatar in messages
 *    - Bot avatar
 *    - Participant list
 * 
 * 3. Admin Template:
 *    - User identification in tables
 *    - Profile sections
 * 
 * Benefits:
 * - Consistent design across templates
 * - Single source of truth
 * - Easier maintenance
 * - Smaller bundle (no duplication)
 */


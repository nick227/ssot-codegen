import React from 'react'
import { clsx } from 'clsx'

export interface BadgeProps {
  variant?: 'default' | 'unread' | 'category'
  size?: 'small' | 'medium' | 'large'
  color?: string
  children: React.ReactNode
  className?: string
}

export function Badge({
  variant = 'default',
  size = 'medium',
  color,
  children,
  className
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center rounded-full font-medium',
        {
          // Variants
          'bg-gray-100 text-gray-800': variant === 'default',
          'bg-red-500 text-white': variant === 'unread',
          'bg-blue-100 text-blue-800': variant === 'category' && !color,
          // Sizes
          'px-2 py-0.5 text-xs': size === 'small',
          'px-3 py-1 text-sm': size === 'medium',
          'px-4 py-1.5 text-base': size === 'large',
        },
        className
      )}
      style={color ? { backgroundColor: color, color: 'white' } : undefined}
    >
      {children}
    </span>
  )
}


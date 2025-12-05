import React from 'react'
import { clsx } from 'clsx'

export interface CompatibilityBadgeProps {
  variant?: 'small' | 'medium' | 'large'
  score: number
  showIcon?: boolean
  className?: string
}

export function CompatibilityBadge({
  variant = 'medium',
  score,
  showIcon = false,
  className
}: CompatibilityBadgeProps) {
  const getState = () => {
    if (score >= 80) return { color: 'bg-green-500', text: 'text-white', icon: '✓' }
    if (score >= 50) return { color: 'bg-yellow-400', text: 'text-gray-900', icon: '−' }
    return { color: 'bg-red-500', text: 'text-white', icon: '✗' }
  }

  const state = getState()
  const sizeClasses = {
    small: 'h-6 px-2 text-xs',
    medium: 'h-8 px-3 text-sm',
    large: 'h-12 px-4 text-lg',
  }

  return (
    <div
      className={clsx(
        'inline-flex items-center justify-center rounded-full font-bold',
        state.color,
        state.text,
        sizeClasses[variant],
        className
      )}
    >
      {showIcon && <span className="mr-1">{state.icon}</span>}
      {Math.round(score)}%
    </div>
  )
}


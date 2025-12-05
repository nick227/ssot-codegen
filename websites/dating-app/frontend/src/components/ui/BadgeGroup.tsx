import React from 'react'
import { clsx } from 'clsx'
import { Badge } from './Badge'

export interface BadgeItem {
  id: string
  label: string
  color?: string
}

export interface BadgeGroupProps {
  variant?: 'horizontal' | 'vertical'
  badges: BadgeItem[]
  maxVisible?: number
  className?: string
}

export function BadgeGroup({
  variant = 'horizontal',
  badges,
  maxVisible,
  className
}: BadgeGroupProps) {
  const visibleBadges = maxVisible ? badges.slice(0, maxVisible) : badges
  const remainingCount = maxVisible && badges.length > maxVisible 
    ? badges.length - maxVisible 
    : 0

  return (
    <div
      className={clsx(
        'flex gap-2',
        variant === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col',
        className
      )}
    >
      {visibleBadges.map((badge) => (
        <Badge
          key={badge.id}
          variant="category"
          size="small"
          color={badge.color}
        >
          {badge.label}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant="default" size="small">
          +{remainingCount}
        </Badge>
      )}
    </div>
  )
}


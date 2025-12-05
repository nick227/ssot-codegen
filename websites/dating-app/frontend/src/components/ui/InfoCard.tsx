import React from 'react'
import { clsx } from 'clsx'
import { Button } from './Button'

export interface InfoCardProps {
  variant?: 'quiz-nudge' | 'empty-state' | 'info'
  icon?: React.ReactNode
  message: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function InfoCard({
  variant = 'info',
  icon,
  message,
  actionLabel,
  onAction,
  className
}: InfoCardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-xl shadow-soft p-6',
        {
          'border-2 border-primary': variant === 'quiz-nudge',
        },
        className
      )}
    >
      {icon && (
        <div className="flex justify-center mb-4">
          {icon}
        </div>
      )}
      <p className="text-center text-gray-700 mb-4">{message}</p>
      {actionLabel && onAction && (
        <div className="flex justify-center">
          <Button variant="primary" size="medium" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  )
}


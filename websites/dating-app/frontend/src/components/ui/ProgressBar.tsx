import React from 'react'
import { clsx } from 'clsx'

export interface ProgressBarProps {
  variant?: 'quiz' | 'upload' | 'action'
  value: number
  max?: number
  showLabel?: boolean
  className?: string
}

export function ProgressBar({
  variant = 'quiz',
  value,
  max = 100,
  showLabel = true,
  className
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div className={clsx('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600">Progress</span>
          <span className="text-sm font-medium text-gray-900">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={clsx(
            'h-full transition-all duration-300',
            {
              'bg-primary': variant === 'quiz',
              'bg-blue-500': variant === 'upload',
              'bg-green-500': variant === 'action',
            }
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}


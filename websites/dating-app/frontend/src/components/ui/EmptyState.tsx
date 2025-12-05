import React from 'react'
import { Button } from './Button'

export interface EmptyStateProps {
  message: string
  subMessage?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  message,
  subMessage,
  actionLabel,
  onAction,
  className
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className || ''}`}>
      <p className="text-gray-500 mb-2">{message}</p>
      {subMessage && <p className="text-sm text-gray-400 mb-4">{subMessage}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}


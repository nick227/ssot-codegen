import React from 'react'
import { clsx } from 'clsx'

export interface LoadingSkeletonProps {
  variant?: 'profile-header' | 'card-list' | 'message-list' | 'custom'
  count?: number
  className?: string
}

export function LoadingSkeleton({ variant = 'custom', count = 1, className }: LoadingSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => (
    <div key={i} className={clsx('animate-pulse bg-gray-200 rounded-lg', className)}>
      {variant === 'profile-header' && (
        <>
          <div className="h-64 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </>
      )}
      {variant === 'card-list' && (
        <div className="h-24 bg-gray-200 rounded-lg"></div>
      )}
      {variant === 'message-list' && (
        <div className="h-16 bg-gray-200 rounded-lg"></div>
      )}
    </div>
  ))

  return <>{skeletons}</>
}


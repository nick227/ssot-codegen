import React from 'react'
import { LoadingSkeleton } from '../ui/LoadingSkeleton'
import { EmptyState } from '../ui/EmptyState'

export interface PageStateHandlerProps {
  /**
   * Loading state
   */
  isLoading: boolean
  
  /**
   * Empty state (no data)
   */
  isEmpty?: boolean
  
  /**
   * Error state
   */
  error?: Error | null
  
  /**
   * Custom loading component
   */
  loadingComponent?: React.ReactNode
  
  /**
   * Custom empty component
   */
  emptyComponent?: React.ReactNode
  
  /**
   * Custom error component
   */
  errorComponent?: React.ReactNode
  
  /**
   * Empty state message
   */
  emptyMessage?: string
  
  /**
   * Empty state sub-message
   */
  emptySubMessage?: string
  
  /**
   * Empty state action label
   */
  emptyActionLabel?: string
  
  /**
   * Empty state action handler
   */
  onEmptyAction?: () => void
  
  /**
   * Content to render when not loading/empty/error
   */
  children: React.ReactNode
  
  /**
   * Additional className
   */
  className?: string
}

/**
 * Generic page state handler - eliminates boilerplate loading/error/empty logic
 * 
 * Reduces page code by 50%+ by consolidating repeated patterns:
 * - Loading state rendering
 * - Error state rendering
 * - Empty state rendering
 * 
 * @example
 * ```typescript
 * <PageStateHandler
 *   isLoading={isLoading}
 *   isEmpty={!data || data.length === 0}
 *   emptyMessage="No profiles found"
 * >
 *   <CardStack cards={data} />
 * </PageStateHandler>
 * ```
 */
export function PageStateHandler({
  isLoading,
  isEmpty = false,
  error = null,
  loadingComponent,
  emptyComponent,
  errorComponent,
  emptyMessage = 'No data available',
  emptySubMessage,
  emptyActionLabel,
  onEmptyAction,
  children,
  className,
}: PageStateHandlerProps) {
  // Error state (highest priority)
  if (error) {
    if (errorComponent) {
      return <>{errorComponent}</>
    }
    return (
      <div className={className}>
        <EmptyState
          message="Something went wrong"
          subMessage={error.message}
        />
      </div>
    )
  }
  
  // Loading state
  if (isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>
    }
    return (
      <div className={className}>
        <LoadingSkeleton variant="custom" />
      </div>
    )
  }
  
  // Empty state
  if (isEmpty) {
    if (emptyComponent) {
      return <>{emptyComponent}</>
    }
    return (
      <div className={className}>
        <EmptyState
          message={emptyMessage}
          subMessage={emptySubMessage}
          actionLabel={emptyActionLabel}
          onAction={onEmptyAction}
        />
      </div>
    )
  }
  
  // Content
  return <>{children}</>
}


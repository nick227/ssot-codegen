import React from 'react'
import { clsx } from 'clsx'

export interface ListViewProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  emptyState?: React.ReactNode
  virtualized?: boolean
  className?: string
}

export function ListView<T>({
  items,
  renderItem,
  emptyState,
  className
}: ListViewProps<T>) {
  if (items.length === 0) {
    return (
      <div className={clsx('flex flex-col items-center justify-center py-12', className)}>
        {emptyState || <p className="text-gray-500">No items</p>}
      </div>
    )
  }

  // TODO: Implement virtualization for lists >50 items
  // For now, render all items
  return (
    <div className={clsx('space-y-2', className)}>
      {items.map((item, index) => (
        <div key={index}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  )
}


import React from 'react'
import { clsx } from 'clsx'

export interface ButtonGroupItem {
  id: string
  label: string
  icon?: React.ReactNode
}

export interface ButtonGroupProps {
  variant?: 'tabs' | 'actions'
  items: ButtonGroupItem[]
  activeId: string
  onChange: (id: string) => void
  className?: string
}

export function ButtonGroup({
  variant = 'tabs',
  items,
  activeId,
  onChange,
  className
}: ButtonGroupProps) {
  return (
    <div
      className={clsx(
        'flex',
        variant === 'tabs' ? 'flex-row overflow-x-auto' : 'flex-wrap gap-2',
        className
      )}
    >
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={clsx(
            'px-4 py-2 rounded-lg font-medium transition-colors min-h-[44px]',
            {
              // Tabs variant
              'border-b-2 border-transparent': variant === 'tabs',
              'border-b-2 border-primary text-primary': variant === 'tabs' && item.id === activeId,
              'text-gray-600 hover:text-gray-900': variant === 'tabs' && item.id !== activeId,
              // Actions variant
              'bg-gray-100 text-gray-700 hover:bg-gray-200': variant === 'actions' && item.id !== activeId,
              'bg-primary text-white': variant === 'actions' && item.id === activeId,
            }
          )}
        >
          {item.icon && <span className="mr-2">{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>
  )
}


import React from 'react'
import { clsx } from 'clsx'

export interface CardProps {
  variant?: 'discovery' | 'match' | 'thread' | 'dimension' | 'result'
  children: React.ReactNode
  className?: string
  onSwipe?: (direction: 'left' | 'right') => void
  onClick?: () => void
}

export function Card({ 
  children, 
  className,
  onClick 
}: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-xl shadow-soft p-4',
        {
          'cursor-pointer': onClick,
          'transition-transform hover:scale-[0.98]': onClick,
        },
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}


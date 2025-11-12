/**
 * Grid Component
 * 
 * Responsive grid layout
 */

import React from 'react'

export interface GridProps {
  children: React.ReactNode
  cols?: 1 | 2 | 3 | 4 | 6 | 12
  gap?: 0 | 1 | 2 | 3 | 4 | 6 | 8
  responsive?: boolean
  className?: string
}

export function Grid({ 
  children, 
  cols = 3,
  gap = 4,
  responsive = true,
  className = ''
}: GridProps) {
  const colClasses = responsive 
    ? {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
        6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
        12: 'grid-cols-4 md:grid-cols-6 lg:grid-cols-12'
      }
    : {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        6: 'grid-cols-6',
        12: 'grid-cols-12'
      }
  
  const gapClasses = {
    0: 'gap-0',
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8'
  }
  
  return (
    <div className={`grid ${colClasses[cols]} ${gapClasses[gap]} ${className}`.trim()}>
      {children}
    </div>
  )
}


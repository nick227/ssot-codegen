/**
 * Stack Component
 * 
 * Vertical or horizontal stacking with consistent spacing
 */

import React from 'react'

export interface StackProps {
  children: React.ReactNode
  direction?: 'horizontal' | 'vertical'
  spacing?: 0 | 1 | 2 | 3 | 4 | 6 | 8 | 12
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  wrap?: boolean
  className?: string
}

export function Stack({ 
  children, 
  direction = 'vertical',
  spacing = 4,
  align = 'stretch',
  justify = 'start',
  wrap = false,
  className = ''
}: StackProps) {
  const isVertical = direction === 'vertical'
  
  const flexDirection = isVertical ? 'flex-col' : 'flex-row'
  
  const spacingClasses = {
    0: isVertical ? 'space-y-0' : 'space-x-0',
    1: isVertical ? 'space-y-1' : 'space-x-1',
    2: isVertical ? 'space-y-2' : 'space-x-2',
    3: isVertical ? 'space-y-3' : 'space-x-3',
    4: isVertical ? 'space-y-4' : 'space-x-4',
    6: isVertical ? 'space-y-6' : 'space-x-6',
    8: isVertical ? 'space-y-8' : 'space-x-8',
    12: isVertical ? 'space-y-12' : 'space-x-12'
  }
  
  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  }
  
  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around'
  }
  
  const wrapClass = wrap ? 'flex-wrap' : ''
  
  return (
    <div 
      className={`
        flex 
        ${flexDirection} 
        ${spacingClasses[spacing]} 
        ${alignClasses[align]} 
        ${justifyClasses[justify]}
        ${wrapClass}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </div>
  )
}


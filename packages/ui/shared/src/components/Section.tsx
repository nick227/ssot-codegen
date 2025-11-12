/**
 * Section Component
 * 
 * Content section with consistent spacing and styling
 */

import React from 'react'

export interface SectionProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  centered?: boolean
  background?: 'white' | 'gray' | 'none'
  padding?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Section({ 
  children,
  title,
  subtitle,
  centered = false,
  background = 'none',
  padding = 'lg',
  className = ''
}: SectionProps) {
  const bgClasses = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    none: ''
  }
  
  const paddingClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-20',
    xl: 'py-32'
  }
  
  const textAlign = centered ? 'text-center' : ''
  
  return (
    <section className={`${bgClasses[background]} ${paddingClasses[padding]} ${className}`.trim()}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {(title || subtitle) && (
          <div className={`mb-12 ${textAlign}`}>
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-lg text-gray-600 max-w-2xl ${centered ? 'mx-auto' : ''}">
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}


/**
 * Hero Component
 * 
 * Landing page hero section
 */

import React from 'react'

export interface HeroProps {
  title: string
  subtitle?: string
  description?: string
  actions?: React.ReactNode
  image?: React.ReactNode
  variant?: 'centered' | 'split'
  className?: string
}

export function Hero({ 
  title,
  subtitle,
  description,
  actions,
  image,
  variant = 'centered',
  className = ''
}: HeroProps) {
  if (variant === 'split') {
    return (
      <section className={`py-20 ${className}`.trim()}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div>
              {subtitle && (
                <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">
                  {subtitle}
                </p>
              )}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                {title}
              </h1>
              {description && (
                <p className="text-lg text-gray-600 mb-8">
                  {description}
                </p>
              )}
              {actions && (
                <div className="flex flex-wrap gap-4">
                  {actions}
                </div>
              )}
            </div>
            
            {/* Image */}
            {image && (
              <div className="flex justify-center">
                {image}
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }
  
  // Centered variant
  return (
    <section className={`py-20 text-center ${className}`.trim()}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {subtitle && (
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">
            {subtitle}
          </p>
        )}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
          {title}
        </h1>
        {description && (
          <p className="text-lg text-gray-600 mb-8">
            {description}
          </p>
        )}
        {actions && (
          <div className="flex flex-wrap justify-center gap-4">
            {actions}
          </div>
        )}
        {image && (
          <div className="mt-12">
            {image}
          </div>
        )}
      </div>
    </section>
  )
}


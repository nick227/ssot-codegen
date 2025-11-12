/**
 * Auth Layout Component
 * 
 * Centered layout for authentication pages (login, signup, etc.)
 */

import React from 'react'

export interface AuthLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  logo?: React.ReactNode
  footer?: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg'
  className?: string
}

export function AuthLayout({ 
  children,
  title,
  subtitle,
  logo,
  footer,
  maxWidth = 'sm',
  className = ''
}: AuthLayoutProps) {
  const widthClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl'
  }
  
  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 ${className}`.trim()}>
      <div className={`w-full ${widthClasses[maxWidth]}`}>
        {/* Logo */}
        {logo && (
          <div className="flex justify-center mb-8">
            {logo}
          </div>
        )}
        
        {/* Card */}
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Header */}
          {(title || subtitle) && (
            <div className="text-center mb-8">
              {title && (
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600">
                  {subtitle}
                </p>
              )}
            </div>
          )}
          
          {/* Content */}
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="mt-6 text-center text-sm text-gray-600">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}


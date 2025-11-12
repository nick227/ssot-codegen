/**
 * Landing Layout Component
 * 
 * Marketing/landing page layout
 */

import React from 'react'

export interface LandingLayoutProps {
  children: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function LandingLayout({ 
  children,
  header,
  footer,
  className = ''
}: LandingLayoutProps) {
  return (
    <div className={`min-h-screen flex flex-col ${className}`.trim()}>
      {/* Header */}
      {header && (
        <div className="flex-shrink-0">
          {header}
        </div>
      )}
      
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer */}
      {footer && (
        <div className="flex-shrink-0">
          {footer}
        </div>
      )}
    </div>
  )
}


/**
 * Dashboard Layout Component
 * 
 * Standard dashboard layout with sidebar and header
 */

import React from 'react'

export interface DashboardLayoutProps {
  children: React.ReactNode
  header?: React.ReactNode
  sidebar?: React.ReactNode
  footer?: React.ReactNode
  sidebarWidth?: string
  className?: string
}

export function DashboardLayout({ 
  children,
  header,
  sidebar,
  footer,
  sidebarWidth = 'w-64',
  className = ''
}: DashboardLayoutProps) {
  return (
    <div className={`min-h-screen flex flex-col ${className}`.trim()}>
      {/* Header */}
      {header && <div className="flex-shrink-0">{header}</div>}
      
      <div className="flex-1 flex">
        {/* Sidebar */}
        {sidebar && (
          <div className={`flex-shrink-0 ${sidebarWidth}`}>
            {sidebar}
          </div>
        )}
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          {children}
        </main>
      </div>
      
      {/* Footer */}
      {footer && <div className="flex-shrink-0">{footer}</div>}
    </div>
  )
}


/**
 * Header Component
 * 
 * Application header with navigation
 */

import React from 'react'

export interface HeaderLink {
  label: string
  href: string
  active?: boolean
}

export interface HeaderProps {
  logo?: React.ReactNode
  title?: string
  links?: HeaderLink[]
  actions?: React.ReactNode
  sticky?: boolean
  className?: string
}

export function Header({ 
  logo,
  title,
  links = [],
  actions,
  sticky = true,
  className = ''
}: HeaderProps) {
  const stickyClass = sticky ? 'sticky top-0 z-50' : ''
  
  return (
    <header className={`bg-white border-b border-gray-200 ${stickyClass} ${className}`.trim()}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            {logo && <div className="flex-shrink-0">{logo}</div>}
            {title && (
              <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            )}
          </div>
          
          {/* Navigation */}
          {links.length > 0 && (
            <nav className="hidden md:flex items-center gap-6">
              {links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.href}
                  className={`
                    text-sm font-medium transition-colors
                    ${link.active 
                      ? 'text-blue-600' 
                      : 'text-gray-700 hover:text-blue-600'
                    }
                  `.trim()}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}
          
          {/* Actions */}
          {actions && (
            <div className="flex items-center gap-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}


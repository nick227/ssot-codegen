/**
 * Sidebar Component
 * 
 * Navigation sidebar with collapsible sections
 */

import React from 'react'

export interface SidebarLink {
  label: string
  href: string
  icon?: React.ReactNode
  active?: boolean
  badge?: string | number
}

export interface SidebarSection {
  title?: string
  links: SidebarLink[]
}

export interface SidebarProps {
  sections: SidebarSection[]
  header?: React.ReactNode
  footer?: React.ReactNode
  collapsible?: boolean
  collapsed?: boolean
  onToggle?: () => void
  className?: string
}

export function Sidebar({ 
  sections,
  header,
  footer,
  collapsible = false,
  collapsed = false,
  onToggle,
  className = ''
}: SidebarProps) {
  const widthClass = collapsed ? 'w-16' : 'w-64'
  
  return (
    <aside className={`
      ${widthClass} 
      bg-white 
      border-r 
      border-gray-200 
      flex 
      flex-col 
      transition-all 
      duration-200
      ${className}
    `.trim().replace(/\s+/g, ' ')}>
      {/* Header */}
      {header && (
        <div className="p-4 border-b border-gray-200">
          {header}
        </div>
      )}
      
      {/* Collapse Toggle */}
      {collapsible && (
        <button
          onClick={onToggle}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          {collapsed ? '→' : '←'}
        </button>
      )}
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {sections.map((section, idx) => (
          <div key={idx}>
            {section.title && !collapsed && (
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {section.title}
              </h3>
            )}
            <ul className="space-y-1">
              {section.links.map((link, linkIdx) => (
                <li key={linkIdx}>
                  <a
                    href={link.href}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg
                      text-sm font-medium transition-colors
                      ${link.active 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `.trim()}
                    title={collapsed ? link.label : undefined}
                  >
                    {link.icon && <span className="flex-shrink-0">{link.icon}</span>}
                    {!collapsed && (
                      <>
                        <span className="flex-1">{link.label}</span>
                        {link.badge && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-full">
                            {link.badge}
                          </span>
                        )}
                      </>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      
      {/* Footer */}
      {footer && !collapsed && (
        <div className="p-4 border-t border-gray-200">
          {footer}
        </div>
      )}
    </aside>
  )
}


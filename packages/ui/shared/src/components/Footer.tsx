/**
 * Footer Component
 * 
 * Application footer with links and copyright
 */

import React from 'react'

export interface FooterLink {
  label: string
  href: string
}

export interface FooterSection {
  title: string
  links: FooterLink[]
}

export interface FooterProps {
  sections?: FooterSection[]
  copyright?: string
  logo?: React.ReactNode
  className?: string
}

export function Footer({ 
  sections = [],
  copyright,
  logo,
  className = ''
}: FooterProps) {
  return (
    <footer className={`bg-gray-50 border-t border-gray-200 ${className}`.trim()}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Footer Sections */}
        {sections.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {sections.map((section, idx) => (
              <div key={idx}>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  {section.title}
                </h3>
                <ul className="space-y-2">
                  {section.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <a
                        href={link.href}
                        className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        
        {/* Bottom */}
        <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
          {logo && <div>{logo}</div>}
          {copyright && (
            <p className="text-sm text-gray-600">{copyright}</p>
          )}
        </div>
      </div>
    </footer>
  )
}


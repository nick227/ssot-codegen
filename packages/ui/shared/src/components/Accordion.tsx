/**
 * Accordion Component
 * 
 * Collapsible content panels
 */

import React, { useState } from 'react'

export interface AccordionItem {
  title: string
  content: React.ReactNode
  icon?: React.ReactNode
  disabled?: boolean
}

export interface AccordionProps {
  items: AccordionItem[]
  multiple?: boolean
  defaultOpen?: string[]
  className?: string
}

export function Accordion({ 
  items,
  multiple = false,
  defaultOpen = [],
  className = ''
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<number>>(
    new Set(defaultOpen.map(title => items.findIndex(item => item.title === title)).filter(i => i >= 0))
  )
  
  const toggleItem = (index: number) => {
    if (items[index].disabled) return
    
    setOpenItems(prev => {
      const next = new Set(prev)
      
      if (next.has(index)) {
        next.delete(index)
      } else {
        if (!multiple) {
          next.clear()
        }
        next.add(index)
      }
      
      return next
    })
  }
  
  return (
    <div className={`border border-gray-200 rounded-lg divide-y divide-gray-200 ${className}`.trim()}>
      {items.map((item, index) => {
        const isOpen = openItems.has(index)
        
        return (
          <div key={index}>
            <button
              onClick={() => toggleItem(index)}
              disabled={item.disabled}
              className={`
                w-full flex items-center justify-between gap-3
                px-4 py-3 text-left transition-colors
                ${item.disabled 
                  ? 'cursor-not-allowed opacity-50' 
                  : 'hover:bg-gray-50'
                }
              `.trim()}
            >
              <div className="flex items-center gap-3 flex-1">
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                <span className="font-medium text-gray-900">{item.title}</span>
              </div>
              <svg 
                className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isOpen && (
              <div className="px-4 py-3 text-sm text-gray-700 bg-gray-50">
                {item.content}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}


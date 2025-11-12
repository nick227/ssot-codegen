/**
 * Dropdown Component
 * 
 * Dropdown menu with positioning
 */

import React, { useState, useRef, useEffect } from 'react'

export interface DropdownOption {
  label: string
  value: string
  icon?: React.ReactNode
  disabled?: boolean
  divider?: boolean
}

export interface DropdownProps {
  trigger: React.ReactNode
  options: DropdownOption[]
  onSelect: (value: string) => void
  position?: 'left' | 'right'
  className?: string
}

export function Dropdown({ 
  trigger,
  options,
  onSelect,
  position = 'left',
  className = ''
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Close on outside click
  useEffect(() => {
    if (!open) return
    
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])
  
  const handleSelect = (value: string) => {
    onSelect(value)
    setOpen(false)
  }
  
  const positionClass = position === 'right' ? 'right-0' : 'left-0'
  
  return (
    <div ref={dropdownRef} className={`relative ${className}`.trim()}>
      <div onClick={() => setOpen(!open)}>
        {trigger}
      </div>
      
      {open && (
        <div className={`
          absolute ${positionClass} mt-2 
          w-56 bg-white rounded-lg shadow-lg 
          border border-gray-200 
          py-1 z-50
        `.trim().replace(/\s+/g, ' ')}>
          {options.map((option, idx) => {
            if (option.divider) {
              return <div key={idx} className="my-1 border-t border-gray-200" />
            }
            
            return (
              <button
                key={idx}
                onClick={() => !option.disabled && handleSelect(option.value)}
                disabled={option.disabled}
                className={`
                  w-full flex items-center gap-3 px-4 py-2 
                  text-sm text-left transition-colors
                  ${option.disabled 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `.trim()}
              >
                {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                <span>{option.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}


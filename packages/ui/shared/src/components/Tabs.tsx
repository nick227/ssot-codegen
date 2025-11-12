/**
 * Tabs Component
 * 
 * Tabbed interface for organizing content
 */

import React, { useState } from 'react'

export interface Tab {
  label: string
  value: string
  icon?: React.ReactNode
  disabled?: boolean
  badge?: string | number
}

export interface TabsProps {
  tabs: Tab[]
  defaultValue?: string
  value?: string
  onChange?: (value: string) => void
  children: (activeTab: string) => React.ReactNode
  variant?: 'default' | 'pills'
  className?: string
}

export function Tabs({ 
  tabs,
  defaultValue,
  value: controlledValue,
  onChange,
  children,
  variant = 'default',
  className = ''
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || tabs[0]?.value)
  
  const activeTab = controlledValue !== undefined ? controlledValue : internalValue
  
  const handleTabChange = (value: string) => {
    if (controlledValue === undefined) {
      setInternalValue(value)
    }
    onChange?.(value)
  }
  
  return (
    <div className={className}>
      {/* Tab List */}
      <div className={`
        flex gap-1
        ${variant === 'default' ? 'border-b border-gray-200' : ''}
      `.trim()}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value
          
          return (
            <button
              key={tab.value}
              onClick={() => !tab.disabled && handleTabChange(tab.value)}
              disabled={tab.disabled}
              className={`
                flex items-center gap-2 px-4 py-2
                text-sm font-medium transition-colors
                ${variant === 'pills' ? 'rounded-lg' : 'border-b-2'}
                ${isActive 
                  ? variant === 'pills'
                    ? 'bg-blue-50 text-blue-600'
                    : 'border-blue-600 text-blue-600'
                  : variant === 'pills'
                    ? 'text-gray-700 hover:bg-gray-100'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }
                ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `.trim().replace(/\s+/g, ' ')}
            >
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
      
      {/* Tab Content */}
      <div className="mt-4">
        {children(activeTab)}
      </div>
    </div>
  )
}


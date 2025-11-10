/**
 * Filter panel with controls for different filter types
 */

import { useState } from 'react'
import type { FilterDef, FilterParam, Messages } from '../types.js'

interface FilterPanelProps<T> {
  filters: FilterDef<T>[]
  activeFilters: FilterParam[]
  onApply: (filter: FilterParam) => void
  onClear: () => void
  messages?: Messages
}

export function FilterPanel<T>({
  filters,
  activeFilters,
  onApply,
  onClear,
  messages
}: FilterPanelProps<T>) {
  const [pendingFilters, setPendingFilters] = useState<Record<string, any>>({})
  
  const handleApply = (filter: FilterDef<T>) => {
    const value = pendingFilters[filter.field]
    
    if (value === undefined || value === null || value === '') {
      return
    }
    
    // Determine operator based on filter type
    let op: FilterParam['op'] = 'eq'
    let finalValue = value
    
    switch (filter.type) {
      case 'text':
        op = 'contains'
        break
      case 'enum':
        op = 'in'
        finalValue = Array.isArray(value) ? value : [value]
        break
      case 'boolean':
        op = 'eq'
        break
      case 'date-range':
        if (value.from && value.to) {
          op = 'between'
          finalValue = [value.from, value.to]
        } else if (value.from) {
          op = 'gte'
          finalValue = value.from
        } else if (value.to) {
          op = 'lte'
          finalValue = value.to
        }
        break
      case 'number-range':
        if (value.min !== undefined && value.max !== undefined) {
          op = 'between'
          finalValue = [value.min, value.max]
        } else if (value.min !== undefined) {
          op = 'gte'
          finalValue = value.min
        } else if (value.max !== undefined) {
          op = 'lte'
          finalValue = value.max
        }
        break
    }
    
    onApply({ field: filter.field, op, value: finalValue })
  }
  
  return (
    <div className="bg-neutral-50 border border-neutral-200 rounded-md p-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">
          {messages?.filters || 'Filters'}
        </h3>
        <button
          onClick={onClear}
          className="text-sm text-primary-600 hover:underline"
          type="button"
        >
          {messages?.clearFilters || 'Clear all'}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filters.map(filter => (
          <div key={filter.field} className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700">
              {filter.label || filter.field}
            </label>
            
            {filter.type === 'text' && (
              <input
                type="text"
                placeholder={`Filter by ${filter.label || filter.field}`}
                value={pendingFilters[filter.field] || ''}
                onChange={(e) => setPendingFilters({ ...pendingFilters, [filter.field]: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleApply(filter)
                  }
                }}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            )}
            
            {filter.type === 'enum' && (
              <select
                multiple
                value={pendingFilters[filter.field] || []}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value)
                  setPendingFilters({ ...pendingFilters, [filter.field]: selected })
                }}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {filter.options?.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
            
            {filter.type === 'boolean' && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setPendingFilters({ ...pendingFilters, [filter.field]: true })
                    handleApply({ ...filter, type: 'boolean' })
                  }}
                  className={`
                    px-3 py-2 rounded-md border
                    ${activeFilters.find(f => f.field === filter.field && f.value === true)
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white border-neutral-300 hover:bg-neutral-50'
                    }
                  `}
                  type="button"
                >
                  True
                </button>
                <button
                  onClick={() => {
                    setPendingFilters({ ...pendingFilters, [filter.field]: false })
                    handleApply({ ...filter, type: 'boolean' })
                  }}
                  className={`
                    px-3 py-2 rounded-md border
                    ${activeFilters.find(f => f.field === filter.field && f.value === false)
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white border-neutral-300 hover:bg-neutral-50'
                    }
                  `}
                  type="button"
                >
                  False
                </button>
              </div>
            )}
            
            {filter.type === 'date-range' && (
              <div className="space-y-2">
                <input
                  type="date"
                  placeholder="From"
                  value={pendingFilters[filter.field]?.from || ''}
                  onChange={(e) => setPendingFilters({
                    ...pendingFilters,
                    [filter.field]: { ...(pendingFilters[filter.field] || {}), from: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                />
                <input
                  type="date"
                  placeholder="To"
                  value={pendingFilters[filter.field]?.to || ''}
                  onChange={(e) => setPendingFilters({
                    ...pendingFilters,
                    [filter.field]: { ...(pendingFilters[filter.field] || {}), to: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                />
              </div>
            )}
            
            {filter.type === 'number-range' && (
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={pendingFilters[filter.field]?.min ?? ''}
                  onChange={(e) => setPendingFilters({
                    ...pendingFilters,
                    [filter.field]: { ...(pendingFilters[filter.field] || {}), min: e.target.valueAsNumber }
                  })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={pendingFilters[filter.field]?.max ?? ''}
                  onChange={(e) => setPendingFilters({
                    ...pendingFilters,
                    [filter.field]: { ...(pendingFilters[filter.field] || {}), max: e.target.valueAsNumber }
                  })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                />
              </div>
            )}
            
            {filter.type !== 'boolean' && (
              <button
                onClick={() => handleApply(filter)}
                className="w-full px-3 py-2 bg-primary text-white rounded-md hover:bg-primary-600"
                type="button"
              >
                Apply
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}


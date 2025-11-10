/**
 * Table toolbar with search and filters
 */

import { useState, useCallback } from 'react'
import type { FilterDef, FilterParam, SearchParam, Messages } from '../types.js'

interface TableToolbarProps<T> {
  searchable?: boolean | string[]
  searchPlaceholder?: string
  filterable?: FilterDef<T>[]
  filters: FilterParam[]
  search: SearchParam | null
  onSearchChange: (search: SearchParam | null) => void
  onFilterAdd: (filter: FilterParam) => void
  onFilterRemove: (field: string) => void
  onFiltersClear: () => void
  messages?: Messages
}

export function TableToolbar<T>({
  searchable,
  searchPlaceholder,
  filterable,
  filters,
  search,
  onSearchChange,
  onFilterAdd,
  onFilterRemove,
  onFiltersClear,
  messages
}: TableToolbarProps<T>) {
  const [searchQuery, setSearchQuery] = useState(search?.query || '')
  const [showFilters, setShowFilters] = useState(false)
  
  // Debounced search
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
    
    if (query.trim()) {
      const fields = Array.isArray(searchable) ? searchable : undefined
      onSearchChange({ query: query.trim(), fields })
    } else {
      onSearchChange(null)
    }
  }, [searchable, onSearchChange])
  
  const hasSearchOrFilters = searchable || (filterable && filterable.length > 0)
  
  if (!hasSearchOrFilters) {
    return null
  }
  
  return (
    <div className="ssot-table-toolbar border-b border-neutral-200 p-4">
      <div className="flex items-center gap-4">
        {/* Search */}
        {searchable && (
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="search"
                placeholder={searchPlaceholder || messages?.search || 'Search...'}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                aria-label="Search table"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  aria-label="Clear search"
                  type="button"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Filter toggle */}
        {filterable && filterable.length > 0 && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              px-4 py-2 rounded-md border
              ${filters.length > 0
                ? 'bg-primary text-white border-primary'
                : 'bg-white border-neutral-300 hover:bg-neutral-50'
              }
            `}
            type="button"
          >
            {messages?.filters || 'Filters'} {filters.length > 0 && `(${filters.length})`}
          </button>
        )}
      </div>
      
      {/* Active filter chips */}
      {filters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-sm text-neutral-600">Active filters:</span>
          {filters.map(filter => (
            <span
              key={filter.field}
              className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
            >
              <span>
                {filterable?.find(f => f.field === filter.field)?.label || filter.field}:{' '}
                {formatFilterValue(filter)}
              </span>
              <button
                onClick={() => onFilterRemove(filter.field)}
                className="hover:text-primary-900"
                aria-label={`Remove filter: ${filter.field}`}
                type="button"
              >
                ✕
              </button>
            </span>
          ))}
          <button
            onClick={onFiltersClear}
            className="text-sm text-primary-600 hover:underline"
            type="button"
          >
            {messages?.clearFilters || 'Clear all'}
          </button>
        </div>
      )}
      
      {/* Filter panel (TODO: Implement in next iteration) */}
      {showFilters && filterable && (
        <div className="mt-4 p-4 bg-neutral-50 rounded-md">
          <p className="text-sm text-neutral-600">
            Filter controls will be implemented in next iteration
          </p>
        </div>
      )}
    </div>
  )
}

function formatFilterValue(filter: FilterParam): string {
  if (Array.isArray(filter.value)) {
    return filter.value.join(', ')
  }
  if (typeof filter.value === 'boolean') {
    return filter.value ? 'Yes' : 'No'
  }
  return String(filter.value)
}


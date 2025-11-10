/**
 * Table state management hook
 */

import { useState, useCallback, useMemo } from 'react'
import type { TableState, SortParam, FilterParam, SearchParam } from '../types.js'

export interface UseTableStateOptions {
  defaultPageSize?: number
  defaultSort?: SortParam[]
}

export function useTableState(options: UseTableStateOptions = {}) {
  const [state, setState] = useState<TableState>({
    page: 1,
    pageSize: options.defaultPageSize || 20,
    sort: options.defaultSort || [],
    filters: [],
    search: null
  })
  
  const setPage = useCallback((page: number) => {
    setState(prev => ({ ...prev, page }))
  }, [])
  
  const setPageSize = useCallback((pageSize: number) => {
    setState(prev => ({ ...prev, pageSize, page: 1 }))
  }, [])
  
  const setSort = useCallback((sort: SortParam[]) => {
    setState(prev => ({ ...prev, sort, page: 1 }))
  }, [])
  
  const toggleSort = useCallback((field: string) => {
    setState(prev => {
      const existing = prev.sort.find(s => s.field === field)
      
      if (!existing) {
        // Add as ascending
        return { ...prev, sort: [...prev.sort, { field, dir: 'asc' }], page: 1 }
      }
      
      if (existing.dir === 'asc') {
        // Change to descending
        return {
          ...prev,
          sort: prev.sort.map(s => s.field === field ? { field, dir: 'desc' } : s),
          page: 1
        }
      }
      
      // Remove from sort
      return {
        ...prev,
        sort: prev.sort.filter(s => s.field !== field),
        page: 1
      }
    })
  }, [])
  
  const clearSort = useCallback(() => {
    setState(prev => ({ ...prev, sort: [], page: 1 }))
  }, [])
  
  const setFilters = useCallback((filters: FilterParam[]) => {
    setState(prev => ({ ...prev, filters, page: 1 }))
  }, [])
  
  const addFilter = useCallback((filter: FilterParam) => {
    setState(prev => ({
      ...prev,
      filters: [...prev.filters.filter(f => f.field !== filter.field), filter],
      page: 1
    }))
  }, [])
  
  const removeFilter = useCallback((field: string) => {
    setState(prev => ({
      ...prev,
      filters: prev.filters.filter(f => f.field !== field),
      page: 1
    }))
  }, [])
  
  const clearFilters = useCallback(() => {
    setState(prev => ({ ...prev, filters: [], page: 1 }))
  }, [])
  
  const setSearch = useCallback((search: SearchParam | null) => {
    setState(prev => ({ ...prev, search, page: 1 }))
  }, [])
  
  const clearSearch = useCallback(() => {
    setState(prev => ({ ...prev, search: null, page: 1 }))
  }, [])
  
  const reset = useCallback(() => {
    setState({
      page: 1,
      pageSize: options.defaultPageSize || 20,
      sort: options.defaultSort || [],
      filters: [],
      search: null
    })
  }, [options.defaultPageSize, options.defaultSort])
  
  // Memoized params for hook
  const params = useMemo(() => ({
    page: state.page,
    pageSize: state.pageSize,
    ...(state.sort.length > 0 && { sort: state.sort }),
    ...(state.filters.length > 0 && { filters: state.filters }),
    ...(state.search && { search: state.search })
  }), [state])
  
  return {
    state,
    params,
    setPage,
    setPageSize,
    setSort,
    toggleSort,
    clearSort,
    setFilters,
    addFilter,
    removeFilter,
    clearFilters,
    setSearch,
    clearSearch,
    reset
  }
}


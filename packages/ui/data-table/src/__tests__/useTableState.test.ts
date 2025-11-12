/**
 * Tests for useTableState hook
 */

import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTableState } from '../hooks/useTableState'

describe('useTableState', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useTableState())
    
    expect(result.current.state).toEqual({
      page: 1,
      pageSize: 20,
      sort: [],
      filters: [],
      search: null
    })
  })
  
  it('should initialize with custom defaults', () => {
    const { result } = renderHook(() => useTableState({
      defaultPageSize: 50,
      defaultSort: [{ field: 'createdAt', dir: 'desc' }]
    }))
    
    expect(result.current.state.pageSize).toBe(50)
    expect(result.current.state.sort).toEqual([{ field: 'createdAt', dir: 'desc' }])
  })
  
  it('should change page', () => {
    const { result } = renderHook(() => useTableState())
    
    act(() => {
      result.current.setPage(2)
    })
    
    expect(result.current.state.page).toBe(2)
  })
  
  it('should change page size and reset to page 1', () => {
    const { result } = renderHook(() => useTableState())
    
    act(() => {
      result.current.setPage(3)
    })
    
    expect(result.current.state.page).toBe(3)
    
    act(() => {
      result.current.setPageSize(50)
    })
    
    expect(result.current.state.pageSize).toBe(50)
    expect(result.current.state.page).toBe(1)
  })
  
  it('should toggle sort: none → asc → desc → none', () => {
    const { result } = renderHook(() => useTableState())
    
    // First click: none → asc
    act(() => {
      result.current.toggleSort('title')
    })
    expect(result.current.state.sort).toEqual([{ field: 'title', dir: 'asc' }])
    
    // Second click: asc → desc
    act(() => {
      result.current.toggleSort('title')
    })
    expect(result.current.state.sort).toEqual([{ field: 'title', dir: 'desc' }])
    
    // Third click: desc → none
    act(() => {
      result.current.toggleSort('title')
    })
    expect(result.current.state.sort).toEqual([])
  })
  
  it('should support multi-column sort', () => {
    const { result } = renderHook(() => useTableState())
    
    act(() => {
      result.current.toggleSort('createdAt')
      result.current.toggleSort('title')
    })
    
    expect(result.current.state.sort).toEqual([
      { field: 'createdAt', dir: 'asc' },
      { field: 'title', dir: 'asc' }
    ])
  })
  
  it('should clear all sorts', () => {
    const { result } = renderHook(() => useTableState())
    
    act(() => {
      result.current.toggleSort('createdAt')
      result.current.toggleSort('title')
    })
    
    expect(result.current.state.sort.length).toBe(2)
    
    act(() => {
      result.current.clearSort()
    })
    
    expect(result.current.state.sort).toEqual([])
  })
  
  it('should add filter', () => {
    const { result } = renderHook(() => useTableState())
    
    act(() => {
      result.current.addFilter({ field: 'published', op: 'eq', value: true })
    })
    
    expect(result.current.state.filters).toEqual([
      { field: 'published', op: 'eq', value: true }
    ])
  })
  
  it('should replace filter for same field', () => {
    const { result } = renderHook(() => useTableState())
    
    act(() => {
      result.current.addFilter({ field: 'published', op: 'eq', value: true })
      result.current.addFilter({ field: 'published', op: 'eq', value: false })
    })
    
    expect(result.current.state.filters).toEqual([
      { field: 'published', op: 'eq', value: false }
    ])
  })
  
  it('should remove filter', () => {
    const { result } = renderHook(() => useTableState())
    
    act(() => {
      result.current.addFilter({ field: 'published', op: 'eq', value: true })
      result.current.addFilter({ field: 'category', op: 'eq', value: 'tech' })
    })
    
    expect(result.current.state.filters.length).toBe(2)
    
    act(() => {
      result.current.removeFilter('published')
    })
    
    expect(result.current.state.filters).toEqual([
      { field: 'category', op: 'eq', value: 'tech' }
    ])
  })
  
  it('should clear all filters', () => {
    const { result } = renderHook(() => useTableState())
    
    act(() => {
      result.current.addFilter({ field: 'published', op: 'eq', value: true })
      result.current.addFilter({ field: 'category', op: 'eq', value: 'tech' })
    })
    
    act(() => {
      result.current.clearFilters()
    })
    
    expect(result.current.state.filters).toEqual([])
  })
  
  it('should set search and reset to page 1', () => {
    const { result } = renderHook(() => useTableState())
    
    act(() => {
      result.current.setPage(3)
    })
    
    expect(result.current.state.page).toBe(3)
    
    act(() => {
      result.current.setSearch({ query: 'hello', fields: ['title'] })
    })
    
    expect(result.current.state.search).toEqual({ query: 'hello', fields: ['title'] })
    expect(result.current.state.page).toBe(1)
  })
  
  it('should generate params object for hook', () => {
    const { result } = renderHook(() => useTableState())
    
    act(() => {
      result.current.setPageSize(50)
      result.current.toggleSort('createdAt')
      result.current.addFilter({ field: 'published', op: 'eq', value: true })
      result.current.setSearch({ query: 'test' })
      result.current.setPage(2)  // Set page last (after search/filter)
    })
    
    expect(result.current.params).toEqual({
      page: 2,
      pageSize: 50,
      sort: [{ field: 'createdAt', dir: 'asc' }],
      filters: [{ field: 'published', op: 'eq', value: true }],
      search: { query: 'test' }
    })
  })
  
  it('should reset all state', () => {
    const { result } = renderHook(() => useTableState({ defaultPageSize: 20 }))
    
    act(() => {
      result.current.setPage(3)
      result.current.setPageSize(100)
      result.current.toggleSort('title')
      result.current.addFilter({ field: 'published', op: 'eq', value: true })
      result.current.setSearch({ query: 'test' })
    })
    
    expect(result.current.state.page).toBe(1)
    expect(result.current.state.sort.length).toBeGreaterThan(0)
    
    act(() => {
      result.current.reset()
    })
    
    expect(result.current.state).toEqual({
      page: 1,
      pageSize: 20,
      sort: [],
      filters: [],
      search: null
    })
  })
})


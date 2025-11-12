/**
 * Tests for DataTable component
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { DataTable } from '../components/DataTable'
import type { UseListResult, ColumnDef } from '../types'

// Mock data
const mockPosts = [
  { id: 1, title: 'First Post', author: { name: 'John' }, published: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 2, title: 'Second Post', author: { name: 'Jane' }, published: false, createdAt: '2025-01-02T00:00:00Z' },
  { id: 3, title: 'Third Post', author: { name: 'Bob' }, published: true, createdAt: '2025-01-03T00:00:00Z' }
]

const mockColumns: ColumnDef<typeof mockPosts[0]>[] = [
  { key: 'title', header: 'Title', sortable: true },
  { key: 'author.name', header: 'Author' },
  { key: 'published', header: 'Status' }
]

describe('DataTable', () => {
  describe('Basic Rendering', () => {
    it('should render with explicit data', () => {
      render(
        <DataTable
          data={mockPosts}
          total={mockPosts.length}
          columns={mockColumns}
        />
      )
      
      expect(screen.getByRole('grid')).toBeInTheDocument()
      expect(screen.getByText('First Post')).toBeInTheDocument()
      expect(screen.getByText('Second Post')).toBeInTheDocument()
    })
    
    it('should render column headers', () => {
      render(
        <DataTable
          data={mockPosts}
          total={mockPosts.length}
          columns={mockColumns}
        />
      )
      
      expect(screen.getByRole('columnheader', { name: /title/i })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /author/i })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument()
    })
    
    it('should render all data rows', () => {
      render(
        <DataTable
          data={mockPosts}
          total={mockPosts.length}
          columns={mockColumns}
        />
      )
      
      const rows = screen.getAllByRole('row')
      // 1 header row + 3 data rows
      expect(rows.length).toBeGreaterThanOrEqual(3)
    })
  })
  
  describe('Loading State', () => {
    it('should show loading state', () => {
      render(
        <DataTable
          data={[]}
          total={0}
          isLoading={true}
          columns={mockColumns}
        />
      )
      
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })
    
    it('should show custom loading state', () => {
      render(
        <DataTable
          data={[]}
          total={0}
          isLoading={true}
          columns={mockColumns}
          loadingState={<div>Custom loading...</div>}
        />
      )
      
      expect(screen.getByText('Custom loading...')).toBeInTheDocument()
    })
  })
  
  describe('Empty State', () => {
    it('should show empty state when no data', () => {
      render(
        <DataTable
          data={[]}
          total={0}
          columns={mockColumns}
        />
      )
      
      expect(screen.getByText(/no results found/i)).toBeInTheDocument()
    })
    
    it('should show custom empty state', () => {
      render(
        <DataTable
          data={[]}
          total={0}
          columns={mockColumns}
          emptyState={<div>No posts yet</div>}
        />
      )
      
      expect(screen.getByText('No posts yet')).toBeInTheDocument()
    })
  })
  
  describe('Error State', () => {
    it('should show error state', () => {
      const error = { code: 'ERROR', message: 'Something went wrong' }
      
      render(
        <DataTable
          data={[]}
          total={0}
          error={error}
          columns={mockColumns}
        />
      )
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })
    
    it('should show custom error state', () => {
      const error = { code: 'ERROR', message: 'Failed' }
      
      render(
        <DataTable
          data={[]}
          total={0}
          error={error}
          columns={mockColumns}
          errorState={(err) => <div>Custom error: {err.message}</div>}
        />
      )
      
      expect(screen.getByText('Custom error: Failed')).toBeInTheDocument()
    })
  })
  
  describe('Custom Cell Rendering', () => {
    it('should use custom cell renderer', () => {
      const columns: ColumnDef<typeof mockPosts[0]>[] = [
        {
          key: 'title',
          header: 'Title',
          cellRender: (value) => <strong data-testid="custom-cell">{value.toUpperCase()}</strong>
        }
      ]
      
      render(
        <DataTable
          data={mockPosts}
          total={mockPosts.length}
          columns={columns}
        />
      )
      
      const customCells = screen.getAllByTestId('custom-cell')
      expect(customCells[0]).toHaveTextContent('FIRST POST')
      expect(customCells.length).toBe(3)
    })
  })
  
  describe('Nested Field Access', () => {
    it('should access nested fields', () => {
      render(
        <DataTable
          data={mockPosts}
          total={mockPosts.length}
          columns={mockColumns}
        />
      )
      
      expect(screen.getByText('John')).toBeInTheDocument()
      expect(screen.getByText('Jane')).toBeInTheDocument()
    })
  })
  
  describe('Pagination', () => {
    it('should show pagination controls', () => {
      render(
        <DataTable
          data={mockPosts}
          total={100}
          pagination="pages"
          defaultPageSize={20}
          columns={mockColumns}
        />
      )
      
      expect(screen.getByLabelText(/pagination/i)).toBeInTheDocument()
      expect(screen.getByText(/showing 1-20 of 100/i)).toBeInTheDocument()
    })
    
    it('should hide pagination when disabled', () => {
      render(
        <DataTable
          data={mockPosts}
          total={mockPosts.length}
          pagination={false}
          columns={mockColumns}
        />
      )
      
      expect(screen.queryByLabelText(/pagination/i)).not.toBeInTheDocument()
    })
  })
})


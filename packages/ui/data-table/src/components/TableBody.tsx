/**
 * Table body with data rows
 */

import { Fragment, type ReactNode } from 'react'
import type { ColumnDef, ErrorShape, Messages } from '../types.js'
import { getNestedValue } from '../utils/cell-accessor.js'

interface TableBodyProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  isLoading: boolean
  error: ErrorShape | null
  rowActions?: (row: T) => ReactNode
  onRowClick?: (row: T) => void
  emptyState?: ReactNode
  loadingState?: ReactNode
  errorState?: (error: ErrorShape) => ReactNode
  messages?: Messages
  shouldVirtualize: boolean
  rowHeight: number
}

export function TableBody<T>({
  columns,
  data,
  isLoading,
  error,
  rowActions,
  onRowClick,
  emptyState,
  loadingState,
  errorState,
  messages,
  shouldVirtualize,
  rowHeight
}: TableBodyProps<T>) {
  // Error state
  if (error) {
    return (
      <tbody>
        <tr>
          <td colSpan={columns.length + 1} className="text-center py-12">
            {errorState ? (
              errorState(error)
            ) : (
              <div className="text-error">
                <p className="font-medium mb-2">
                  {messages?.error || 'Error loading data'}
                </p>
                <p className="text-sm text-neutral-600">{error.message}</p>
              </div>
            )}
          </td>
        </tr>
      </tbody>
    )
  }
  
  // Loading state
  if (isLoading) {
    return (
      <tbody>
        <tr>
          <td colSpan={columns.length + 1} className="text-center py-12">
            {loadingState || (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin h-8 w-8 border-4 border-primary-200 border-t-primary-600 rounded-full" />
                <p className="text-neutral-600">
                  {messages?.loading || 'Loading...'}
                </p>
              </div>
            )}
          </td>
        </tr>
      </tbody>
    )
  }
  
  // Empty state
  if (data.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={columns.length + 1} className="text-center py-12">
            {emptyState || (
              <div className="text-neutral-500">
                <p>{messages?.noResults || 'No results found'}</p>
              </div>
            )}
          </td>
        </tr>
      </tbody>
    )
  }
  
  // TODO: Add virtualization for large datasets
  // For now, render all rows (will add @tanstack/react-virtual in next iteration)
  
  return (
    <tbody>
      {data.map((row, rowIndex) => (
        <tr
          key={`row-${rowIndex}`}
          role="row"
          className={onRowClick ? 'cursor-pointer hover:bg-neutral-50' : ''}
          onClick={() => onRowClick?.(row)}
        >
          {columns.map((column) => {
            const value = getNestedValue(row, column.key)
            
            return (
              <td
                key={column.key}
                role="gridcell"
                headers={`col-${column.key}`}
                className={`
                  ${column.align === 'center' ? 'text-center' : ''}
                  ${column.align === 'right' ? 'text-right' : ''}
                  px-4 py-3 border-b border-neutral-200
                `}
              >
                {column.cellRender ? (
                  column.cellRender(value, row, rowIndex)
                ) : (
                  <span>{formatCellValue(value)}</span>
                )}
              </td>
            )
          })}
          
          {/* Actions column */}
          <td className="px-4 py-3 border-b border-neutral-200 text-right">
            {rowActions && rowActions(row)}
          </td>
        </tr>
      ))}
    </tbody>
  )
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? '✓' : '○'
  if (value instanceof Date) return value.toLocaleDateString()
  if (typeof value === 'object') return '[object]'
  return String(value)
}


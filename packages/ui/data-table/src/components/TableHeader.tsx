/**
 * Table header with sortable columns
 */

import type { ColumnDef, SortParam } from '../types.js'

interface TableHeaderProps<T> {
  columns: ColumnDef<T>[]
  sort: SortParam[]
  onToggleSort: (field: string) => void
  onClearSort: () => void
}

export function TableHeader<T>({ columns, sort, onToggleSort, onClearSort }: TableHeaderProps<T>) {
  const getSortInfo = (field: string) => {
    const index = sort.findIndex(s => s.field === field)
    if (index === -1) return null
    
    return {
      dir: sort[index].dir,
      order: index + 1,
      isFirst: index === 0
    }
  }
  
  return (
    <thead>
      <tr>
        {columns.map((column, index) => {
          const sortInfo = column.sortable ? getSortInfo(column.key) : null
          const isSorted = sortInfo !== null
          
          return (
            <th
              key={column.key}
              id={`col-${column.key}`}
              role="columnheader"
              aria-sort={
                sortInfo
                  ? sortInfo.dir === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              }
              className={`
                ${column.align === 'center' ? 'text-center' : ''}
                ${column.align === 'right' ? 'text-right' : ''}
                ${column.sortable ? 'cursor-pointer select-none hover:bg-neutral-50' : ''}
                ${isSorted ? 'bg-primary-50' : ''}
              `}
              style={{ width: column.width }}
              onClick={() => column.sortable && onToggleSort(column.key)}
              onKeyDown={(e) => {
                if (column.sortable && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  onToggleSort(column.key)
                }
              }}
              tabIndex={column.sortable ? 0 : -1}
            >
              {column.headerRender ? (
                column.headerRender(column)
              ) : (
                <div className="flex items-center gap-2">
                  <span>{column.header}</span>
                  
                  {column.sortable && (
                    <span className="sort-indicator" aria-label={
                      isSorted
                        ? `Sorted ${sortInfo.dir === 'asc' ? 'ascending' : 'descending'}`
                        : 'Not sorted'
                    }>
                      {!isSorted && <span className="text-neutral-300">↕</span>}
                      {isSorted && sortInfo.isFirst && (
                        <span className="text-primary-600 font-bold">
                          {sortInfo.dir === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                      {isSorted && !sortInfo.isFirst && (
                        <span className="text-primary-600 text-xs">
                          {sortInfo.dir === 'asc' ? '↑' : '↓'}
                          <sup>{sortInfo.order}</sup>
                        </span>
                      )}
                    </span>
                  )}
                </div>
              )}
            </th>
          )
        })}
        
        {/* Actions column */}
        <th className="w-24">Actions</th>
      </tr>
      
      {/* Sort order display */}
      {sort.length > 0 && (
        <tr>
          <th colSpan={columns.length + 1} className="bg-primary-50 py-2 px-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-neutral-600">Sorted by:</span>
              {sort.map((s, i) => (
                <span key={s.field} className="font-medium">
                  {i + 1}. {columns.find(c => c.key === s.field)?.header || s.field}{' '}
                  {s.dir === 'asc' ? '↑' : '↓'}
                </span>
              ))}
              <button
                onClick={onClearSort}
                className="ml-auto text-primary-600 hover:underline"
                type="button"
              >
                Clear sorts
              </button>
            </div>
          </th>
        </tr>
      )}
    </thead>
  )
}


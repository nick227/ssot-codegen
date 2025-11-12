/**
 * Table pagination controls
 */

import type { Messages } from '../types.js'

interface TablePaginationProps {
  page: number
  pageSize: number
  total: number
  pageSizeOptions: number[]
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  mode: 'pages' | 'infinite'
  messages?: Messages
}

export function TablePagination({
  page,
  pageSize,
  total,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  mode,
  messages
}: TablePaginationProps) {
  const totalPages = Math.ceil(total / pageSize)
  const startItem = (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, total)
  
  if (mode === 'infinite') {
    // TODO: Implement infinite scroll in next iteration
    return null
  }
  
  // Page number pagination
  const pages = generatePageNumbers(page, totalPages)
  
  return (
    <div className="ssot-table-pagination flex items-center justify-between px-4 py-3 border-t border-neutral-200">
      {/* Results info */}
      <div className="text-sm text-neutral-600" role="status" aria-live="polite">
        {messages?.showing || 'Showing'} {startItem}-{endItem} of {total}
      </div>
      
      {/* Pagination controls */}
      <div className="flex items-center gap-4">
        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="page-size" className="text-sm text-neutral-600">
            {messages?.rowsPerPage || 'Rows per page'}:
          </label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="border border-neutral-300 rounded px-2 py-1 text-sm"
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        
        {/* Page numbers */}
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="px-3 py-1 rounded border border-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
            aria-label="Previous page"
          >
            ←
          </button>
          
          {pages.map((pageNum, index) => {
            if (pageNum === '...') {
              return <span key={`ellipsis-${index}`} className="px-2">...</span>
            }
            
            const isCurrentPage = pageNum === page
            
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum as number)}
                className={`
                  px-3 py-1 rounded border
                  ${isCurrentPage
                    ? 'bg-primary text-white border-primary'
                    : 'border-neutral-300 hover:bg-neutral-50'
                  }
                `}
                aria-label={`Page ${pageNum}`}
                aria-current={isCurrentPage ? 'page' : undefined}
              >
                {pageNum}
              </button>
            )
          })}
          
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1 rounded border border-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
            aria-label="Next page"
          >
            →
          </button>
        </nav>
      </div>
    </div>
  )
}

/**
 * Generate page numbers with ellipsis
 * Example: [1, 2, 3, '...', 10, 11, 12] for page 11 of 12
 */
function generatePageNumbers(currentPage: number, totalPages: number): Array<number | '...'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  
  const pages: Array<number | '...'> = []
  
  // Always show first page
  pages.push(1)
  
  if (currentPage > 3) {
    pages.push('...')
  }
  
  // Show pages around current
  for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
    pages.push(i)
  }
  
  if (currentPage < totalPages - 2) {
    pages.push('...')
  }
  
  // Always show last page
  if (totalPages > 1) {
    pages.push(totalPages)
  }
  
  return pages
}

